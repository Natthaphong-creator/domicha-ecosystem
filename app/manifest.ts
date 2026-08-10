import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Domichathailand",
    short_name: "Domichathailand",
    description: "ระบบพอร์ทัลสำหรับ Brand Owner, พนักงาน และแฟรนไชส์ซี Domichathailand",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffd9ad",
    theme_color: "#f5662d",
    orientation: "any",
    lang: "th",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icons/domicha-original-logo.png",
        sizes: "511x511",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/domicha-original-logo.png",
        sizes: "511x511",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
