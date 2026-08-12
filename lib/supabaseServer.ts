import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { canAccessRole, isOwnerUserId, normalizeRole } from "@/lib/ownerAccess";

export function createSupabaseRouteClient(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        : undefined
    }
  );
}

export async function requireUser(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request);
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function requireUserRole(request: NextRequest, allowedRoles: string[]) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth;

  const { data: profile, error } = await auth.supabase
    .from("users")
    .select("id,email,full_name,role")
    .eq("id", auth.user.id)
    .single();

  if ((error || !profile) && isOwnerUserId(auth.user.id) && allowedRoles.includes("Admin")) {
    return {
      ...auth,
      profile: {
        id: auth.user.id,
        email: auth.user.email || "",
        full_name: auth.user.user_metadata?.full_name || "DomiCha Owner",
        role: "Admin"
      }
    };
  }

  if (error || !profile) {
    return { ...auth, response: NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 403 }) };
  }

  const normalizedProfile = isOwnerUserId(auth.user.id)
    ? { ...profile, role: "Admin" }
    : { ...profile, role: normalizeRole(profile.role) };

  if (!canAccessRole(auth.user.id, normalizedProfile.role, allowedRoles)) {
    return { ...auth, profile: normalizedProfile, response: NextResponse.json({ error: "ไม่มีสิทธิ์ใช้งานส่วนนี้" }, { status: 403 }) };
  }

  return { ...auth, profile: normalizedProfile };
}

export function handleRouteError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error
      ? (error as { message?: string; details?: string; hint?: string }).message
        || (error as { details?: string }).details
        || JSON.stringify(error)
      : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}
