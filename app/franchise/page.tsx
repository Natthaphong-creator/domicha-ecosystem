import type { Metadata } from "next";
import { DomichaFranchise } from "@/components/DomichaMarketing";
import { getPublicSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แฟรนไชส์ DomiCha | เลือกโมเดลตามงบ ทำเล และเป้าหมาย",
  description: "ข้อมูลแฟรนไชส์ DomiCha สำหรับผู้สนใจเปิดร้าน พร้อมโมเดล Starter, Kiosk, Shop และฟอร์มฝากข้อมูล"
};

export default async function FranchisePage() {
  const settings = await getPublicSiteSettings();
  return <DomichaFranchise settings={settings} />;
}
