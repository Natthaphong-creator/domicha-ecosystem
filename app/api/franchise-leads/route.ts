import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const contact = String(body.contact || "").trim();
  const location = String(body.location || "").trim();

  if (!name || !contact || !location) {
    return NextResponse.json({ ok: false, error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "รับข้อมูลแล้ว" });
}
