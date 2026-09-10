import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Facebook,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound
} from "lucide-react";
import { PublicFranchiseForm } from "@/components/PublicFranchiseForm";

const brandPillars = [
  {
    icon: Store,
    title: "แบรนด์จำง่าย",
    detail: "มาสคอต สีแบรนด์ และภาพหน้าร้านถูกออกแบบให้ลูกค้าจำได้เร็ว เหมาะกับตลาดเครื่องดื่มที่ต้องแข่งด้วยภาพจำ"
  },
  {
    icon: BookOpenCheck,
    title: "เริ่มแบบมีคู่มือ",
    detail: "ให้แนวทางเมนู มาตรฐานหน้าร้าน และการเตรียมงานที่จำเป็น เพื่อช่วยลดการลองผิดลองถูกช่วงเริ่มต้น"
  },
  {
    icon: UsersRound,
    title: "ดูจากทำเลจริง",
    detail: "ทีมงานช่วยประเมินงบ ทำเล และเป้าหมายก่อนแนะนำรูปแบบที่เหมาะสม ไม่ขายแพ็กเกจแบบคำตอบเดียวกับทุกพื้นที่"
  }
];

const franchiseModels = [
  {
    name: "Compact Start",
    title: "เริ่มเล็ก คุมงบง่าย",
    detail: "เหมาะกับพื้นที่จำกัด จุดขายเสริม หรือผู้เริ่มต้นที่ต้องการเรียนรู้ระบบก่อนขยาย"
  },
  {
    name: "Standard Store",
    title: "หน้าร้านชัด พร้อมขาย",
    detail: "เหมาะกับทำเลชุมชน หน้าโรงเรียน ออฟฟิศ หรือพื้นที่ที่ต้องการภาพลักษณ์แบรนด์เต็มขึ้น"
  },
  {
    name: "Growth Plan",
    title: "วางระบบเพื่อเติบโต",
    detail: "เหมาะกับผู้ที่ต้องการต่อยอดเป็นหลายสาขา มีระบบสั่งซื้อวัตถุดิบและการจัดการที่ตรวจสอบได้"
  }
];

const processSteps = [
  {
    title: "ฝากข้อมูลและเป้าหมาย",
    detail: "ลูกค้าฝากชื่อ เบอร์ จังหวัด ทำเล และงบประมาณเบื้องต้น"
  },
  {
    title: "ประเมินงบกับทำเล",
    detail: "ทีมงานดูความเหมาะสม เพื่อแนะนำทิศทางที่ตรงกับพื้นที่จริง"
  },
  {
    title: "แนะนำรูปแบบแฟรนไชส์",
    detail: "คุยรายละเอียดแพ็กเกจ อุปกรณ์ และการเตรียมเปิดร้านแบบเป็นส่วนตัว"
  },
  {
    title: "เตรียมเปิดและดูแลต่อ",
    detail: "เตรียมวัตถุดิบ มาตรฐานร้าน และแนวทางดูแลหลังเปิด"
  }
];

const protectedDetails = [
  "หน้าเว็บบอกแนวทางแบรนด์ เมนู และการดูแลหลังเปิดร้านในระดับที่ช่วยตัดสินใจ",
  "สูตร ต้นทุน รายการอุปกรณ์ และ SOP ฉบับเต็มสงวนไว้หลังทีมงานประเมินเบื้องต้น",
  "ผู้สนใจจะได้รับรายละเอียดที่เหมาะกับงบและทำเลของตัวเอง ไม่ใช่ข้อมูลชุดเดียวสำหรับทุกคน"
];

const supportItems = [
  ["แนวทางแบรนด์", "โลโก้ มาสคอต สีหลัก และรูปแบบสื่อสารหน้าร้าน"],
  ["แนวทางเมนู", "กลุ่มเมนูหลักที่เข้าใจง่าย พร้อมเปิดรายละเอียดหลังประเมิน"],
  ["แนวทางการเริ่มต้น", "ประเมินทำเล งบประมาณ และรูปแบบร้านที่เหมาะสม"],
  ["แนวทางดูแลต่อ", "วัตถุดิบ ระบบสั่งซื้อ และการติดตามหลังเปิดร้าน"]
];

const socialLinks = [
  { label: "Facebook", value: "domichathailand", href: "https://www.facebook.com/domichathailand", icon: Facebook },
  { label: "TikTok", value: "domicha.tea", href: "https://www.tiktok.com/@domicha.tea", icon: Sparkles }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fff7e8] text-[#17100c]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-[#fff7e8]/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="DomiCha Thailand">
            <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={56} height={56} className="h-14 w-14 object-contain" priority />
            <span className="leading-tight">
              <strong className="block text-lg font-extrabold">DomiCha Thailand</strong>
              <span className="hidden text-xs font-bold text-[#f5662d] sm:block">Good taste Good fresh Everyday</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm font-black text-stone-700 lg:flex" aria-label="เมนูเว็บไซต์">
            <a href="#why">จุดแข็ง</a>
            <a href="#model">โมเดล</a>
            <a href="#support">สิ่งที่ได้</a>
            <a href="#process">ขั้นตอน</a>
            <a href="#contact">ติดต่อ</a>
          </nav>
          <a href="#contact" className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-[#17100c] px-5 text-sm font-black text-white shadow-xl shadow-stone-950/15 lg:ml-4">
            ขอข้อมูล <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate min-h-[780px] overflow-hidden bg-[#17100c] pt-[74px]">
        <Image
          src="/products/taiwan-tea.png"
          alt="วัตถุดิบชานม DomiCha"
          fill
          sizes="100vw"
          className="object-contain object-[78%_50%] opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17100c] via-[#17100c]/82 to-[#17100c]/36" />
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_70%_45%,rgba(245,102,45,0.34),transparent_42rem)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#fff7e8] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[706px] max-w-7xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-4 py-2 text-xs font-extrabold text-orange-100 shadow-2xl backdrop-blur">
              <Sparkles className="h-4 w-4 text-orange-300" />
              แฟรนไชส์ชานมไข่มุกที่เริ่มต้นแบบมีระบบ
            </span>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.12] sm:text-5xl lg:text-6xl">
              DomiCha Franchise
              <span className="block text-orange-300">เปิดร้านให้ชัด ตั้งแต่วันแรก</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-orange-50/92 sm:text-lg">
              สำหรับผู้ที่อยากเริ่มธุรกิจเครื่องดื่มด้วยแบรนด์ที่มีภาพจำ เมนูเข้าใจง่าย และทีมงานช่วยประเมินงบกับทำเลก่อนเริ่มจริง
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex h-14 items-center gap-2 rounded-full bg-[#f5662d] px-7 text-base font-black text-white shadow-2xl shadow-orange-950/25">
                ขอประเมินแพ็กเกจ <ArrowRight className="h-5 w-5" />
              </a>
              <a href="https://line.me/R/ti/p/@domicha" className="inline-flex h-14 items-center gap-2 rounded-full border border-white/20 bg-white/12 px-6 text-base font-black text-white backdrop-blur">
                <MessageCircle className="h-5 w-5" /> คุย LINE
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-20 px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-3 rounded-[28px] border border-white/80 bg-white/94 p-4 shadow-2xl shadow-orange-950/10 backdrop-blur md:grid-cols-3">
          {[
            ["Brand", "ภาพจำแบรนด์ชัด"],
            ["Start", "ช่วยประเมินก่อนเริ่ม"],
            ["System", "ต่อยอดสู่ระบบสาขา"]
          ].map(([value, label]) => (
            <div key={value} className="rounded-2xl bg-[#fff1dc] px-5 py-4">
              <p className="text-2xl font-extrabold text-[#f5662d]">{value}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-700">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">WHY DOMICHA</p>
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">หน้าเว็บต้องทำให้ลูกค้าเชื่อก่อน แล้วค่อยให้ทีมขายปิดรายละเอียด</h2>
          </div>
          <p className="text-base font-medium leading-8 text-stone-600">
            โครงใหม่นี้เน้นให้ผู้สนใจเข้าใจแบรนด์ เห็นภาพการเริ่มต้น และฝากข้อมูลเพื่อให้ทีมงานคัดกรองงบกับทำเล โดยไม่เปิดเผยข้อมูลที่เป็นความลับของธุรกิจ
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {brandPillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-950/5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-[#f5662d]">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold">{item.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-stone-600">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="model" className="bg-[#17100c] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[.18em] text-orange-300">FRANCHISE MODEL</p>
              <h2 className="mt-4 text-3xl font-black leading-[1.18] sm:text-4xl">บอกโมเดลให้เห็นทางเลือก แต่ไม่โชว์ข้อมูลลับของแพ็กเกจ</h2>
            </div>
            <div className="space-y-4">
              {protectedDetails.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-orange-300" />
                  <p className="text-sm font-medium leading-7 text-stone-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {franchiseModels.map((model) => (
              <article key={model.name} className="rounded-[28px] border border-white/10 bg-white/[.06] p-6">
                <span className="rounded-full bg-orange-300 px-3 py-1 text-xs font-extrabold text-[#17100c]">{model.name}</span>
                <h3 className="mt-5 text-xl font-extrabold">{model.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-stone-300">{model.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="support" className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[34px] bg-[#17100c] shadow-2xl shadow-orange-950/10">
            <Image
              src="/products/taiwan-tea.png"
              alt="วัตถุดิบชานม DomiCha"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-contain p-10 opacity-95"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_35%,rgba(245,102,45,0.28),transparent_20rem)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17100c]/88 via-[#17100c]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-sm font-extrabold text-orange-200">ภาพที่ควรสื่อสาร</p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl">แบรนด์พร้อมขาย ลูกค้าเข้าใจง่าย</h3>
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">SUPPORT</p>
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">สิ่งที่ผู้สนใจควรรู้ก่อนฝากข้อมูล</h2>
            <div className="mt-7 grid gap-4">
              {supportItems.map(([title, detail]) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-orange-100 bg-[#fffaf2] p-4">
                  <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-[#f5662d]" />
                  <div>
                    <h3 className="font-extrabold">{title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-stone-600">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">PROCESS</p>
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">ลูกค้าควรรู้ทันทีว่าต้องเริ่มจากอะไร</h2>
            <p className="mt-5 text-base font-medium leading-8 text-stone-600">
              ขั้นตอนสั้น ชัด และพาไปสู่การฝากข้อมูล ไม่ทำให้หน้าเว็บดูเหมือนเปิดข้อมูลแพ็กเกจทั้งหมดต่อสาธารณะ
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <article key={step.title} className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-950/5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5662d] text-lg font-extrabold text-white">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-stone-600">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#ffe3b5] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.88fr_1.12fr] lg:items-start">
          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">CONTACT</p>
            <h2 className="mt-4 text-3xl font-black leading-[1.18] sm:text-4xl">ฝากข้อมูลแฟรนไชส์ แล้วให้ทีม DomiCha ประเมินให้เหมาะกับพื้นที่ของคุณ</h2>
            <p className="mt-5 text-base font-medium leading-8 text-stone-700">
              เหมาะสำหรับคนที่มีทำเลแล้ว กำลังหาทำเล หรืออยากประเมินงบก่อนลงทุน ทีมงานจะติดต่อกลับเพื่อแนะนำแนวทางที่เหมาะสม
            </p>
            <div className="mt-7 space-y-3 text-sm font-black text-stone-700">
              <a href="tel:0988247849" className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#f5662d]" /> 098-824-7849
              </a>
              <a href="https://line.me/R/ti/p/@domicha" className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-[#06c755]" /> LINE Official: @domicha
              </a>
              <span className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#f5662d]" /> DomiCha Thailand
              </span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-stone-800">
                    <Icon className="h-4 w-4 text-[#f5662d]" /> {item.label}: {item.value}
                  </a>
                );
              })}
            </div>
          </div>
          <PublicFranchiseForm />
        </div>
      </section>

      <footer className="bg-[#17100c] px-4 py-8 text-white sm:px-6">
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
            ขอข้อมูล <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
