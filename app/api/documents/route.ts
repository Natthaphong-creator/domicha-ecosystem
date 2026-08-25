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
  customers?: { customer_name: string } | { customer_name: string }[] | null;
};

type FranchiseeOrderRow = {
  id: string;
  order_number: string;
  invoice_number: string | null;
  receipt_number: string | null;
  payment_status: "Pending" | "Paid" | "Overdue" | "Cancelled";
  grand_total: number;
  created_at: string;
  invoice_issued_at: string | null;
  invoice_due_at: string | null;
  receipt_issued_at: string | null;
  franchisee_profiles?: { branch_name: string; owner_name: string } | { branch_name: string; owner_name: string }[] | null;
};

function num(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin", "Executive", "Manager", "AssistantManager", "Sales", "Accountant"]);
    if ("response" in auth) return auth.response;
    const db = getSupabaseAdmin() || auth.supabase;

    const [salesDocuments, franchiseeOrders] = await Promise.all([
      db
        .from("sales_documents")
        .select("id,document_number,document_type,status,grand_total,issue_date,due_date,customers(customer_name)")
        .order("issue_date", { ascending: false })
        .limit(300),
      db
        .from("franchisee_orders")
        .select("id,order_number,invoice_number,receipt_number,payment_status,grand_total,created_at,invoice_issued_at,invoice_due_at,receipt_issued_at,franchisee_profiles(branch_name,owner_name)")
        .order("created_at", { ascending: false })
        .limit(300)
    ]);

    if (salesDocuments.error) throw salesDocuments.error;
    if (franchiseeOrders.error) throw franchiseeOrders.error;

    const mappedSales = ((salesDocuments.data || []) as SalesDocumentRow[]).map((row) => {
      const customer = relationOne(row.customers);
      return {
        id: row.id,
        source: "sales_document" as const,
        number: row.document_number,
        type: row.document_type,
        customer: customer?.customer_name || "-",
        date: row.issue_date,
        dueDate: row.due_date || row.issue_date,
        total: num(row.grand_total),
        status: row.status,
        href: `/documents/${row.id}`
      };
    });

    const mappedOrders = ((franchiseeOrders.data || []) as FranchiseeOrderRow[]).map((row) => {
      const profile = relationOne(row.franchisee_profiles);
      const paid = row.payment_status === "Paid";
      return {
        id: row.id,
        source: "franchisee_order" as const,
        number: paid ? row.receipt_number || row.invoice_number || row.order_number : row.invoice_number || row.order_number,
        type: paid ? "Receipt" as const : "Invoice" as const,
        customer: profile?.branch_name || profile?.owner_name || "-",
        date: paid ? row.receipt_issued_at || row.invoice_issued_at || row.created_at : row.invoice_issued_at || row.created_at,
        dueDate: row.invoice_due_at || row.created_at,
        total: num(row.grand_total),
        status: row.payment_status === "Paid" ? "Paid" as const : row.payment_status === "Overdue" ? "Overdue" as const : row.payment_status === "Cancelled" ? "Cancelled" as const : "Pending" as const,
        href: `/orders/${row.id}${paid ? "?doc=receipt" : ""}`
      };
    });

    return NextResponse.json([...mappedSales, ...mappedOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (error) {
    return handleRouteError(error);
  }
}
