"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  Eye,
  FilePlus2,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShoppingBag,
  X
} from "lucide-react";
import {
  accountingDocuments,
  documentStatusLabels,
  documentTypeLabels,
  type AccountingDocument,
  type AccountingDocumentStatus,
  type AccountingDocumentType
} from "@/lib/accountingDemo";
import { dateThai, money } from "@/lib/format";

const statusClasses: Record<AccountingDocumentStatus, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Pending: "bg-amber-50 text-amber-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
  Cancelled: "bg-slate-100 text-slate-500"
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<AccountingDocument[]>(accountingDocuments);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AccountingDocumentType | "All">("All");
  const [status, setStatus] = useState<AccountingDocumentStatus | "All">("All");
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesQuery = !normalizedQuery || `${document.number} ${document.customer}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (type === "All" || document.type === type) && (status === "All" || document.status === status);
    });
  }, [documents, query, status, type]);

  function createDemoDocument(documentType: AccountingDocumentType) {
    const prefix = { Quotation: "QT", Invoice: "INV", Receipt: "RE", TaxInvoice: "TAX" }[documentType];
    const nextNumber = `${prefix}-202607-${String(documents.length + 49).padStart(4, "0")}`;
    setDocuments((current) => [
      {
        id: crypto.randomUUID(),
        number: nextNumber,
        type: documentType,
        customer: "ลูกค้าใหม่ (ตัวอย่าง)",
        date: "2026-07-01",
        dueDate: "2026-07-08",
        total: 0,
        status: "Draft"
      },
      ...current
    ]);
    setShowCreate(false);
    showNotice(`สร้าง${documentTypeLabels[documentType]}ฉบับร่างแล้ว`);
  }

  function markPaid(id: string) {
    setDocuments((current) => current.map((document) => (document.id === id ? { ...document, status: "Paid" } : document)));
    showNotice("บันทึกรับชำระเงินเรียบร้อย");
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <header className="premium-page-header overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-2xl shadow-orange-950/10 sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
              <ShoppingBag className="h-3.5 w-3.5" /> Sales workspace
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-[-.03em] sm:text-4xl">ศูนย์จัดการงานขาย</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">ติดตามเอกสาร รับชำระ และรับออเดอร์ใหม่จากหน้าร้าน DomiCha ในพื้นที่เดียว</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/15">
              เปิดหน้าร้านลูกค้า <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="relative">
              <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/20" onClick={() => setShowCreate((current) => !current)}>
                <Plus className="h-4 w-4" />
                สร้างเอกสาร
                <ChevronDown className="h-4 w-4" />
              </button>
              {showCreate ? (
                <div className="absolute right-0 top-12 z-10 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl">
                  {(Object.entries(documentTypeLabels) as [AccountingDocumentType, string][]).map(([value, label]) => (
                    <button key={value} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-slate-50" onClick={() => createDemoDocument(value)}>
                      <FilePlus2 className="h-4 w-4 text-orange-500" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["เอกสารทั้งหมด", documents.length, "text-slate-950"],
          ["รอรับชำระ", documents.filter((item) => item.status === "Pending").length, "text-amber-600"],
          ["รับชำระแล้ว", documents.filter((item) => item.status === "Paid").length, "text-emerald-600"],
          ["เกินกำหนด", documents.filter((item) => item.status === "Overdue").length, "text-red-600"]
        ].map(([label, value, color]) => (
          <article key={String(label)} className="rounded-[22px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_12px_36px_rgba(80,45,20,.07)] backdrop-blur">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-10" placeholder="ค้นหาเลขที่เอกสาร หรือลูกค้า" />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <label className="relative">
              <span className="sr-only">ประเภทเอกสาร</span>
              <select value={type} onChange={(event) => setType(event.target.value as AccountingDocumentType | "All")} className="h-10 min-w-40 pr-8">
                <option value="All">เอกสารทุกประเภท</option>
                {(Object.entries(documentTypeLabels) as [AccountingDocumentType, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="relative">
              <span className="sr-only">สถานะเอกสาร</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as AccountingDocumentStatus | "All")} className="h-10 min-w-36 pr-8">
                <option value="All">ทุกสถานะ</option>
                {(Object.entries(documentStatusLabels) as [AccountingDocumentStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 sm:inline-flex">
              <Filter className="h-4 w-4" /> ตัวกรอง
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>เอกสาร</th>
                <th>ลูกค้า</th>
                <th>วันที่ออก</th>
                <th>ครบกำหนด</th>
                <th>สถานะ</th>
                <th className="text-right">ยอดสุทธิ</th>
                <th className="w-40 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((document) => (
                <tr key={document.id} className="hover:bg-slate-50/70">
                  <td>
                    <strong className="block whitespace-nowrap">{document.number}</strong>
                    <span className="text-xs text-slate-400">{documentTypeLabels[document.type]}</span>
                  </td>
                  <td className="min-w-52">{document.customer}</td>
                  <td className="whitespace-nowrap text-slate-500">{dateThai(document.date)}</td>
                  <td className="whitespace-nowrap text-slate-500">{dateThai(document.dueDate)}</td>
                  <td>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[document.status]}`}>
                      {documentStatusLabels[document.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right font-semibold">{money(document.total)}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      {document.status === "Pending" || document.status === "Overdue" ? (
                        <button className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50" aria-label={`รับชำระ ${document.number}`} onClick={() => markPaid(document.id)}>
                          <Check className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label={`ดู ${document.number}`} onClick={() => showNotice("เปิดดูเอกสารตัวอย่าง")}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label={`ส่ง ${document.number}`} onClick={() => showNotice("เตรียมส่งเอกสารทางอีเมล")}>
                        <Send className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label={`ดาวน์โหลด ${document.number}`} onClick={() => showNotice("เตรียมไฟล์ PDF ตัวอย่าง")}>
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={`เมนูเพิ่มเติม ${document.number}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-14 text-center text-slate-400">ไม่พบเอกสารที่ค้นหา</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          <span>แสดง {filtered.length} จาก {documents.length} รายการ</span>
          <span>ข้อมูลตัวอย่างสำหรับทดสอบระบบ</span>
        </div>
      </section>

      {notice ? (
        <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl lg:bottom-7">
          <Check className="h-4 w-4 text-emerald-400" />
          {notice}
          <button onClick={() => setNotice("")} aria-label="ปิดข้อความ"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
      ) : null}
    </div>
  );
}
