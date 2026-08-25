import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

type SalesDocumentRow = {
  id: string;
  document_number: string;
  document_type: "Invoice" | "Receipt" | "TaxInvoice";
  status: "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled";
  grand_total: number;
  issue_date: string;
  due_date: string | null;
  created_at: string;
  customers?: { customer_name: string } | { customer_name: string }[] | null;
};

type FranchiseeOrderRow = {
  id: string;
  order_number: string;
  invoice_number: string | null;
  payment_status: "Pending" | "Paid" | "Overdue" | "Cancelled";
  grand_total: number;
  created_at: string;
  invoice_issued_at: string | null;
  invoice_due_at: string | null;
  franchisee_profiles?: { branch_name: string; owner_name: string } | { branch_name: string; owner_name: string }[] | null;
};

type StockMovementRow = {
  id: string;
  quantity: number;
  created_at: string;
};

function num(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getCustomerName(row: SalesDocumentRow) {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
  return customer?.customer_name || "-";
}

function getFranchiseeName(row: FranchiseeOrderRow) {
  const profile = Array.isArray(row.franchisee_profiles) ? row.franchisee_profiles[0] : row.franchisee_profiles;
  return profile?.branch_name || profile?.owner_name || "-";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("th-TH", { month: "short" }).format(date).replace(".", "");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Executive", "Manager", "AssistantManager", "Sales", "Accountant"]);
    if ("response" in auth) return auth.response;
    const db = getSupabaseAdmin() || auth.supabase;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);

    const [customers, suppliers, products, quotations, salesDocuments, recentSales, statusSummary, franchiseeOrders, recentFranchiseeOrders, stockMovements] = await Promise.all([
      db.from("customers").select("id", { count: "exact", head: true }),
      db.from("suppliers").select("id", { count: "exact", head: true }),
      db.from("products").select("id", { count: "exact", head: true }),
      db.from("quotations").select("id", { count: "exact", head: true }),
      db
        .from("sales_documents")
        .select("id,document_number,document_type,status,grand_total,issue_date,due_date,created_at,customers(customer_name)")
        .gte("issue_date", sixMonthStart)
        .neq("status", "Cancelled")
        .order("issue_date", { ascending: true }),
      db
        .from("sales_documents")
        .select("id,document_number,document_type,status,grand_total,issue_date,due_date,created_at,customers(customer_name)")
        .order("created_at", { ascending: false })
        .limit(6),
      db.from("sales_documents").select("status"),
      db
        .from("franchisee_orders")
        .select("id,order_number,invoice_number,payment_status,grand_total,created_at,invoice_issued_at,invoice_due_at,franchisee_profiles(branch_name,owner_name)")
        .gte("created_at", `${sixMonthStart}T00:00:00`)
        .neq("payment_status", "Cancelled")
        .order("created_at", { ascending: true }),
      db
        .from("franchisee_orders")
        .select("id,order_number,invoice_number,payment_status,grand_total,created_at,invoice_issued_at,invoice_due_at,franchisee_profiles(branch_name,owner_name)")
        .order("created_at", { ascending: false })
        .limit(6),
      db
        .from("stock_movements")
        .select("id,quantity,created_at")
        .eq("movement_type", "sale_out")
        .gte("created_at", `${sixMonthStart}T00:00:00`)
    ]);

    const errors = [customers.error, suppliers.error, products.error, quotations.error, salesDocuments.error, recentSales.error, statusSummary.error, franchiseeOrders.error, recentFranchiseeOrders.error, stockMovements.error].filter(Boolean);
    if (errors[0]) throw errors[0];

    const summary = (statusSummary.data || []).reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const salesRows = (salesDocuments.data || []) as SalesDocumentRow[];
    const orderRows = (franchiseeOrders.data || []) as FranchiseeOrderRow[];
    const stockRows = (stockMovements.data || []) as StockMovementRow[];
    const currentMonthRows = salesRows.filter((row) => row.issue_date >= monthStart && row.issue_date < nextMonthStart);
    const currentMonthOrderRows = orderRows.filter((row) => row.created_at >= `${monthStart}T00:00:00` && row.created_at < `${nextMonthStart}T00:00:00`);
    const paidRows = currentMonthRows.filter((row) => row.status === "Paid");
    const paidOrderRows = currentMonthOrderRows.filter((row) => row.payment_status === "Paid");
    const pendingRows = currentMonthRows.filter((row) => ["Draft", "Pending", "Overdue"].includes(row.status));
    const pendingOrderRows = currentMonthOrderRows.filter((row) => ["Pending", "Overdue"].includes(row.payment_status));
    const overdueRows = currentMonthRows.filter((row) => row.status === "Overdue");
    const overdueOrderRows = currentMonthOrderRows.filter((row) => row.payment_status === "Overdue");

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { key: monthKey(date), month: monthLabel(date), income: 0, pending: 0 };
    });

    salesRows.forEach((row) => {
      const date = new Date(row.issue_date);
      const bucket = months.find((item) => item.key === monthKey(date));
      if (!bucket) return;
      if (row.status === "Paid") bucket.income += num(row.grand_total);
      if (["Draft", "Pending", "Overdue"].includes(row.status)) bucket.pending += num(row.grand_total);
    });

    orderRows.forEach((row) => {
      const date = new Date(row.created_at);
      const bucket = months.find((item) => item.key === monthKey(date));
      if (!bucket) return;
      if (row.payment_status === "Paid") bucket.income += num(row.grand_total);
      if (["Pending", "Overdue"].includes(row.payment_status)) bucket.pending += num(row.grand_total);
    });

    const mappedRecentSales = ((recentSales.data || []) as SalesDocumentRow[]).map((row) => ({
      id: row.id,
      number: row.document_number,
      type: row.document_type,
      customer: getCustomerName(row),
      date: row.issue_date,
      dueDate: row.due_date,
      total: num(row.grand_total),
      status: row.status
    }));

    const mappedRecentOrders = ((recentFranchiseeOrders.data || []) as FranchiseeOrderRow[]).map((row) => ({
      id: row.id,
      number: row.invoice_number || row.order_number,
      type: "Invoice" as const,
      customer: getFranchiseeName(row),
      date: row.invoice_issued_at || row.created_at,
      dueDate: row.invoice_due_at,
      total: num(row.grand_total),
      status: row.payment_status === "Paid" ? "Paid" as const : row.payment_status === "Overdue" ? "Overdue" as const : row.payment_status === "Cancelled" ? "Cancelled" as const : "Pending" as const
    }));

    return NextResponse.json({
      totals: {
        customers: customers.count || 0,
        suppliers: suppliers.count || 0,
        products: products.count || 0,
        quotations: quotations.count || 0,
        monthlyRevenue: paidRows.reduce((total, row) => total + num(row.grand_total), 0) + paidOrderRows.reduce((total, row) => total + num(row.grand_total), 0),
        pendingReceivables: pendingRows.reduce((total, row) => total + num(row.grand_total), 0) + pendingOrderRows.reduce((total, row) => total + num(row.grand_total), 0),
        overdueReceivables: overdueRows.reduce((total, row) => total + num(row.grand_total), 0) + overdueOrderRows.reduce((total, row) => total + num(row.grand_total), 0),
        salesDocuments: salesRows.length + orderRows.length,
        stockMovements: stockRows.length,
        stockOutQuantity: stockRows.reduce((total, row) => total + num(row.quantity), 0)
      },
      recentSales: [...mappedRecentSales, ...mappedRecentOrders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
      monthlySales: months,
      statusSummary: {
        ...summary,
        Pending: (summary.Pending || 0) + orderRows.filter((row) => row.payment_status === "Pending").length,
        Paid: (summary.Paid || 0) + orderRows.filter((row) => row.payment_status === "Paid").length,
        Overdue: (summary.Overdue || 0) + orderRows.filter((row) => row.payment_status === "Overdue").length,
        Cancelled: (summary.Cancelled || 0) + orderRows.filter((row) => row.payment_status === "Cancelled").length
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
