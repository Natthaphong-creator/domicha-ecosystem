import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

const columns = "id,customer_name,contact_person,phone,email,tax_id,billing_address,shipping_address,customer_type,status,created_at";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.from("customers").select(columns).order("created_at", { ascending: false });
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
      .from("customers")
      .insert({ ...payload, created_by: auth.user.id })
      .select(columns)
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
