"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/apiClient";
import { dateThai, money } from "@/lib/format";
import type { Quotation } from "@/lib/types";

const statusLabels: Record<string, string> = {
  Draft: "ร่าง",
  Sent: "ส่งแล้ว",
  Accepted: "ยอมรับ",
  Rejected: "ปฏิเสธ",
  Expired: "หมดอายุ"
};

export default function QuotationsPage() {
  const [rows, setRows] = useState<Quotation[]>([]);

  async function load() {
    setRows(await apiFetch<Quotation[]>("/api/quotations"));
  }

  async function remove(id: string) {
    if (!confirm("ยืนยันการลบใบเสนอราคานี้?")) return;
    await apiFetch(`/api/quotations/${id}`, { method: "DELETE" });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader title="ใบเสนอราคา" description="สร้าง แก้ไข ดูรายละเอียด และส่งออก PDF" actionHref="/quotations/new" actionLabel="สร้างใบเสนอราคา" />
      <div className="overflow-hidden rounded-md border border-domicha-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>เลขที่</th>
                <th>ลูกค้า</th>
                <th>วันที่</th>
                <th>สถานะ</th>
                <th>ยอดสุทธิ</th>
                <th className="w-36 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500">
                    ยังไม่มีใบเสนอราคา
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.quotation_number}</td>
                    <td>{row.customers?.customer_name || "-"}</td>
                    <td>{dateThai(row.quotation_date)}</td>
                    <td>{statusLabels[row.status] || row.status}</td>
                    <td>{money(row.grand_total)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link className="rounded-md border border-domicha-line p-2" href={`/quotations/${row.id}`} aria-label="ดู">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link className="rounded-md border border-domicha-line p-2" href={`/quotations/${row.id}/edit`} aria-label="แก้ไข">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button className="rounded-md border border-red-100 p-2 text-red-600" onClick={() => remove(row.id)} aria-label="ลบ">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
