import { ArrowDownLeft, ArrowUpRight, Landmark, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { expenseRecords, monthlyCashflow } from "@/lib/accountingDemo";
import { money } from "@/lib/format";

export default function CashflowPage() {
  const current = monthlyCashflow[monthlyCashflow.length - 1];
  const max = Math.max(...monthlyCashflow.flatMap((row) => [row.income, row.expense]));
  const metrics: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: "เงินเข้าเดือนนี้", value: current.income, icon: ArrowDownLeft, color: "bg-emerald-50 text-emerald-700" },
    { label: "เงินออกเดือนนี้", value: current.expense, icon: ArrowUpRight, color: "bg-orange-50 text-orange-700" },
    { label: "กระแสเงินสดสุทธิ", value: current.income - current.expense, icon: TrendingUp, color: "bg-blue-50 text-blue-700" }
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-4">
      <header><p className="text-sm font-medium text-orange-600">บัญชี</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">กระแสเงินสด</h1><p className="mt-1 text-sm text-slate-500">ติดตามเงินเข้า เงินออก และสภาพคล่องของธุรกิจ</p></header>
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
            {monthlyCashflow.map((row) => (
              <div key={row.month} className="flex h-full flex-col justify-end">
                <div className="flex flex-1 items-end justify-center gap-1.5">
                  <span className="w-4 rounded-t-lg bg-emerald-500 sm:w-7" style={{ height: `${(row.income / max) * 100}%` }} />
                  <span className="w-4 rounded-t-lg bg-orange-300 sm:w-7" style={{ height: `${(row.expense / max) * 100}%` }} />
                </div>
                <span className="mt-3 text-center text-xs text-slate-400">{row.month}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><Landmark className="h-5 w-5" /></span><div><p className="text-xs text-slate-400">ยอดเงินรวม</p><strong className="text-xl">{money(418920)}</strong></div></div>
          <h2 className="mt-6 font-semibold">รายจ่ายล่าสุด</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {expenseRecords.slice(0, 4).map((row) => <div key={row.id} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{row.vendor}</p><p className="text-xs text-slate-400">{row.category}</p></div><strong className="whitespace-nowrap text-red-600">-{money(row.total)}</strong></div>)}
          </div>
        </article>
      </section>
    </div>
  );
}
