export type UserRole = "Admin" | "Sales" | "Accountant";
export type Status = "Active" | "Inactive";
export type CustomerType = "Retail" | "Franchisee" | "Corporate";
export type VatType = "VAT 7%" | "No VAT" | "VAT Included";
export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

export type FieldType = "text" | "email" | "number" | "textarea" | "select";

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
};

export type Customer = {
  id: string;
  customer_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  customer_type: CustomerType;
  status: Status;
  created_at: string;
};

export type Supplier = {
  id: string;
  supplier_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  address: string | null;
  payment_terms: string | null;
  product_category_supplied: string | null;
  status: Status;
  created_at: string;
};

export type Product = {
  id: string;
  product_code: string;
  product_name: string;
  category: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  vat_type: VatType;
  minimum_stock: number;
  supplier_id: string | null;
  status: Status;
  created_at: string;
  suppliers?: { supplier_name: string } | null;
};

export type QuotationItem = {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_amount?: number;
  line_total?: number;
};

export type Quotation = {
  id: string;
  quotation_number: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string | null;
  status: QuotationStatus;
  subtotal: number;
  discount_total: number;
  vat_total: number;
  grand_total: number;
  notes: string | null;
  created_at: string;
  customers?: { customer_name: string } | null;
  quotation_items?: QuotationItem[];
};
