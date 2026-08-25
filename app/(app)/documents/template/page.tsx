"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { FlowAccountDocumentTemplate } from "@/components/FlowAccountDocumentTemplate";

const invoiceItems = [
  { code: "CUP-001", description: "แก้ว สกรีนลาย", quantity: 1000, unit: "ใบ", unitPrice: 1.5, vatRate: 7 },
  { code: "TEA-TW", description: "ชาไต้หวัน", quantity: 5, unit: "ห่อ", unitPrice: 40, vatRate: 7 },
  { code: "TEA-JS", description: "ชามะลิ", quantity: 10, unit: "ห่อ", unitPrice: 40, vatRate: 7 },
  { code: "TEA-GR", description: "ชาเขียว", quantity: 5, unit: "ห่อ", unitPrice: 40, vatRate: 7 },
  { code: "TEA-RD", description: "ชาแดง", quantity: 5, unit: "ห่อ", unitPrice: 40, vatRate: 7 },
  { code: "PWD-PN", description: "ผงพันซ์", quantity: 1, unit: "ซอง", unitPrice: 120, vatRate: 7 },
  { code: "PWD-BF", description: "อัญชันมะนาว", quantity: 1, unit: "ถุง", unitPrice: 120, vatRate: 7 },
  { code: "SEAL-01", description: "ม้วนซีล", quantity: 1, unit: "ม้วน", unitPrice: 960, vatRate: 7 }
];

const receiptItems = [
  { code: "TEA-JS", description: "ชามะลิ", quantity: 10, unit: "ห่อ", unitPrice: 40, vatRate: 7 }
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
        reference="SO202607030001"
        poNumber="PO-WT-20260703"
        customerName="คุณ อภินันท์ คุณสวัสดิ์   โดมิชา สาขาวัดตาลล้อม"
        customerAddress="218 ซ.สุภาวรรณ 4 ต.บ้านบึง อ.บ้านบึง ชลบุรี 20170"
        customerBranch="โดมิชา สาขาวัดตาลล้อม"
        customerTaxId="1209500039121"
        items={invoiceItems}
        amountText="สามพันเก้าร้อยห้าสิบเก้าบาทถ้วน"
        creditTerm="ชำระภายในวันออกเอกสาร"
        deliveryMethod="จัดส่งจากคลังกลาง"
        note="อ้างอิงใบสั่งซื้อแฟรนไชส์ซีและรายการตัดสต๊อกคลังกลาง ใช้ตรวจสอบยอดขาย ภาษีขาย และลูกหนี้การค้า"
      />

      <FlowAccountDocumentTemplate
        kind="receipt"
        documentNumber="RE202603260001"
        documentDate="26/03/2026"
        seller="ณัฐพงษ์ อุทระ"
        reference="INV202603290004"
        poNumber="PO-WT-20260329"
        customerName="คุณ อภินันท์ คุณสวัสดิ์   โดมิชา สาขาวัดตาลล้อม"
        customerAddress="218 ซ.สุภาวรรณ 4 ต.บ้านบึง อ.บ้านบึง ชลบุรี 20170"
        customerBranch="โดมิชา สาขาวัดตาลล้อม"
        customerTaxId="1209500039121"
        items={receiptItems}
        amountText="สี่ร้อยยี่สิบแปดบาทถ้วน"
        creditTerm="รับชำระแล้ว"
        deliveryMethod="จัดส่งจากคลังกลาง"
        note="แนบหลักฐานการโอนเงินเพื่อกระทบยอดบัญชีธนาคาร และใช้ปิดยอดลูกหนี้ตามใบแจ้งหนี้อ้างอิง"
        payment={{
          method: "transfer",
          bank: "กสิกรไทย ออมทรัพย์",
          accountNumber: "1862519848",
          paidDate: "29/03/2026",
          amount: 428,
          transactionRef: "KBNK20260329001"
        }}
      />
    </div>
  );
}
