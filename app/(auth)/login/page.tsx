"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
    if (demoMode) {
      router.replace(nextPath || "/dashboard");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (userProfile?.role === "Franchisee") {
      router.replace("/shop");
      return;
    }

    if (nextPath) {
      router.replace(nextPath);
      return;
    }

    router.replace("/dashboard");
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
          <div><h1 className="text-xl font-bold">Domichathailand</h1><p className="text-xs text-slate-400">Staff & Franchisee Login</p></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-950">เข้าสู่ระบบ</h2>
        <p className="mt-1 text-sm text-slate-500">{demoMode ? "ยังไม่ได้เชื่อมต่อฐานข้อมูลสำหรับเข้าสู่ระบบ" : "ใช้บัญชีที่ทีม DomiCha สร้างให้เพื่อเข้าสู่ระบบทีมงานหรือพอร์ทัลสั่งซื้อของสาขา"}</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email">อีเมล</label>
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password">รหัสผ่าน</label>
              <Link className="text-sm font-medium text-orange-600 hover:text-orange-700" href="/forgot-password">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button disabled={loading} className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี? กรุณาติดต่อทีม DomiCha เพื่อเปิดสิทธิ์ใช้งาน
        </p>
      </form>
    </main>
  );
}
