import { NextRequest, NextResponse } from "next/server";
import { shopProductMap } from "@/lib/shopCatalog";

export const runtime = "nodejs";

type OrderPayload = {
  customerName?: string;
  phone?: string;
  branchName?: string;
  deliveryMethod?: "delivery" | "pickup";
  address?: string;
  paymentMethod?: "transfer" | "cod";
  note?: string;
  items?: Array<{ productId?: string; quantity?: number }>;
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function makeOrderNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `DC-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function buildOrderFlexMessage(order: {
  orderNumber: string;
  customerName: string;
  phone: string;
  branchName: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  paymentMethod: "transfer" | "cod";
  note: string;
  itemLines: string[];
  deliveryFee: number;
  total: number;
}) {
  const money = (value: number) => `${value.toLocaleString("th-TH")} บาท`;
  return {
    type: "flex",
    altText: `ออเดอร์ใหม่ ${order.orderNumber} • ${money(order.total)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#17120F",
        contents: [
          { type: "text", text: "DOMICHA • NEW ORDER", color: "#FB923C", size: "xs", weight: "bold" },
          { type: "text", text: "มีคำสั่งซื้อใหม่", color: "#FFFFFF", size: "xl", weight: "bold", margin: "sm" },
          { type: "text", text: order.orderNumber, color: "#D6D3D1", size: "sm", margin: "sm" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          { type: "text", text: order.customerName, size: "lg", weight: "bold", color: "#1C1917", wrap: true },
          { type: "text", text: `โทร ${order.phone} • ${order.branchName}`, size: "sm", color: "#78716C", wrap: true },
          { type: "separator" },
          ...order.itemLines.map((text) => ({ type: "text", text, size: "sm", color: "#292524", wrap: true })),
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "ยอดรวม", color: "#78716C", size: "sm" },
              { type: "text", text: money(order.total), color: "#EA580C", size: "lg", weight: "bold", align: "end" }
            ]
          },
          {
            type: "text",
            text: order.deliveryMethod === "delivery"
              ? `จัดส่ง: ${order.address}${order.deliveryFee ? ` (+${money(order.deliveryFee)})` : " (ฟรี)"}`
              : "รับสินค้าที่ศูนย์",
            size: "sm",
            color: "#57534E",
            wrap: true
          },
          { type: "text", text: `ชำระ: ${order.paymentMethod === "transfer" ? "โอนเงิน" : "เก็บเงินปลายทาง"}`, size: "sm", color: "#57534E" },
          ...(order.note ? [{ type: "text", text: `หมายเหตุ: ${order.note}`, size: "sm", color: "#9A3412", wrap: true }] : [])
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        backgroundColor: "#FFF7ED",
        contents: [{ type: "text", text: "กรุณาติดต่อลูกค้าเพื่อยืนยันออเดอร์", size: "sm", color: "#9A3412", weight: "bold", align: "center" }]
      }
    }
  };
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: "ส่งคำสั่งซื้อถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  let payload: OrderPayload;
  try {
    payload = await request.json() as OrderPayload;
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const customerName = cleanText(payload.customerName, 80);
  const phone = cleanText(payload.phone, 20);
  const branchName = cleanText(payload.branchName, 80);
  const address = cleanText(payload.address, 300);
  const note = cleanText(payload.note, 240);
  const deliveryMethod: "delivery" | "pickup" = payload.deliveryMethod === "pickup" ? "pickup" : "delivery";
  const paymentMethod: "transfer" | "cod" = payload.paymentMethod === "cod" ? "cod" : "transfer";

  if (!customerName) return NextResponse.json({ error: "กรุณาระบุชื่อลูกค้า" }, { status: 400 });
  if (!/^[0-9+\-\s]{9,20}$/.test(phone)) return NextResponse.json({ error: "กรุณาระบุเบอร์โทรให้ถูกต้อง" }, { status: 400 });
  if (!branchName) return NextResponse.json({ error: "กรุณาระบุชื่อสาขาหรือร้าน" }, { status: 400 });
  if (deliveryMethod === "delivery" && !address) return NextResponse.json({ error: "กรุณาระบุที่อยู่จัดส่ง" }, { status: 400 });
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "ยังไม่มีสินค้าในคำสั่งซื้อ" }, { status: 400 });
  }

  const normalizedItems = payload.items.map((item) => {
    const product = shopProductMap.get(cleanText(item.productId, 60));
    const quantity = Math.floor(Number(item.quantity));
    if (!product || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) return null;
    return { product, quantity, lineTotal: product.price * quantity };
  });
  if (normalizedItems.some((item) => !item)) {
    return NextResponse.json({ error: "พบรายการสินค้าหรือจำนวนที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const validItems = normalizedItems.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const subtotal = validItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = deliveryMethod === "delivery" && subtotal < 5_000 ? 80 : 0;
  const total = subtotal + deliveryFee;
  const orderNumber = makeOrderNumber();
  const order = {
    orderNumber,
    customerName,
    phone,
    branchName,
    deliveryMethod,
    address,
    paymentMethod,
    note,
    deliveryFee,
    total,
    itemLines: validItems.map(({ product, quantity, lineTotal }) =>
      `${product.name} × ${quantity} ${product.unit} • ${lineTotal.toLocaleString("th-TH")} บาท`
    )
  };

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targetId = process.env.LINE_OA_ORDER_TARGET_ID;
  if (!channelAccessToken || !targetId) {
    return NextResponse.json({
      ok: true,
      orderNumber,
      total,
      lineNotified: false,
      demoMode: true,
      message: "รับคำสั่งซื้อแล้ว (โหมดตัวอย่าง: ยังไม่ได้ตั้งค่า LINE OA)"
    });
  }

  const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${channelAccessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: targetId, messages: [buildOrderFlexMessage(order)] })
  });

  if (!lineResponse.ok) {
    const detail = await lineResponse.text();
    return NextResponse.json({ error: "รับออเดอร์แล้ว แต่ LINE OA แจ้งเตือนไม่สำเร็จ", orderNumber, detail }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    orderNumber,
    total,
    lineNotified: true,
    requestId: lineResponse.headers.get("x-line-request-id") || ""
  });
}
