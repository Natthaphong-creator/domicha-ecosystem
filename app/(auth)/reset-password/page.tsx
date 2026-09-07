"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(demoMode);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (demoMode) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        setMessage("ลิงก์ตั้งรหัสผ่านไม่พร้อมใช้งาน กรุณาขอลิงก์ใหม่อีกครั้ง");
      }
    });
  }, [demoMode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setStatus("error");
      setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (demoMode) {
      setStatus("saved");
      setMessage("ตั้งรหัสผ่านใหม่ในโหมดตัวอย่างแล้ว");
      return;
    }

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage("ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาขอลิงก์ใหม่อีกครั้ง");
      return;
    }

    await supabase.auth.signOut();
    setStatus("saved");
    setMessage("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กำลังพาไปหน้าเข้าสู่ระบบ");
    window.setTimeout(() => router.replace("/login"), 1200);
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
            <h1 className="text-xl font-bold">DomiCha Back Office</h1>
            <p className="text-xs text-slate-400">ตั้งรหัสผ่านใหม่อย่างปลอดภัย</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-950">ตั้งรหัสผ่านใหม่</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          ตั้งรหัสผ่านใหม่สำหรับบัญชีของพี่ แล้วใช้รหัสนี้เข้าสู่ระบบครั้งต่อไป
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="password">รหัสผ่านใหม่</label>
            <input
              id="password"
              type="password"
              minLength={6}
              required
              disabled={!ready || status === "saved"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
            <input
              id="confirmPassword"
              type="password"
              minLength={6}
              required
              disabled={!ready || status === "saved"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>
        {message ? (
          <p className={`mt-4 rounded-md px-3 py-2 text-sm ${status === "error" || !ready ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
        <button disabled={!ready || status === "saving" || status === "saved"} className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
          {status === "saving" ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          กลับไป{" "}
          <Link className="font-medium text-orange-600" href="/login">
            หน้าเข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </main>
  );
}
