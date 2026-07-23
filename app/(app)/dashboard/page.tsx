import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  FilePlus2,
  Landmark,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { DomiChaSystemPanel } from "@/components/DomiChaSystemPanel";
import { accountingDocuments, documentStatusLabels, documentTypeLabels, monthlyCashflow } from "@/lib/accountingDemo";
import { getDomiChaSystemSummary } from "@/lib/domichaSystem";
import { dateThai, money } from "@/lib/format";

export const dynamic = "force-dynamic";

const maxCashflow = Math.max(...monthlyCashflow.flatMap((row) => [row.income, row.expense]));

const statusClasses = {
  Draft: "bg-slate-100 text-slate-600",
  Pending: "bg-amber-50 text-amber-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
  Cancelled: "bg-slate-100 text-slate-500"
} as const;

export default async function DashboardPage() {
  const domichaSystem = await getDomiChaSystemSummary();

  return (
    <div className="space-y-6 pb-24 lg:pb-4">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-orange-600">วันพุธที่ 1 กรกฎาคม 2569</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">ภาพรวมธุรกิจ</h1>
          <p className="mt-1 text-sm text-slate-500">สวัสดีครับ คุณณัฐพงษ์ — วันนี้มี 3 รายการที่ควรติดตาม</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4" />
            เดือนนี้
          </button>
          <Link href="/sales/new" className="premium-button inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            สร้างรายการ
          </Link>
        </div>
      </section>

      <DomiChaSystemPanel initial={domichaSystem} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "รายรับเดือนนี้", value: 284650, change: "+12.8%", positive: true, icon: Banknote, color: "bg-emerald-50 text-emerald-700" },
          { label: "รายจ่ายเดือนนี้", value: 161320, change: "+4.2%", positive: false, icon: WalletCards, color: "bg-orange-50 text-orange-700" },
          { label: "กำไรโดยประมาณ", value: 123330, change: "+24.6%", positive: true, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "รอรับชำระ", value: 104810, change: "3 เอกสาร", positive: false, icon: CircleAlert, color: "bg-amber-50 text-amber-700" }
        ].map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.positive ? ArrowUpRight : ArrowDownRight;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{money(card.value)}</p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className={`mt-4 flex items-center gap-1 text-xs font-medium ${card.positive ? "text-emerald-600" : "text-slate-500"}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                {card.change} <span className="font-normal text-slate-400">เทียบเดือนก่อน</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">รายรับและรายจ่าย</h2>
              <p className="mt-1 text-xs text-slate-400">ข้อมูลย้อนหลัง 6 เดือน</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> รายรับ</span>
              <span className="flex items-center gap-1.5 text-slate-500"><i className="h-2.5 w-2.5 rounded-full bg-orange-300" /> รายจ่าย</span>
            </div>
          </div>
          <div className="mt-8 grid h-60 grid-cols-6 items-end gap-3 border-b border-slate-100 sm:gap-5">
            {monthlyCashflow.map((row) => (
              <div key={row.month} className="flex h-full flex-col justify-end">
                <div className="flex flex-1 items-end justify-center gap-1 sm:gap-2">
                  <span className="w-3 rounded-t-md bg-emerald-500 sm:w-5" style={{ height: `${(row.income / maxCashflow) * 100}%` }} title={`รายรับ ${money(row.income)}`} />
                  <span className="w-3 rounded-t-md bg-orange-300 sm:w-5" style={{ height: `${(row.expense / maxCashflow) * 100}%` }} title={`รายจ่าย ${money(row.expense)}`} />
                </div>
                <span className="mt-3 text-center text-xs text-slate-400">{row.month}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="domicha-dark-pattern rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">เงินสดและธนาคาร</p>
              <h2 className="mt-1 text-2xl font-bold">{money(418920)}</h2>
            </div>
            <Landmark className="h-7 w-7 text-orange-400" />
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["ธนาคารกสิกรไทย •• 7849", 298450],
              ["ธนาคารกรุงเทพ •• 1206", 95670],
              ["เงินสดย่อย", 24800]
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-sm">
                <span className="text-slate-300">{label}</span>
                <strong>{money(Number(value))}</strong>
              </div>
            ))}
          </div>
          <Link href="/cashflow" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
            ดูกระแสเงินสด
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold">เอกสารล่าสุด</h2>
              <p className="mt-0.5 text-xs text-slate-400">รายการขายและการรับชำระล่าสุด</p>
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
                {accountingDocuments.slice(0, 5).map((document) => (
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
                <h2 className="font-semibold text-red-950">เอกสารเกินกำหนด 1 รายการ</h2>
                <p className="mt-1 text-sm text-red-700">ยอดค้างรับรวม {money(45280)}</p>
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
                { label: "ใบแจ้งหนี้", icon: ReceiptText, href: "/documents", color: "bg-orange-50 text-orange-700" },
                { label: "รับชำระเงิน", icon: CircleCheck, href: "/documents", color: "bg-emerald-50 text-emerald-700" },
                { label: "บันทึกรายจ่าย", icon: WalletCards, href: "/expenses", color: "bg-violet-50 text-violet-700" }
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
