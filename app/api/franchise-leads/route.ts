import { NextRequest, NextResponse } from "next/server";

type LeadPayload = {
  name?: string;
  contact?: string;
  location?: string;
  budget?: string;
  note?: string;
};

function cleanText(value: unknown, max = 240) {
  return String(value || "").trim().slice(0, max);
}

function validateLead(lead: Required<LeadPayload>) {
  if (!lead.name) return "กรุณาระบุชื่อผู้ติดต่อ";
  if (!lead.contact) return "กรุณาระบุเบอร์โทรหรือ LINE ID";
  return "";
}

async function sendToWebhook(lead: Required<LeadPayload>) {
  const webhookUrl = process.env.DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, source: "DomiCha Website", createdAt: new Date().toISOString() })
  });

  if (!response.ok) throw new Error("Webhook rejected franchise lead");
  return true;
}

async function sendToLine(lead: Required<LeadPayload>) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targetId = process.env.LINE_FRANCHISE_LEAD_TARGET_ID;
  if (!channelAccessToken || !targetId) return false;

  const text = [
    "มี Lead แฟรนไชส์ใหม่จากเว็บไซต์ DomiCha",
    `ชื่อ: ${lead.name}`,
    `ติดต่อ: ${lead.contact}`,
    `ทำเล: ${lead.location || "-"}`,
    `งบ: ${lead.budget || "-"}`,
    `หมายเหตุ: ${lead.note || "-"}`
  ].join("\n");

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ to: targetId, messages: [{ type: "text", text }] })
  });

  if (!response.ok) throw new Error("LINE rejected franchise lead");
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as LeadPayload;
    const lead = {
      name: cleanText(payload.name, 120),
      contact: cleanText(payload.contact, 80),
      location: cleanText(payload.location, 160),
      budget: cleanText(payload.budget, 80),
      note: cleanText(payload.note, 400)
    };

    const validation = validateLead(lead);
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });

    const destinations: string[] = [];
    if (await sendToWebhook(lead)) destinations.push("Webhook");
    if (await sendToLine(lead)) destinations.push("LINE OA");

    return NextResponse.json({
      ok: true,
      message: destinations.length
        ? `รับข้อมูลแล้ว ส่งต่อไปยัง ${destinations.join(" และ ")} เรียบร้อย`
        : "รับข้อมูลตัวอย่างแล้ว ตั้งค่า Webhook หรือ LINE OA เพื่อส่ง lead จริง"
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ส่งข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
