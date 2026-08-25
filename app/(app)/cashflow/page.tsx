"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, RefreshCcw, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { money } from "@/lib/format";

type DashboardPayload = {
  totals: {
    monthlyRevenue: number;
    pendingReceivables: number;
    overdueReceivables: number;
  };
  recentSales: Array<{
    id: string;
    number: string;
    customer: string;
    total: number;
    status: "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled";
  }>;
  monthlySales: Array<{ month: string; income: number; pending: number }>;
};

const emptyData: DashboardPayload = {
  totals: {
    monthlyRevenue: 0,
    pendingReceivables: 0,
    overdueReceivables: 0
  },
  recentSales: [],
  monthlySales: []
};

export default function CashflowPage() {
  const [data, setData] = useState<DashboardPayload>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCashflow() {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<DashboardPayload>("/api/dashboard"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดกระแสเงินสดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCashflow();
  }, []);

  const max = useMemo(() => Math.max(1, ...data.monthlySales.flatMap((row) => [row.income, row.pending])), [data.monthlySales]);
  const netCash = data.totals.monthlyRevenue - data.totals.overdueReceivables;
  const metrics: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: "เงินเข้าที่รับชำระเดือนนี้", value: data.totals.monthlyRevenue, icon: ArrowDownLeft, color: "bg-emerald-50 text-emerald-700" },
    { label: "ลูกหนี้รอรับชำระ", value: data.totals.pendingReceivables, icon: ArrowUpRight, color: "bg-orange-50 text-orange-700" },
    { label: "กระแสเงินสดสุทธิ", value: netCash, icon: TrendingUp, color: "bg-blue-50 text-blue-700" }
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-4">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-orange-600">บัญชี</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">กระแสเงินสด</h1>
          <p className="mt-1 text-sm text-slate-500">ติดตามเงินเข้า ลูกหนี้ และสภาพคล่องจากเอกสารขายจริงในระบบ</p>
        </div>
        <button onClick={loadCashflow} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช
        </button>
      </header>

      {error ? <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{money(value)}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">แนวโน้ม 6 เดือน</h2>
          <div className="mt-8 grid h-72 grid-cols-6 items-end gap-4 border-b border-slate-100">
            {data.monthlySales.map((row) => (
              <div key={row.month} className="flex h-full flex-col justify-end">
                <div className="flex flex-1 items-end justify-center gap-1.5">
                  <span className="w-4 rounded-t-lg bg-emerald-500 sm:w-7" style={{ height: `${(row.income / max) * 100}%` }} />
                  <span className="w-4 rounded-t-lg bg-orange-300 sm:w-7" style={{ height: `${(row.pending / max) * 100}%` }} />
                </div>
                <span className="mt-3 text-center text-xs text-slate-400">{row.month}</span>
              </div>
            ))}
            {!loading && data.monthlySales.length === 0 ? (
              <div className="col-span-6 flex h-full items-center justify-center text-sm text-slate-400">ยังไม่มีข้อมูลกระแสเงินสด</div>
            ) : null}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><Landmark className="h-5 w-5" /></span><div><p className="text-xs text-slate-400">เงินรับชำระเดือนนี้</p><strong className="text-xl">{money(data.totals.monthlyRevenue)}</strong></div></div>
          <h2 className="mt-6 font-semibold">เอกสารล่าสุด</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {data.recentSales.slice(0, 4).map((row) => <div key={row.id} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{row.customer}</p><p className="text-xs text-slate-400">{row.number}</p></div><strong className={row.status === "Paid" ? "whitespace-nowrap text-emerald-600" : "whitespace-nowrap text-orange-600"}>{money(row.total)}</strong></div>)}
            {!loading && data.recentSales.length === 0 ? <p className="py-4 text-sm text-slate-400">ยังไม่มีเอกสารล่าสุด</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
