import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,product_code,product_name,category,unit,cost_price,selling_price,image_url,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";
const columnsWithoutImage = "id,product_code,product_name,category,unit,cost_price,selling_price,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";

function isMissingImageColumn(error: unknown) {
  return JSON.stringify(error).includes("image_url");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("products").select(columns).order("created_at", { ascending: false });
    if (!error) return NextResponse.json(data);
    if (!isMissingImageColumn(error)) throw error;

    const fallback = await auth.supabase.from("products").select(columnsWithoutImage).order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    return NextResponse.json((fallback.data || []).map((product) => ({ ...product, image_url: null })));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const payload = await request.json();
    const insertPayload = { ...payload, supplier_id: payload.supplier_id || null, created_by: auth.user.id };
    const { data, error } = await auth.supabase
      .from("products")
      .insert(insertPayload)
      .select(columns)
      .single();
    if (!error) return NextResponse.json(data, { status: 201 });
    if (!isMissingImageColumn(error)) throw error;

    const { image_url: _imageUrl, ...payloadWithoutImage } = insertPayload;
    const fallback = await auth.supabase
      .from("products")
      .insert(payloadWithoutImage)
      .select(columnsWithoutImage)
      .single();
    if (fallback.error) throw fallback.error;
    return NextResponse.json({ ...fallback.data, image_url: null }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
