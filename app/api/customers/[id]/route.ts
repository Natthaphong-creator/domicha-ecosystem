import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,customer_name,contact_person,phone,email,tax_id,billing_address,shipping_address,customer_type,status,created_at";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("customers").select(columns).eq("id", params.id).single();
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
    const { data, error } = await auth.supabase.from("customers").update(payload).eq("id", params.id).select(columns).single();
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

    const { error } = await auth.supabase.from("customers").delete().eq("id", params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
