"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck, Clock3, MessageCircle, RefreshCcw, Search, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { dateThai } from "@/lib/format";
import type { FranchiseLead, FranchiseLeadStatus } from "@/lib/types";

const statusLabels: Record<FranchiseLeadStatus, string> = {
  New: "ใหม่",
  Contacted: "ติดต่อแล้ว",
  Qualified: "ผ่านการคัดกรอง",
  PackageSent: "ส่งแพ็กเกจแล้ว",
  Won: "ปิดการขาย",
  Lost: "ไม่พร้อมตอนนี้"
};

const statusClasses: Record<FranchiseLeadStatus, string> = {
  New: "border-orange-100 bg-orange-50 text-orange-700",
  Contacted: "border-blue-100 bg-blue-50 text-blue-700",
  Qualified: "border-violet-100 bg-violet-50 text-violet-700",
  PackageSent: "border-amber-100 bg-amber-50 text-amber-700",
  Won: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Lost: "border-slate-200 bg-slate-100 text-slate-500"
};

const statuses = Object.keys(statusLabels) as FranchiseLeadStatus[];

export default function FranchiseLeadsPage() {
  const [leads, setLeads] = useState<FranchiseLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function loadLeads() {
    setLoading(true);
    setError("");
    try {
      setLeads(await apiFetch<FranchiseLead[]>("/api/franchise-leads"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลด Lead แฟรนไชส์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function updateLead(id: string, status: FranchiseLeadStatus) {
    setSavingId(id);
    setError("");
    try {
      const updated = await apiFetch<FranchiseLead>("/api/franchise-leads", {
        method: "PATCH",
        body: JSON.stringify({ id, status })
      });
      setLeads((current) => current.map((lead) => lead.id === id ? updated : lead));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setSavingId("");
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return leads;
    return leads.filter((lead) => [
      lead.name,
      lead.contact,
      lead.location,
      lead.budget,
      lead.note,
      statusLabels[lead.status]
    ].some((value) => String(value || "").toLowerCase().includes(keyword)));
  }, [leads, query]);

  const activeLeads = leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).length;
  const contactedLeads = leads.filter((lead) => lead.status !== "New").length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
              <UserPlus className="h-4 w-4" /> Franchise Leads
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Lead แฟรนไชส์จากหน้าเว็บ</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              รวมรายชื่อผู้สนใจแฟรนไชส์จากฟอร์มหน้าเว็บไซต์ เก็บข้อมูลไว้ในระบบหลังบ้านเพื่อให้ทีมงานติดตามและปิดการขายได้เป็นขั้นตอน
            </p>
          </div>
          <button onClick={loadLeads} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15">
            <RefreshCcw className="h-4 w-4" /> รีเฟรช
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Lead ทั้งหมด</p>
          <p className="mt-2 text-3xl font-black">{leads.length}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">กำลังติดตาม</p>
          <p className="mt-2 text-3xl font-black text-orange-600">{activeLeads}</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">ติดต่อแล้ว</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{contactedLeads}</p>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">รายการผู้สนใจ</h2>
            <p className="mt-1 text-xs text-slate-400">เปลี่ยนสถานะหลังโทรหรือคุย LINE เพื่อให้ทีมรู้ว่าควรทำอะไรต่อ</p>
          </div>
          <label className="relative block md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 rounded-2xl pl-10" placeholder="ค้นหาชื่อ / เบอร์ / จังหวัด / งบ" />
          </label>
        </div>

        {error ? <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">กำลังโหลด Lead...</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">ยังไม่มี Lead ในเงื่อนไขนี้</p>
            <p className="mt-1 text-sm text-slate-500">เมื่อลูกค้ากรอกฟอร์มแฟรนไชส์ รายการจะมาแสดงที่นี่</p>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {filtered.map((lead) => (
            <article key={lead.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-orange-200 hover:bg-orange-50/30">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{lead.name}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClasses[lead.status]}`}>{statusLabels[lead.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{lead.contact} • {lead.location || "ยังไม่ระบุทำเล"} • {lead.budget || "ยังไม่ระบุงบ"}</p>
                  {lead.note ? <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-600">{lead.note}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>ส่งจาก {lead.source}</span>
                    <span>{dateThai(lead.created_at)}</span>
                    {lead.last_contacted_at ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />ติดต่อเมื่อ {dateThai(lead.last_contacted_at)}</span> : null}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:min-w-[280px] xl:grid-cols-1">
                  <select
                    value={lead.status}
                    disabled={savingId === lead.id}
                    onChange={(event) => updateLead(lead.id, event.target.value as FranchiseLeadStatus)}
                    className="h-11 rounded-2xl"
                    aria-label={`สถานะของ ${lead.name}`}
                  >
                    {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                  <a href={`tel:${lead.contact.replace(/[^\d+]/g, "")}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-orange-600">
                    โทร / ติดตาม <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
