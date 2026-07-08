import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabaseServer";

type InvoiceLinePayload = {
  lineUserId?: string;
  invoiceNumber?: string;
  customerName?: string;
  total?: number;
  dueDate?: string;
  invoiceUrl?: string;
};

function validatePayload(payload: InvoiceLinePayload) {
  if (!payload.lineUserId?.trim()) return "ไม่พบ LINE User ID";
  if (!payload.invoiceNumber?.trim()) return "ไม่พบเลขที่ใบแจ้งหนี้";
  if (!payload.customerName?.trim()) return "ไม่พบชื่อลูกค้า";
  if (!Number.isFinite(payload.total) || Number(payload.total) < 0) return "ยอดใบแจ้งหนี้ไม่ถูกต้อง";
  if (!payload.dueDate?.trim()) return "ไม่พบวันครบกำหนด";
  try {
    const url = new URL(payload.invoiceUrl || "");
    if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") return "ลิงก์ใบแจ้งหนี้ต้องเป็น HTTPS";
  } catch {
    return "ลิงก์ใบแจ้งหนี้ไม่ถูกต้อง";
  }
  return "";
}

function buildInvoiceFlexMessage(payload: Required<InvoiceLinePayload>) {
  const formattedTotal = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2
  }).format(payload.total);

  return {
    type: "flex",
    altText: `ใบแจ้งหนี้ ${payload.invoiceNumber} ยอด ${formattedTotal}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#111827",
        contents: [
          { type: "text", text: "DOMICHA BUSINESS", color: "#FB923C", size: "xs", weight: "bold" },
          { type: "text", text: "ใบแจ้งหนี้", color: "#FFFFFF", size: "xl", weight: "bold", margin: "md" },
          { type: "text", text: payload.invoiceNumber, color: "#CBD5E1", size: "sm", margin: "sm" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          { type: "text", text: payload.customerName, size: "md", weight: "bold", color: "#111827", wrap: true },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "ยอดชำระ", size: "sm", color: "#64748B", flex: 2 },
              { type: "text", text: formattedTotal, size: "md", color: "#EA580C", weight: "bold", align: "end", flex: 3 }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "ครบกำหนด", size: "sm", color: "#64748B", flex: 2 },
              { type: "text", text: payload.dueDate, size: "sm", color: "#111827", align: "end", flex: 3 }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#F97316",
            action: { type: "uri", label: "เปิดดูใบแจ้งหนี้", uri: payload.invoiceUrl }
          }
        ]
      }
    }
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN" }, { status: 503 });
  }

  const payload = await request.json() as InvoiceLinePayload;
  const validationError = validatePayload(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const completePayload = payload as Required<InvoiceLinePayload>;
  const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: completePayload.lineUserId,
      messages: [buildInvoiceFlexMessage(completePayload)]
    })
  });

  if (!lineResponse.ok) {
    const detail = await lineResponse.text();
    return NextResponse.json(
      { error: "LINE Messaging API ปฏิเสธคำขอ", detail },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    requestId: lineResponse.headers.get("x-line-request-id") || "",
    invoiceNumber: completePayload.invoiceNumber
  });
}
