import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Domichathailand",
    short_name: "Domichathailand",
    description: "เว็บไซต์ Domichathailand สำหรับชานมไข่มุก DomiCha และข้อมูลแฟรนไชส์",
    start_url: "/",
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
