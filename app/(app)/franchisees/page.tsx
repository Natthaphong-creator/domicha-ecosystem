"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Plus, RefreshCcw, ShieldCheck, Store, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

type Franchisee = {
  id: string;
  branch_name: string;
  owner_name: string;
  phone: string;
  email: string;
  province: string | null;
  shipping_address: string | null;
  credit_limit: number;
  payment_terms: string;
  status: "Pending" | "Active" | "Suspended";
  created_at: string;
  branches?: { branch_code: string; branch_name: string } | null;
};

type FormState = {
  email: string;
  password: string;
  ownerName: string;
  branchName: string;
  branchCode: string;
  phone: string;
  province: string;
  shippingAddress: string;
  taxId: string;
  creditLimit: string;
  paymentTerms: string;
  status: "Pending" | "Active" | "Suspended";
};

const initialForm: FormState = {
  email: "",
  password: "",
  ownerName: "",
  branchName: "",
  branchCode: "",
  phone: "",
  province: "",
  shippingAddress: "",
  taxId: "",
  creditLimit: "0",
  paymentTerms: "ชำระก่อนจัดส่ง",
  status: "Active"
};

function makePassword() {
  return `DC${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
}

function statusBadge(status: Franchisee["status"]) {
  const map = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Suspended: "bg-red-50 text-red-700 border-red-100"
  };
  return map[status];
}

export default function FranchiseesPage() {
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [form, setForm] = useState<FormState>({ ...initialForm, password: makePassword() });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);

  async function loadFranchisees() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<Franchisee[]>("/api/franchisees");
      setFranchisees(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลแฟรนไชส์ซีไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFranchisees();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(null);
    try {
      await apiFetch("/api/franchisees", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          creditLimit: Number(form.creditLimit || 0)
        })
      });
      setSuccess({ email: form.email, password: form.password });
      setForm({ ...initialForm, password: makePassword() });
      await loadFranchisees();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "สร้างบัญชีแฟรนไชส์ซีไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
            <ShieldCheck className="h-4 w-4" /> HQ Private Portal
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">จัดการสมาชิกแฟรนไชส์ซี</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            แบบ A: HQ สร้างบัญชีให้สาขาเอง แล้วส่งอีเมลและรหัสผ่านให้แฟรนไชส์ซีใช้เข้าสั่งซื้อวัตถุดิบผ่าน `/shop`
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-600">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">สร้างบัญชีแฟรนไชส์ซี</h2>
              <p className="text-xs text-slate-400">ใช้สำหรับเจ้าของสาขา ไม่เปิดให้ลูกค้าทั่วไปสมัครเอง</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label>
              อีเมล Login
              <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 h-12 rounded-2xl" placeholder="branch@example.com" />
            </label>
            <label>
              รหัสผ่านเริ่มต้น
              <div className="mt-1.5 flex gap-2">
                <input required minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="h-12 rounded-2xl" />
                <button type="button" onClick={() => setForm({ ...form, password: makePassword() })} className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 text-slate-500" aria-label="สุ่มรหัสผ่าน">
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                ชื่อเจ้าของสาขา
                <input required value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} className="mt-1.5 h-12 rounded-2xl" />
              </label>
              <label>
                เบอร์โทร
                <input required inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1.5 h-12 rounded-2xl" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                ชื่อสาขา
                <input required value={form.branchName} onChange={(event) => setForm({ ...form, branchName: event.target.value })} className="mt-1.5 h-12 rounded-2xl" placeholder="DomiCha บางนา" />
              </label>
              <label>
                รหัสสาขา
                <input required value={form.branchCode} onChange={(event) => setForm({ ...form, branchCode: event.target.value.toUpperCase() })} className="mt-1.5 h-12 rounded-2xl" placeholder="BANGNA-01" />
              </label>
            </div>
            <label>
              จังหวัด
              <input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="mt-1.5 h-12 rounded-2xl" />
            </label>
            <label>
              ที่อยู่จัดส่งหลัก
              <textarea rows={3} value={form.shippingAddress} onChange={(event) => setForm({ ...form, shippingAddress: event.target.value })} className="mt-1.5 rounded-2xl" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                เลขภาษี
                <input value={form.taxId} onChange={(event) => setForm({ ...form, taxId: event.target.value })} className="mt-1.5 h-12 rounded-2xl" />
              </label>
              <label>
                เครดิตวงเงิน
                <input type="number" min="0" value={form.creditLimit} onChange={(event) => setForm({ ...form, creditLimit: event.target.value })} className="mt-1.5 h-12 rounded-2xl" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                เงื่อนไขชำระเงิน
                <input value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} className="mt-1.5 h-12 rounded-2xl" />
              </label>
              <label>
                สถานะ
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FormState["status"] })} className="mt-1.5 h-12 rounded-2xl">
                  <option value="Active">Active — ใช้งานได้ทันที</option>
                  <option value="Pending">Pending — รออนุมัติ</option>
                  <option value="Suspended">Suspended — ระงับ</option>
                </select>
              </label>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {success ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-bold">สร้างบัญชีสำเร็จ</p>
              <p className="mt-1">ส่งให้แฟรนไชส์ซี: {success.email}</p>
              <p className="mt-1 flex items-center gap-2"><KeyRound className="h-4 w-4" /> รหัสผ่านเริ่มต้น: <b>{success.password}</b></p>
            </div>
          ) : null}

          <button disabled={submitting} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 font-bold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
            {submitting ? "กำลังสร้างบัญชี..." : <><Plus className="h-5 w-5" /> สร้างบัญชีแฟรนไชส์ซี</>}
          </button>
        </form>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">รายชื่อแฟรนไชส์ซี</h2>
              <p className="mt-1 text-xs text-slate-400">สาขาที่มีสิทธิ์เข้าสั่งซื้อในระบบ</p>
            </div>
            <button onClick={loadFranchisees} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500" aria-label="รีเฟรช">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">กำลังโหลดข้อมูล...</p> : null}
            {!loading && franchisees.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">ยังไม่มีแฟรนไชส์ซี</p> : null}
            {franchisees.map((franchisee) => (
              <article key={franchisee.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm">
                    <Store className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{franchisee.branch_name}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBadge(franchisee.status)}`}>{franchisee.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{franchisee.owner_name} • {franchisee.phone}</p>
                    <p className="mt-1 text-xs text-slate-400">{franchisee.email} {franchisee.province ? `• ${franchisee.province}` : ""}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
