import type { Metadata } from "next";
import { DomichaOrderApp } from "@/components/DomichaMarketing";
import { getPublicSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สั่ง DomiCha ผ่านแอป | Domichathailand",
  description: "หน้าสั่งซื้อ DomiCha สำหรับลูกค้าทั่วไป เลือกเมนู ติดต่อร้าน และต่อยอดเป็นช่องทางขายออนไลน์ของแบรนด์"
};

export default async function OrderAppPage() {
  const settings = await getPublicSiteSettings();
  return <DomichaOrderApp settings={settings} />;
}
