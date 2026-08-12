import { NextRequest, NextResponse } from "next/server";
import { cleanSiteSettings, defaultSiteSettings, getPublicSiteSettings } from "@/lib/siteSettings";
import { handleRouteError, requireUserRole } from "@/lib/supabaseServer";

export async function GET() {
  try {
    return NextResponse.json(await getPublicSiteSettings());
  } catch {
    return NextResponse.json(defaultSiteSettings);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUserRole(request, ["Admin"]);
    if ("response" in auth) return auth.response;

    const settings = cleanSiteSettings(await request.json());
    const { error } = await auth.supabase.from("site_settings").upsert({
      key: "public_contact",
      value: settings,
      updated_by: auth.user.id
    });

    if (error) throw error;
    return NextResponse.json(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
