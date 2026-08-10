export type SiteSettings = {
  brandPhone: string;
  lineUrl: string;
  lineLabel: string;
  contactNote: string;
};

export const defaultSiteSettings: SiteSettings = {
  brandPhone: "",
  lineUrl: "https://line.me/R/ti/p/@domicha",
  lineLabel: "@domicha",
  contactNote: "ฝากข้อมูลเบื้องต้นเพื่อให้ทีมงานแนะนำแพ็กเกจตามงบ ทำเล และรูปแบบร้านที่ต้องการ"
};

export function cleanSiteSettings(payload: Partial<SiteSettings>): SiteSettings {
  return {
    brandPhone: String(payload.brandPhone || "").trim().slice(0, 40),
    lineUrl: String(payload.lineUrl || defaultSiteSettings.lineUrl).trim().slice(0, 240),
    lineLabel: String(payload.lineLabel || defaultSiteSettings.lineLabel).trim().slice(0, 80),
    contactNote: String(payload.contactNote || defaultSiteSettings.contactNote).trim().slice(0, 240)
  };
}

export function phoneHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "#contact";
}
