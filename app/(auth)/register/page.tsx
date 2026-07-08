"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { roles } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Sales");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("สมัครสมาชิกสำเร็จ หากเปิดยืนยันอีเมลไว้ กรุณาตรวจสอบอีเมลก่อนเข้าสู่ระบบ");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-domicha-milk px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-md border border-domicha-line bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-domicha-tea">สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-slate-600">กำหนดบทบาทผู้ใช้งานสำหรับระบบ Phase 1</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="full_name">ชื่อผู้ใช้งาน</label>
            <input id="full_name" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div>
            <label htmlFor="email">อีเมล</label>
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label htmlFor="role">บทบาท</label>
            <select id="role" value={role} onChange={(event) => setRole(event.target.value)}>
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="password">รหัสผ่าน</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
        <button disabled={loading} className="mt-6 w-full rounded-md bg-domicha-tea px-4 py-2 font-medium text-white disabled:opacity-60">
          {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          มีบัญชีแล้ว?{" "}
          <Link className="font-medium text-domicha-tea" href="/login">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </main>
  );
}
