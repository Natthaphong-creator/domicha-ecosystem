"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export function EntityList<T extends { id: string }>({ endpoint, editBasePath, columns }: { endpoint: string; editBasePath: string; columns: Column<T>[] }) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setRows(await apiFetch<T[]>(endpoint));
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("ยืนยันการลบข้อมูลนี้?")) return;
    await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="rounded-md border border-domicha-line bg-white p-5 text-sm text-slate-600">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="rounded-md border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>;

  return (
    <div className="overflow-hidden rounded-md border border-domicha-line bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)}>{column.label}</th>
              ))}
              <th className="w-28 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-slate-500">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={String(column.key)}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? "-")}</td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link className="rounded-md border border-domicha-line p-2 text-slate-700 hover:bg-domicha-milk" href={`${editBasePath}/${row.id}/edit`} aria-label="แก้ไข">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="rounded-md border border-red-100 p-2 text-red-600 hover:bg-red-50" onClick={() => remove(row.id)} aria-label="ลบ">
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
  );
}
