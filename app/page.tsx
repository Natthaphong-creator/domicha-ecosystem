import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Facebook,
  LineChart,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { PublicFranchiseForm } from "@/components/PublicFranchiseForm";

const strengths = [
  {
    icon: Store,
    title: "เริ่มง่ายขึ้น",
    detail: "มีแนวทางหน้าร้าน เมนูหลัก และมาตรฐานการเปิดร้านให้เดินตามตั้งแต่ช่วงเริ่มต้น"
  },
  {
    icon: ShieldCheck,
    title: "ควบคุมคุณภาพ",
    detail: "วัตถุดิบและสูตรหลักอยู่ภายใต้มาตรฐานแบรนด์ เพื่อให้รสชาติสม่ำเสมอในทุกสาขา"
  },
  {
    icon: TrendingUp,
    title: "คิดเพื่อการขายจริง",
    detail: "ออกแบบแพ็กเกจให้เหมาะกับงบ ทำเล และเป้าหมายกำไร โดยทีมงานช่วยประเมินก่อนตัดสินใจ"
  }
];

const menuHighlights = ["ชานมไต้หวัน", "ชาไทย", "ชาเขียว", "โกโก้", "บราวน์ชูการ์", "เมนูโซดา"];

const socialLinks = [
  { label: "Facebook", value: "domichathailand", href: "https://www.facebook.com/domichathailand", icon: Facebook },
  { label: "TikTok", value: "domicha.tea", href: "https://www.tiktok.com/@domicha.tea", icon: Sparkles }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fff3dc] text-stone-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/40 bg-[#fff3dc]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="DomiCha Thailand">
            <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={58} height={58} className="h-[58px] w-[58px] object-contain" priority />
            <span className="leading-tight">
              <strong className="block text-lg">DomichaThailand</strong>
              <span className="hidden text-xs font-semibold text-orange-600 sm:block">Good taste Good fresh Everyday</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm font-bold text-stone-700 md:flex" aria-label="เมนูเว็บไซต์">
            <a href="#why">จุดแข็ง</a>
            <a href="#model">แฟรนไชส์</a>
            <a href="#menu">เมนูขายดี</a>
            <a href="#contact">ติดต่อ</a>
          </nav>
          <a href="#contact" className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-black text-white shadow-xl shadow-stone-950/15 md:ml-4">
            สมัครแฟรนไชส์ <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate min-h-[720px] overflow-hidden pt-[76px]">
        <Image
          src="/brand/customer.png"
          alt="บรรยากาศหน้าร้าน DomiCha"
          fill
          sizes="100vw"
          className="object-cover object-[58%_42%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/82 via-stone-950/45 to-stone-950/10" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#fff3dc] to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[644px] max-w-7xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-4 py-2 text-xs font-bold text-orange-100 shadow-2xl backdrop-blur">
              <Sparkles className="h-4 w-4 text-orange-300" /> แฟรนไชส์ชานมไข่มุกที่พร้อมโตไปกับคุณ
            </span>
            <h1 className="mt-7 text-5xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
              DomichaThailand
              <span className="block text-orange-300">เปิดร้านง่ายขึ้น โตอย่างเป็นระบบ</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-orange-50/90 sm:text-lg">
              หน้าเว็บนี้ออกแบบให้ผู้สนใจเห็นแบรนด์ เข้าใจโอกาส และฝากข้อมูลให้ทีม DomiCha ประเมินแพ็กเกจที่เหมาะกับงบ ทำเล และเป้าหมายของแต่ละคน
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex h-14 items-center gap-2 rounded-full bg-[#f5662d] px-7 text-base font-black text-white shadow-2xl shadow-orange-950/25">
                ขอข้อมูลแฟรนไชส์ <ArrowRight className="h-5 w-5" />
              </a>
              <a href="tel:0988247849" className="inline-flex h-14 items-center gap-2 rounded-full border border-white/20 bg-white/12 px-6 text-base font-black text-white backdrop-blur">
                <Phone className="h-5 w-5" /> โทรหาแบรนด์
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-3">
        {strengths.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[28px] border border-orange-100 bg-white/78 p-6 shadow-xl shadow-orange-950/5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{item.detail}</p>
            </article>
          );
        })}
      </section>

      <section id="model" className="bg-stone-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-orange-300">Franchise Model</p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">โชว์จุดตัดสินใจให้ชัด แต่สงวนรายละเอียดสำคัญของแบรนด์</h2>
          </div>
          <div className="text-base font-medium leading-8 text-stone-300">
            หน้าเว็บบอกสิ่งที่ผู้สนใจควรรู้: เริ่มง่าย มีทีมงานช่วยดูแล และเลือกแพ็กเกจตามงบกับทำเลได้ ส่วนสูตร ต้นทุน รายการอุปกรณ์ SOP และรายละเอียดเชิงลึก จะคุยหลังประเมินข้อมูลเบื้องต้น เพื่อป้องกันการลอกเลียนแบบและรักษาความได้เปรียบของแบรนด์
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-orange-600">Signature Menu</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">เมนูที่เข้าใจง่าย ขายซ้ำได้ และต่อยอดได้หลายกลุ่มลูกค้า</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {menuHighlights.map((item) => (
              <div key={item} className="rounded-2xl border border-orange-100 bg-white p-4 text-center text-sm font-black shadow-lg shadow-orange-950/5">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[28px] bg-white p-6 shadow-xl shadow-orange-950/5">
            <BadgeCheck className="h-8 w-8 text-orange-600" />
            <h3 className="mt-4 text-xl font-black">รีวิวและเสียงตอบรับ</h3>
            <p className="mt-3 text-sm leading-7 text-stone-600">ช่วงแรกใช้ภาพหน้าร้าน เมนูขายดี และข้อความจากลูกค้าจริงเมื่อมีข้อมูลยืนยันแล้ว เพื่อเพิ่มความน่าเชื่อถือแบบไม่กล่าวเกินจริง</p>
          </article>
          <article className="rounded-[28px] bg-white p-6 shadow-xl shadow-orange-950/5">
            <UsersRound className="h-8 w-8 text-orange-600" />
            <h3 className="mt-4 text-xl font-black">เหมาะกับใคร</h3>
            <p className="mt-3 text-sm leading-7 text-stone-600">ผู้ที่อยากเปิดร้านเครื่องดื่ม มีทำเลอยู่แล้ว หรือกำลังมองหาระบบช่วยเริ่มต้นโดยไม่ต้องลองผิดลองถูกทั้งหมดเอง</p>
          </article>
          <article className="rounded-[28px] bg-white p-6 shadow-xl shadow-orange-950/5">
            <LineChart className="h-8 w-8 text-orange-600" />
            <h3 className="mt-4 text-xl font-black">ประเมินก่อนลงทุน</h3>
            <p className="mt-3 text-sm leading-7 text-stone-600">ทีมงานช่วยคุยเรื่องงบ ทำเล และเป้าหมาย เพื่อแนะนำแนวทางที่เหมาะสมก่อนลงรายละเอียดแพ็กเกจ</p>
          </article>
        </div>
      </section>

      <section id="contact" className="bg-[#ffe8bd] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-orange-600">Let's grow together</p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">ฝากข้อมูลให้ทีม DomiCha ติดต่อกลับ</h2>
            <p className="mt-5 text-base font-medium leading-8 text-stone-700">
              กรอกข้อมูลเบื้องต้น ทีมงานจะช่วยแนะนำแพ็กเกจตามงบ ทำเล และรูปแบบร้านที่ต้องการ โดยยังไม่เปิดเผยรายละเอียดเชิงลึกบนหน้าเว็บ
            </p>
            <div className="mt-7 space-y-3 text-sm font-bold text-stone-700">
              <a href="tel:0988247849" className="flex items-center gap-3"><Phone className="h-5 w-5 text-orange-600" /> 098-824-7849</a>
              <a href="https://line.me/R/ti/p/@domicha" className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#06c755]" /> LINE Official: @domicha</a>
              <span className="flex items-center gap-3"><MapPin className="h-5 w-5 text-orange-600" /> DomichaThailand</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-stone-800">
                    <Icon className="h-4 w-4 text-orange-600" /> {item.label}: {item.value}
                  </a>
                );
              })}
            </div>
          </div>
          <PublicFranchiseForm />
        </div>
      </section>

      <footer className="bg-stone-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© DomiCha Thailand</span>
          <span>Good taste Good fresh Everyday</span>
        </div>
      </footer>
    </main>
  );
}
