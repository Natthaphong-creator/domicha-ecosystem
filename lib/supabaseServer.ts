import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

export function handleRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}
