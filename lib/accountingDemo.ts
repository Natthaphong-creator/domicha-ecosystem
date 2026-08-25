export type AccountingDocumentStatus = "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled";
export type AccountingDocumentType = "Quotation" | "Invoice" | "Receipt" | "TaxInvoice";

export type AccountingDocument = {
  id: string;
  number: string;
  type: AccountingDocumentType;
  customer: string;
  date: string;
  dueDate: string;
  total: number;
  status: AccountingDocumentStatus;
};

export type ExpenseRecord = {
  id: string;
  number: string;
  vendor: string;
  category: string;
  date: string;
  total: number;
  status: "Paid" | "Pending";
};

export const accountingDocuments: AccountingDocument[] = [
  { id: "doc-1", number: "INV-202607-0048", type: "Invoice", customer: "DomiCha สาขาบางแสน", date: "2026-07-01", dueDate: "2026-07-08", total: 28450, status: "Pending" },
  { id: "doc-2", number: "RE-202606-0119", type: "Receipt", customer: "บริษัท ชลบุรี ฟู้ด จำกัด", date: "2026-06-30", dueDate: "2026-06-30", total: 64735, status: "Paid" },
  { id: "doc-3", number: "QT-202606-0087", type: "Quotation", customer: "DomiCha สาขาศรีราชา", date: "2026-06-29", dueDate: "2026-07-06", total: 18900, status: "Draft" },
  { id: "doc-4", number: "INV-202606-0047", type: "Invoice", customer: "DomiCha สาขาพัทยา", date: "2026-06-25", dueDate: "2026-06-30", total: 45280, status: "Overdue" },
  { id: "doc-5", number: "TAX-202606-0062", type: "TaxInvoice", customer: "บริษัท มิลค์ที จำกัด", date: "2026-06-24", dueDate: "2026-06-24", total: 96300, status: "Paid" },
  { id: "doc-6", number: "INV-202606-0046", type: "Invoice", customer: "DomiCha สาขาระยอง", date: "2026-06-22", dueDate: "2026-07-07", total: 31080, status: "Pending" }
];

export const expenseRecords: ExpenseRecord[] = [
  { id: "exp-1", number: "EXP-202607-0012", vendor: "บริษัท บรรจุภัณฑ์ไทย จำกัด", category: "บรรจุภัณฑ์", date: "2026-07-01", total: 23800, status: "Paid" },
  { id: "exp-2", number: "EXP-202606-0118", vendor: "ติ่งฟง ฟู้ดส์", category: "วัตถุดิบ", date: "2026-06-30", total: 48650, status: "Paid" },
  { id: "exp-3", number: "EXP-202606-0117", vendor: "ค่าโฆษณาออนไลน์", category: "การตลาด", date: "2026-06-28", total: 12500, status: "Pending" },
  { id: "exp-4", number: "EXP-202606-0116", vendor: "บริษัท ขนส่งด่วน จำกัด", category: "ขนส่ง", date: "2026-06-27", total: 8960, status: "Paid" },
  { id: "exp-5", number: "EXP-202606-0115", vendor: "สำนักงานบัญชี ธนพร", category: "บริการวิชาชีพ", date: "2026-06-25", total: 6500, status: "Paid" }
];

export const monthlyCashflow = [
  { month: "ก.พ.", income: 198000, expense: 128000 },
  { month: "มี.ค.", income: 225000, expense: 136000 },
  { month: "เม.ย.", income: 214000, expense: 142000 },
  { month: "พ.ค.", income: 248000, expense: 151000 },
  { month: "มิ.ย.", income: 267000, expense: 157000 },
  { month: "ก.ค.", income: 284650, expense: 161320 }
] as const;

export const documentTypeLabels: Record<AccountingDocumentType, string> = {
  Quotation: "ใบเสนอราคา",
  Invoice: "ใบแจ้งหนี้",
  Receipt: "ใบเสร็จรับเงิน",
  TaxInvoice: "ใบกำกับภาษี"
};

export const documentStatusLabels: Record<AccountingDocumentStatus, string> = {
  Draft: "ร่าง",
  Pending: "รอรับชำระ",
  Paid: "รับชำระแล้ว",
  Overdue: "เกินกำหนด",
  Cancelled: "ยกเลิก"
};
