import type { Metadata, Viewport } from "next";
import type React from "react";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "DomiCha Business",
  description: "ระบบบัญชีและบริหารธุรกิจครบวงจรสำหรับ DomiCha",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DomiCha"
  },
  icons: {
    icon: "/icons/domicha-original-logo.png",
    apple: "/icons/domicha-original-logo.png"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#f5662d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
