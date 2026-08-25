import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const FIREBASE_DATABASE_URL =
  process.env.DOMICHA_FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_DOMICHA_FIREBASE_DATABASE_URL ||
  "https://domichastore-default-rtdb.asia-southeast1.firebasedatabase.app";

const FIREBASE_STORE_PATH =
  process.env.DOMICHA_FIREBASE_STORE_PATH ||
  process.env.NEXT_PUBLIC_DOMICHA_FIREBASE_STORE_PATH ||
  "domicha_v2/store";

const INTERNAL_CUSTOMER_NAMES = ["INatthaphong", "วีรภัทรา อุทธะ"];

type AnyRecord = Record<string, any>;

type ImportDocument = {
  number: string;
  type: "Invoice" | "Receipt";
  customerName: string;
  phone: string;
  email: string;
  taxId: string;
  address: string;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled";
  subtotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  note: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function asArrayOrValues(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.map(asRecord).filter(Boolean);
  return Object.values(asRecord(value)).map(asRecord).filter(Boolean);
}

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function num(value: unknown): number {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function customerName(row: AnyRecord): string {
  return clean(row.customer || row.customerName || row.name || row.ownerName || "");
}

function isInternalCustomer(row: AnyRecord): boolean {
  const name = customerName(row).toLocaleLowerCase("th-TH");
  return INTERNAL_CUSTOMER_NAMES.some((internalName) => internalName.toLocaleLowerCase("th-TH") === name);
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const text = clean(value);
  const thai = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (thai) {
    const yearValue = Number(thai[3]);
    const year = yearValue > 2400 ? yearValue - 543 : yearValue;
    const month = thai[2].padStart(2, "0");
    const day = thai[1].padStart(2, "0");
    const hour = (thai[4] || "00").padStart(2, "0");
    const minute = (thai[5] || "00").padStart(2, "0");
    const second = (thai[6] || "00").padStart(2, "0");
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`);
  }

  const parsed = text ? new Date(text) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isoDate(value: unknown): string {
  return toDate(value).toISOString().slice(0, 10);
}

function statusOf(row: AnyRecord, receipt = false): ImportDocument["status"] {
  if (receipt) return "Paid";
  const status = clean(row.status).toLowerCase();
  const paymentStatus = clean(row.paymentStatus);
  if (["cancel", "canceled", "cancelled", "void", "voided"].includes(status)) return "Cancelled";
  if (paymentStatus === "ชำระแล้ว" || status === "paid") return "Paid";
  if (paymentStatus === "เกินกำหนด" || status === "overdue") return "Overdue";
  return "Pending";
}

function itemRows(row: AnyRecord): ImportDocument["items"] {
  return asArrayOrValues(row.items)
    .map((item) => {
      const quantity = num(item.qty ?? item.quantity ?? 1) || 1;
      const lineTotal = num(item.lineTotal ?? item.total ?? 0);
      const unitPrice = num(item.unitPrice ?? item.price ?? item.sellingPrice ?? (quantity ? lineTotal / quantity : 0));
      return {
        productName: clean(item.item || item.name || item.productName || "สินค้า"),
        quantity,
        unitPrice,
        lineTotal: lineTotal || quantity * unitPrice
      };
    })
    .filter((item) => item.productName);
}

function documentFromSource(row: AnyRecord, type: ImportDocument["type"], number: string): ImportDocument {
  const items = itemRows(row);
  const subtotal = num(row.subtotal ?? row.saleTotal ?? row.total ?? items.reduce((sum, item) => sum + item.lineTotal, 0));
  const vat = num(row.vat ?? row.vatTotal ?? 0);
  const grandTotal = num(row.total ?? row.grandTotal ?? row.saleTotal ?? subtotal + vat);
  const issueDate = isoDate(row.date || row.createdAt || row.paidAt);

  return {
    number,
    type,
    customerName: customerName(row) || "ลูกค้า DomiCha",
    phone: clean(row.phone || row.customerPhone || ""),
    email: clean(row.email || row.customerEmail || ""),
    taxId: clean(row.taxId || row.customerTaxId || ""),
    address: clean(row.address || row.billingAddress || row.customerAddress || ""),
    issueDate,
    dueDate: isoDate(row.dueDate || row.date || row.createdAt || row.paidAt || issueDate),
    status: statusOf(row, type === "Receipt"),
    subtotal,
    discount: num(row.discount || row.discountTotal || 0),
    vat,
    grandTotal,
    note: [
      `นำเข้าจาก DomiCha System: ${number}`,
      row.saleId ? `saleId ${row.saleId}` : "",
      row.payment ? `ช่องทางชำระ ${row.payment}` : ""
    ].filter(Boolean).join(" | "),
    items
  };
}

function customerKey(name: string, phone: string) {
  return `${name.toLocaleLowerCase("th-TH")}::${phone}`;
}

function slug(text: string) {
  return clean(text).toLocaleLowerCase("th-TH").replace(/[^a-z0-9ก-๙]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "domicha-item";
}

async function fetchStore() {
  const url = `${FIREBASE_DATABASE_URL.replace(/\/$/, "")}/${FIREBASE_STORE_PATH}.json`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`อ่านข้อมูล DomiCha System ไม่สำเร็จ (${response.status})`);
  return asRecord(await response.json());
}

function buildImportDocuments(data: AnyRecord) {
  const invoices = asArrayOrValues(data.invoices)
    .filter((row) => !isInternalCustomer(row))
    .map((row) => documentFromSource(row, "Invoice", clean(row.id || row.invoiceNo || row.invoiceNumber)));

  const receipts = asArrayOrValues(data.receipts)
    .filter((row) => !isInternalCustomer(row))
    .map((row) => documentFromSource(row, "Receipt", clean(row.id || row.receiptNo || row.receiptNumber)));

  const invoiceSaleIds = new Set(asArrayOrValues(data.invoices).map((row) => clean(row.saleId)).filter(Boolean));
  const receiptSaleIds = new Set(asArrayOrValues(data.receipts).map((row) => clean(row.saleId)).filter(Boolean));
  const standaloneSales = asArrayOrValues(data.customerSales)
    .filter((row) => !isInternalCustomer(row))
    .filter((row) => !invoiceSaleIds.has(clean(row.id)) && !receiptSaleIds.has(clean(row.id)))
    .map((row) => documentFromSource(row, statusOf(row) === "Paid" ? "Receipt" : "Invoice", clean(row.id)));

  return [...invoices, ...receipts, ...standaloneSales].filter((document) => document.number);
}

export async function syncDomiChaHistory(createdBy?: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("ยังไม่ได้ตั้งค่า Supabase Service Role สำหรับดึงข้อมูลย้อนหลัง");

  const data = await fetchStore();
  const documents = buildImportDocuments(data);
  const rawCustomers = asArrayOrValues(data.customers).filter((row) => !isInternalCustomer(row));
  const skippedInternal =
    asArrayOrValues(data.customers).filter(isInternalCustomer).length +
    asArrayOrValues(data.invoices).filter(isInternalCustomer).length +
    asArrayOrValues(data.receipts).filter(isInternalCustomer).length +
    asArrayOrValues(data.customerSales).filter(isInternalCustomer).length;

  const { data: existingCustomers, error: existingCustomerError } = await db
    .from("customers")
    .select("id,customer_name,phone");
  if (existingCustomerError) throw existingCustomerError;

  const customerMap = new Map<string, string>();
  (existingCustomers || []).forEach((customer: AnyRecord) => {
    customerMap.set(customerKey(clean(customer.customer_name), clean(customer.phone)), customer.id);
  });

  let customersCreated = 0;
  const ensureCustomer = async (customer: { name: string; phone: string; email?: string; taxId?: string; address?: string; type?: string }) => {
    const key = customerKey(customer.name, customer.phone);
    const existingId = customerMap.get(key);
    if (existingId) return existingId;

    const { data: inserted, error } = await db
      .from("customers")
      .insert({
        customer_name: customer.name,
        contact_person: null,
        phone: customer.phone || null,
        email: customer.email || null,
        tax_id: customer.taxId || null,
        billing_address: customer.address || null,
        shipping_address: customer.address || null,
        customer_type: customer.type || "Franchisee",
        status: "Active",
        created_by: createdBy || null
      })
      .select("id")
      .single();
    if (error) throw error;
    customerMap.set(key, inserted.id);
    customersCreated += 1;
    return inserted.id as string;
  };

  for (const customer of rawCustomers) {
    await ensureCustomer({
      name: customerName(customer) || clean(customer.id) || "ลูกค้า DomiCha",
      phone: clean(customer.phone),
      email: clean(customer.email),
      taxId: clean(customer.taxId),
      address: clean(customer.address || customer.billingAddress),
      type: clean(customer.id).startsWith("DMC") ? "Franchisee" : "Retail"
    });
  }

  const documentNumbers = documents.map((document) => document.number);
  const { data: existingDocs, error: existingDocsError } = await db
    .from("sales_documents")
    .select("id,document_number")
    .in("document_number", documentNumbers.length ? documentNumbers : ["__none__"]);
  if (existingDocsError) throw existingDocsError;

  const docMap = new Map<string, string>();
  (existingDocs || []).forEach((document: AnyRecord) => docMap.set(clean(document.document_number), document.id));

  let documentsCreated = 0;
  let documentsUpdated = 0;
  let itemsSynced = 0;
  for (const document of documents) {
    const customerId = await ensureCustomer({
      name: document.customerName,
      phone: document.phone,
      email: document.email,
      taxId: document.taxId,
      address: document.address,
      type: "Franchisee"
    });

    const payload = {
      document_number: document.number,
      document_type: document.type,
      customer_id: customerId,
      issue_date: document.issueDate,
      due_date: document.dueDate,
      status: document.status,
      subtotal: Number(document.subtotal.toFixed(2)),
      discount_total: Number(document.discount.toFixed(2)),
      vat_total: Number(document.vat.toFixed(2)),
      grand_total: Number(document.grandTotal.toFixed(2)),
      notes: document.note,
      created_by: createdBy || null
    };

    let documentId = docMap.get(document.number);
    if (documentId) {
      const { error } = await db.from("sales_documents").update(payload).eq("id", documentId);
      if (error) throw error;
      documentsUpdated += 1;
    } else {
      const { data: inserted, error } = await db.from("sales_documents").insert(payload).select("id").single();
      if (error) throw error;
      if (!inserted?.id) throw new Error(`สร้างเอกสาร ${document.number} ไม่สำเร็จ`);
      const newDocumentId = inserted.id as string;
      documentId = newDocumentId;
      docMap.set(document.number, newDocumentId);
      documentsCreated += 1;
    }

    const { error: deleteItemsError } = await db.from("sales_document_items").delete().eq("sales_document_id", documentId);
    if (deleteItemsError) throw deleteItemsError;

    if (document.items.length) {
      const { error: itemError } = await db.from("sales_document_items").insert(document.items.map((item) => ({
        sales_document_id: documentId,
        product_id: null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice.toFixed(2)),
        discount: 0,
        vat_amount: 0,
        line_total: Number(item.lineTotal.toFixed(2))
      })));
      if (itemError) throw itemError;
      itemsSynced += document.items.length;
    }
  }

  const { data: existingMovements, error: movementLookupError } = await db
    .from("stock_movements")
    .select("reference_number,product_name,movement_type")
    .eq("reference_type", "domicha_system_history")
    .in("reference_number", documentNumbers.length ? documentNumbers : ["__none__"]);
  if (movementLookupError) throw movementLookupError;

  const movementKeys = new Set((existingMovements || []).map((movement: AnyRecord) => `${movement.reference_number}::${movement.product_name}::${movement.movement_type}`));
  const movements = documents.flatMap((document) => document.items.map((item) => ({
    product_id: `domicha-${slug(item.productName)}`,
    product_name: item.productName,
    movement_type: "sale_out",
    quantity: item.quantity,
    unit: "หน่วย",
    unit_price: Number(item.unitPrice.toFixed(2)),
    line_total: Number(item.lineTotal.toFixed(2)),
    reference_type: "domicha_system_history",
    reference_id: null,
    reference_number: document.number,
    sales_document_id: docMap.get(document.number) || null,
    note: `ดึงย้อนหลังจาก DomiCha System ${document.number}`,
    created_by: createdBy || null
  }))).filter((movement) => !movementKeys.has(`${movement.reference_number}::${movement.product_name}::${movement.movement_type}`));

  if (movements.length) {
    const { error: movementError } = await db.from("stock_movements").insert(movements);
    if (movementError) throw movementError;
  }

  return {
    customersCreated,
    documentsCreated,
    documentsUpdated,
    itemsSynced,
    stockMovementsCreated: movements.length,
    skippedInternal
  };
}
