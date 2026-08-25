import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type ProductCostRow = {
  id: string;
  cost_price: number | null;
};

type FranchiseeOrderItemRow = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type FranchiseeOrderRow = {
  id: string;
  payment_status: string;
  grand_total: number;
  delivery_fee: number | null;
  created_at: string;
  franchisee_profiles?: { branch_name: string; owner_name: string } | { branch_name: string; owner_name: string }[] | null;
  franchisee_order_items?: FranchiseeOrderItemRow[] | null;
};

type BranchProfitRow = {
  branchName: string;
  ownerName: string;
  orderCount: number;
  revenue: number;
  productRevenue: number;
  deliveryFee: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
  missingCostItems: number;
  lastOrderAt: string | null;
};

function num(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function dateParam(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function profileOf(row: FranchiseeOrderRow) {
  const profile = Array.isArray(row.franchisee_profiles) ? row.franchisee_profiles[0] : row.franchisee_profiles;
  return {
    branchName: profile?.branch_name || "ไม่ระบุสาขา",
    ownerName: profile?.owner_name || "-"
  };
}

function defaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
  return { from, to };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Executive"]);
    if ("response" in auth) return auth.response;

    const period = defaultPeriod();
    const from = dateParam(request, "from") || period.from;
    const to = dateParam(request, "to") || period.to;
    const db = getSupabaseAdmin() || auth.supabase;

    const [ordersResult, productsResult] = await Promise.all([
      db
        .from("franchisee_orders")
        .select(`
          id,
          payment_status,
          grand_total,
          delivery_fee,
          created_at,
          franchisee_profiles(branch_name,owner_name),
          franchisee_order_items(product_id,product_name,quantity,unit_price,line_total)
        `)
        .gte("created_at", `${from}T00:00:00`)
        .lt("created_at", `${to}T00:00:00`)
        .neq("payment_status", "Cancelled")
        .order("created_at", { ascending: false }),
      db.from("products").select("id,cost_price")
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (productsResult.error) throw productsResult.error;

    const productCost = new Map((productsResult.data || []).map((product: ProductCostRow) => [product.id, num(product.cost_price)]));
    const branches = new Map<string, BranchProfitRow>();

    ((ordersResult.data || []) as FranchiseeOrderRow[]).forEach((order) => {
      const profile = profileOf(order);
      const current = branches.get(profile.branchName) || {
        branchName: profile.branchName,
        ownerName: profile.ownerName,
        orderCount: 0,
        revenue: 0,
        productRevenue: 0,
        deliveryFee: 0,
        cost: 0,
        grossProfit: 0,
        marginPercent: 0,
        missingCostItems: 0,
        lastOrderAt: null
      };

      const items = order.franchisee_order_items || [];
      const productRevenue = items.reduce((sum, item) => sum + num(item.line_total), 0);
      const deliveryFee = num(order.delivery_fee);
      const revenue = num(order.grand_total);
      const cost = items.reduce((sum, item) => {
        const productId = item.product_id || "";
        if (!productId || !productCost.has(productId)) {
          current.missingCostItems += 1;
          return sum;
        }
        return sum + productCost.get(productId)! * num(item.quantity);
      }, 0);

      current.orderCount += 1;
      current.revenue += revenue;
      current.productRevenue += productRevenue || Math.max(0, revenue - deliveryFee);
      current.deliveryFee += deliveryFee;
      current.cost += cost;
      current.lastOrderAt = current.lastOrderAt && current.lastOrderAt > order.created_at ? current.lastOrderAt : order.created_at;
      branches.set(profile.branchName, current);
    });

    const rows = Array.from(branches.values())
      .map((row) => {
        const grossProfit = row.productRevenue - row.cost;
        return {
          ...row,
          grossProfit,
          marginPercent: row.productRevenue > 0 ? (grossProfit / row.productRevenue) * 100 : 0
        };
      })
      .sort((a, b) => b.grossProfit - a.grossProfit);

    const totals = rows.reduce(
      (acc, row) => ({
        orderCount: acc.orderCount + row.orderCount,
        revenue: acc.revenue + row.revenue,
        productRevenue: acc.productRevenue + row.productRevenue,
        deliveryFee: acc.deliveryFee + row.deliveryFee,
        cost: acc.cost + row.cost,
        grossProfit: acc.grossProfit + row.grossProfit,
        missingCostItems: acc.missingCostItems + row.missingCostItems
      }),
      { orderCount: 0, revenue: 0, productRevenue: 0, deliveryFee: 0, cost: 0, grossProfit: 0, missingCostItems: 0 }
    );

    return NextResponse.json({
      period: { from, to },
      totals: {
        ...totals,
        branchCount: rows.length,
        marginPercent: totals.productRevenue > 0 ? (totals.grossProfit / totals.productRevenue) * 100 : 0
      },
      branches: rows
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
