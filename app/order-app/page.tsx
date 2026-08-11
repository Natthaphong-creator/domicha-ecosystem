import type { Metadata } from "next";
import { DomichaOrderApp } from "@/components/DomichaMarketing";
import { getPublicSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สั่งวัตถุดิบสำหรับแฟรนไชส์ซี | Domichathailand",
  description: "หน้าสั่งวัตถุดิบสำหรับสาขาแฟรนไชส์ซี DomiCha ที่ลงทะเบียนและได้รับอนุมัติจากแบรนด์แล้ว"
};

export default async function OrderAppPage() {
  const settings = await getPublicSiteSettings();
  return <DomichaOrderApp settings={settings} />;
}
