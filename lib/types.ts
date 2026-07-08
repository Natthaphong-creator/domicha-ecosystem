export type UserRole = "Admin" | "Sales" | "Accountant" | "Franchisee";
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

export type FranchiseeOrderStatus = "Received" | "Confirmed" | "Packing" | "Shipped" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Overdue" | "Cancelled";

export type FranchiseeOrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at?: string;
};

export type FranchiseeOrder = {
  id: string;
  order_number: string;
  franchisee_id: string;
  user_id: string;
  branch_id: string | null;
  delivery_method: "delivery" | "pickup" | string;
  shipping_address: string | null;
  payment_method: "transfer" | "cod" | string;
  order_status: FranchiseeOrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  grand_total: number;
  note: string | null;
  line_request_id: string | null;
  created_at: string;
  updated_at: string;
  franchisee_profiles?: {
    branch_name: string;
    owner_name: string;
    phone: string;
    email: string;
    province: string | null;
    shipping_address: string | null;
    tax_id: string | null;
    payment_terms: string | null;
  } | null;
  franchisee_order_items?: FranchiseeOrderItem[];
};
