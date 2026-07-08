"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { FormField } from "@/lib/types";

type EntityFormProps = {
  title: string;
  fields: FormField[];
  endpoint: string;
  backHref: string;
  initialData?: Record<string, unknown>;
  extraOptions?: Record<string, { label: string; value: string }[]>;
};

export function EntityForm({ title, fields, endpoint, backHref, initialData, extraOptions }: EntityFormProps) {
  const router = useRouter();
  const defaults = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, field.type === "number" ? 0 : ""])), [fields]);
  const [form, setForm] = useState<Record<string, unknown>>({ ...defaults, status: "Active", ...initialData });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...defaults, status: "Active", ...initialData });
  }, [defaults, initialData]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = { ...form };
      for (const field of fields) {
        if (field.type === "number") payload[field.name] = Number(payload[field.name] || 0);
      }
      await apiFetch(endpoint, {
        method: initialData?.id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      router.push(backHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-domicha-line bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-domicha-ink">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const options = extraOptions?.[field.name] || field.options || [];
          const value = String(form[field.name] ?? "");
          return (
            <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
              <label htmlFor={field.name}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea id={field.name} rows={3} required={field.required} value={value} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
              ) : field.type === "select" ? (
                <select id={field.name} required={field.required} value={value} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
                  <option value="">เลือกข้อมูล</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  step={field.type === "number" ? "0.01" : undefined}
                  required={field.required}
                  value={value}
                  onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              )}
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => router.push(backHref)} className="rounded-md border border-domicha-line px-4 py-2 text-sm">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-domicha-tea px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
