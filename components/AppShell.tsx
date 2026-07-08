"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  ClipboardList,
  CircleDollarSign,
  Crown,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageOpen,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Store,
  Truck,
  Users,
  UserRoundCog,
  WalletCards,
  X
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const navGroups = [
  {
    label: "ภาพรวม",
    items: [{ href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard }]
  },
  {
    label: "งานขาย",
    items: [
      { href: "/shop", label: "พอร์ทัลแฟรนไชส์ซี", icon: Store },
      { href: "/franchisees", label: "แฟรนไชส์ซี", icon: UserRoundCog },
      { href: "/orders", label: "ใบสั่งซื้อ", icon: ClipboardList },
      { href: "/documents", label: "เอกสารขาย", icon: FileText },
      { href: "/sales/new", label: "บันทึกการขาย", icon: CircleDollarSign },
      { href: "/quotations", label: "ใบเสนอราคา", icon: ReceiptText },
      { href: "/customers", label: "ลูกค้า", icon: Users }
    ]
  },
  {
    label: "ค่าใช้จ่าย",
    items: [
      { href: "/expenses", label: "รายจ่าย", icon: WalletCards },
      { href: "/suppliers", label: "ซัพพลายเออร์", icon: Truck }
    ]
  },
  {
    label: "สินค้าและบัญชี",
    items: [
      { href: "/products", label: "สินค้า/วัตถุดิบ", icon: Boxes },
      { href: "/cashflow", label: "กระแสเงินสด", icon: CircleDollarSign },
      { href: "/reports", label: "รายงาน", icon: FileBarChart }
    ]
  }
] as const;

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-5" aria-label="เมนูระบบ">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                    active ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "text-orange-600" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function logout() {
    if (!demoMode) await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="domicha-app-pattern min-h-screen text-slate-900">
      <aside className="domicha-sidebar-pattern fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-5">
          <Image
            src="/icons/domicha-original-logo.png"
            alt="Domi Cha"
            width={52}
            height={52}
            className="h-[52px] w-[52px] shrink-0 object-contain"
            priority
          />
          <span>
            <strong className="block text-base leading-tight">DomiCha Business</strong>
            <span className="text-xs text-slate-400">Accounting & Operations</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <Navigation pathname={pathname} />
        </div>
        <div className="border-t border-slate-100 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">NP</span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">ณัฐพงษ์ อุทธะ</strong>
              <span className="block truncate text-xs text-slate-400">{demoMode ? "โหมดตัวอย่าง" : "ผู้ดูแลระบบ"}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/35" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[286px] overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <Image
                  src="/icons/domicha-original-logo.png"
                  alt="Domi Cha"
                  width={54}
                  height={54}
                  className="h-[54px] w-[54px] object-contain"
                />
                <strong className="text-base">DomiCha Business</strong>
              </Link>
              <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="ปิดเมนู" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <Navigation pathname={pathname} onNavigate={() => setOpen(false)} />
            <button className="mt-6 flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600" onClick={logout}>
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button className="rounded-xl border border-slate-200 p-2.5 lg:hidden" onClick={() => setOpen(true)} aria-label="เปิดเมนู">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="Domi Cha หน้าหลัก">
            <Image
              src="/icons/domicha-original-logo.png"
              alt="Domi Cha"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </Link>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-10 border-0 bg-slate-100 pl-10 focus:bg-white" placeholder="ค้นหาเอกสาร ลูกค้า หรือเลขที่..." aria-label="ค้นหาทั้งระบบ" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-semibold text-amber-800 sm:inline-flex">
              <Crown className="h-3.5 w-3.5 text-amber-600" />
              {demoMode ? "● ข้อมูลตัวอย่าง" : "● ระบบออนไลน์"}
            </span>
            <Link href="/shop" className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-sm font-semibold text-orange-700 hover:bg-orange-100" aria-label="เปิดพอร์ทัลแฟรนไชส์ซี">
              <Store className="h-4 w-4" />
              <span className="hidden xl:inline">พอร์ทัลแฟรนไชส์ซี</span>
            </Link>
            <Link href="/sales/new" className="premium-button inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">สร้างเอกสาร</span>
            </Link>
            <button className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-500 sm:block" aria-label="ตั้งค่า">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <nav className="mobile-safe-nav fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-orange-200/70 bg-[#fffaf0]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="เมนูด่วน">
        {[
          { href: "/dashboard", label: "ภาพรวม", icon: BarChart3 },
          { href: "/orders", label: "ออเดอร์", icon: ClipboardList },
          { href: "/expenses", label: "รายจ่าย", icon: WalletCards },
          { href: "/products", label: "สินค้า", icon: PackageOpen },
          { href: "/customers", label: "ลูกค้า", icon: Store }
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`grid place-items-center gap-1 rounded-xl py-2 text-[10px] ${active ? "bg-orange-50 font-semibold text-orange-600" : "text-slate-500"}`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
