"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bell, Check, ClipboardCheck, CreditCard, FileText, LockKeyhole, PackageCheck, ReceiptText, ShieldCheck } from "lucide-react";
import { money } from "@/lib/format";
import { domichaPromptPay } from "@/lib/promptpay";

const demoOrder = {
  orderNumber: "DC-DEMO-001",
  branchName: "DomiCha สาขาตัวอย่าง",
  ownerName: "แฟรนไชส์ซีตัวอย่าง",
  total: 10240,
  items: [
    { name: "ชาไต้หวัน DomiCha", unit: "ถุง", quantity: 20, price: 220 },
    { name: "ชาเขียว DomiCha", unit: "ถุง", quantity: 15, price: 210 },
    { name: "ผงกล้วย Ding Fong", unit: "ถุง", quantity: 10, price: 165 },
    { name: "ไซรัปสตรอว์เบอร์รี", unit: "ขวด", quantity: 8, price: 130 }
  ]
};

export default function PaymentDemoPage() {
  const [step, setStep] = useState<"qr" | "submitted" | "confirmed">("qr");
  const [reference, setReference] = useState("DEMO-TRANSFER-10240");

  const subtotal = demoOrder.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <main className="min-h-screen bg-[#fff3dd] px-4 py-6 text-slate-950 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={64} height={64} className="h-16 w-16 object-contain" priority />
            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-orange-600">Payment Flow Demo</p>
              <h1 className="text-2xl font-black sm:text-3xl">เดโม่สั่งซื้อวัตถุดิบ + แจ้งโอน</h1>
            </div>
          </div>
          <Link href="/shop" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white">
            ไปหน้า Shop จริง <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_420px]">
          <article className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-xl shadow-orange-950/10">
            <div className="bg-slate-950 p-6 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-300">Franchisee Order</p>
                  <h2 className="mt-2 text-2xl font-black">{demoOrder.orderNumber}</h2>
                  <p className="mt-2 text-sm text-slate-300">{demoOrder.branchName} • {demoOrder.ownerName}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-orange-200">
                  <LockKeyhole className="h-4 w-4" /> เดโม่ ไม่บันทึกจริง
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-orange-50 text-left text-slate-600">
                      <th className="px-4 py-3">สินค้า</th>
                      <th className="px-4 py-3 text-right">จำนวน</th>
                      <th className="px-4 py-3 text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoOrder.items.map((item) => (
                      <tr key={item.name} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-bold">{item.name}</td>
                        <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-right font-bold">{money(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">ยอดสินค้า</p>
                  <p className="mt-1 text-lg font-black">{money(subtotal)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">ค่าจัดส่ง</p>
                  <p className="mt-1 text-lg font-black">ฟรี</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs text-orange-700">ยอดชำระ</p>
                  <p className="mt-1 text-lg font-black text-orange-600">{money(demoOrder.total)}</p>
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-5">
            <section className="rounded-[30px] border border-white/80 bg-white p-5 text-center shadow-xl shadow-orange-950/10">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <CreditCard className="h-6 w-6" />
              </span>
              <h2 className="mt-3 text-xl font-black">QR PromptPay</h2>
              <img
                src={`/api/promptpay?amount=${encodeURIComponent(String(demoOrder.total))}`}
                alt="QR PromptPay Demo"
                className="mx-auto mt-4 h-56 w-56 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm"
              />
              <p className="mt-3 text-sm font-bold">{domichaPromptPay.accountName}</p>
              <p className="mt-1 text-xs text-slate-500">เลขพร้อมเพย์: {domichaPromptPay.target}</p>
              <p className="mt-2 text-2xl font-black text-orange-600">{money(demoOrder.total)}</p>

              {step === "qr" ? (
                <div className="mt-5 text-left">
                  <label className="text-xs font-bold text-slate-600">เลขอ้างอิงสลิป / หมายเหตุ</label>
                  <input value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1.5 h-11 rounded-2xl" />
                  <button onClick={() => setStep("submitted")} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-bold text-white">
                    <Check className="h-4 w-4" /> แจ้งทีมว่าโอนแล้ว
                  </button>
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">รับข้อมูลแล้ว</p>
              )}
            </section>

            <section className="rounded-[30px] border border-white/80 bg-white p-5 shadow-xl shadow-orange-950/10">
              <h2 className="flex items-center gap-2 text-lg font-black">
                <ClipboardCheck className="h-5 w-5 text-orange-600" /> หลังบ้านทีม Domicha เห็นอะไร
              </h2>
              <div className="mt-4 space-y-3">
                <div className={`rounded-2xl border p-4 ${step === "qr" ? "border-orange-100 bg-orange-50 text-orange-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>
                  <p className="text-xs font-bold">สถานะชำระเงิน</p>
                  <p className="mt-1 font-black">{step === "qr" ? "มี QR รอโอน" : "ลูกค้าแจ้งโอนแล้ว"}</p>
                  {step !== "qr" ? <p className="mt-1 text-xs">อ้างอิง: {reference || "ลูกค้าแจ้งโอนแล้ว"}</p> : null}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold"><Bell className="h-4 w-4 text-orange-600" /> LINE OA แจ้งทีมแบบปลอดภัย</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    ข้อความแจ้งเตือนจะบอกว่ามีรายการแจ้งโอนใหม่และให้ทีมเข้าไปตรวจในหลังบ้าน โดยไม่ส่งข้อมูลลูกค้าเต็มใน LINE
                  </p>
                </div>
                {step === "submitted" ? (
                  <button onClick={() => setStep("confirmed")} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-bold text-white">
                    <ReceiptText className="h-4 w-4" /> ทีมตรวจแล้ว กดยืนยันชำระเงิน
                  </button>
                ) : null}
                {step === "confirmed" ? (
                  <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
                    <p className="flex items-center gap-2 font-black"><FileText className="h-4 w-4" /> ออกใบเสร็จแล้ว</p>
                    <p className="mt-1 text-xs">สถานะเปลี่ยนเป็น Paid และสร้างเลขใบเสร็จ RC-DEMO-001</p>
                    <div className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-emerald-900">
                      ส่งใบเสร็จไปยัง Email ลูกค้าอัตโนมัติ<br />
                      เก็บสำเนา PDF ใน Google Drive โฟลเดอร์รายเดือน
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: PackageCheck, title: "1. สั่งซื้อ", text: "แฟรนไชส์ซีเลือกวัตถุดิบและยืนยันออเดอร์" },
            { icon: ShieldCheck, title: "2. แจ้งโอน", text: "ลูกค้าสแกน QR แล้วกดแจ้งทีมว่าโอนแล้ว" },
            { icon: ReceiptText, title: "3. ออกใบเสร็จ", text: "ทีมตรวจสลิปก่อนกดยืนยันชำระเงิน" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
                <Icon className="h-5 w-5 text-orange-600" />
                <p className="mt-2 font-black">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
