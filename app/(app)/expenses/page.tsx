"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Download, MoreHorizontal, Paperclip, Plus, Search, WalletCards, X } from "lucide-react";
import { expenseRecords, type ExpenseRecord } from "@/lib/accountingDemo";
import { dateThai, money } from "@/lib/format";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(expenseRecords);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const total = useMemo(() => expenses.reduce((sum, row) => sum + row.total, 0), [expenses]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = Number(form.get("total") || 0);
    setExpenses((current) => [
      {
        id: crypto.randomUUID(),
        number: `EXP-202607-${String(current.length + 13).padStart(4, "0")}`,
        vendor: String(form.get("vendor") || "ไม่ระบุผู้ขาย"),
        category: String(form.get("category") || "อื่น ๆ"),
        date: "2026-07-01",
        total: value,
        status: "Pending"
      },
      ...current
    ]);
    setOpen(false);
    setNotice("บันทึกรายจ่ายใหม่แล้ว");
    window.setTimeout(() => setNotice(""), 2200);
  }

  const shown = expenses.filter((row) => `${row.number} ${row.vendor} ${row.category}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-5 pb-24 lg:pb-4">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-orange-600">ค่าใช้จ่าย</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">รายจ่ายและซื้อสินค้า</h1>
          <p className="mt-1 text-sm text-slate-500">บันทึกค่าใช้จ่าย แนบหลักฐาน และติดตามยอดค้างจ่าย</p>
        </div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/20" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> บันทึกรายจ่าย
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["รายจ่ายเดือนนี้", total, "text-slate-950"],
          ["ชำระแล้ว", expenses.filter((row) => row.status === "Paid").reduce((sum, row) => sum + row.total, 0), "text-emerald-600"],
          ["รอชำระ", expenses.filter((row) => row.status === "Pending").reduce((sum, row) => sum + row.total, 0), "text-amber-600"]
        ].map(([label, value, color]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{money(Number(value))}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative max-w-lg flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-10" placeholder="ค้นหาผู้ขาย หมวด หรือเลขที่" />
          </label>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600">
            <Download className="h-4 w-4" /> ส่งออก
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>เลขที่</th><th>ผู้ขาย/รายการ</th><th>หมวด</th><th>วันที่</th><th>สถานะ</th><th className="text-right">จำนวนเงิน</th><th className="w-24 text-right">จัดการ</th></tr></thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap font-medium">{row.number}</td>
                  <td className="min-w-56">{row.vendor}</td>
                  <td><span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{row.category}</span></td>
                  <td className="whitespace-nowrap text-slate-500">{dateThai(row.date)}</td>
                  <td><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${row.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{row.status === "Paid" ? "ชำระแล้ว" : "รอชำระ"}</span></td>
                  <td className="whitespace-nowrap text-right font-semibold">{money(row.total)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={`ไฟล์แนบ ${row.number}`}><Paperclip className="h-4 w-4" /></button>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={`เมนู ${row.number}`}><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-bold">บันทึกรายจ่าย</h2><p className="mt-1 text-sm text-slate-500">เพิ่มรายการค่าใช้จ่ายใหม่</p></div>
              <button type="button" className="rounded-xl p-2 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="ปิด"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">ผู้ขายหรือชื่อรายการ<input name="vendor" required className="mt-1.5" placeholder="เช่น บริษัท บรรจุภัณฑ์ไทย จำกัด" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>หมวดรายจ่าย<select name="category" className="mt-1.5"><option>วัตถุดิบ</option><option>บรรจุภัณฑ์</option><option>ขนส่ง</option><option>การตลาด</option><option>อื่น ๆ</option></select></label>
                <label>จำนวนเงิน<input name="total" type="number" min="0" required className="mt-1.5" placeholder="0.00" /></label>
              </div>
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-5 text-sm text-slate-500"><Paperclip className="h-4 w-4" /> แนบใบเสร็จหรือหลักฐาน</button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" onClick={() => setOpen(false)}>ยกเลิก</button>
              <button className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">บันทึกรายจ่าย</button>
            </div>
          </form>
        </div>
      ) : null}

      {notice ? <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl lg:bottom-7"><Check className="h-4 w-4 text-emerald-400" />{notice}</div> : null}
    </div>
  );
}
