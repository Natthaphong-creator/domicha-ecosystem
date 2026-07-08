import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DomiCha Business",
    short_name: "DomiCha",
    description: "ระบบบัญชี งานขาย และบริหารธุรกิจ DomiCha",
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
        src: "/icons/domicha-app-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
