"use client";

import { useState } from "react";
import { DownloadCloud } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

type ImportResult = {
  imported: number;
  total: number;
  source: "stock" | "fallback";
  imageColumnMissing?: boolean;
};

export function ProductImportButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function importProducts() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await apiFetch<ImportResult>("/api/products/import-stock", { method: "POST" });
      setMessage(`นำเข้าแล้ว ${result.imported.toLocaleString("th-TH")} / ${result.total.toLocaleString("th-TH")} รายการ${result.imported === 0 ? " (รายการเดิมมีอยู่แล้ว)" : ""}`);
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "นำเข้าสินค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-orange-100 bg-white/85 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-domicha-ink">นำเข้ารายการทั้งหมดจาก DomiCha Stock</p>
          <p className="mt-1 text-xs text-slate-500">ระบบจะเพิ่มเฉพาะสินค้าที่ยังไม่มี คุณค่อยลบหรือแก้รูป/ราคาได้ภายหลัง</p>
        </div>
        <button
          type="button"
          onClick={importProducts}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60"
        >
          <DownloadCloud className="h-4 w-4" />
          {loading ? "กำลังนำเข้า..." : "นำเข้าจาก Stock"}
        </button>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
