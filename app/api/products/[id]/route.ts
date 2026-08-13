import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,product_code,product_name,category,unit,cost_price,selling_price,image_url,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";
const columnsWithoutImage = "id,product_code,product_name,category,unit,cost_price,selling_price,vat_type,minimum_stock,supplier_id,status,created_at,suppliers(supplier_name)";

function isMissingImageColumn(error: unknown) {
  return JSON.stringify(error).includes("image_url");
}

function productUpdatePayload(payload: Record<string, unknown>) {
  return {
    product_code: payload.product_code,
    product_name: payload.product_name,
    category: payload.category,
    unit: payload.unit,
    cost_price: payload.cost_price,
    selling_price: payload.selling_price,
    image_url: payload.image_url || null,
    vat_type: payload.vat_type,
    minimum_stock: payload.minimum_stock,
    supplier_id: payload.supplier_id || null,
    status: payload.status
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;
    const db = getSupabaseAdmin() || auth.supabase;

    const { data, error } = await db.from("products").select(columns).eq("id", params.id).single();
    if (!error) return NextResponse.json(data);
    if (!isMissingImageColumn(error)) throw error;

    const fallback = await db.from("products").select(columnsWithoutImage).eq("id", params.id).single();
    if (fallback.error) throw fallback.error;
    return NextResponse.json({ ...fallback.data, image_url: null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;
    const db = getSupabaseAdmin() || auth.supabase;

    const payload = await request.json();
    const updatePayload = productUpdatePayload(payload);
    const { data, error } = await db
      .from("products")
      .update(updatePayload)
      .eq("id", params.id)
      .select(columns)
      .single();
    if (!error) return NextResponse.json(data);
    if (!isMissingImageColumn(error)) throw error;

    const { image_url: _imageUrl, ...payloadWithoutImage } = updatePayload;
    const fallback = await db
      .from("products")
      .update(payloadWithoutImage)
      .eq("id", params.id)
      .select(columnsWithoutImage)
      .single();
    if (fallback.error) throw fallback.error;
    return NextResponse.json({ ...fallback.data, image_url: null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;
    const db = getSupabaseAdmin() || auth.supabase;

    const { error } = await db.from("products").delete().eq("id", params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
