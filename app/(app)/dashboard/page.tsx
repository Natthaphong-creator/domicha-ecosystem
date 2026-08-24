import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { DashboardSalesOverview } from "@/components/DashboardSalesOverview";
import { DomiChaSystemPanel } from "@/components/DomiChaSystemPanel";
import { getDomiChaSystemSummary } from "@/lib/domichaSystem";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const domichaSystem = await getDomiChaSystemSummary();

  return (
    <div className="space-y-6 pb-24 lg:pb-4">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-orange-600">วันพุธที่ 1 กรกฎาคม 2569</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">ภาพรวมธุรกิจ</h1>
          <p className="mt-1 text-sm text-slate-500">สวัสดีครับ คุณณัฐพงษ์ — วันนี้มีรายการขายและลูกหนี้ที่ควรติดตาม</p>
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

      <DashboardSalesOverview />
    </div>
  );
}
