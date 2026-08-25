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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Sales", "Accountant", "Franchisee"]);
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
