"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ClipboardList, FileText, PackageCheck, RefreshCcw, Search } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { dateThai, money } from "@/lib/format";
import type { FranchiseeOrder } from "@/lib/types";

function statusClass(status: string) {
  const map: Record<string, string> = {
    Received: "border-orange-100 bg-orange-50 text-orange-700",
    Confirmed: "border-blue-100 bg-blue-50 text-blue-700",
    Packing: "border-violet-100 bg-violet-50 text-violet-700",
    Shipped: "border-sky-100 bg-sky-50 text-sky-700",
    Completed: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Cancelled: "border-red-100 bg-red-50 text-red-700"
  };
  return map[status] || "border-slate-100 bg-slate-50 text-slate-600";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<FranchiseeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      setOrders(await apiFetch<FranchiseeOrder[]>("/api/orders"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดรายการใบสั่งซื้อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => {
      const profile = order.franchisee_profiles;
      return [
        order.order_number,
        order.order_status,
        order.payment_status,
        profile?.branch_name,
        profile?.owner_name,
        profile?.phone,
        profile?.email
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [orders, query]);

  const totalValue = orders.reduce((sum, order) => sum + Number(order.grand_total || 0), 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
              <FileText className="h-4 w-4" /> Franchisee Purchase Orders
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">เอกสารใบสั่งซื้อแฟรนไชส์ซี</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              รวมคำสั่งซื้อจากสาขา เปิดดูรูปแบบเอกสาร พิมพ์ หรือบันทึกเป็น PDF เพื่อส่งต่อให้คลังสินค้าและบัญชี
            </p>
          </div>
          <button onClick={loadOrders} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15">
            <RefreshCcw className="h-4 w-4" /> รีเฟรช
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">จำนวนเอกสาร</p>
          <p className="mt-2 text-3xl font-black">{orders.length}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">มูลค่ารวม</p>
          <p className="mt-2 text-3xl font-black text-orange-600">{money(totalValue)}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">เอกสารรอดำเนินการ</p>
          <p className="mt-2 text-3xl font-black">{orders.filter((order) => !["Completed", "Cancelled"].includes(order.order_status)).length}</p>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">รายการเอกสาร</h2>
            <p className="mt-1 text-xs text-slate-400">กด “เปิดเอกสาร” เพื่อดูใบสั่งซื้อแบบพร้อมพิมพ์</p>
          </div>
          <label className="relative block md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 rounded-2xl pl-10" placeholder="ค้นหาเลขที่ / สาขา / เบอร์โทร" />
          </label>
        </div>

        {error ? <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">กำลังโหลดรายการเอกสาร...</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">ยังไม่มีใบสั่งซื้อ</p>
            <p className="mt-1 text-sm text-slate-500">เมื่อแฟรนไชส์ซีสั่งของจาก /shop รายการจะมาแสดงที่นี่</p>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {filtered.map((order) => {
            const profile = order.franchisee_profiles;
            return (
              <article key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-orange-200 hover:bg-orange-50/30">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm">
                    <PackageCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{order.order_number}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(order.order_status)}`}>{order.order_status}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{order.payment_status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{profile?.branch_name || "ไม่พบชื่อสาขา"} • {profile?.owner_name || "-"} • {profile?.phone || "-"}</p>
                    <p className="mt-1 text-xs text-slate-400">{dateThai(order.created_at)} • {order.delivery_method === "pickup" ? "รับสินค้าที่ศูนย์" : "จัดส่ง"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 lg:min-w-[260px] lg:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">ยอดสุทธิ</p>
                      <p className="text-lg font-black text-orange-600">{money(order.grand_total)}</p>
                    </div>
                    <Link href={`/orders/${order.id}`} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-orange-600">
                      เปิดเอกสาร <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
