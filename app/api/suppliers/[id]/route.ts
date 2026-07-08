import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,supplier_name,contact_person,phone,email,tax_id,address,payment_terms,product_category_supplied,status,created_at";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("suppliers").select(columns).eq("id", params.id).single();
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
    const { data, error } = await auth.supabase.from("suppliers").update(payload).eq("id", params.id).select(columns).single();
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

    const { error } = await auth.supabase.from("suppliers").delete().eq("id", params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
