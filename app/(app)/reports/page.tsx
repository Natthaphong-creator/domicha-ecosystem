import { ArrowRight, FileBarChart, PieChart, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { money } from "@/lib/format";

export default function ReportsPage() {
  const reports = [
    { title: "กำไรขาดทุน", description: "สรุปรายได้ ต้นทุน ค่าใช้จ่าย และกำไรสุทธิ", icon: TrendingUp, value: money(123330), color: "bg-emerald-50 text-emerald-700" },
    { title: "ภาษีขาย", description: "ยอดขายและภาษีมูลค่าเพิ่มที่ต้องนำส่ง", icon: ReceiptText, value: money(18623), color: "bg-orange-50 text-orange-700" },
    { title: "ภาษีซื้อ", description: "ภาษีมูลค่าเพิ่มจากรายการซื้อและรายจ่าย", icon: WalletCards, value: money(10554), color: "bg-blue-50 text-blue-700" },
    { title: "ลูกหนี้การค้า", description: "ยอดค้างรับ แยกตามอายุหนี้และลูกค้า", icon: PieChart, value: money(104810), color: "bg-violet-50 text-violet-700" }
  ];
  return (
    <div className="space-y-6 pb-24 lg:pb-4">
      <header><p className="text-sm font-medium text-orange-600">รายงาน</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">ศูนย์รายงานธุรกิจ</h1><p className="mt-1 text-sm text-slate-500">ข้อมูลสรุปเพื่อการตัดสินใจและจัดเตรียมบัญชี</p></header>
      <section className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return <article key={report.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${report.color}`}><Icon className="h-6 w-6" /></span><strong className="text-xl">{report.value}</strong></div><h2 className="mt-5 font-semibold">{report.title}</h2><p className="mt-1 text-sm text-slate-500">{report.description}</p><button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">เปิดรายงาน <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button></article>;
        })}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex gap-4"><span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-white/10"><FileBarChart className="h-6 w-6 text-orange-400" /></span><div><h2 className="font-semibold">ชุดรายงานสำหรับสำนักงานบัญชี</h2><p className="mt-1 text-sm text-slate-400">ดาวน์โหลดรายงานประจำเดือนพร้อมเอกสารประกอบในครั้งเดียว</p></div></div><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">เตรียมชุดรายงาน</button></div>
      </section>
    </div>
  );
}
