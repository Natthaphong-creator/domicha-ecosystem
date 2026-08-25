"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  ExternalLink,
  FileText,
  Gauge,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Store,
  Users,
  Warehouse
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DomiChaSystemSummary } from "@/lib/domichaSystem";
import { money } from "@/lib/format";

function numberThai(value: number) {
  return Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

function timeThai(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function openable(url: string) {
  return Boolean(url && /^https?:\/\//.test(url));
}

export function DomiChaSystemPanel({ initial }: { initial: DomiChaSystemSummary }) {
  const [summary, setSummary] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/domicha-system", { cache: "no-store" });
      const next = (await response.json()) as DomiChaSystemSummary;
      setSummary(next);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => refresh(true), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const t = summary.totals;
  const apps = [
    {
      name: "DomiCha System",
      label: "Stock / คลัง",
      detail: "คลังกลาง สต๊อคสาขา ใบเบิก ใบเสร็จ",
      url: summary.links.stock,
      icon: Warehouse,
      color: "bg-orange-50 text-orange-700"
    },
    {
      name: "DomiCha POS",
      label: "หน้าร้าน",
      detail: "ขายหน้าร้าน เปิดกะ ปิดกะ สมาชิก",
      url: summary.links.pos,
      icon: ShoppingCart,
      color: "bg-emerald-50 text-emerald-700"
    },
    {
      name: "POS Manager",
      label: "เจ้าของร้าน",
      detail: "ยอดขายสด รายงาน กะทุกสาขา เมนู",
      url: summary.links.manager,
      icon: Gauge,
      color: "bg-blue-50 text-blue-700"
    }
  ];

  return (
    <section id="domicha-system" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-orange-600">DomiCha Ecosystem</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">ระบบเชื่อมต่อกลาง</h2>
          <p className="mt-1 text-sm text-slate-500">
            อ่านข้อมูลเดียวกับ Stock / POS / POS Manager จาก Firebase Realtime Database
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={() => refresh()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {!summary.ok ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          อ่านข้อมูลกลางไม่สำเร็จ: {summary.error || "กรุณาตรวจ Firebase Rules"}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <article key={app.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${app.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-400">{app.label}</p>
                  <h3 className="mt-0.5 font-bold text-slate-950">{app.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{app.detail}</p>
                </div>
              </div>
              {openable(app.url) ? (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600"
                >
                  เปิดระบบ
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  href="/settings"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500"
                >
                  รอตั้งค่า URL
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">ยอดขาย POS วันนี้</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{money(t.todaySales)}</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-orange-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">{numberThai(t.todayOrders)} บิล</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">กะที่เปิดอยู่</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{numberThai(t.openShifts)}</p>
            </div>
            <Store className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">จาก {numberThai(t.branches)} สาขา</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">คลังกลาง</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{numberThai(t.warehouseUnits)}</p>
            </div>
            <Boxes className="h-6 w-6 text-blue-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">{numberThai(t.warehouseItems)} รายการ</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">ต้องติดตาม</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{numberThai(t.pendingTransfers + t.lowWarehouseItems + t.pendingOnlineOrders)}</p>
            </div>
            <CircleAlert className="h-6 w-6 text-red-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">ค้างรับ {t.pendingTransfers} / สต๊อคต่ำ {t.lowWarehouseItems} / ออนไลน์ {t.pendingOnlineOrders}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">ลูกค้าใน Stock</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{numberThai(t.customers)}</p>
            </div>
            <Users className="h-6 w-6 text-orange-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">ฐานข้อมูลลูกค้ากลาง</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">ใบแจ้งหนี้ค้างรับ</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">{numberThai(t.pendingInvoices)}</p>
            </div>
            <FileText className="h-6 w-6 text-amber-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">ทั้งหมด {numberThai(t.invoices)} ใบ</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">ขายลูกค้าวันนี้</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{money(t.todayCustomerRevenue)}</p>
            </div>
            <ReceiptText className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">{numberThai(t.todayCustomerSales)} บิล / ใบเสร็จ {numberThai(t.customerReceipts)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">ยอดขายลูกค้ารวม</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{money(t.customerRevenue)}</p>
            </div>
            <ReceiptText className="h-6 w-6 text-blue-500" />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">{numberThai(t.customerSales)} รายการจาก Stock</p>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-950">ยอดขายวันนี้แยกสาขา</h3>
            <span className="text-xs text-slate-400">อัปเดต {timeThai(summary.updatedAt)}</span>
          </div>
          <div className="mt-4 space-y-3">
            {summary.branchSales.length ? summary.branchSales.map((row) => (
              <div key={row.branch} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{row.branch}</p>
                  <p className="text-xs text-slate-400">{numberThai(row.orders)} บิล</p>
                </div>
                <strong>{money(row.total)}</strong>
              </div>
            )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ยังไม่มียอดขายวันนี้</p>}
          </div>
        </article>

        <div className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-950">เอกสารลูกค้าล่าสุด</h3>
            <div className="mt-4 space-y-2">
              {summary.recentCustomerDocs.length ? summary.recentCustomerDocs.map((doc) => (
                <div key={`${doc.type}-${doc.id}`} className="rounded-xl bg-slate-50 px-3 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{doc.title} {doc.id}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{doc.customer}</p>
                    </div>
                    <strong className="whitespace-nowrap text-slate-900">{money(doc.total)}</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-orange-600">{doc.status}</span>
                    <span className="truncate text-slate-400">{doc.date || "-"}</span>
                  </div>
                </div>
              )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ยังไม่มีเอกสารลูกค้าจาก Stock</p>}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-950">กะที่กำลังเปิด</h3>
            <div className="mt-4 space-y-2">
              {summary.openShifts.length ? summary.openShifts.map((shift) => (
                <div key={`${shift.branch}-${shift.openedAt}`} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-emerald-900">{shift.branch}</p>
                  <p className="text-xs text-emerald-700">เปิดโดย {shift.staff}</p>
                </div>
              )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ยังไม่มีกะที่เปิดอยู่</p>}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-950">คลังกลางใกล้หมด</h3>
            <div className="mt-4 space-y-2">
              {summary.lowItems.length ? summary.lowItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-red-900">{item.name}</span>
                  <span className="text-red-700">{numberThai(item.qty)} / ขั้นต่ำ {numberThai(item.min)}</span>
                </div>
              )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">คลังกลางยังไม่มีรายการต่ำกว่าขั้นต่ำ</p>}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
