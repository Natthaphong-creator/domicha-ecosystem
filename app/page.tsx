import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Facebook,
  LineChart,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  TimerReset,
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

const proofPoints = [
  { value: "Brand", label: "ภาพจำชัดด้วยมาสคอตและโทนสี" },
  { value: "System", label: "มีแนวทางเปิดร้านและดูแลหลังเริ่มต้น" },
  { value: "Menu", label: "เมนูหลักเข้าใจง่าย เหมาะกับตลาดเครื่องดื่ม" }
];

const franchiseTracks = [
  {
    title: "เริ่มจากทำเลเล็ก",
    detail: "เหมาะกับผู้ที่มีพื้นที่จำกัด ต้องการเริ่มแบบควบคุมงบ และอยากทดสอบตลาดก่อนขยาย",
    tag: "Starter"
  },
  {
    title: "หน้าร้านมาตรฐาน",
    detail: "เหมาะกับทำเลชุมชน โรงเรียน ออฟฟิศ หรือพื้นที่ที่ต้องการภาพลักษณ์แบรนด์ชัดเจน",
    tag: "Standard"
  },
  {
    title: "เติบโตเป็นสาขา",
    detail: "เหมาะกับผู้ที่ต้องการวางระบบขายซ้ำ จัดการวัตถุดิบ และต่อยอดหลายช่องทางในอนาคต",
    tag: "Growth"
  }
];

const startSteps = [
  { icon: MessageCircle, title: "ฝากข้อมูล", detail: "แจ้งจังหวัด ทำเล งบประมาณ และเป้าหมายเบื้องต้น" },
  { icon: ClipboardCheck, title: "ประเมินแพ็กเกจ", detail: "ทีมงานช่วยดูความเหมาะสมก่อนลงรายละเอียดสำคัญ" },
  { icon: PackageCheck, title: "เตรียมเปิดร้าน", detail: "จัดชุดเริ่มต้น วัตถุดิบ อุปกรณ์ และแนวทางปฏิบัติตามมาตรฐาน" },
  { icon: TimerReset, title: "ดูแลหลังเปิด", detail: "ติดตามการใช้งานสินค้า เมนูขาย และการสั่งซื้อวัตถุดิบต่อเนื่อง" }
];

const reviewPlaceholders = [
  {
    quote: "แบรนด์มีภาพจำชัด เมนูเข้าใจง่าย และเหมาะกับคนที่อยากเริ่มต้นแบบมีแนวทาง",
    name: "เสียงตอบรับจากผู้สนใจแฟรนไชส์",
    area: "รออัปเดตรีวิวจริง"
  },
  {
    quote: "สิ่งที่ช่วยตัดสินใจคือการได้คุยเรื่องงบ ทำเล และรูปแบบร้านก่อนเห็นรายละเอียดลึก",
    name: "คำถามยอดนิยมจากลูกค้า",
    area: "ใช้ปรับคำแนะนำแพ็กเกจ"
  },
  {
    quote: "หน้าเว็บควรเห็นว่ามีทีมดูแล ไม่ใช่แค่ขายชุดแฟรนไชส์แล้วจบ",
    name: "แนวทางแบรนด์",
    area: "DomiCha Thailand"
  }
];

const faqs = [
  {
    question: "หน้าเว็บควรบอกราคาแฟรนไชส์ทั้งหมดไหม?",
    answer: "ควรบอกเป็นช่วงหรือแนวทางให้ลูกค้าเข้าใจระดับงบ แต่ไม่จำเป็นต้องเปิดรายละเอียดสูตร ต้นทุน รายการอุปกรณ์ และ SOP ทั้งหมดบนหน้าเว็บ"
  },
  {
    question: "ถ้ายังไม่มีทำเล สมัครได้ไหม?",
    answer: "สมัครเพื่อขอคำแนะนำเบื้องต้นได้ ทีมงานจะช่วยประเมินรูปแบบร้านที่เหมาะกับงบและพื้นที่ที่กำลังมองหา"
  },
  {
    question: "หลังเปิดร้านมีการดูแลต่อหรือไม่?",
    answer: "ควรสื่อสารให้ชัดว่ามีแนวทางเมนู วัตถุดิบ มาตรฐานหน้าร้าน และช่องทางสั่งซื้อสำหรับแฟรนไชส์ซีที่ได้รับอนุมัติแล้ว"
  }
];

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
            <a href="#process">ขั้นตอน</a>
            <a href="#menu">เมนูขายดี</a>
            <a href="#reviews">รีวิว</a>
            <a href="#contact">ติดต่อ</a>
          </nav>
          <a href="#contact" className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-black text-white shadow-xl shadow-stone-950/15 md:ml-4">
            สมัครแฟรนไชส์ <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate min-h-[720px] overflow-hidden pt-[76px]">
        <Image
          src="/products/taiwan-tea.png"
          alt="วัตถุดิบชานม DomiCha"
          fill
          sizes="100vw"
          className="object-contain object-[78%_50%] opacity-95"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/78 to-orange-950/20" />
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_70%_45%,rgba(245,102,45,0.32),transparent_42rem)]" />
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
              แฟรนไชส์ชานมไข่มุกที่ออกแบบให้เริ่มต้นง่ายขึ้น มีภาพจำแบรนด์ชัด เมนูเข้าใจง่าย และมีทีมช่วยประเมินแนวทางตามงบ ทำเล และเป้าหมายของแต่ละคน
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

      <section className="relative z-10 -mt-16 px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-2xl shadow-orange-950/10 backdrop-blur md:grid-cols-3">
          {proofPoints.map((point) => (
            <div key={point.value} className="rounded-2xl bg-orange-50/70 px-5 py-4">
              <p className="text-2xl font-black text-orange-600">{point.value}</p>
              <p className="mt-1 text-sm font-bold leading-6 text-stone-700">{point.label}</p>
            </div>
          ))}
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
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3">
          {franchiseTracks.map((track) => (
            <article key={track.title} className="rounded-[28px] border border-white/10 bg-white/[.06] p-6">
              <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-stone-950">{track.tag}</span>
              <h3 className="mt-5 text-2xl font-black">{track.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-stone-300">{track.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-orange-600">Start With DomiCha</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">จากสนใจแฟรนไชส์ สู่การเปิดร้านแบบมีระบบ</h2>
            <p className="mt-5 text-base font-medium leading-8 text-stone-600">
              เราออกแบบหน้าเว็บให้ลูกค้ารู้ว่าต้องเริ่มจากอะไร โดยยังสงวนรายละเอียดสำคัญไว้คุยหลังผ่านการประเมินเบื้องต้น
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {startSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-950/5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-black text-orange-600">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-7 text-stone-600">{step.detail}</p>
                </article>
              );
            })}
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
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { src: "/products/taiwan-tea.png", name: "ชาไต้หวัน", desc: "ฐานเมนูชานม กลิ่นหอม ขายง่าย" },
            { src: "/products/red-tea.png", name: "ชาแดง", desc: "ต่อยอดเมนูชาไทยและเครื่องดื่มเย็น" },
            { src: "/products/green-tea.png", name: "ชาเขียว", desc: "เมนูยอดนิยมที่ช่วยเพิ่มตัวเลือกหน้าร้าน" }
          ].map((product) => (
            <article key={product.name} className="overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-xl shadow-orange-950/5">
              <div className="relative h-52 bg-[#fff7e8]">
                <Image src={product.src} alt={product.name} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-contain p-8" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-black">{product.name}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-stone-600">{product.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="reviews" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.24em] text-orange-600">Trust Builder</p>
          <h2 className="mt-3 text-4xl font-black leading-tight">เพิ่มความมั่นใจด้วยรีวิวและหลักฐานที่ตรวจสอบได้</h2>
          <p className="mt-4 text-base font-medium leading-8 text-stone-600">
            ตอนนี้ใช้ข้อความเชิงแนวทางที่ไม่กล่าวอ้างเกินจริงก่อน เมื่อมีรีวิวจากลูกค้าจริงหรือสาขาจริง สามารถนำมาแทนที่เพื่อเพิ่มพลังการตัดสินใจได้ทันที
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {reviewPlaceholders.map((review) => (
            <article key={review.name} className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-950/5">
              <p className="text-lg font-black leading-8 text-stone-950">“{review.quote}”</p>
              <div className="mt-6 border-t border-orange-100 pt-4">
                <p className="font-black text-orange-600">{review.name}</p>
                <p className="mt-1 text-sm font-medium text-stone-500">{review.area}</p>
              </div>
            </article>
          ))}
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

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-orange-600">FAQ</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">คำถามที่ช่วยให้ลูกค้าตัดสินใจง่ายขึ้น</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-[24px] border border-orange-100 bg-[#fffaf0] p-5">
                <h3 className="text-lg font-black">{faq.question}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-stone-600">{faq.answer}</p>
              </article>
            ))}
          </div>
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

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-100 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <a href="tel:0988247849" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 text-sm font-black text-stone-900">
            <Phone className="h-4 w-4" /> โทร
          </a>
          <a href="#contact" className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-[#f5662d] text-sm font-black text-white">
            ขอข้อมูล <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
