"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [ready, setReady] = useState(demoMode);

  useEffect(() => {
    if (demoMode) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });
  }, [demoMode, router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">กำลังตรวจสอบสิทธิ์...</div>;
  }

  return <>{children}</>;
}
