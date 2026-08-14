import { NextRequest, NextResponse } from "next/server";
import { getLineChannelAccessToken } from "@/lib/lineMessaging";
import { deliverReceiptAutomation } from "@/lib/receiptAutomation";
import type { FranchiseeOrder } from "@/lib/types";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

const orderSelect = `
  id,
  order_number,
  franchisee_id,
  user_id,
  branch_id,
  delivery_method,
  shipping_address,
  payment_method,
  order_status,
  payment_status,
  payment_confirmed_at,
  payment_confirmed_by,
  payment_reference,
  promptpay_payload,
  promptpay_account_name,
  receipt_number,
  receipt_issued_at,
  subtotal,
  delivery_fee,
  grand_total,
  note,
  line_request_id,
  created_at,
  updated_at,
  franchisee_profiles(branch_name,owner_name,phone,email,province,shipping_address,tax_id,payment_terms),
  franchisee_order_items(id,product_id,product_name,unit,quantity,unit_price,line_total,created_at)
`;

function makeReceiptNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `RC-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

async function notifyPaymentSubmitted(order: {
  id: string;
  order_number: string;
}, origin: string) {
  const targetId = process.env.LINE_OA_ORDER_TARGET_ID;
  const channelAccessToken = await getLineChannelAccessToken();
  if (!targetId || !channelAccessToken) return false;

  const message = [
    "DomiCha: มีรายการแจ้งโอนเงินใหม่",
    `เลขออเดอร์: ${order.order_number}`,
    "กรุณาเข้าไปตรวจสอบสลิปและยอดเงินจริงในหลังบ้านก่อนยืนยันชำระเงิน",
    `${origin}/orders`
  ].join("\n");

  const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${channelAccessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: targetId, messages: [{ type: "text", text: message }] })
  });

  return lineResponse.ok;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Executive", "Manager", "AssistantManager", "Franchisee"]);
    if ("response" in auth) return auth.response;
    if (!("profile" in auth)) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 403 });
    }

    let query = auth.supabase
      .from("franchisee_orders")
      .select(orderSelect)
      .eq("id", params.id);

    if (auth.profile.role === "Franchisee") {
      query = query.eq("user_id", auth.user.id);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return NextResponse.json({ error: "ไม่พบใบสั่งซื้อนี้" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Executive", "Manager", "AssistantManager", "Franchisee"]);
    if ("response" in auth) return auth.response;
    if (!("profile" in auth)) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 403 });
    }

    const payload = await request.json().catch(() => ({})) as { action?: string; paymentReference?: string };
    if (!["submit-payment", "confirm-payment"].includes(payload.action || "")) {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await auth.supabase
      .from("franchisee_orders")
      .select("id,user_id,payment_method,payment_status,receipt_number,order_number,grand_total,payment_reference,franchisee_profiles(branch_name,owner_name,phone)")
      .eq("id", params.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "ไม่พบใบสั่งซื้อนี้" }, { status: 404 });
    }

    if (payload.action === "submit-payment") {
      if (auth.profile.role !== "Franchisee") {
        return NextResponse.json({ error: "เฉพาะบัญชีแฟรนไชส์ซีเท่านั้นที่แจ้งโอนจากหน้า shop ได้" }, { status: 403 });
      }
      if (existing.user_id !== auth.user.id) {
        return NextResponse.json({ error: "ไม่สามารถแจ้งชำระเงินของออเดอร์นี้ได้" }, { status: 403 });
      }
      if (existing.payment_method !== "transfer") {
        return NextResponse.json({ error: "ออเดอร์นี้ไม่ได้เลือกชำระด้วยการโอนเงิน" }, { status: 400 });
      }
      if (existing.payment_status === "Paid") {
        return NextResponse.json({ ok: true, message: "ออเดอร์นี้ยืนยันชำระเงินแล้ว", lineNotified: false });
      }

      const paymentReference = typeof payload.paymentReference === "string"
        ? payload.paymentReference.trim().slice(0, 120)
        : "";

      const { data: updated, error } = await auth.supabase
        .from("franchisee_orders")
        .update({ payment_reference: paymentReference || "ลูกค้าแจ้งโอนแล้ว" })
        .eq("id", params.id)
        .select("id,order_number")
        .single();

      if (error || !updated) {
        return NextResponse.json({ error: "บันทึกการแจ้งโอนไม่สำเร็จ" }, { status: 500 });
      }

      const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      const lineNotified = await notifyPaymentSubmitted(updated, origin);

      return NextResponse.json({
        ok: true,
        lineNotified,
        message: lineNotified ? "รับข้อมูลแล้ว" : "รับข้อมูลแล้ว"
      });
    }

    if (!["Admin", "Executive", "Manager", "AssistantManager"].includes(auth.profile.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ยืนยันการชำระเงิน" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updatePayload = {
      payment_status: "Paid",
      order_status: "Confirmed",
      payment_confirmed_at: now,
      payment_confirmed_by: auth.user.id,
      payment_reference: typeof payload.paymentReference === "string" ? payload.paymentReference.trim().slice(0, 120) || null : null,
      receipt_number: existing.receipt_number || makeReceiptNumber(),
      receipt_issued_at: existing.payment_status === "Paid" && existing.receipt_number ? undefined : now
    };

    const { data, error } = await auth.supabase
      .from("franchisee_orders")
      .update(updatePayload)
      .eq("id", params.id)
      .select(orderSelect)
      .single();

    if (error) throw error;

    const receiptDelivery = await deliverReceiptAutomation(data as unknown as FranchiseeOrder);
    return NextResponse.json({ ...data, receipt_delivery: receiptDelivery });
  } catch (error) {
    return handleRouteError(error);
  }
}
