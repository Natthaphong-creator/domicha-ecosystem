"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { dateThai, money } from "@/lib/format";
import type { FranchiseeOrder } from "@/lib/types";

function methodLabel(value: string) {
  if (value === "pickup") return "รับสินค้าที่ศูนย์";
  return "จัดส่ง";
}

function paymentLabel(value: string) {
  if (value === "cod") return "เก็บเงินปลายทาง";
  return "โอนเงิน";
}

export default function OrderDocumentPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<FranchiseeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<FranchiseeOrder>(`/api/orders/${params.id}`)
      .then(setOrder)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "โหลดเอกสารไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="rounded-2xl bg-white p-6 text-sm text-slate-500">กำลังโหลดเอกสาร...</div>;
  if (error || !order) return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error || "ไม่พบเอกสาร"}</div>;

  const profile = order.franchisee_profiles;
  const items = order.franchisee_order_items || [];
  const printedAt = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

  return (
    <div className="space-y-5">
      <div className="print-hidden flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" /> กลับรายการเอกสาร
        </Link>
        <div className="flex gap-2">
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
              <p className="mt-1 text-xl font-black text-orange-300 print:text-orange-600">{order.order_number}</p>
              <p className="mt-2 text-xs text-slate-300 print:text-slate-500">วันที่ {dateThai(order.created_at)}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 border-b border-slate-100 p-7 md:grid-cols-2">
          <div className="rounded-2xl bg-orange-50 p-5 print:bg-slate-50">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Branch</p>
            <h2 className="mt-2 text-xl font-black">{profile?.branch_name || "-"}</h2>
            <p className="mt-2 text-sm text-slate-600">เจ้าของสาขา: {profile?.owner_name || "-"}</p>
            <p className="mt-1 text-sm text-slate-600">โทร: {profile?.phone || "-"}</p>
            <p className="mt-1 text-sm text-slate-600">อีเมล: {profile?.email || "-"}</p>
            {profile?.tax_id ? <p className="mt-1 text-sm text-slate-600">เลขภาษี: {profile.tax_id}</p> : null}
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Delivery & Payment</p>
            <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">วิธีรับสินค้า</dt>
              <dd className="font-bold">{methodLabel(order.delivery_method)}</dd>
              <dt className="text-slate-500">ชำระเงิน</dt>
              <dd className="font-bold">{paymentLabel(order.payment_method)}</dd>
              <dt className="text-slate-500">สถานะออเดอร์</dt>
              <dd className="font-bold">{order.order_status}</dd>
              <dt className="text-slate-500">สถานะชำระ</dt>
              <dd className="font-bold">{order.payment_status}</dd>
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
                {items.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-xs text-slate-400">{item.product_id}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{Number(item.quantity).toLocaleString("th-TH")} {item.unit}</td>
                    <td className="px-4 py-3 text-right">{money(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-bold">{money(item.line_total)}</td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">ไม่มีรายการสินค้า</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Shipping Address / Note</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {order.delivery_method === "pickup" ? "รับสินค้าที่ศูนย์ DomiCha" : order.shipping_address || profile?.shipping_address || "-"}
              </p>
              {order.note ? <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-800">หมายเหตุ: {order.note}</p> : null}
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white print:bg-slate-50 print:text-slate-950">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300 print:text-slate-500">ยอดสินค้า</span>
                  <strong>{money(order.subtotal)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300 print:text-slate-500">ค่าจัดส่ง</span>
                  <strong>{money(order.delivery_fee)}</strong>
                </div>
                <div className="border-t border-white/10 pt-4 print:border-slate-200">
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">ยอดสุทธิ</span>
                    <strong className="text-2xl text-orange-300 print:text-orange-600">{money(order.grand_total)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="grid gap-4 border-t border-slate-100 bg-slate-50 p-7 text-xs text-slate-500 md:grid-cols-2">
          <p>เอกสารนี้สร้างจากระบบ DomiCha Business • พิมพ์เมื่อ {printedAt}</p>
          <p className="md:text-right">ผู้จัดทำ ____________________ &nbsp;&nbsp; ผู้อนุมัติ ____________________</p>
        </footer>
      </article>
    </div>
  );
}
