import { DomichaHome } from "@/components/DomichaMarketing";
import { getPublicSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getPublicSiteSettings();
  return <DomichaHome settings={settings} />;
}
