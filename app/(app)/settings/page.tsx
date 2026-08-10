"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Globe2, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/apiClient";
import { defaultSiteSettings, SiteSettings } from "@/lib/siteSettingsShared";

export default function SettingsPage() {
  const [form, setForm] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<SiteSettings>("/api/site-settings")
      .then((settings) => {
        if (active) setForm(settings);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const saved = await apiFetch<SiteSettings>("/api/site-settings", {
        method: "PATCH",
        body: JSON.stringify(form)
      });
      setForm(saved);
      setMessage("บันทึกการตั้งค่าเว็บไซต์แล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-24 lg:pb-4">
      <PageHeader title="ตั้งค่าเว็บไซต์" description="แก้ข้อมูลติดต่อที่แสดงบนหน้าเว็บสาธารณะของ DomiCha" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-600">
              <Globe2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">ข้อมูลติดต่อหน้า Landing Page</h2>
              <p className="mt-0.5 text-sm text-slate-500">ใช้กับปุ่มโทรหาแบรนด์ ปุ่ม LINE และข้อความนำฟอร์มแฟรนไชส์</p>
            </div>
          </div>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังโหลดข้อมูล
            </div>
          ) : (
            <div className="grid gap-5">
              <label className="block">
                เบอร์โทรแบรนด์
                <input className="mt-1.5 h-12 rounded-2xl" inputMode="tel" placeholder="เช่น 098-824-7849" value={form.brandPhone} onChange={(event) => setForm({ ...form, brandPhone: event.target.value })} />
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  LINE URL
                  <input className="mt-1.5 h-12 rounded-2xl" placeholder="https://line.me/R/ti/p/@domicha" value={form.lineUrl} onChange={(event) => setForm({ ...form, lineUrl: event.target.value })} />
                </label>
                <label className="block">
                  ชื่อ LINE ที่แสดงในระบบ
                  <input className="mt-1.5 h-12 rounded-2xl" placeholder="@domicha" value={form.lineLabel} onChange={(event) => setForm({ ...form, lineLabel: event.target.value })} />
                </label>
              </div>
              <label className="block">
                ข้อความนำฟอร์มติดต่อ
                <textarea className="mt-1.5 min-h-28 rounded-2xl" value={form.contactNote} onChange={(event) => setForm({ ...form, contactNote: event.target.value })} />
              </label>
              {message ? <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</p> : null}
              {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
              <button disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60 sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "กำลังบันทึก" : "บันทึกการตั้งค่า"}
              </button>
            </div>
          )}
        </form>
        <aside className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <h2 className="font-semibold text-orange-950">คำแนะนำหลังจดโดเมน</h2>
          <p className="mt-3 text-sm leading-6 text-orange-900/80">ใช้ `www.domichathailand.com` สำหรับหน้าเว็บลูกค้า, `order.domichathailand.com` สำหรับแฟรนไชส์ซี และ `admin.domichathailand.com` สำหรับหลังบ้านเจ้าของ</p>
          <div className="mt-5 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-950">แก้ได้โดยไม่ deploy ใหม่</p>
            <p className="mt-2">เบอร์โทร, LINE, และข้อความนำฟอร์ม</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
