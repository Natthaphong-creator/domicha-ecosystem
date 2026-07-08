"use client";

import { useEffect, useState } from "react";
import { EntityForm } from "@/components/EntityForm";
import { apiFetch } from "@/lib/apiClient";
import type { FormField } from "@/lib/types";

export function EntityEditLoader({
  id,
  title,
  fields,
  endpoint,
  backHref,
  extraOptions
}: {
  id: string;
  title: string;
  fields: FormField[];
  endpoint: string;
  backHref: string;
  extraOptions?: Record<string, { label: string; value: string }[]>;
}) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Record<string, unknown>>(`${endpoint}/${id}`).then(setData).catch((err) => setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"));
  }, [endpoint, id]);

  if (error) return <div className="rounded-md border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="rounded-md border border-domicha-line bg-white p-5 text-sm text-slate-600">กำลังโหลดข้อมูล...</div>;

  return <EntityForm title={title} fields={fields} endpoint={`${endpoint}/${id}`} backHref={backHref} initialData={data} extraOptions={extraOptions} />;
}
