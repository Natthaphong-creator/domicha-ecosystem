"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { money } from "@/lib/format";

const sampleOrder = {
  orderNumber: "DC-20260708-SAMPLE",
  createdAt: "8 ก.ค. 2569",
  printedAt: "8 ก.ค. 2569 16:45",
  branchName: "DomiCha สาขาบางนา",
  ownerName: "คุณณัฐพงษ์",
  phone: "089-123-4567",
  email: "bangna@domicha.co",
  taxId: "0105569000001",
  deliveryMethod: "จัดส่ง",
  paymentMethod: "โอนเงิน",
  orderStatus: "Received",
  paymentStatus: "Pending",
  shippingAddress: "99/9 ถนนสุขุมวิท แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260",
  note: "ขอจัดส่งช่วงเช้า และโทรแจ้งก่อนเข้าพื้นที่",
  subtotal: 10240,
  deliveryFee: 0,
  grandTotal: 10240,
  items: [
    { id: "TEA-TAIWAN", name: "ชาไต้หวัน DomiCha", unit: "ถุง", quantity: 20, unitPrice: 220, lineTotal: 4400 },
    { id: "TEA-GREEN", name: "ชาเขียว DomiCha", unit: "ถุง", quantity: 15, unitPrice: 210, lineTotal: 3150 },
    { id: "POWDER-BANANA", name: "ผงกล้วย Ding Fong", unit: "ถุง", quantity: 10, unitPrice: 165, lineTotal: 1650 },
    { id: "SYRUP-STRAWBERRY", name: "ไซรัปสตรอว์เบอร์รี", unit: "ขวด", quantity: 8, unitPrice: 130, lineTotal: 1040 }
  ]
};

export default function SampleOrderDocumentPage() {
  return (
    <div className="space-y-5">
      <div className="print-hidden flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" /> กลับรายการเอกสาร
        </Link>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-11 items-center rounded-2xl border border-orange-100 bg-orange-50 px-4 text-sm font-bold text-orange-700">
            ตัวอย่างเอกสาร
          </span>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-orange-600">
            <Printer className="h-4 w-4" /> พิมพ์
          </button>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> บันทึก PDF
          </button>
        </div>
      </div>

      <article className="print-document mx-auto max-w-[960px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 print:shadow-none">
        <header className="bg-slate-950 p-7 text-white print:bg-white print:text-slate-950">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={74} height={74} className="h-[74px] w-[74px] rounded-2xl bg-white object-contain p-1" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300 print:text-orange-600">DomiCha Business</p>
                <h1 className="mt-1 text-2xl font-black">ใบสั่งซื้อแฟรนไชส์ซี</h1>
                <p className="mt-1 text-sm text-slate-300 print:text-slate-500">Franchisee Purchase Order</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-right print:border-slate-200 print:bg-slate-50">
              <p className="text-xs text-slate-300 print:text-slate-500">เลขที่เอกสาร</p>
              <p className="mt-1 text-xl font-black text-orange-300 print:text-orange-600">{sampleOrder.orderNumber}</p>
              <p className="mt-2 text-xs text-slate-300 print:text-slate-500">วันที่ {sampleOrder.createdAt}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 border-b border-slate-100 p-7 md:grid-cols-2">
          <div className="rounded-2xl bg-orange-50 p-5 print:bg-slate-50">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Branch</p>
            <h2 className="mt-2 text-xl font-black">{sampleOrder.branchName}</h2>
            <p className="mt-2 text-sm text-slate-600">เจ้าของสาขา: {sampleOrder.ownerName}</p>
            <p className="mt-1 text-sm text-slate-600">โทร: {sampleOrder.phone}</p>
            <p className="mt-1 text-sm text-slate-600">อีเมล: {sampleOrder.email}</p>
            <p className="mt-1 text-sm text-slate-600">เลขภาษี: {sampleOrder.taxId}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Delivery & Payment</p>
            <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">วิธีรับสินค้า</dt>
              <dd className="font-bold">{sampleOrder.deliveryMethod}</dd>
              <dt className="text-slate-500">ชำระเงิน</dt>
              <dd className="font-bold">{sampleOrder.paymentMethod}</dd>
              <dt className="text-slate-500">สถานะออเดอร์</dt>
              <dd className="font-bold">{sampleOrder.orderStatus}</dd>
              <dt className="text-slate-500">สถานะชำระ</dt>
              <dd className="font-bold">{sampleOrder.paymentStatus}</dd>
            </dl>
          </div>
        </section>

        <section className="p-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-white print:bg-slate-100 print:text-slate-700">
                  <th className="w-12 px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">สินค้า</th>
                  <th className="px-4 py-3 text-right">จำนวน</th>
                  <th className="px-4 py-3 text-right">ราคา/หน่วย</th>
                  <th className="px-4 py-3 text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                {sampleOrder.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.id}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity.toLocaleString("th-TH")} {item.unit}</td>
                    <td className="px-4 py-3 text-right">{money(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold">{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Shipping Address / Note</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{sampleOrder.shippingAddress}</p>
              <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-800">หมายเหตุ: {sampleOrder.note}</p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white print:bg-slate-50 print:text-slate-950">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300 print:text-slate-500">ยอดสินค้า</span>
                  <strong>{money(sampleOrder.subtotal)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300 print:text-slate-500">ค่าจัดส่ง</span>
                  <strong>{money(sampleOrder.deliveryFee)}</strong>
                </div>
                <div className="border-t border-white/10 pt-4 print:border-slate-200">
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">ยอดสุทธิ</span>
                    <strong className="text-2xl text-orange-300 print:text-orange-600">{money(sampleOrder.grandTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="grid gap-4 border-t border-slate-100 bg-slate-50 p-7 text-xs text-slate-500 md:grid-cols-2">
          <p>เอกสารนี้เป็นข้อมูลตัวอย่างจากระบบ DomiCha Business • พิมพ์เมื่อ {sampleOrder.printedAt}</p>
          <p className="md:text-right">ผู้จัดทำ ____________________ &nbsp;&nbsp; ผู้อนุมัติ ____________________</p>
        </footer>
      </article>
    </div>
  );
}
