import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanSiteSettings, defaultSiteSettings, SiteSettings } from "@/lib/siteSettingsShared";

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return defaultSiteSettings;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "public_contact")
    .maybeSingle();

  if (error || !data?.value) return defaultSiteSettings;
  return cleanSiteSettings(data.value as Partial<SiteSettings>);
}

export { cleanSiteSettings, defaultSiteSettings, phoneHref } from "@/lib/siteSettingsShared";
export type { SiteSettings } from "@/lib/siteSettingsShared";
