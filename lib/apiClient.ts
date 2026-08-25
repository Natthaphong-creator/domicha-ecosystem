"use client";

import { supabase } from "@/lib/supabaseClient";
import { demoApiFetch } from "@/lib/demoApi";

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (demoMode) return demoApiFetch<T>(url, init);

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "ไม่สามารถเชื่อมต่อ API ได้");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
