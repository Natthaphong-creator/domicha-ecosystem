import { NextRequest, NextResponse } from "next/server";
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

function num(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getCustomerName(row: SalesDocumentRow) {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
  return customer?.customer_name || "-";
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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);

    const [customers, suppliers, products, quotations, salesDocuments, recentSales, statusSummary] = await Promise.all([
      auth.supabase.from("customers").select("id", { count: "exact", head: true }),
      auth.supabase.from("suppliers").select("id", { count: "exact", head: true }),
      auth.supabase.from("products").select("id", { count: "exact", head: true }),
      auth.supabase.from("quotations").select("id", { count: "exact", head: true }),
      auth.supabase
        .from("sales_documents")
        .select("id,document_number,document_type,status,grand_total,issue_date,due_date,created_at,customers(customer_name)")
        .gte("issue_date", sixMonthStart)
        .neq("status", "Cancelled")
        .order("issue_date", { ascending: true }),
      auth.supabase
        .from("sales_documents")
        .select("id,document_number,document_type,status,grand_total,issue_date,due_date,created_at,customers(customer_name)")
        .order("created_at", { ascending: false })
        .limit(6),
      auth.supabase.from("sales_documents").select("status")
    ]);

    const errors = [customers.error, suppliers.error, products.error, quotations.error, salesDocuments.error, recentSales.error, statusSummary.error].filter(Boolean);
    if (errors[0]) throw errors[0];

    const summary = (statusSummary.data || []).reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const salesRows = (salesDocuments.data || []) as SalesDocumentRow[];
    const currentMonthRows = salesRows.filter((row) => row.issue_date >= monthStart && row.issue_date < nextMonthStart);
    const paidRows = currentMonthRows.filter((row) => row.status === "Paid");
    const pendingRows = currentMonthRows.filter((row) => ["Draft", "Pending", "Overdue"].includes(row.status));
    const overdueRows = currentMonthRows.filter((row) => row.status === "Overdue");

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

    return NextResponse.json({
      totals: {
        customers: customers.count || 0,
        suppliers: suppliers.count || 0,
        products: products.count || 0,
        quotations: quotations.count || 0,
        monthlyRevenue: paidRows.reduce((total, row) => total + num(row.grand_total), 0),
        pendingReceivables: pendingRows.reduce((total, row) => total + num(row.grand_total), 0),
        overdueReceivables: overdueRows.reduce((total, row) => total + num(row.grand_total), 0),
        salesDocuments: salesRows.length
      },
      recentSales: ((recentSales.data || []) as SalesDocumentRow[]).map((row) => ({
        id: row.id,
        number: row.document_number,
        type: row.document_type,
        customer: getCustomerName(row),
        date: row.issue_date,
        dueDate: row.due_date,
        total: num(row.grand_total),
        status: row.status
      })),
      monthlySales: months,
      statusSummary: summary
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
