import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,product_code,product_name,category,unit,cost_price,selling_price,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("products").select(columns).eq("id", params.id).single();
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
    const { data, error } = await auth.supabase
      .from("products")
      .update({ ...payload, supplier_id: payload.supplier_id || null })
      .eq("id", params.id)
      .select(columns)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { error } = await auth.supabase.from("products").delete().eq("id", params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
