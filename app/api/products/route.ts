import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,product_code,product_name,category,unit,cost_price,selling_price,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("products").select(columns).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const payload = await request.json();
    const { data, error } = await auth.supabase
      .from("products")
      .insert({ ...payload, supplier_id: payload.supplier_id || null, created_by: auth.user.id })
      .select(columns)
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
