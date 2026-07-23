const FIREBASE_DATABASE_URL =
  process.env.DOMICHA_FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_DOMICHA_FIREBASE_DATABASE_URL ||
  "https://domichastore-default-rtdb.asia-southeast1.firebasedatabase.app";

const FIREBASE_STORE_PATH =
  process.env.DOMICHA_FIREBASE_STORE_PATH ||
  process.env.NEXT_PUBLIC_DOMICHA_FIREBASE_STORE_PATH ||
  "domicha_v2/store";

export const domichaAppLinks = {
  stock: process.env.NEXT_PUBLIC_DOMICHA_STOCK_URL || "https://domichastore.netlify.app/",
  pos: process.env.NEXT_PUBLIC_DOMICHA_POS_URL || "",
  manager: process.env.NEXT_PUBLIC_DOMICHA_POS_MANAGER_URL || ""
};

type AnyRecord = Record<string, any>;

const INTERNAL_CUSTOMER_NAMES = ["INatthaphong", "วีรภัทรา อุทธะ"];

export type DomiChaSystemSummary = {
  ok: boolean;
  updatedAt: string;
  error?: string;
  totals: {
    branches: number;
    warehouseItems: number;
    warehouseUnits: number;
    branchUnits: number;
    lowWarehouseItems: number;
    pendingTransfers: number;
    customers: number;
    invoices: number;
    pendingInvoices: number;
    customerReceipts: number;
    customerSales: number;
    customerRevenue: number;
    todayCustomerSales: number;
    todayCustomerRevenue: number;
    onlineOrders: number;
    pendingOnlineOrders: number;
    todaySales: number;
    todayOrders: number;
    openShifts: number;
  };
  branchSales: Array<{ branch: string; total: number; orders: number }>;
  recentCustomerDocs: Array<{
    id: string;
    type: "invoice" | "receipt" | "customer_sale";
    title: string;
    customer: string;
    total: number;
    status: string;
    date: string;
  }>;
  lowItems: Array<{ name: string; qty: number; min: number }>;
  openShifts: Array<{ branch: string; staff: string; openedAt: string }>;
  links: typeof domichaAppLinks;
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function asArrayOrValues(value: unknown): any[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return Object.values(asRecord(value)).filter(Boolean);
}

function num(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function bangkokDayKey(value: unknown = Date.now()): string {
  const date = toDate(value);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(safe);
}

function toDate(value: unknown = Date.now()): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const text = value.trim();
    const thai = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (thai) {
      const day = thai[1].padStart(2, "0");
      const month = thai[2].padStart(2, "0");
      const yearNum = Number(thai[3]);
      const year = yearNum > 2400 ? yearNum - 543 : yearNum;
      const hh = (thai[4] || "00").padStart(2, "0");
      const mm = (thai[5] || "00").padStart(2, "0");
      const ss = (thai[6] || "00").padStart(2, "0");
      return new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}+07:00`);
    }
    return new Date(text);
  }
  return new Date();
}

function sumRecord(record: AnyRecord): number {
  return Object.values(record).reduce((total, value) => total + num(value), 0);
}

function saleDayKey(sale: AnyRecord): string {
  return bangkokDayKey(sale.createdAt || sale.timestamp || sale.date || sale.updatedAt || Date.now());
}

function saleTotal(sale: AnyRecord): number {
  return num(sale.total ?? sale.saleTotal ?? sale.netTotal ?? 0);
}

function isSaleActive(sale: AnyRecord): boolean {
  return !sale.voided && sale.status !== "canceled" && sale.status !== "cancelled";
}

function isShiftOpen(shift: AnyRecord): boolean {
  const status = String(shift.status || "").toLowerCase();
  return !shift.closedAt && status !== "closed" && status !== "close";
}

function docDate(doc: AnyRecord): string {
  return String(doc.paidAt || doc.createdAt || doc.date || doc.updatedAt || "");
}

function docTime(doc: AnyRecord): number {
  const time = toDate(docDate(doc)).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function docCustomer(doc: AnyRecord): string {
  return String(doc.customer || doc.customerName || doc.name || "-");
}

function isInternalCustomer(doc: AnyRecord): boolean {
  const name = docCustomer(doc).replace(/\s+/g, " ").trim().toLocaleLowerCase("th-TH");
  return INTERNAL_CUSTOMER_NAMES.some((internalName) => internalName.toLocaleLowerCase("th-TH") === name);
}

function docTotal(doc: AnyRecord): number {
  return num(doc.total ?? doc.saleTotal ?? doc.grandTotal ?? doc.amount ?? 0);
}

function isPaid(doc: AnyRecord): boolean {
  const status = String(doc.status || "").toLowerCase();
  const paymentStatus = String(doc.paymentStatus || "");
  return status === "paid" || paymentStatus === "ชำระแล้ว";
}

function isCancelled(doc: AnyRecord): boolean {
  const status = String(doc.status || "").toLowerCase();
  return ["cancel", "canceled", "cancelled", "void", "voided"].includes(status) || Boolean(doc.canceled);
}

export async function getDomiChaSystemSummary(): Promise<DomiChaSystemSummary> {
  const empty: DomiChaSystemSummary = {
    ok: false,
    updatedAt: new Date().toISOString(),
    totals: {
      branches: 0,
      warehouseItems: 0,
      warehouseUnits: 0,
      branchUnits: 0,
      lowWarehouseItems: 0,
      pendingTransfers: 0,
      customers: 0,
      invoices: 0,
      pendingInvoices: 0,
      customerReceipts: 0,
      customerSales: 0,
      customerRevenue: 0,
      todayCustomerSales: 0,
      todayCustomerRevenue: 0,
      onlineOrders: 0,
      pendingOnlineOrders: 0,
      todaySales: 0,
      todayOrders: 0,
      openShifts: 0
    },
    branchSales: [],
    recentCustomerDocs: [],
    lowItems: [],
    openShifts: [],
    links: domichaAppLinks
  };

  try {
    const url = `${FIREBASE_DATABASE_URL.replace(/\/$/, "")}/${FIREBASE_STORE_PATH}.json`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Firebase ${response.status}`);
    const data = asRecord(await response.json());
    const settings = asRecord(data.settings);
    const warehouse = asRecord(data.warehouse);
    const branchStock = asRecord(data.branchStock);
    const transfers = asRecord(data.transfers);
    const customers = asArrayOrValues(data.customers).map(asRecord).filter((customer) => customer.active !== false && !isInternalCustomer(customer));
    const invoices = asArrayOrValues(data.invoices).map(asRecord).filter((invoice) => !isCancelled(invoice) && !isInternalCustomer(invoice));
    const receiptRows = asArrayOrValues(data.receipts).map(asRecord).filter((receipt) => !isCancelled(receipt) && !isInternalCustomer(receipt));
    const customerSales = asArrayOrValues(data.customerSales).map(asRecord).filter((sale) => isSaleActive(sale) && !isInternalCustomer(sale));
    const onlineOrders = asArrayOrValues(data.onlineOrders).map(asRecord);
    const sales = asArrayOrValues(data.sales).map(asRecord).filter(isSaleActive);
    const shifts = asArrayOrValues(data.posShifts).map(asRecord).filter(isShiftOpen);
    const mins = asRecord(settings.mins);
    const branches = asArrayOrValues(data.branches).map(String).filter(Boolean);
    const today = bangkokDayKey();
    const todaySales = sales.filter((sale) => saleDayKey(sale) === today);
    const branchMap = new Map<string, { branch: string; total: number; orders: number }>();

    todaySales.forEach((sale) => {
      const branch = String(sale.branch || "ไม่ระบุสาขา");
      const row = branchMap.get(branch) || { branch, total: 0, orders: 0 };
      row.total += saleTotal(sale);
      row.orders += 1;
      branchMap.set(branch, row);
    });

    const lowItems = Object.entries(warehouse)
      .map(([name, qty]) => ({ name, qty: num(qty), min: num(mins[name] ?? 0) }))
      .filter((item) => item.min > 0 && item.qty <= item.min)
      .sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name, "th"))
      .slice(0, 8);

    const openShiftRows = shifts
      .map((shift) => ({
        branch: String(shift.branch || "-"),
        staff: String(shift.staff || shift.openedBy || "-"),
        openedAt: String(shift.openedAt || shift.date || "")
      }))
      .slice(0, 8);

    const todayCustomerSales = customerSales.filter((sale) => saleDayKey(sale) === today);
    const recentCustomerDocs = [
      ...invoices.map((doc) => ({
        id: String(doc.id || doc.invoiceNo || doc.invoiceNumber || "-"),
        type: "invoice" as const,
        title: "ใบแจ้งหนี้",
        customer: docCustomer(doc),
        total: docTotal(doc),
        status: isPaid(doc) ? "ชำระแล้ว" : "รอชำระ",
        date: docDate(doc)
      })),
      ...receiptRows.map((doc) => ({
        id: String(doc.id || doc.receiptNo || doc.receiptNumber || "-"),
        type: "receipt" as const,
        title: "ใบเสร็จรับเงิน",
        customer: docCustomer(doc),
        total: docTotal(doc),
        status: "ออกใบเสร็จแล้ว",
        date: docDate(doc)
      })),
      ...customerSales.map((doc) => ({
        id: String(doc.id || "-"),
        type: "customer_sale" as const,
        title: "ขายให้ลูกค้า",
        customer: docCustomer(doc),
        total: docTotal(doc),
        status: String(doc.paymentStatus || doc.status || "-"),
        date: docDate(doc)
      }))
    ].sort((a, b) => docTime(b) - docTime(a)).slice(0, 8);

    return {
      ok: true,
      updatedAt: new Date().toISOString(),
      totals: {
        branches: branches.length,
        warehouseItems: Object.keys(warehouse).length,
        warehouseUnits: sumRecord(warehouse),
        branchUnits: Object.values(branchStock).reduce((total, stock) => total + sumRecord(asRecord(stock)), 0),
        lowWarehouseItems: lowItems.length,
        pendingTransfers: Object.values(transfers).filter((tx) => asRecord(tx).status === "pending").length,
        customers: customers.length,
        invoices: invoices.length,
        pendingInvoices: invoices.filter((invoice) => !isPaid(invoice)).length,
        customerReceipts: receiptRows.length,
        customerSales: customerSales.length,
        customerRevenue: customerSales.reduce((total, sale) => total + saleTotal(sale), 0),
        todayCustomerSales: todayCustomerSales.length,
        todayCustomerRevenue: todayCustomerSales.reduce((total, sale) => total + saleTotal(sale), 0),
        onlineOrders: onlineOrders.length,
        pendingOnlineOrders: onlineOrders.filter((order) => !["completed", "cancelled", "canceled"].includes(String(order.orderStatus || "").toLowerCase())).length,
        todaySales: todaySales.reduce((total, sale) => total + saleTotal(sale), 0),
        todayOrders: todaySales.length,
        openShifts: shifts.length
      },
      branchSales: Array.from(branchMap.values()).sort((a, b) => b.total - a.total).slice(0, 6),
      recentCustomerDocs,
      lowItems,
      openShifts: openShiftRows,
      links: domichaAppLinks
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : "อ่านข้อมูล Firebase ไม่สำเร็จ"
    };
  }
}
