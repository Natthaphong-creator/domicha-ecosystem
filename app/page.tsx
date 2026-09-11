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
    title: "เริ่มต้นเป็นขั้นตอน",
    detail: "มีแนวทางเมนู มาตรฐานหน้าร้าน และการเตรียมงานที่ช่วยให้ผู้เริ่มต้นวางแผนได้ง่ายขึ้น"
  },
  {
    icon: UsersRound,
    title: "ดูจากทำเลจริง",
    detail: "ทีมงานช่วยประเมินงบ ทำเล และเป้าหมาย เพื่อแนะนำรูปแบบที่เหมาะกับแต่ละพื้นที่มากที่สุด"
  }
];

const franchiseModels = [
  {
    name: "Package M",
    title: "ตั้งหลักไว้",
    price: "39,000 บาท",
    detail: "เหมาะกับผู้เริ่มต้นที่ต้องการคุมงบ ทดลองทำเล หรือเปิดจุดขายขนาดกะทัดรัด"
  },
  {
    name: "Package L",
    title: "โตแบบโปร",
    price: "69,000 บาท",
    detail: "เหมาะกับทำเลที่ต้องการภาพหน้าร้านชัดขึ้น มีอุปกรณ์และการเตรียมเปิดร้านที่ครบกว่า"
  },
  {
    name: "Package XL",
    title: "เจ้าของกิจการเต็มตัว",
    price: "89,000 บาท",
    detail: "เหมาะกับผู้ที่ต้องการวางภาพร้านจริงจังขึ้น และเตรียมต่อยอดเป็นระบบสาขาในอนาคต"
  }
];

const processSteps = [
  {
    title: "ฝากข้อมูลและเป้าหมาย",
    detail: "ผู้สนใจฝากชื่อ เบอร์ จังหวัด ทำเล และงบประมาณเบื้องต้น"
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
  "ราคาเครื่องดื่มเริ่มต้น 20 บาท/แก้ว พร้อมจุดขายฟรีไข่มุก สื่อสารความคุ้มค่าได้ชัดเจน",
  "แพ็กเกจแฟรนไชส์เริ่มต้น 39,000-89,000 บาท โดยทีมงานช่วยประเมินให้เหมาะกับงบและทำเล",
  "รายละเอียดแพ็กเกจและการเตรียมเปิดร้านจะอธิบายให้ครบถ้วนหลังประเมินรูปแบบร้านเบื้องต้น",
  "ไม่มีค่า Royalty Fee รายเดือน และมีระบบสนับสนุนแฟรนไชส์หลังเปิดร้าน"
];

const supportItems = [
  ["แนวทางแบรนด์", "โลโก้ มาสคอต สีหลัก และรูปแบบสื่อสารหน้าร้าน"],
  ["แนวทางเมนู", "เครื่องดื่มราคาเริ่มต้น 20 บาท พร้อมไข่มุกฟรี และเมนูครอบคลุมหลายกลุ่มลูกค้า"],
  ["แนวทางการเริ่มต้น", "ประเมินทำเล งบประมาณ และรูปแบบร้านที่เหมาะสม"],
  ["แนวทางดูแลต่อ", "ระบบสั่งซื้อวัตถุดิบออนไลน์ การตลาด อบรม และ Line Group สนับสนุนแฟรนไชส์ซี"]
];

const idealProfiles = [
  ["มีทำเลอยู่แล้ว", "เหมาะกับผู้ที่มีพื้นที่หน้าบ้าน หน้าอาคาร ร้านค้าเดิม หรือพื้นที่เช่าที่ต้องการต่อยอดเป็นจุดขายเครื่องดื่ม"],
  ["อยากเริ่มธุรกิจเสริม", "เหมาะกับผู้ที่อยากเริ่มจากงบควบคุมได้ และต้องการแบรนด์ที่มีแนวทางเริ่มต้นชัดเจน"],
  ["ต้องการแบรนด์พร้อมระบบ", "เหมาะกับคนที่ไม่อยากเริ่มจากศูนย์ ทั้งด้านเมนู ภาพลักษณ์ร้าน วัตถุดิบ และการดูแลหลังเปิด"],
  ["กำลังเปรียบเทียบแพ็กเกจ", "เหมาะกับผู้ที่อยากให้ทีมงานช่วยดูงบ ทำเล และแนะนำรูปแบบร้านก่อนตัดสินใจลงทุน"]
];

const faqs = [
  ["ต้องมีประสบการณ์ร้านเครื่องดื่มมาก่อนไหม?", "ไม่จำเป็นครับ ทีมงานมีแนวทางเริ่มต้นและการอบรมพื้นฐาน เพื่อช่วยให้ผู้เริ่มต้นเข้าใจการเตรียมร้านและการขายได้ง่ายขึ้น"],
  ["แพ็กเกจรวมค่าตกแต่งร้านหรือไม่?", "แพ็กเกจยังไม่รวมค่าตกแต่งร้านและค่าปรับปรุงพื้นที่ เพราะแต่ละทำเลมีขนาดและรูปแบบต่างกัน ทีมงานจะช่วยประเมินงบเพิ่มเติมตามหน้างานจริง"],
  ["ต้องมีทำเลก่อนติดต่อไหม?", "ยังไม่มีก็ติดต่อได้ครับ หากมีทำเลแล้วทีมงานจะช่วยประเมินความเหมาะสมเบื้องต้น หากยังไม่มีทำเลสามารถฝากข้อมูลเพื่อคุยแนวทางก่อนได้"],
  ["หลังฝากข้อมูลแล้วจะเกิดอะไรต่อ?", "ทีมงานจะตรวจข้อมูลเบื้องต้นและติดต่อกลับเพื่อสอบถามงบ ทำเล และเป้าหมาย ก่อนแนะนำแพ็กเกจที่เหมาะสม"],
  ["มีค่า Royalty Fee รายเดือนไหม?", "ไม่มีค่า Royalty Fee รายเดือนตามข้อมูลแพ็กเกจปัจจุบัน โดยรายละเอียดเงื่อนไขจะสรุปอีกครั้งก่อนตัดสินใจ"]
];

const socialLinks = [
  { label: "Facebook", value: "domichathailand", href: "https://www.facebook.com/domichathailand", icon: Facebook },
  { label: "TikTok", value: "domicha.tea", href: "https://www.tiktok.com/@domicha.tea", icon: Sparkles }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fff7e8] text-[#17100c]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-orange-100 bg-[#fff7e8]/96 shadow-sm shadow-orange-950/5 backdrop-blur-2xl">
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
          src="/domicha-franchise-counter.png"
          alt="บรรยากาศแฟรนไชส์ DomiCha"
          fill
          sizes="100vw"
          className="object-cover object-[56%_42%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17100c]/92 via-[#17100c]/68 to-[#17100c]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_52%,rgba(245,102,45,0.2),transparent_34rem)]" />
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
              สำหรับผู้ที่อยากเริ่มธุรกิจเครื่องดื่มด้วยแบรนด์ที่มีภาพจำ ราคาเริ่มต้นเข้าถึงง่าย และทีมงานช่วยประเมินงบกับทำเลก่อนเริ่มจริง
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
            ["20.-", "ราคาเริ่มต้นเข้าถึงง่าย"],
            ["No Royalty", "ไม่มีค่ารายเดือน"]
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
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">แบรนด์ที่ออกแบบมาให้เริ่มต้นง่ายและจดจำได้</h2>
          </div>
          <p className="text-base font-medium leading-8 text-stone-600">
            DomiCha มีจุดขายที่ชัด ราคาเริ่มต้นเข้าถึงง่าย ภาพลักษณ์แบรนด์จดจำได้ และมีทีมงานช่วยประเมินแนวทางให้เหมาะกับงบและทำเลของผู้สนใจ
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

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">GOOD FIT</p>
              <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">เหมาะกับใคร</h2>
            </div>
            <p className="text-base font-medium leading-8 text-stone-600">
              DomiCha เหมาะกับผู้ที่อยากเริ่มธุรกิจเครื่องดื่มแบบมีแบรนด์ มีแนวทางให้เดิน และต้องการให้ทีมงานช่วยประเมินความเหมาะสมก่อนลงทุนจริง
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {idealProfiles.map(([title, detail]) => (
              <article key={title} className="rounded-[26px] border border-orange-100 bg-[#fffaf2] p-6 shadow-lg shadow-orange-950/5">
                <h3 className="text-xl font-extrabold">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-stone-600">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="model" className="bg-[#17100c] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[.18em] text-orange-300">FRANCHISE MODEL</p>
              <h2 className="mt-4 text-3xl font-black leading-[1.18] sm:text-4xl">แพ็กเกจแฟรนไชส์เริ่มต้นให้เลือกตามงบและทำเล</h2>
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
                <p className="mt-3 text-3xl font-black text-orange-200">{model.price}</p>
                <p className="mt-3 text-sm font-medium leading-7 text-stone-300">{model.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm font-medium leading-7 text-stone-400">
            ราคาข้างต้นเป็นราคาแพ็กเกจเบื้องต้น ยังไม่รวม VAT 7% และไม่รวมค่าตกแต่งร้าน / ค่าปรับปรุงพื้นที่ รวมถึงงบเพิ่มเติมบางรายการ เช่น ค่าเช่าพื้นที่ ระบบ POS หรือเงินทุนหมุนเวียน ซึ่งทีมงานจะช่วยประเมินตามรูปแบบร้านจริง
          </p>
        </div>
      </section>

      <section id="support" className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-[470px] overflow-hidden rounded-[34px] bg-[#28130c] p-8 shadow-2xl shadow-orange-950/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_30%,rgba(255,208,183,0.35),transparent_19rem)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,247,232,0.08)_0_1px,transparent_1px_22px)]" />
            <div className="relative flex min-h-[410px] flex-col justify-between text-white">
              <div>
                <p className="text-sm font-extrabold text-orange-200">DOMICHA FRANCHISE</p>
                <h3 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">เริ่มต้นธุรกิจเครื่องดื่มด้วยแนวทางที่ชัดเจนกว่าเดิม</h3>
                <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-orange-50/82">
                  ทีมงานช่วยให้ผู้สนใจเห็นภาพรวมของแบรนด์ ประเมินงบและทำเลเบื้องต้น แล้วแนะนำรูปแบบแพ็กเกจที่เหมาะกับเป้าหมายของแต่ละพื้นที่
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Brand", "ภาพจำและมาตรฐานการสื่อสาร"],
                  ["Location", "ประเมินทำเลและงบประมาณ"],
                  ["Package", "แนะนำรูปแบบที่เหมาะสม"],
                  ["System", "ต่อยอดสู่การดูแลหลังเปิดร้าน"]
                ].map(([title, detail]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[.08] p-4 backdrop-blur">
                    <p className="text-lg font-black text-orange-200">{title}</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-orange-50/75">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">SUPPORT</p>
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">ทีม DomiCha ช่วยให้การเริ่มต้นเป็นขั้นตอนมากขึ้น</h2>
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
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">สนใจแฟรนไชส์ เริ่มได้ใน 4 ขั้นตอน</h2>
            <p className="mt-5 text-base font-medium leading-8 text-stone-600">
              ฝากข้อมูลเบื้องต้น แล้วให้ทีมงานช่วยดูว่างบ ทำเล และรูปแบบร้านเหมาะกับการเริ่มต้นแบบไหน
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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#f5662d]">FAQ</p>
            <h2 className="mt-3 text-3xl font-black leading-[1.18] sm:text-4xl">คำถามที่พบบ่อยก่อนตัดสินใจ</h2>
            <p className="mt-5 text-base font-medium leading-8 text-stone-600">
              รวมคำตอบเบื้องต้นเพื่อช่วยให้ผู้สนใจประเมินภาพรวมก่อนฝากข้อมูล
            </p>
          </div>
          <div className="grid gap-4">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-lg shadow-orange-950/5">
                <h3 className="text-lg font-extrabold">{question}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-stone-600">{answer}</p>
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
