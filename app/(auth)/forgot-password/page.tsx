"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    if (demoMode) {
      setStatus("sent");
      setMessage("โหมดตัวอย่างยังไม่ได้เชื่อมอีเมลจริง");
      return;
    }

    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`
    });

    if (error) {
      setStatus("error");
      setMessage("ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบอีเมลอีกครั้ง");
      return;
    }

    setStatus("sent");
    setMessage("ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/icons/domicha-original-logo.png"
            alt="Domi Cha"
            width={76}
            height={76}
            className="h-[76px] w-[76px] shrink-0 object-contain"
            priority
          />
          <div>
            <h1 className="text-xl font-bold">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-xs text-slate-400">สำหรับบัญชีทีมงานและแฟรนไชส์ซี</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-950">ลืมรหัสผ่าน</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          กรอกอีเมลที่ใช้เข้าสู่ระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
        </p>
        <div className="mt-6">
          <label htmlFor="email">อีเมล</label>
          <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        {message ? (
          <p className={`mt-4 rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
        <button disabled={status === "sending"} className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
          {status === "sending" ? "กำลังส่งลิงก์..." : "ส่งลิงก์ตั้งรหัสใหม่"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          จำรหัสผ่านได้แล้ว?{" "}
          <Link className="font-medium text-orange-600" href="/login">
            กลับไปเข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </main>
  );
}
