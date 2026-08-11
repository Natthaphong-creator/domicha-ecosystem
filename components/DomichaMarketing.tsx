import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Coffee,
  HelpCircle,
  MapPin,
  MessageCircle,
  ShoppingBag,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { FranchiseLeadForm } from "@/components/FranchiseLeadForm";
import { PublicContactActions } from "@/components/PublicContactActions";
import { SiteSettings } from "@/lib/siteSettingsShared";

const proofPoints = [
  ["Fresh", "ชงใหม่ทุกแก้ว"],
  ["Boba", "ไข่มุกหนึบเต็มคำ"],
  ["Smile", "แบรนด์น่ารักจำง่าย"]
];

const customerMoments = [
  {
    icon: Coffee,
    title: "เมนูคุ้นเคย ดื่มง่าย",
    text: "ชานม บราวน์ชูการ์ ชาไทย โกโก้ และชาเขียว ออกแบบให้ลูกค้าเลือกง่าย"
  },
  {
    icon: Sparkles,
    title: "ถ่ายรูปขึ้น จำแบรนด์ได้",
    text: "มาสคอทแมว DomiCha และโทนส้มครีมทำให้ร้านดูเป็นมิตรตั้งแต่แรกเห็น"
  },
  {
    icon: BadgeCheck,
    title: "มาตรฐานรสชาติ",
    text: "วางเมนูและภาพหน้าร้านให้ลูกค้ารู้สึกมั่นใจ สั่งซ้ำได้ง่าย"
  }
];

const pillars = [
  {
    icon: BadgeCheck,
    title: "หน้าร้านน่าจำ",
    text: "คาแรกเตอร์แมว สีส้มครีม และภาพร้านที่อบอุ่น ช่วยให้ DomiCha ไม่ดูเหมือนร้านชานมทั่วไป"
  },
  {
    icon: Coffee,
    title: "เมนูขายง่าย",
    text: "เมนูหลักที่ลูกค้าคุ้นเคย ดื่มง่าย และเหมาะกับตลาดที่ต้องการตัดสินใจเร็ว"
  },
  {
    icon: ClipboardCheck,
    title: "มาตรฐานสาขา",
    text: "มีแนวทางการชง การบริการ และการจัดหน้าร้านให้ภาพแบรนด์ไปในทิศทางเดียวกัน"
  },
  {
    icon: ShieldCheck,
    title: "พร้อมขยายต่อ",
    text: "เหมาะกับผู้ที่อยากเริ่มร้านเครื่องดื่มด้วยภาพแบรนด์ชัด เมนูเข้าใจง่าย และแนวทางเปิดร้านเป็นขั้นตอน"
  }
];

const drinks = ["Milk Tea", "Brown Sugar", "Thai Tea", "Cocoa", "Pink Milk", "Green Tea"];

const orderSteps = [
  {
    icon: Coffee,
    title: "เลือกเมนูโปรด",
    text: "ดูเมนูแนะนำ เครื่องดื่มขายดี และเลือกความหวานหรือท็อปปิงที่ต้องการ"
  },
  {
    icon: MapPin,
    title: "เลือกสาขาใกล้คุณ",
    text: "เตรียมรองรับการเลือกสาขา เวลาไปรับ และช่องทางติดต่อกลับจากทีมร้าน"
  },
  {
    icon: ShoppingBag,
    title: "สั่งง่าย รับไว",
    text: "ออกแบบให้ลูกค้าสั่งซ้ำได้ง่าย ลดขั้นตอน และช่วยให้ร้านปิดการขายเร็วขึ้น"
  }
];

const models = [
  {
    name: "Starter",
    detail: "เหมาะกับผู้เริ่มต้น พื้นที่เล็ก หรือต้องการทดลองทำธุรกิจเครื่องดื่มแบบควบคุมงบ",
    image: "/brand/training.png",
    keywords: ["เริ่มต้นง่าย", "เหมาะกับมือใหม่", "ควบคุมงบได้"]
  },
  {
    name: "Kiosk",
    detail: "เหมาะกับตลาด หน้าโรงเรียน หน้าโรงงาน หรือจุดขายที่ต้องการความเร็วและภาพหน้าร้านชัด",
    image: "/brand/storefront.png",
    keywords: ["เปิดขายเร็ว", "เหมาะกับทำเลคนเดิน", "ภาพร้านชัด"]
  },
  {
    name: "Shop",
    detail: "เหมาะกับทำเลระยะยาว ต้องการหน้าร้านเต็มรูปแบบ และรองรับยอดขายมากขึ้น",
    image: "/brand/customer.png",
    keywords: ["หน้าร้านเต็มรูปแบบ", "รองรับการเติบโต", "ดูเป็นแบรนด์จริงจัง"]
  }
];

const decisionKeywords = [
  "มีอบรมก่อนเปิดร้าน",
  "มีเมนูมาตรฐาน",
  "มีสื่อแบรนด์พร้อมใช้",
  "ไม่มี Royalty Fee รายเดือน",
  "ทีมงานช่วยประเมินงบและพื้นที่",
  "เลือกโมเดลตามทำเล"
];

const supports = [
  "อบรมการชงและการบริการ",
  "แนวทางจัดหน้าร้าน",
  "สื่อแบรนด์สำหรับเปิดร้าน",
  "รายการอุปกรณ์ตามแพ็กเกจ",
  "แนวทางดูทำเลเบื้องต้น",
  "คำแนะนำก่อนลงทุน"
];

const protectedDetails = [
  "สูตรและสัดส่วนวัตถุดิบ",
  "ต้นทุนต่อแก้วแบบละเอียด",
  "SOP ฉบับเต็ม",
  "รายชื่อซัพพลายเออร์",
  "รายการอุปกรณ์แยกรายชิ้น",
  "เงื่อนไขสัญญาฉบับละเอียด"
];

const steps = [
  "ฝากข้อมูล งบประมาณ และทำเลที่สนใจ",
  "ทีมงานช่วยประเมินโมเดลร้านที่เหมาะ",
  "คุยรายละเอียดแพ็กเกจและเงื่อนไข",
  "อบรม เตรียมอุปกรณ์ และเปิดร้าน"
];

const faqs = [
  {
    question: "ไม่มีประสบการณ์ขายเครื่องดื่ม เริ่มได้ไหม?",
    answer: "เริ่มได้ครับ เพราะแบรนด์มีการอบรมพื้นฐานการชง การเตรียมวัตถุดิบ การบริการ และมาตรฐานหน้าร้าน"
  },
  {
    question: "ต้องบอกงบประมาณก่อนหรือไม่?",
    answer: "แนะนำให้แจ้งงบและทำเลคร่าว ๆ เพื่อให้ทีมงานช่วยแนะนำโมเดลร้านที่เหมาะ ไม่ดันให้ลงทุนเกินความจำเป็น"
  },
  {
    question: "มี Royalty Fee รายเดือนไหม?",
    answer: "สื่อสารแบบไม่มี Royalty Fee รายเดือน หากมีเงื่อนไขเฉพาะตามรูปแบบร้าน ทีมงานจะแจ้งในขั้นตอนเสนอแพ็กเกจ"
  }
];

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#f0dfc6] bg-[#fff8ed]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="DomiCha homepage">
          <Image src="/brand/logo.png" alt="DomiCha logo" width={48} height={48} className="h-11 w-11 object-contain" priority />
          <div className="leading-tight">
            <p className="text-lg font-black">Domichathailand</p>
            <p className="text-xs font-semibold text-[#7d4b2a]">Good taste Good fresh Everyday</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-[#4b3427] md:flex">
          <a href="/#brand">จุดแข็ง</a>
          <a href="/#menu">เมนู</a>
          <Link href="/order-app">สั่งผ่านแอป</Link>
          <Link href="/franchise">แฟรนไชส์</Link>
        </nav>
        <Link href="/franchise#contact" className="inline-flex items-center gap-2 rounded-full bg-[#18120f] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#f0692f]">
          <MessageCircle className="h-4 w-4" />
          ติดต่อ
        </Link>
      </div>
    </header>
  );
}

function OrderAppHero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="bg-[#fff8ed] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_.86fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#f4cfaa] bg-white px-4 py-2 text-sm font-extrabold text-[#8b4a22]">
            <ShoppingBag className="h-4 w-4 text-[#f0692f]" />
            Order DomiCha
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] text-[#18120f] sm:text-6xl lg:text-7xl">
            สั่ง DomiCha ผ่านแอป สะดวกขึ้นตั้งแต่เลือกเมนูจนถึงรับเครื่องดื่ม
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#6a4a35]">
            หน้า ordering สำหรับลูกค้าทั่วไป ช่วยให้เห็นเมนูชัด ตัดสินใจเร็ว และติดต่อร้านได้ทันที เหมาะสำหรับต่อยอดเป็นช่องทางขายออนไลน์ของแบรนด์
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={settings.lineUrl} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#06c755] px-6 py-4 font-black text-white transition hover:bg-[#05ad49]">
              สั่งผ่าน LINE ตอนนี้
              <MessageCircle className="h-5 w-5" />
            </a>
            <Link href="#how-to-order" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#18120f] bg-white px-6 py-4 font-black text-[#18120f] transition hover:bg-[#feebc8]">
              ดูขั้นตอนสั่งซื้อ
            </Link>
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-[#7d4b2a]">
            LINE {settings.lineLabel} {settings.brandPhone ? `• โทร ${settings.brandPhone}` : "• ฝากข้อความไว้ ทีมงานจะติดต่อกลับ"}
          </p>
        </div>
        <div className="mx-auto w-full max-w-[520px]">
          <div className="relative overflow-hidden rounded-lg border border-[#f0dfc6] bg-white shadow-xl shadow-orange-950/10" style={{ aspectRatio: "941 / 1672" }}>
            <Image src="/brand/customer.png" alt="ลูกค้าสั่ง DomiCha" fill priority sizes="(max-width: 1024px) 92vw, 520px" className="object-cover object-center" />
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderAppSections({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <section id="how-to-order" className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {orderSteps.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-[#f0dfc6] bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-[#f0692f]" />
                <h2 className="mt-5 text-xl font-black">{item.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#6a4a35]">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="border-y border-[#f0dfc6] bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#f0692f]">Customer Order</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">หน้าสั่งซื้อที่ลูกค้าเห็นแล้วเข้าใจทันที</h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-[#6a4a35]">
              โฟกัสที่เมนูขายดี ภาพเครื่องดื่มชัด และปุ่มติดต่อที่กดง่าย เพื่อให้ลูกค้าตัดสินใจสั่งเร็ว โดยไม่แสดงข้อมูลธุรกิจเชิงลึกบนหน้า public
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["เมนูแนะนำชัด", "สั่งซ้ำง่าย", "รองรับโปรโมชัน", "เชื่อม LINE ได้"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-[#fff8ed] p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#f0692f]" />
                  <p className="text-sm font-black text-[#4b3427]">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#f0dfc6] bg-[#fff8ed] p-5">
            <div className="rounded-lg bg-[#18120f] p-5 text-white">
              <p className="text-sm font-black uppercase tracking-[.22em] text-[#feebc8]">Quick Order</p>
              <h3 className="mt-3 text-3xl font-black">เมนูที่ลูกค้าน่ากดสั่ง</h3>
              <div className="mt-6 grid gap-3">
                {drinks.slice(0, 5).map((drink) => (
                  <div key={drink} className="flex items-center justify-between rounded-lg bg-white/10 p-4">
                    <span className="font-black">{drink}</span>
                    <span className="rounded-full bg-[#feebc8] px-3 py-1 text-xs font-black text-[#18120f]">เลือกเมนู</span>
                  </div>
                ))}
              </div>
              <a href={settings.lineUrl} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f0692f] px-5 py-4 font-black text-white transition hover:bg-[#d9541c]">
                ไปที่ช่องทางสั่งซื้อ
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Hero({ franchise = false }: { franchise?: boolean }) {
  return (
    <section className="bg-[#fff8ed] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_.86fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#f4cfaa] bg-white px-4 py-2 text-sm font-extrabold text-[#8b4a22]">
            <Sparkles className="h-4 w-4 text-[#f0692f]" />
            Good taste Good fresh Everyday
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] text-[#18120f] sm:text-6xl lg:text-7xl">
            {franchise ? "เปิดร้าน DomiCha ด้วยโมเดลที่เหมาะกับงบและทำเลของคุณ" : "DomiCha โดมิชา ชานมไข่มุกแบรนด์น่ารักที่ลูกค้าจำได้"}
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#6a4a35]">
            {franchise
              ? "แฟรนไชส์ที่สื่อสารพอดี เห็นภาพชัด และสงวนสูตร ต้นทุน SOP รวมถึงรายละเอียดลึกไว้หลังการประเมิน"
              : "ชานมไข่มุก เมนูดื่มง่าย ไข่มุกหนึบ และมาสคอทแมว DomiCha ที่ทำให้หน้าร้านดูอบอุ่น เป็นมิตร และถ่ายรูปขึ้น"}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={franchise ? "#contact" : "#menu"} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0692f] px-6 py-4 font-black text-white transition hover:bg-[#d9541c]">
              {franchise ? "ขอข้อมูลแฟรนไชส์" : "ดูเมนู DomiCha"}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href={franchise ? "/" : "/franchise"} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#18120f] bg-white px-6 py-4 font-black text-[#18120f] transition hover:bg-[#feebc8]">
              {franchise ? "กลับหน้าแบรนด์" : "สนใจแฟรนไชส์"}
            </Link>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {proofPoints.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-[#f0dfc6] bg-white p-4">
                <p className="text-3xl font-black text-[#f0692f]">{value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#6a4a35]">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[520px]">
          <div className="relative overflow-hidden rounded-lg border border-[#f0dfc6] bg-white shadow-xl shadow-orange-950/10" style={{ aspectRatio: "941 / 1672" }}>
            <Image src={franchise ? "/brand/growth.png" : "/brand/storefront.png"} alt="DomiCha" fill priority sizes="(max-width: 1024px) 92vw, 520px" className="object-cover object-center" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandSections() {
  return (
    <>
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {customerMoments.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-[#f0dfc6] bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-[#f0692f]" />
                <h2 className="mt-5 text-xl font-black">{item.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#6a4a35]">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section id="brand" className="border-y border-[#f0dfc6] bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#f0692f]">Brand Strength</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">แบรนด์จำง่าย เมนูคุ้นเคย และภาพร้านพร้อมขาย</h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-[#6a4a35]">Domichathailand ทำให้ลูกค้าเข้าใจเร็วว่าขายอะไร ทำไมต้องลอง และทำไมร้านนี้ดูน่าเชื่อถือ ตั้งแต่โลโก้ สี เมนู ไปจนถึงภาพหน้าร้าน</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-[#f0dfc6] bg-[#fffaf3] p-6">
                  <Icon className="h-7 w-7 text-[#f0692f]" />
                  <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#6a4a35]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section id="menu" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#f0692f]">Signature Menu</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">เมนูหลักจำง่าย ลูกค้าเข้าใจเร็ว</h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-[#6a4a35]">ใช้เมนูที่คุ้นเคยเป็นฐาน และใช้คาแรกเตอร์แบรนด์ช่วยให้หน้าร้านดูเป็นมิตร ถ่ายรูปขึ้น และเหมาะกับทำเลคนเดิน</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {drinks.map((drink) => <span key={drink} className="rounded-full border border-[#f0dfc6] bg-white px-4 py-2 text-sm font-black text-[#4b3427]">{drink}</span>)}
            </div>
            <Link href="/franchise" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#18120f] px-5 py-3 font-black text-white transition hover:bg-[#f0692f]">
              สนใจต่อยอดเป็นแฟรนไชส์
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-[520px] lg:max-w-[560px]">
            <div className="relative overflow-hidden rounded-lg border border-[#f0dfc6] bg-white shadow-xl shadow-orange-950/10" style={{ aspectRatio: "941 / 1672" }}>
              <Image src="/brand/menu-lineup.png" alt="เมนู DomiCha" fill sizes="(max-width: 1024px) 92vw, 560px" className="object-cover object-center" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FranchiseModelSection() {
  return (
    <section id="franchise" className="bg-[#18120f] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#feebc8]">Franchise Model</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">โชว์จุดตัดสินใจให้ชัด แต่สงวนรายละเอียดสำคัญของแบรนด์</h2>
          </div>
          <p className="text-base font-semibold leading-8 text-white/72">หน้าเว็บบอกสิ่งที่ผู้สนใจควรรู้: เริ่มง่าย มีทีมงานช่วยดูแล และเลือกแพ็กเกจตามทำเลได้ ส่วนสูตร ต้นทุน รายการอุปกรณ์ และ SOP ฉบับเต็มค่อยคุยหลังประเมินเบื้องต้น</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decisionKeywords.map((keyword) => (
            <div key={keyword} className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#feebc8]" />
              <p className="text-sm font-black leading-6 text-white">{keyword}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {models.map((model) => (
            <article key={model.name} className="overflow-hidden rounded-lg border border-white/12 bg-white/8">
              <div className="relative" style={{ aspectRatio: "4 / 3" }}>
                <Image src={model.image} alt={`DomiCha ${model.name}`} fill sizes="(max-width: 1024px) 92vw, 380px" className="object-cover object-center" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-black text-[#feebc8]">{model.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/76">{model.detail}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {model.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-[#feebc8]/24 bg-[#feebc8]/10 px-3 py-1.5 text-xs font-black text-[#feebc8]">{keyword}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-white/12 bg-white p-6 text-[#18120f]">
            <h3 className="text-2xl font-black">สิ่งที่แบรนด์ช่วยเตรียม</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {supports.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg bg-[#fff8ed] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f0692f]" />
                  <p className="text-sm font-bold leading-6 text-[#4b3427]">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#feebc8]/24 bg-[#2a1a13] p-6">
            <h3 className="text-2xl font-black">รายละเอียดที่สงวนไว้</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/70">รายละเอียดแพ็กเกจ สูตร ต้นทุน และรายการอุปกรณ์ฉบับเต็ม สงวนไว้สำหรับผู้ที่ผ่านการประเมินเบื้องต้นโดยทีมงาน DomiCha เพื่อปกป้องมาตรฐานของแบรนด์และลดการลอกแบบ</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {protectedDetails.map((item) => <span key={item} className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/82">{item}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessAndFaq() {
  return (
    <>
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#f0692f]">Process</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">ขั้นตอนเรียบง่าย ชัดเจน</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-[#f0dfc6] bg-[#fffaf3] p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0692f] text-sm font-black text-white">{index + 1}</span>
                <p className="mt-4 font-black leading-7">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="faq" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-[#f0692f]">FAQ</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">ตอบคำถามก่อนคุยรายละเอียด</h2>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <article key={item.question} className="rounded-lg border border-[#f0dfc6] bg-white p-5">
                <div className="flex gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-[#f0692f]" />
                  <div>
                    <h3 className="text-lg font-black">{item.question}</h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-[#6a4a35]">{item.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="contact" className="bg-[#feebc8] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[.22em] text-[#f0692f]">Let&apos;s Grow Together</p>
          <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">อยากเปิดร้าน DomiCha เริ่มจากการประเมินที่เหมาะกับคุณ</h2>
          <PublicContactActions initialSettings={settings} />
        </div>
        <FranchiseLeadForm />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#18120f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="DomiCha logo" width={46} height={46} className="h-11 w-11 object-contain" />
          <div>
            <p className="font-black">Domichathailand</p>
            <p className="text-sm font-semibold text-white/58">Good taste Good fresh Everyday</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-bold text-white/72">
          <Link href="/">หน้าแรก</Link>
          <Link href="/order-app">สั่งผ่านแอป</Link>
          <Link href="/franchise">แฟรนไชส์</Link>
        </div>
      </div>
    </footer>
  );
}

export function DomichaHome({ settings }: { settings: SiteSettings }) {
  return (
    <main className="min-h-screen bg-[#fff8ed] text-[#18120f]">
      <Header />
      <Hero />
      <BrandSections />
      <FranchiseModelSection />
      <ContactSection settings={settings} />
      <Footer />
    </main>
  );
}

export function DomichaFranchise({ settings }: { settings: SiteSettings }) {
  return (
    <main className="min-h-screen bg-[#fff8ed] text-[#18120f]">
      <Header />
      <Hero franchise />
      <FranchiseModelSection />
      <ProcessAndFaq />
      <ContactSection settings={settings} />
      <Footer />
    </main>
  );
}

export function DomichaOrderApp({ settings }: { settings: SiteSettings }) {
  return (
    <main className="min-h-screen bg-[#fff8ed] text-[#18120f]">
      <Header />
      <OrderAppHero settings={settings} />
      <OrderAppSections settings={settings} />
      <ContactSection settings={settings} />
      <Footer />
    </main>
  );
}
