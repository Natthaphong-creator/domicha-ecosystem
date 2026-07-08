import { NextRequest, NextResponse } from "next/server";
import { calculateQuotation } from "@/lib/quotationMath";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns =
  "id,quotation_number,customer_id,quotation_date,valid_until,status,subtotal,discount_total,vat_total,grand_total,notes,created_at,customers(customer_name),quotation_items(id,product_id,product_name,quantity,unit_price,discount,vat_amount,line_total)";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("quotations").select(columns).eq("id", params.id).single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const payload = await request.json();
    const calculated = calculateQuotation(payload.items || []);

    const { error } = await auth.supabase
      .from("quotations")
      .update({
        customer_id: payload.customer_id,
        quotation_date: payload.quotation_date,
        valid_until: payload.valid_until || null,
        status: payload.status,
        subtotal: calculated.subtotal,
        discount_total: calculated.discount_total,
        vat_total: calculated.vat_total,
        grand_total: calculated.grand_total,
        notes: payload.notes || null
      })
      .eq("id", params.id);
    if (error) throw error;

    const { error: deleteError } = await auth.supabase.from("quotation_items").delete().eq("quotation_id", params.id);
    if (deleteError) throw deleteError;

    if (calculated.items.length > 0) {
      const { error: itemError } = await auth.supabase.from("quotation_items").insert(
        calculated.items.map((item) => ({
          quotation_id: params.id,
          product_id: item.product_id || null,
          product_name: item.product_name || "รายการสินค้า",
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          vat_amount: item.vat_amount,
          line_total: item.line_total
        }))
      );
      if (itemError) throw itemError;
    }

    const { data, error: fetchError } = await auth.supabase.from("quotations").select(columns).eq("id", params.id).single();
    if (fetchError) throw fetchError;
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { error } = await auth.supabase.from("quotations").delete().eq("id", params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
