"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Edit } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { dateThai, money } from "@/lib/format";
import type { Quotation } from "@/lib/types";

const statusLabels: Record<string, string> = {
  Draft: "ร่าง",
  Sent: "ส่งแล้ว",
  Accepted: "ยอมรับ",
  Rejected: "ปฏิเสธ",
  Expired: "หมดอายุ"
};

export default function QuotationViewPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    apiFetch<Quotation>(`/api/quotations/${params.id}`).then(setQuotation);
  }, [params.id]);

  async function downloadPdf() {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const response = await fetch(`/api/quotations/${params.id}/pdf`, {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quotation?.quotation_number || "quotation"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!quotation) return <div className="rounded-md border border-domicha-line bg-white p-5 text-sm text-slate-600">กำลังโหลดใบเสนอราคา...</div>;

  return (
    <>
      <PageHeader title={`ใบเสนอราคา ${quotation.quotation_number}`} description="รายละเอียดใบเสนอราคาและการส่งออก PDF" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Link href={`/quotations/${quotation.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-md border border-domicha-line bg-white px-4 py-2 text-sm">
          <Edit className="h-4 w-4" />
          แก้ไข
        </Link>
        <button onClick={downloadPdf} className="inline-flex items-center justify-center gap-2 rounded-md bg-domicha-tea px-4 py-2 text-sm font-medium text-white">
          <Download className="h-4 w-4" />
          ส่งออก PDF
        </button>
      </div>
      <section className="rounded-md border border-domicha-line bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">เลขที่</p>
            <p className="font-semibold">{quotation.quotation_number}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">ลูกค้า</p>
            <p className="font-semibold">{quotation.customers?.customer_name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">วันที่</p>
            <p className="font-semibold">{dateThai(quotation.quotation_date)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">สถานะ</p>
            <p className="font-semibold">{statusLabels[quotation.status] || quotation.status}</p>
          </div>
        </div>
      </section>
      <section className="mt-5 overflow-hidden rounded-md border border-domicha-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>ราคา/หน่วย</th>
                <th>ส่วนลด</th>
                <th>VAT</th>
                <th>รวม</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.quotation_items || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.unit_price)}</td>
                  <td>{money(item.discount)}</td>
                  <td>{money(item.vat_amount)}</td>
                  <td className="font-medium">{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-5 rounded-md border border-domicha-line bg-white p-5 shadow-sm">
        <div className="ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span>ยอดก่อนส่วนลด/VAT</span>
            <strong>{money(quotation.subtotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span>ส่วนลดรวม</span>
            <strong>{money(quotation.discount_total)}</strong>
          </div>
          <div className="flex justify-between">
            <span>VAT 7%</span>
            <strong>{money(quotation.vat_total)}</strong>
          </div>
          <div className="flex justify-between border-t border-domicha-line pt-3 text-lg text-domicha-tea">
            <span>ยอดสุทธิ</span>
            <strong>{money(quotation.grand_total)}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
