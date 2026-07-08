"use client";

import { useEffect, useState } from "react";
import { QuotationForm } from "@/components/QuotationForm";
import { apiFetch } from "@/lib/apiClient";
import type { Quotation } from "@/lib/types";

export function QuotationEditLoader({ id }: { id: string }) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Quotation>(`/api/quotations/${id}`).then(setQuotation).catch((err) => setError(err instanceof Error ? err.message : "โหลดใบเสนอราคาไม่สำเร็จ"));
  }, [id]);

  if (error) return <div className="rounded-md border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  if (!quotation) return <div className="rounded-md border border-domicha-line bg-white p-5 text-sm text-slate-600">กำลังโหลดใบเสนอราคา...</div>;

  return <QuotationForm initialData={quotation} />;
}
