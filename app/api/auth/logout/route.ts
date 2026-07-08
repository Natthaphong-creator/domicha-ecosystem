import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  await auth.supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
