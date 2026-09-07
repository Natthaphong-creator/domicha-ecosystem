"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";

const budgets = ["ยังไม่ระบุงบ", "ต่ำกว่า 100,000", "100,000 - 200,000", "200,000 - 300,000", "มากกว่า 300,000"];

export function PublicFranchiseForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("sending");

    try {
      const response = await fetch("/api/franchise-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });

      if (!response.ok) throw new Error("Lead submit failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl shadow-orange-950/10 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-3xl font-black">ขอข้อมูลแฟรนไชส์</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">ฝากข้อมูลเบื้องต้น ทีมงานจะติดต่อกลับเพื่อประเมินแพ็กเกจที่เหมาะกับงบและทำเล</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 font-bold">
          ชื่อผู้ติดต่อ
          <input name="name" required placeholder="ระบุชื่อและนามสกุล" className="h-14 rounded-2xl" />
        </label>
        <label className="grid gap-2 font-bold">
          เบอร์โทร / LINE ID
          <input name="contact" required placeholder="ช่องทางที่ทีมงานติดต่อกลับได้" className="h-14 rounded-2xl" />
        </label>
        <label className="grid gap-2 font-bold">
          จังหวัด / ทำเลที่สนใจ
          <input name="location" required placeholder="เช่น ชลบุรี / หน้าโรงเรียน / ใกล้ออฟฟิศ" className="h-14 rounded-2xl" />
        </label>
        <label className="grid gap-2 font-bold">
          งบประมาณเบื้องต้น
          <select name="budget" defaultValue="ยังไม่ระบุงบ" className="h-14 rounded-2xl">
            {budgets.map((budget) => <option key={budget} value={budget}>{budget}</option>)}
          </select>
        </label>
        <label className="grid gap-2 font-bold">
          รายละเอียดเพิ่มเติม
          <textarea name="note" rows={4} placeholder="เช่น มีพื้นที่แล้ว / กำลังหาทำเล / อยากเปิดต่างจังหวัด" className="rounded-2xl" />
        </label>
      </div>
      {status === "sent" ? (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> รับข้อมูลแล้ว
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
      ) : null}
      <button disabled={status === "sending"} className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f5662d] px-6 text-base font-black text-white shadow-xl shadow-orange-500/20 disabled:opacity-60">
        {status === "sending" ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลให้ทีม DomiCha"} <ArrowRight className="h-5 w-5" />
      </button>
      <p className="mt-4 text-center text-xs font-semibold leading-6 text-stone-400">
        ข้อมูลนี้ใช้เพื่อให้ทีมงานติดต่อกลับและประเมินแนวทางแฟรนไชส์เท่านั้น
      </p>
    </form>
  );
}
