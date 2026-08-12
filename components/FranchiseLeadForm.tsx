"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const budgets = [
  "ยังไม่ระบุงบ",
  "ต่ำกว่า 100,000 บาท",
  "100,000 - 200,000 บาท",
  "200,000 - 400,000 บาท",
  "มากกว่า 400,000 บาท"
];

export function FranchiseLeadForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    location: "",
    budget: budgets[0],
    note: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/franchise-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "ส่งข้อมูลไม่สำเร็จ");
      setMessage(payload.message || "รับข้อมูลแล้ว");
      setForm({ name: "", contact: "", location: "", budget: budgets[0], note: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow-xl shadow-orange-950/10">
      <h3 className="text-2xl font-black text-[#18120f]">ขอข้อมูลแฟรนไชส์</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#7d4b2a]">ฝากข้อมูลเบื้องต้น ทีมงานจะช่วยแนะนำแพ็กเกจตามงบและทำเล</p>
      <div className="mt-6 grid gap-4">
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="ชื่อผู้ติดต่อ" aria-label="ชื่อผู้ติดต่อ" />
        <input required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="เบอร์โทร / LINE ID" aria-label="เบอร์โทรหรือ LINE ID" />
        <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="จังหวัด / ทำเลที่สนใจ" aria-label="จังหวัดหรือทำเลที่สนใจ" />
        <select value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} aria-label="งบประมาณคร่าว ๆ">
          {budgets.map((budget) => <option key={budget}>{budget}</option>)}
        </select>
        <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="รายละเอียดเพิ่มเติม เช่น มีพื้นที่แล้ว / กำลังหาทำเล / อยากเปิดต่างจังหวัด" aria-label="รายละเอียดเพิ่มเติม" className="min-h-28" />
      </div>
      {message ? <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f0692f] px-6 py-4 font-black text-white transition hover:bg-[#d9541c] disabled:opacity-60">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        ส่งข้อมูลให้ทีม DomiCha
        <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
}
