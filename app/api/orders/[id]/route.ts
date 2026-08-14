import { NextRequest, NextResponse } from "next/server";
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
    const auth = await requireUserRole(request, ["Admin", "Executive", "Manager", "AssistantManager"]);
    if ("response" in auth) return auth.response;

    const payload = await request.json().catch(() => ({})) as { action?: string; paymentReference?: string };
    if (payload.action !== "confirm-payment") {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await auth.supabase
      .from("franchisee_orders")
      .select("id,payment_status,receipt_number")
      .eq("id", params.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "ไม่พบใบสั่งซื้อนี้" }, { status: 404 });
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
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
