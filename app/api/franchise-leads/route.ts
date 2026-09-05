import { NextResponse } from "next/server";

function clean(value: unknown, max = 500) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const payload = {
    name: clean(body.name, 120),
    contact: clean(body.contact, 120),
    location: clean(body.location, 160),
    budget: clean(body.budget, 80),
    note: clean(body.note, 800),
    source: "DomichaThailand Website",
    createdAt: new Date().toISOString()
  };

  if (!payload.name || !payload.contact || !payload.location) {
    return NextResponse.json({ ok: false, error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  const webhookUrl = process.env.FRANCHISE_LEAD_WEBHOOK_URL || process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "ส่งข้อมูลไปยังระบบรับข้อมูลไม่สำเร็จ" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
