import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const [customers, suppliers, products, quotations, recent, statusSummary] = await Promise.all([
      auth.supabase.from("customers").select("id", { count: "exact", head: true }),
      auth.supabase.from("suppliers").select("id", { count: "exact", head: true }),
      auth.supabase.from("products").select("id", { count: "exact", head: true }),
      auth.supabase.from("quotations").select("id", { count: "exact", head: true }),
      auth.supabase
        .from("quotations")
        .select("id,quotation_number,status,grand_total,created_at,customers(customer_name)")
        .order("created_at", { ascending: false })
        .limit(6),
      auth.supabase.from("quotations").select("status")
    ]);

    const errors = [customers.error, suppliers.error, products.error, quotations.error, recent.error, statusSummary.error].filter(Boolean);
    if (errors[0]) throw errors[0];

    const summary = (statusSummary.data || []).reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totals: {
        customers: customers.count || 0,
        suppliers: suppliers.count || 0,
        products: products.count || 0,
        quotations: quotations.count || 0
      },
      recentQuotations: recent.data || [],
      statusSummary: summary
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
