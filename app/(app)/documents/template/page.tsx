"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { FlowAccountDocumentTemplate } from "@/components/FlowAccountDocumentTemplate";

const invoiceItems = [
  { description: "แก้ว สกรีนลาย", quantity: 1000, unit: "ใบ", unitPrice: 1.5 },
  { description: "ชาไต้หวัน", quantity: 5, unit: "ห่อ", unitPrice: 40 },
  { description: "ชามะลิ", quantity: 10, unit: "ห่อ", unitPrice: 40 },
  { description: "ชาเขียว", quantity: 5, unit: "ห่อ", unitPrice: 40 },
  { description: "ชาแดง", quantity: 5, unit: "ห่อ", unitPrice: 40 },
  { description: "ผงพันซ์", quantity: 1, unit: "ซอง", unitPrice: 120 },
  { description: "อัญชันมะนาว", quantity: 1, unit: "ถุง", unitPrice: 120 },
  { description: "ม้วนซีล", quantity: 1, unit: "ม้วน", unitPrice: 960, discount: "0.0 ฿" }
];

const receiptItems = [
  { description: "ชามะลิ", quantity: 10, unit: "ห่อ", unitPrice: 40 }
];

export default function DocumentTemplatePage() {
  return (
    <div className="space-y-5 pb-12">
      <div className="print-hidden flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/documents" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" /> กลับหน้าเอกสารขาย
        </Link>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-11 items-center rounded-2xl border border-sky-100 bg-sky-50 px-4 text-sm font-bold text-sky-700">
            Flow-style template
          </span>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-orange-600">
            <Printer className="h-4 w-4" /> พิมพ์
          </button>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> บันทึก PDF
          </button>
        </div>
      </div>

      <FlowAccountDocumentTemplate
        kind="invoice"
        documentNumber="INV202607030002"
        documentDate="03/07/2026"
        dueDate="03/07/2026"
        seller="ณัฐพงษ์ อุทระ"
        customerName="คุณ อภินันท์ คุณสวัสดิ์   โดมิชา สาขาวัดตาลล้อม"
        customerAddress="218 ซ.สุภาวรรณ 4 ต.บ้านบึง อ.บ้านบึง ชลบุรี 20170"
        customerTaxId="1209500039121"
        items={invoiceItems}
        amountText="สามพันเจ็ดร้อยบาทถ้วน"
      />

      <FlowAccountDocumentTemplate
        kind="receipt"
        documentNumber="RE202603260001"
        documentDate="26/03/2026"
        seller="ณัฐพงษ์ อุทระ"
        reference="INV202603290004"
        customerName="คุณ อภินันท์ คุณสวัสดิ์   โดมิชา สาขาวัดตาลล้อม"
        customerAddress="218 ซ.สุภาวรรณ 4 ต.บ้านบึง อ.บ้านบึง ชลบุรี 20170"
        customerTaxId="1209500039121"
        items={receiptItems}
        amountText="สี่ร้อยบาทถ้วน"
        payment={{
          method: "transfer",
          bank: "กสิกรไทย ออมทรัพย์",
          accountNumber: "1862519848",
          paidDate: "29/03/2026",
          amount: 400
        }}
      />
    </div>
  );
}
