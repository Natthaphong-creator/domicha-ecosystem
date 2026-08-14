import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { createPromptPayPayload, domichaPromptPay } from "@/lib/promptpay";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const amount = Number(request.nextUrl.searchParams.get("amount") || 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: "ยอดชำระไม่ถูกต้อง" }, { status: 400 });
  }

  const payload = createPromptPayPayload(domichaPromptPay.target, amount);
  const svg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
    color: {
      dark: "#18120F",
      light: "#FFFFFF"
    }
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
