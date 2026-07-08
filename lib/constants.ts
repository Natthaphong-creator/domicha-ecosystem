import type { FormField } from "@/lib/types";

export const roles = [
  { label: "ผู้ดูแลระบบ", value: "Admin" },
  { label: "ฝ่ายขาย", value: "Sales" },
  { label: "บัญชี", value: "Accountant" }
];

export const statusOptions = [
  { label: "ใช้งาน", value: "Active" },
  { label: "ไม่ใช้งาน", value: "Inactive" }
];

export const customerFields: FormField[] = [
  { name: "customer_name", label: "ชื่อลูกค้า", type: "text", required: true },
  { name: "contact_person", label: "ผู้ติดต่อ", type: "text" },
  { name: "phone", label: "เบอร์โทรศัพท์", type: "text" },
  { name: "email", label: "อีเมล", type: "email" },
  { name: "tax_id", label: "เลขประจำตัวผู้เสียภาษี", type: "text" },
  { name: "billing_address", label: "ที่อยู่ออกบิล", type: "textarea" },
  { name: "shipping_address", label: "ที่อยู่จัดส่ง", type: "textarea" },
  {
    name: "customer_type",
    label: "ประเภทลูกค้า",
    type: "select",
    required: true,
    options: [
      { label: "รายย่อย", value: "Retail" },
      { label: "แฟรนไชส์", value: "Franchisee" },
      { label: "องค์กร", value: "Corporate" }
    ]
  },
  { name: "status", label: "สถานะ", type: "select", required: true, options: statusOptions }
];

export const supplierFields: FormField[] = [
  { name: "supplier_name", label: "ชื่อซัพพลายเออร์", type: "text", required: true },
  { name: "contact_person", label: "ผู้ติดต่อ", type: "text" },
  { name: "phone", label: "เบอร์โทรศัพท์", type: "text" },
  { name: "email", label: "อีเมล", type: "email" },
  { name: "tax_id", label: "เลขประจำตัวผู้เสียภาษี", type: "text" },
  { name: "address", label: "ที่อยู่", type: "textarea" },
  { name: "payment_terms", label: "เงื่อนไขการชำระเงิน", type: "text" },
  { name: "product_category_supplied", label: "หมวดสินค้าที่จัดหา", type: "text" },
  { name: "status", label: "สถานะ", type: "select", required: true, options: statusOptions }
];

export const productFields: FormField[] = [
  { name: "product_code", label: "รหัสสินค้า", type: "text", required: true },
  { name: "product_name", label: "ชื่อสินค้า/วัตถุดิบ", type: "text", required: true },
  { name: "category", label: "หมวดหมู่", type: "text" },
  { name: "unit", label: "หน่วย", type: "text", required: true },
  { name: "cost_price", label: "ราคาทุน", type: "number", required: true },
  { name: "selling_price", label: "ราคาขาย", type: "number", required: true },
  {
    name: "vat_type",
    label: "ประเภท VAT",
    type: "select",
    required: true,
    options: [
      { label: "VAT 7%", value: "VAT 7%" },
      { label: "ไม่มี VAT", value: "No VAT" },
      { label: "รวม VAT แล้ว", value: "VAT Included" }
    ]
  },
  { name: "minimum_stock", label: "สต็อกขั้นต่ำ", type: "number", required: true },
  { name: "supplier_id", label: "ซัพพลายเออร์", type: "select" },
  { name: "status", label: "สถานะ", type: "select", required: true, options: statusOptions }
];
