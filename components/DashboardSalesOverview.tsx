"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CircleAlert,
  CircleCheck,
  FilePlus2,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { documentStatusLabels, documentTypeLabels } from "@/lib/accountingDemo";
import { dateThai, money } from "@/lib/format";

type SalesStatus = "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled";
type SalesType = "Invoice" | "Receipt" | "TaxInvoice";

type DashboardPayload = {
  totals: {
    customers: number;
    suppliers: number;
    products: number;
    quotations: number;
    monthlyRevenue: number;
    pendingReceivables: number;
    overdueReceivables: number;
    salesDocuments: number;
  };
  recentSales: Array<{
    id: string;
    number: string;
    type: SalesType;
    customer: string;
    date: string;
    dueDate: string | null;
    total: number;
    status: SalesStatus;
  }>;
  monthlySales: Array<{ month: string; income: number; pending: number }>;
  statusSummary: Record<string, number>;
};

const statusClasses: Record<SalesStatus, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Pending: "bg-amber-50 text-amber-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
  Cancelled: "bg-slate-100 text-slate-500"
};

const defaultData: DashboardPayload = {
  totals: {
    customers: 0,
    suppliers: 0,
    products: 0,
    quotations: 0,
    monthlyRevenue: 0,
    pendingReceivables: 0,
    overdueReceivables: 0,
    salesDocuments: 0
  },
  recentSales: [],
  monthlySales: [],
  statusSummary: {}
};

export function DashboardSalesOverview() {
  const [data, setData] = useState<DashboardPayload>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<DashboardPayload>("/api/dashboard"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูล Dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const maxChart = useMemo(() => Math.max(1, ...data.monthlySales.flatMap((row) => [row.income, row.pending])), [data.monthlySales]);
  const estimatedProfit = Math.max(0, data.totals.monthlyRevenue * 0.38);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={loadDashboard} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold text-red-700">
            <RefreshCcw className="h-4 w-4" /> ลองใหม่
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "ยอดขายรับชำระเดือนนี้", value: data.totals.monthlyRevenue, change: "จากเอกสาร Paid", positive: true, icon: Banknote, color: "bg-emerald-50 text-emerald-700" },
          { label: "รอรับชำระ", value: data.totals.pendingReceivables, change: `${data.statusSummary.Pending || 0} เอกสาร`, positive: false, icon: WalletCards, color: "bg-orange-50 text-orange-700" },
          { label: "กำไรโดยประมาณ", value: estimatedProfit, change: "ประเมิน 38%", positive: true, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "เกินกำหนด", value: data.totals.overdueReceivables, change: `${data.statusSummary.Overdue || 0} เอกสาร`, positive: false, icon: CircleAlert, color: "bg-amber-50 text-amber-700" }
        ].map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.positive ? ArrowUpRight : ArrowDownRight;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{loading ? "..." : money(card.value)}</p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className={`mt-4 flex items-center gap-1 text-xs font-medium ${card.positive ? "text-emerald-600" : "text-slate-500"}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                {card.change}
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">ยอดขายและลูกหนี้</h2>
              <p className="mt-1 text-xs text-slate-400">ข้อมูลจากเอกสารขายย้อนหลัง 6 เดือน</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> รับชำระแล้ว</span>
              <span className="flex items-center gap-1.5 text-slate-500"><i className="h-2.5 w-2.5 rounded-full bg-orange-300" /> รอรับชำระ</span>
            </div>
          </div>
          <div className="mt-8 grid h-60 grid-cols-6 items-end gap-3 border-b border-slate-100 sm:gap-5">
            {(data.monthlySales.length ? data.monthlySales : Array.from({ length: 6 }, (_, index) => ({ month: String(index + 1), income: 0, pending: 0 }))).map((row) => (
              <div key={row.month} className="flex h-full flex-col justify-end">
                <div className="flex flex-1 items-end justify-center gap-1 sm:gap-2">
                  <span className="w-3 rounded-t-md bg-emerald-500 sm:w-5" style={{ height: `${(row.income / maxChart) * 100}%` }} title={`รับชำระแล้ว ${money(row.income)}`} />
                  <span className="w-3 rounded-t-md bg-orange-300 sm:w-5" style={{ height: `${(row.pending / maxChart) * 100}%` }} title={`รอรับชำระ ${money(row.pending)}`} />
                </div>
                <span className="mt-3 text-center text-xs text-slate-400">{row.month}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="domicha-dark-pattern rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">ลูกค้าและเอกสารขาย</p>
              <h2 className="mt-1 text-2xl font-bold">{loading ? "..." : `${data.totals.customers.toLocaleString("th-TH")} ราย`}</h2>
            </div>
            <ReceiptText className="h-7 w-7 text-orange-400" />
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["ลูกค้าทั้งหมด", data.totals.customers],
              ["เอกสารขายใน 6 เดือน", data.totals.salesDocuments],
              ["สินค้าในระบบ", data.totals.products]
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-sm">
                <span className="text-slate-300">{label}</span>
                <strong>{Number(value).toLocaleString("th-TH")}</strong>
              </div>
            ))}
          </div>
          <Link href="/sales/new" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
            บันทึกการขาย
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold">เอกสารขายล่าสุด</h2>
              <p className="mt-0.5 text-xs text-slate-400">ดึงจากการขายลูกค้าและใบแจ้งหนี้จริง</p>
            </div>
            <Link href="/documents" className="flex items-center gap-1 text-sm font-medium text-orange-600">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>เลขที่เอกสาร</th>
                  <th>ลูกค้า</th>
                  <th>วันที่</th>
                  <th>สถานะ</th>
                  <th className="text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <strong className="block text-slate-800">{document.number}</strong>
                      <span className="text-xs text-slate-400">{documentTypeLabels[document.type]}</span>
                    </td>
                    <td>{document.customer}</td>
                    <td className="whitespace-nowrap text-slate-500">{dateThai(document.date)}</td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[document.status]}`}>
                        {documentStatusLabels[document.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right font-semibold">{money(document.total)}</td>
                  </tr>
                ))}
                {!loading && data.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">ยังไม่มีข้อมูลขายลูกค้า</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-red-100 text-red-600">
                <CircleAlert className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-red-950">ยอดเกินกำหนด</h2>
                <p className="mt-1 text-sm text-red-700">{money(data.totals.overdueReceivables)}</p>
                <Link href="/documents" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-700">
                  ติดตามการชำระ <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">สร้างรายการด่วน</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "ใบเสนอราคา", icon: FilePlus2, href: "/quotations/new", color: "bg-blue-50 text-blue-700" },
                { label: "บันทึกขาย", icon: ReceiptText, href: "/sales/new", color: "bg-orange-50 text-orange-700" },
                { label: "รับชำระเงิน", icon: CircleCheck, href: "/documents", color: "bg-emerald-50 text-emerald-700" },
                { label: "รายงาน", icon: WalletCards, href: "/reports", color: "bg-violet-50 text-violet-700" }
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="rounded-xl border border-slate-100 p-3 text-sm font-medium hover:border-slate-200 hover:shadow-sm">
                    <span className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${action.color}`}><Icon className="h-4 w-4" /></span>
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
