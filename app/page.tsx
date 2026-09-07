import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Facebook,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  TimerReset,
  TrendingUp
} from "lucide-react";
import { PublicFranchiseForm } from "@/components/PublicFranchiseForm";

const decisionPoints = [
  {
    icon: Store,
    title: "ภาพจำหน้าร้านชัด",
    detail: "โลโก้ มาสคอต สีแบรนด์ และเมนูถูกออกแบบให้ลูกค้าจำง่ายตั้งแต่ครั้งแรก"
  },
  {
    icon: ShieldCheck,
    title: "เริ่มแบบมีมาตรฐาน",
    detail: "มีแนวทางวัตถุดิบ เมนูหลัก และการจัดการหน้าร้านให้เดินตาม ไม่ต้องเริ่มจากศูนย์"
  },
  {
    icon: TrendingUp,
    title: "คิดจากการขายจริง",
    detail: "ทีมงานช่วยประเมินงบ ทำเล และรูปแบบร้านก่อนแนะนำแพ็กเกจที่เหมาะสม"
  }
];

const franchiseTracks = [
  {
    title: "เริ่มต้น",
    headline: "เริ่มเล็กให้คล่อง",
    detail: "เหมาะกับพื้นที่จำกัดหรือผู้ที่อยากเริ่มแบบควบคุมงบ ทดลองตลาด และเรียนรู้ระบบก่อนขยาย"
  },
  {
    title: "มาตรฐาน",
    headline: "หน้าร้านพร้อมขาย",
    detail: "เหมาะกับทำเลชุมชน โรงเรียน ออฟฟิศ หรือจุดขายที่ต้องการภาพลักษณ์แบรนด์ชัดเจน"
  },
  {
    title: "เติบโต",
    headline: "ต่อยอดเป็นสาขา",
    detail: "เหมาะกับผู้ที่ต้องการวางระบบขายซ้ำ จัดการวัตถุดิบ และขยายช่องทางในอนาคต"
  }
];

const journey = [
  { icon: MessageCircle, title: "ฝากข้อมูล", detail: "แจ้งจังหวัด ทำเล งบประมาณ และเป้าหมายเบื้องต้น" },
  { icon: ClipboardCheck, title: "ประเมินแนวทาง", detail: "ทีมงานช่วยดูความเหมาะสมก่อนเปิดรายละเอียดลึก" },
  { icon: PackageCheck, title: "เตรียมชุดเริ่มต้น", detail: "จัดวัตถุดิบ อุปกรณ์ เมนู และมาตรฐานที่จำเป็นต่อการเปิดร้าน" },
  { icon: TimerReset, title: "ดูแลหลังเปิด", detail: "ติดตามการใช้งานสินค้า การขาย และการสั่งซื้อวัตถุดิบต่อเนื่อง" }
];

const menuHighlights = [
  { name: "กลุ่มชานม", detail: "เมนูหลักที่ลูกค้าเข้าใจง่าย เหมาะกับการขายซ้ำและสร้างฐานลูกค้าประจำ" },
  { name: "กลุ่มชาไทยและโกโก้", detail: "เมนูรสเข้มที่ช่วยเพิ่มทางเลือกให้หน้าร้านและเข้ากับตลาดไทย" },
  { name: "กลุ่มเครื่องดื่มสดชื่น", detail: "เมนูสำหรับเพิ่มยอดขายช่วงอากาศร้อนและรองรับลูกค้าหลากหลายวัย" }
];

const trustItems = [
  "เปิดข้อมูลที่ช่วยตัดสินใจ เช่น ภาพรวมแบรนด์ แนวเมนู รูปแบบเริ่มต้น และการดูแลหลังเปิดร้าน",
  "สงวนสูตร ต้นทุน รายการอุปกรณ์ และ SOP ฉบับเต็มไว้คุยหลังประเมินเบื้องต้น",
  "เลือกแพ็กเกจจากงบ ทำเล และเป้าหมายของผู้ลงทุน ไม่ใช้คำตอบเดียวกับทุกคน"
];

const socialLinks = [
  { label: "Facebook", value: "domichathailand", href: "https://www.facebook.com/domichathailand", icon: Facebook },
  { label: "TikTok", value: "domicha.tea", href: "https://www.tiktok.com/@domicha.tea", icon: Sparkles }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fff4dd] text-stone-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-orange-100/70 bg-[#fff4dd]/92 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="DomichaThailand">
            <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={58} height={58} className="h-[58px] w-[58px] object-contain" priority />
            <span className="leading-tight">
              <strong className="block text-lg">DomichaThailand</strong>
              <span className="hidden text-xs font-bold text-orange-600 sm:block">Good taste Good fresh Everyday</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-black text-stone-700 lg:flex" aria-label="เมนูเว็บไซต์">
            <a href="#why">จุดแข็ง</a>
            <a href="#model">รูปแบบแฟรนไชส์</a>
            <a href="#process">ขั้นตอน</a>
            <a href="#menu">เมนู</a>
            <a href="#contact">ติดต่อ</a>
          </nav>
          <a href="#contact" className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-black text-white shadow-xl shadow-stone-950/15 lg:ml-4">
            นัดคุยแฟรนไชส์ <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate min-h-[760px] overflow-hidden pt-[76px]">
        <Image
          src="/domicha-franchise-counter.png"
          alt="บรรยากาศแฟรนไชส์ DomiCha"
          fill
          sizes="100vw"
          className="object-cover object-[56%_43%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/88 via-stone-950/62 to-stone-950/8" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#fff4dd] to-transparent" />
        <div className="relative z-10 mx-auto grid min-h-[684px] max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-4 py-2 text-xs font-black text-orange-100 shadow-2xl backdrop-blur">
              <Sparkles className="h-4 w-4 text-orange-300" /> แฟรนไชส์ชานมไข่มุกสำหรับคนที่อยากเริ่มแบบมีระบบ
            </span>
            <h1 className="mt-7 text-5xl font-black leading-[1.04] sm:text-6xl lg:text-7xl">
              เปิดร้าน DomiCha
              <span className="block text-orange-300">เริ่มชัด ดูแลง่าย โตเป็นระบบ</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-orange-50/92 sm:text-lg">
              แบรนด์ชานมไข่มุกที่มีภาพจำจากมาสคอต เมนูที่เข้าใจง่าย และแนวทางดูแลหลังเริ่มต้น เหมาะสำหรับผู้ที่อยากเปิดร้านเครื่องดื่มโดยไม่ต้องลองผิดลองถูกทั้งหมดเอง
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex h-14 items-center gap-2 rounded-full bg-[#f5662d] px-7 text-base font-black text-white shadow-2xl shadow-orange-950/25">
                ขอประเมินแพ็กเกจ <ArrowRight className="h-5 w-5" />
              </a>
              <a href="tel:0988247849" className="inline-flex h-14 items-center gap-2 rounded-full border border-white/20 bg-white/12 px-6 text-base font-black text-white backdrop-blur">
                <Phone className="h-5 w-5" /> โทรหาแบรนด์
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="ml-auto max-w-sm rounded-[32px] border border-white/18 bg-white/12 p-5 text-white shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-black text-orange-200">สำหรับผู้สนใจจริงจัง</p>
              <h2 className="mt-3 text-3xl font-black leading-tight">คุยจากงบ ทำเล และเป้าหมายจริง</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-orange-50/85">
                ทีมงานช่วยประเมินแนวทางก่อนเปิดรายละเอียดแพ็กเกจ เพื่อให้เริ่มต้นเหมาะกับสถานการณ์ของแต่ละพื้นที่
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-16 px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-3 rounded-[28px] border border-white/80 bg-white/92 p-4 shadow-2xl shadow-orange-950/10 backdrop-blur md:grid-cols-3">
          {[
            ["Brand", "ภาพจำชัด สีแบรนด์จำง่าย"],
            ["Menu", "เมนูหลักเข้าใจเร็ว ขายซ้ำได้"],
            ["Support", "มีทีมช่วยประเมินก่อนเริ่ม"]
          ].map(([value, label]) => (
            <div key={value} className="rounded-2xl bg-orange-50/80 px-5 py-4">
              <p className="text-2xl font-black text-orange-600">{value}</p>
              <p className="mt-1 text-sm font-bold leading-6 text-stone-700">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black tracking-[.18em] text-orange-600">จุดแข็งของแบรนด์</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">ทำไม DomiCha ถึงเหมาะกับคนที่อยากเริ่มธุรกิจเครื่องดื่ม</h2>
          </div>
          <p className="text-base font-semibold leading-8 text-stone-600">
            สื่อสารให้เห็นว่า DomiCha ไม่ใช่แค่ขายชื่อแบรนด์ แต่เป็นแนวทางเริ่มต้นร้านที่มีภาพจำ เมนู และระบบดูแลต่อเนื่องสำหรับผู้ลงทุน
          </p>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {decisionPoints.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[28px] border border-orange-100 bg-white/82 p-6 shadow-xl shadow-orange-950/5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-2xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-stone-600">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="model" className="bg-stone-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black tracking-[.18em] text-orange-300">รูปแบบแฟรนไชส์</p>
              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">เปิดภาพรวมให้ตัดสินใจง่าย โดยยังรักษาข้อมูลสำคัญของแบรนด์</h2>
            </div>
            <div className="space-y-4">
              {trustItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4">
                  <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-orange-300" />
                  <p className="text-sm font-semibold leading-7 text-stone-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {franchiseTracks.map((track) => (
              <article key={track.title} className="rounded-[28px] border border-white/10 bg-white/[.06] p-6">
                <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-stone-950">{track.title}</span>
                <h3 className="mt-5 text-2xl font-black">{track.headline}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-stone-300">{track.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-black tracking-[.18em] text-orange-600">ขั้นตอนเริ่มต้น</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">ขั้นตอนที่ทำให้ลูกค้ารู้ว่าเริ่มอย่างไร</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-stone-600">
              ลดความลังเลด้วยขั้นตอนที่ชัดเจน ตั้งแต่ฝากข้อมูลจนถึงการดูแลหลังเปิดร้าน
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {journey.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-950/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-black text-orange-600">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-stone-600">{step.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="menu" className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-black tracking-[.18em] text-orange-600">คอนเซปต์เมนู</p>
              <h2 className="mt-3 text-4xl font-black leading-tight">เห็นทิศทางเมนู โดยไม่เปิดสินค้าหลักหรือสูตรภายใน</h2>
            </div>
            <p className="text-base font-semibold leading-8 text-stone-600">
              หน้าเว็บควรให้ลูกค้าเห็นว่าแบรนด์มีเมนูพร้อมขายและต่อยอดได้หลายกลุ่ม แต่ไม่ควรโชว์วัตถุดิบหลัก สูตร รายการสินค้า หรือต้นทุนที่เป็นข้อมูลภายในของแบรนด์
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {menuHighlights.map((menu, index) => (
              <article key={menu.name} className="rounded-[28px] border border-orange-100 bg-[#fffaf0] p-6 shadow-xl shadow-orange-950/5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white">0{index + 1}</span>
                <h3 className="mt-6 text-2xl font-black">{menu.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-stone-600">{menu.detail}</p>
                <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-white/70 p-4 text-xs font-black tracking-[.08em] text-orange-600">
                  เปิดรายละเอียดหลังประเมินเบื้องต้น
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#ffe4b3] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.88fr_1.12fr] lg:items-start">
          <div>
            <p className="text-xs font-black tracking-[.18em] text-orange-600">ติดต่อทีมแฟรนไชส์</p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">ฝากข้อมูล แล้วให้ทีม DomiCha ช่วยประเมินแนวทาง</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-stone-700">
              เหมาะสำหรับผู้ที่มีทำเลแล้ว กำลังหาทำเล หรืออยากประเมินงบก่อนลงทุน ทีมงานจะติดต่อกลับเพื่อแนะนำแพ็กเกจที่เหมาะสมโดยไม่เปิดข้อมูลสำคัญบนหน้าเว็บ
            </p>
            <div className="mt-7 space-y-3 text-sm font-black text-stone-700">
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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 pb-16 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between md:pb-0">
          <span>© DomiCha Thailand</span>
          <span>Good taste Good fresh Everyday</span>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-100 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <a href="tel:0988247849" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 text-sm font-black text-stone-900">
            <Phone className="h-4 w-4" /> โทร
          </a>
          <a href="#contact" className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-[#f5662d] text-sm font-black text-white">
            ขอประเมิน <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
