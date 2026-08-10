"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(demoMode);

  useEffect(() => {
    if (demoMode) return;

    async function prepareSession() {
      setError("");
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("ลิงก์ตั้งรหัสผ่านหมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง");
          setReady(false);
          return;
        }
        window.history.replaceState({}, document.title, "/reset-password");
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setError("กรุณาเปิดหน้านี้จากลิงก์ reset password ในอีเมล");
        setReady(false);
        return;
      }

      setReady(true);
    }

    prepareSession();
  }, [demoMode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (demoMode) {
      setMessage("โหมดตัวอย่าง: ตั้งรหัสผ่านใหม่สำเร็จ");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
      return;
    }

    setMessage("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว สามารถกลับไปเข้าสู่ระบบได้");
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
          <div><h1 className="text-xl font-bold">Domichathailand</h1><p className="text-xs text-slate-400">Set new password</p></div>
        </div>

        <h2 className="text-2xl font-bold text-slate-950">ตั้งรหัสผ่านใหม่</h2>
        <p className="mt-1 text-sm text-slate-500">กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="password">รหัสผ่านใหม่</label>
            <input id="password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={!ready} />
          </div>
          <div>
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
            <input id="confirmPassword" type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!ready} />
          </div>
        </div>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

        <button disabled={!ready || loading} className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
          {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link className="font-medium text-orange-600" href="/login">
            กลับเข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </main>
  );
}
