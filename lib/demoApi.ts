import { calculateQuotation } from "@/lib/quotationMath";

const DEMO_STORAGE_KEY = "domicha-business-demo-v1";

type DemoDatabase = {
  customers: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  products: Record<string, unknown>[];
  quotations: Record<string, unknown>[];
};

const initialDatabase: DemoDatabase = {
  customers: [
    { id: "customer-1", customer_name: "DomiCha สาขาบางแสน", contact_person: "คุณพลอย", phone: "081-234-5678", email: "bangsaen@domicha.co", tax_id: "0205567000101", billing_address: "เมืองชลบุรี ชลบุรี", shipping_address: "บางแสน ชลบุรี", customer_type: "Franchisee", status: "Active", created_at: "2026-05-01" },
    { id: "customer-2", customer_name: "บริษัท ชลบุรี ฟู้ด จำกัด", contact_person: "คุณนนท์", phone: "089-555-1200", email: "account@chonburifood.co.th", tax_id: "0205567000214", billing_address: "ศรีราชา ชลบุรี", shipping_address: "ศรีราชา ชลบุรี", customer_type: "Corporate", status: "Active", created_at: "2026-05-04" },
    { id: "customer-3", customer_name: "DomiCha สาขาพัทยา", contact_person: "คุณเมย์", phone: "086-245-9910", email: "pattaya@domicha.co", tax_id: "", billing_address: "บางละมุง ชลบุรี", shipping_address: "พัทยา ชลบุรี", customer_type: "Franchisee", status: "Active", created_at: "2026-05-10" }
  ],
  suppliers: [
    { id: "supplier-1", supplier_name: "ติ่งฟง ฟู้ดส์", contact_person: "ฝ่ายขาย", phone: "02-555-0188", email: "sales@dingfong.example", tax_id: "0105567001123", address: "กรุงเทพมหานคร", payment_terms: "30 วัน", product_category_supplied: "ผงชงและไซรัป", status: "Active", created_at: "2026-05-01" },
    { id: "supplier-2", supplier_name: "บริษัท บรรจุภัณฑ์ไทย จำกัด", contact_person: "คุณกอล์ฟ", phone: "038-555-178", email: "sale@thaipack.example", tax_id: "0205567008821", address: "ชลบุรี", payment_terms: "เครดิต 15 วัน", product_category_supplied: "แก้วและบรรจุภัณฑ์", status: "Active", created_at: "2026-05-02" }
  ],
  products: [
    { id: "product-1", product_code: "TEA-RED-500", product_name: "ชาแดง DomiCha", category: "ชา", unit: "ถุง", cost_price: 135, selling_price: 195, vat_type: "VAT 7%", minimum_stock: 20, supplier_id: "supplier-1", status: "Active", created_at: "2026-05-01", suppliers: { supplier_name: "ติ่งฟง ฟู้ดส์" } },
    { id: "product-2", product_code: "TEA-GREEN-500", product_name: "ชาเขียว DomiCha", category: "ชา", unit: "ถุง", cost_price: 145, selling_price: 210, vat_type: "VAT 7%", minimum_stock: 20, supplier_id: "supplier-1", status: "Active", created_at: "2026-05-01", suppliers: { supplier_name: "ติ่งฟง ฟู้ดส์" } },
    { id: "product-3", product_code: "PEARL-1000", product_name: "ไข่มุก ตราโทรจัน", category: "ท็อปปิ้ง", unit: "ถุง", cost_price: 62, selling_price: 89, vat_type: "VAT 7%", minimum_stock: 25, supplier_id: "supplier-1", status: "Active", created_at: "2026-05-03", suppliers: { supplier_name: "ติ่งฟง ฟู้ดส์" } }
  ],
  quotations: [
    {
      id: "quotation-1",
      quotation_number: "QT-202606-0087",
      customer_id: "customer-1",
      quotation_date: "2026-06-29",
      valid_until: "2026-07-06",
      status: "Draft",
      subtotal: 18000,
      discount_total: 500,
      vat_total: 1225,
      grand_total: 18725,
      notes: "จัดส่งภายใน 5 วันทำการ",
      created_at: "2026-06-29",
      customers: { customer_name: "DomiCha สาขาบางแสน" },
      quotation_items: [
        { id: "item-1", product_id: "product-1", product_name: "ชาแดง DomiCha", quantity: 50, unit_price: 195, discount: 250, vat_amount: 665, line_total: 10165 },
        { id: "item-2", product_id: "product-2", product_name: "ชาเขียว DomiCha", quantity: 40, unit_price: 210, discount: 250, vat_amount: 560, line_total: 8710 }
      ]
    }
  ]
};

function cloneInitialDatabase(): DemoDatabase {
  return JSON.parse(JSON.stringify(initialDatabase)) as DemoDatabase;
}

function loadDatabase(): DemoDatabase {
  if (typeof window === "undefined") return cloneInitialDatabase();
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) {
    const database = cloneInitialDatabase();
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database));
    return database;
  }
  try {
    return JSON.parse(raw) as DemoDatabase;
  } catch {
    return cloneInitialDatabase();
  }
}

function saveDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database));
}

function relationName(resource: keyof DemoDatabase, row: Record<string, unknown>, database: DemoDatabase) {
  if (resource === "products") {
    const supplier = database.suppliers.find((item) => item.id === row.supplier_id);
    return { ...row, suppliers: supplier ? { supplier_name: supplier.supplier_name } : null };
  }
  if (resource === "quotations") {
    const customer = database.customers.find((item) => item.id === row.customer_id);
    return { ...row, customers: customer ? { customer_name: customer.customer_name } : null };
  }
  return row;
}

export async function demoApiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const database = loadDatabase();
  const segments = url.split("?")[0].split("/").filter(Boolean);
  const resource = segments[1] as keyof DemoDatabase;
  const id = segments[2];
  const method = (init?.method || "GET").toUpperCase();

  if (!["customers", "suppliers", "products", "quotations"].includes(resource)) {
    throw new Error("ข้อมูลตัวอย่างยังไม่รองรับรายการนี้");
  }

  const rows = database[resource];
  if (method === "GET") {
    const result = id ? rows.find((row) => row.id === id) : rows;
    if (!result) throw new Error("ไม่พบข้อมูล");
    if (Array.isArray(result)) return result.map((row) => relationName(resource, row, database)) as T;
    return relationName(resource, result, database) as T;
  }

  if (method === "DELETE" && id) {
    database[resource] = rows.filter((row) => row.id !== id);
    saveDatabase(database);
    return undefined as T;
  }

  const payload = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
  const prepared = { ...payload };
  if (resource === "quotations" && Array.isArray(payload.items)) {
    const totals = calculateQuotation(payload.items as never[]);
    Object.assign(prepared, totals, { quotation_items: totals.items });
    delete prepared.items;
  }

  if (method === "POST") {
    const created = {
      ...prepared,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...(resource === "quotations"
        ? { quotation_number: `QT-202607-${String(rows.length + 88).padStart(4, "0")}` }
        : {})
    };
    database[resource] = [created, ...rows];
    saveDatabase(database);
    return relationName(resource, created, database) as T;
  }

  if (method === "PUT" && id) {
    const current = rows.find((row) => row.id === id);
    if (!current) throw new Error("ไม่พบข้อมูล");
    const updated = { ...current, ...prepared, id };
    database[resource] = rows.map((row) => row.id === id ? updated : row);
    saveDatabase(database);
    return relationName(resource, updated, database) as T;
  }

  throw new Error("ไม่รองรับคำสั่งนี้ในโหมดตัวอย่าง");
}
