import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60">
        <Image
          src="/icons/domicha-original-logo.png"
          alt="Domi Cha"
          width={82}
          height={82}
          className="mx-auto h-[82px] w-[82px] object-contain"
          priority
        />
        <span className="mx-auto mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-950">ปิดการสมัครสมาชิกเอง</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          ระบบนี้ใช้สำหรับ HQ และแฟรนไชส์ซีที่ได้รับบัญชีจาก DomiCha เท่านั้น
          เพื่อป้องกันลูกค้าทั่วไปหรือบุคคลภายนอกเข้าถึงหน้าสั่งซื้อวัตถุดิบ
        </p>
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left text-sm text-emerald-800">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            HQ สามารถสร้างบัญชีแฟรนไชส์ซีได้จากเมนู “แฟรนไชส์ซี” ในระบบหลังบ้าน
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/20">
          กลับไปเข้าสู่ระบบ
        </Link>
      </section>
    </main>
  );
}
