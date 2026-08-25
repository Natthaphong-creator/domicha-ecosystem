import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type OrderStockItem = {
  product: {
    id: string;
    name: string;
    unit: string;
    price: number;
  };
  quantity: number;
  lineTotal: number;
};

type StockMovementInput = {
  orderId: string;
  orderNumber: string;
  createdBy: string;
  items: OrderStockItem[];
};

type SalesDocumentStockItem = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type SalesDocumentStockInput = {
  salesDocumentId: string;
  documentNumber: string;
  createdBy: string;
  items: SalesDocumentStockItem[];
};

export type StockMovementResult = {
  attempted: boolean;
  ok: boolean;
  count: number;
  error?: string;
};

export async function recordFranchiseeOrderStockOut({
  orderId,
  orderNumber,
  createdBy,
  items
}: StockMovementInput): Promise<StockMovementResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { attempted: false, ok: false, count: 0, error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
  }

  if (!items.length) {
    return { attempted: false, ok: true, count: 0 };
  }

  const rows = items.map(({ product, quantity, lineTotal }) => ({
    product_id: product.id,
    product_name: product.name,
    movement_type: "sale_out",
    quantity,
    unit: product.unit,
    unit_price: product.price,
    line_total: lineTotal,
    reference_type: "franchisee_order",
    reference_id: orderId,
    reference_number: orderNumber,
    franchisee_order_id: orderId,
    note: "ตัดสต็อกจากคำสั่งซื้อแฟรนไชส์ซี",
    created_by: createdBy
  }));

  const { error } = await supabase.from("stock_movements").insert(rows);
  if (error) {
    return { attempted: true, ok: false, count: 0, error: error.message };
  }

  return { attempted: true, ok: true, count: rows.length };
}

export async function recordSalesDocumentStockOut({
  salesDocumentId,
  documentNumber,
  createdBy,
  items
}: SalesDocumentStockInput): Promise<StockMovementResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { attempted: false, ok: false, count: 0, error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
  }

  const rows = items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      product_id: item.product_id || `manual-${item.product_name}`,
      product_name: item.product_name,
      movement_type: "sale_out",
      quantity: item.quantity,
      unit: null,
      unit_price: item.unit_price,
      line_total: item.line_total,
      reference_type: "sales_document",
      reference_id: salesDocumentId,
      reference_number: documentNumber,
      sales_document_id: salesDocumentId,
      note: "ตัดสต็อกจากการขายหลังบ้าน",
      created_by: createdBy
    }));

  if (!rows.length) {
    return { attempted: false, ok: true, count: 0 };
  }

  const { error } = await supabase.from("stock_movements").insert(rows);
  if (error) {
    return { attempted: true, ok: false, count: 0, error: error.message };
  }

  return { attempted: true, ok: true, count: rows.length };
}
