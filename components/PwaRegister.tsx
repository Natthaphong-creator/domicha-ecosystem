"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The web app remains usable if service worker registration is unavailable.
      });
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ios && !standalone && window.localStorage.getItem("domicha-ios-install-dismissed") !== "1") {
      setShowIosHelp(true);
    }

    function handleInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  function dismissIosHelp() {
    window.localStorage.setItem("domicha-ios-install-dismissed", "1");
    setShowIosHelp(false);
  }

  if (installPrompt) {
    return (
      <button
        className="pwa-install-cta fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl lg:bottom-6"
        onClick={install}
      >
        <Download className="h-4 w-4 text-orange-400" />
        ติดตั้ง DomiCha App
      </button>
    );
  }

  if (showIosHelp) {
    return (
      <aside className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-orange-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl lg:bottom-6" aria-label="วิธีติดตั้งแอป">
        <button className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" onClick={dismissIosHelp} aria-label="ปิดคำแนะนำ">
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-3 pr-7">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-orange-100 text-orange-600"><Share className="h-5 w-5" /></span>
          <div><strong className="text-sm">ติดตั้งบน iPhone หรือ iPad</strong><p className="mt-1 text-xs leading-5 text-slate-500">แตะปุ่มแชร์ใน Safari แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”</p></div>
        </div>
      </aside>
    );
  }

  return null;
}
