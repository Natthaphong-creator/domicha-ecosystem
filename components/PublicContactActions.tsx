"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { cleanSiteSettings, phoneHref, SiteSettings } from "@/lib/siteSettingsShared";

const DEMO_STORAGE_KEY = "domicha-business-demo-v1";

export function PublicContactActions({ initialSettings }: { initialSettings: SiteSettings }) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (!raw) return;
      const database = JSON.parse(raw) as { siteSettings?: Partial<SiteSettings> };
      if (database.siteSettings) setSettings(cleanSiteSettings(database.siteSettings));
    } catch {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  return (
    <>
      <p className="mt-5 text-lg font-semibold leading-8 text-[#6a4a35]">
        {settings.contactNote} ทีมงานจะช่วยแนะนำโมเดลร้านที่เหมาะกับงบ ทำเล และเป้าหมายของคุณ
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={phoneHref(settings.brandPhone)} className="inline-flex items-center gap-2 rounded-full bg-[#18120f] px-5 py-3 font-black text-white">
          <Phone className="h-5 w-5" />
          โทรหาแบรนด์
        </a>
        <a href={settings.lineUrl} className="inline-flex items-center gap-2 rounded-full bg-[#06c755] px-5 py-3 font-black text-white">
          <MessageCircle className="h-5 w-5" />
          คุย LINE Official
        </a>
      </div>
      <p className="mt-4 text-sm font-bold leading-6 text-[#7d4b2a]">
        {settings.brandPhone ? `โทร ${settings.brandPhone}` : "ฝากข้อมูลไว้ แล้วทีมงานจะติดต่อกลับ"} • LINE {settings.lineLabel}
      </p>
    </>
  );
}
