"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CalendarDays, LockKeyhole, RefreshCcw, TrendingUp, WalletCards } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { dateThai, money } from "@/lib/format";

type BranchProfitPayload = {
  period: { from: string; to: string };
  totals: {
    branchCount: number;
    orderCount: number;
    revenue: number;
    productRevenue: number;
    deliveryFee: number;
    cost: number;
    grossProfit: number;
    marginPercent: number;
    missingCostItems: number;
  };
  branches: Array<{
    branchName: string;
    ownerName: string;
    orderCount: number;
    revenue: number;
    productRevenue: number;
    deliveryFee: number;
    cost: number;
    grossProfit: number;
    marginPercent: number;
    missingCostItems: number;
    lastOrderAt: string | null;
  }>;
};

const emptyPayload: BranchProfitPayload = {
  period: { from: "", to: "" },
  totals: {
    branchCount: 0,
    orderCount: 0,
    revenue: 0,
    productRevenue: 0,
    deliveryFee: 0,
    cost: 0,
    grossProfit: 0,
    marginPercent: 0,
    missingCostItems: 0
  },
  branches: []
};

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function initialPeriod() {
  const now = new Date();
  return {
    from: dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: dateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 1))
  };
}

function percent(value: number) {
  return `${value.toLocaleString("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function BranchProfitReport() {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState<BranchProfitPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from: period.from, to: period.to });
      setData(await apiFetch<BranchProfitPayload>(`/api/reports/branch-profit?${params.toString()}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดรายงานกำไรไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topBranch = useMemo(() => data.branches[0], [data.branches]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              เฉพาะเจ้าของและผู้บริหาร
            </div>
            <h2 className="mt-3 text-xl font-bold text-slate-950">กำไรแยกตามร้าน</h2>
            <p className="mt-1 text-sm text-slate-500">คำนวณจากใบสั่งซื้อแฟรนไชส์ซี หักต้นทุนสินค้าตามราคาทุนในคลังสินค้า</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[150px_150px_auto]">
            <label className="text-xs font-semibold text-slate-500">
              ตั้งแต่
              <input type="date" value={period.from} onChange={(event) => setPeriod({ ...period, from: event.target.value })} className="mt-1 h-10 rounded-xl text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              ก่อนวันที่
              <input type="date" value={period.to} onChange={(event) => setPeriod({ ...period, to: event.target.value })} className="mt-1 h-10 rounded-xl text-sm" />
            </label>
            <button onClick={loadReport} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              โหลดรายงาน
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "ยอดขายสินค้า", value: money(data.totals.productRevenue), detail: `${data.totals.orderCount.toLocaleString("th-TH")} ออเดอร์`, icon: WalletCards, color: "bg-emerald-50 text-emerald-700" },
          { label: "ต้นทุนสินค้า", value: money(data.totals.cost), detail: "จากราคาทุนในสินค้า", icon: BarChart3, color: "bg-orange-50 text-orange-700" },
          { label: "กำไรรวม", value: money(data.totals.grossProfit), detail: `Margin ${percent(data.totals.marginPercent)}`, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "ร้านที่มียอด", value: data.totals.branchCount.toLocaleString("th-TH"), detail: topBranch ? `สูงสุด: ${topBranch.branchName}` : "ยังไม่มีข้อมูล", icon: CalendarDays, color: "bg-slate-100 text-slate-700" }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{loading ? "..." : card.value}</p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500">{card.detail}</p>
            </article>
          );
        })}
      </section>

      {data.totals.missingCostItems ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          มี {data.totals.missingCostItems.toLocaleString("th-TH")} รายการที่ยังไม่พบราคาทุนในสินค้า กำไรจริงอาจต่ำกว่าที่แสดง
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">ตารางกำไรแต่ละร้าน</h2>
            <p className="mt-0.5 text-xs text-slate-400">{data.period.from ? `${dateThai(data.period.from)} ถึงก่อน ${dateThai(data.period.to)}` : "เลือกช่วงวันที่แล้วโหลดรายงาน"}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ร้าน</th>
                <th className="text-right">ออเดอร์</th>
                <th className="text-right">ยอดขายสินค้า</th>
                <th className="text-right">ต้นทุน</th>
                <th className="text-right">กำไร</th>
                <th className="text-right">Margin</th>
                <th>ล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((branch) => (
                <tr key={branch.branchName}>
                  <td>
                    <strong className="block text-slate-900">{branch.branchName}</strong>
                    <span className="text-xs text-slate-400">{branch.ownerName}</span>
                  </td>
                  <td className="text-right">{branch.orderCount.toLocaleString("th-TH")}</td>
                  <td className="text-right">{money(branch.productRevenue)}</td>
                  <td className="text-right">{money(branch.cost)}</td>
                  <td className={`text-right font-semibold ${branch.grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{money(branch.grossProfit)}</td>
                  <td className="text-right">{percent(branch.marginPercent)}</td>
                  <td>{dateThai(branch.lastOrderAt)}</td>
                </tr>
              ))}
              {!loading && data.branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-500">ยังไม่มีออเดอร์ในช่วงวันที่นี้</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
