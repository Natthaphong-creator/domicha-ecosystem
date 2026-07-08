"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  FileText,
  Info,
  MessageCircle,
  PackagePlus,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";

type SaleItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type DeliveryResult = {
  invoiceNumber: string;
  lineStatus: "sent" | "simulated" | "skipped";
};

const customers = [
  { id: "customer-1", name: "DomiCha สาขาบางแสน", lineUserId: "U-demo-bangsaen-001", lineReady: true },
  { id: "customer-2", name: "บริษัท ชลบุรี ฟู้ด จำกัด", lineUserId: "U-demo-chonburi-002", lineReady: true },
  { id: "customer-3", name: "DomiCha สาขาพัทยา", lineUserId: "", lineReady: false }
];

const products = [
  { id: "product-1", name: "ชาแดง DomiCha", price: 195 },
  { id: "product-2", name: "ชาเขียว DomiCha", price: 210 },
  { id: "product-3", name: "ไข่มุก ตราโทรจัน", price: 89 },
  { id: "product-4", name: "แก้วพิมพ์ลาย DomiCha", price: 78 }
];

function newItem(): SaleItem {
  return { id: crypto.randomUUID(), productId: "", name: "", quantity: 1, unitPrice: 0 };
}

export default function NewSalePage() {
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [customerId, setCustomerId] = useState(customers[0].id);
  const [items, setItems] = useState<SaleItem[]>([
    { id: "sale-item-1", productId: "product-1", name: "ชาแดง DomiCha", quantity: 20, unitPrice: 195 },
    { id: "sale-item-2", productId: "product-3", name: "ไข่มุก ตราโทรจัน", quantity: 10, unitPrice: 89 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [sendLine, setSendLine] = useState(true);
  const [lineUserId, setLineUserId] = useState(customers[0].lineUserId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);

  const selectedCustomer = customers.find((customer) => customer.id === customerId) || customers[0];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * 0.07;
  const grandTotal = taxable + vat;

  function selectCustomer(value: string) {
    const customer = customers.find((row) => row.id === value);
    setCustomerId(value);
    setLineUserId(customer?.lineUserId || "");
    if (!customer?.lineReady) setSendLine(false);
  }

  function updateItem(id: string, patch: Partial<SaleItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function selectProduct(itemId: string, productId: string) {
    const product = products.find((row) => row.id === productId);
    updateItem(itemId, { productId, name: product?.name || "", unitPrice: product?.price || 0 });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!items.some((item) => item.productId && item.quantity > 0)) {
      setError("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    if (sendLine && !lineUserId) {
      setError("ลูกค้ารายนี้ยังไม่มี LINE User ID กรุณาเชื่อมบัญชี LINE ก่อน");
      return;
    }

    setSaving(true);
    const invoiceNumber = `INV-202607-${String(Date.now()).slice(-4)}`;

    try {
      if (sendLine && !demoMode) {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        const response = await fetch("/api/line/send-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({
            lineUserId,
            invoiceNumber,
            customerName: selectedCustomer.name,
            total: grandTotal,
            dueDate: "2026-07-09",
            invoiceUrl: `${window.location.origin}/documents`
          })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "ส่งใบแจ้งหนี้ผ่าน LINE ไม่สำเร็จ");
        setResult({ invoiceNumber, lineStatus: "sent" });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        setResult({ invoiceNumber, lineStatus: sendLine ? "simulated" : "skipped" });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "บันทึกการขายไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-3xl pb-24 lg:pb-4">
        <section className="premium-success overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-2xl shadow-emerald-900/10">
          <div className="p-7 text-center sm:p-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-emerald-600">SALE COMPLETED</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">บันทึกการขายสำเร็จ</h1>
            <p className="mt-2 text-slate-500">สร้างใบแจ้งหนี้ <strong className="text-slate-900">{result.invoiceNumber}</strong> เรียบร้อยแล้ว</p>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/80 p-5 sm:p-7">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <span className={`grid h-11 w-11 flex-none place-items-center rounded-2xl ${result.lineStatus === "skipped" ? "bg-slate-100 text-slate-500" : "bg-[#06c755]/10 text-[#06a846]"}`}>
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">การจัดส่งผ่าน LINE</h2>
                  {result.lineStatus !== "skipped" ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">สำเร็จ</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {result.lineStatus === "sent"
                    ? `ส่งใบแจ้งหนี้ให้ ${selectedCustomer.name} แล้ว`
                    : result.lineStatus === "simulated"
                      ? "จำลองการส่งสำเร็จ — ใส่ Channel Access Token เพื่อส่งจริง"
                      : "ไม่ได้เลือกส่งใบแจ้งหนี้ผ่าน LINE"}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button onClick={() => setResult(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">บันทึกการขายเพิ่ม</button>
              <a href="/documents" className="premium-button inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                ดูใบแจ้งหนี้ <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 pb-24 lg:pb-4">
      <header className="premium-page-header overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[.16em]">PREMIUM SALES FLOW</p>
            </div>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">บันทึกการขาย</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">ระบบจะสร้างใบแจ้งหนี้ คำนวณภาษี และส่งให้ลูกค้าผ่าน LINE อัตโนมัติในขั้นตอนเดียว</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Token จัดเก็บฝั่งเซิร์ฟเวอร์
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.55fr)]">
        <div className="space-y-6">
          <section className="premium-surface rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-orange-600"><FileText className="h-5 w-5" /></span>
              <div><h2 className="font-semibold">ข้อมูลการขาย</h2><p className="text-xs text-slate-400">กำหนดลูกค้าและวันครบกำหนดชำระ</p></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>ลูกค้า<select className="mt-1.5" value={customerId} onChange={(event) => selectCustomer(event.target.value)}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label>วันที่ขาย<input className="mt-1.5" type="date" defaultValue="2026-07-02" /></label>
              <label>เงื่อนไขการชำระ<select className="mt-1.5" defaultValue="7"><option value="0">ชำระทันที</option><option value="7">ภายใน 7 วัน</option><option value="15">ภายใน 15 วัน</option><option value="30">ภายใน 30 วัน</option></select></label>
              <label>ครบกำหนด<input className="mt-1.5" type="date" defaultValue="2026-07-09" /></label>
            </div>
          </section>

          <section className="premium-surface rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600"><PackagePlus className="h-5 w-5" /></span>
                <div><h2 className="font-semibold">รายการสินค้า</h2><p className="text-xs text-slate-400">ราคาจะถูกดึงจากฐานสินค้าอัตโนมัติ</p></div>
              </div>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium" onClick={() => setItems((current) => [...current, newItem()])}><Plus className="h-4 w-4" /> เพิ่มรายการ</button>
            </div>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[minmax(180px,1fr)_100px_130px_120px_40px] sm:items-end">
                  <label>สินค้า<select className="mt-1" value={item.productId} onChange={(event) => selectProduct(item.id, event.target.value)}><option value="">เลือกสินค้า</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                  <label>จำนวน<input className="mt-1" type="number" min="1" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} /></label>
                  <label>ราคาต่อหน่วย<input className="mt-1" type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })} /></label>
                  <div><p className="text-xs font-medium text-slate-500">รวม</p><p className="mt-2.5 whitespace-nowrap font-semibold">{money(item.quantity * item.unitPrice)}</p></div>
                  <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`ลบ ${item.name || "รายการ"}`} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="premium-line-card overflow-hidden rounded-3xl border border-[#06c755]/20 bg-white shadow-xl shadow-emerald-900/10">
            <div className="bg-gradient-to-br from-[#06c755] to-[#04a849] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /><h2 className="font-semibold">ส่งผ่าน LINE อัตโนมัติ</h2></div><p className="mt-2 text-xs text-white/75">ส่ง Flex Message พร้อมปุ่มเปิดใบแจ้งหนี้ทันที</p></div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" checked={sendLine} onChange={(event) => setSendLine(event.target.checked)} />
                  <span className="h-7 w-12 rounded-full bg-black/20 transition peer-checked:bg-white/95 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 peer-checked:after:bg-[#06a846]" />
                  <span className="sr-only">เปิดส่ง LINE อัตโนมัติ</span>
                </label>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 font-bold text-orange-700">{selectedCustomer.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{selectedCustomer.name}</strong><span className={`text-xs ${lineUserId ? "text-emerald-600" : "text-red-500"}`}>{lineUserId ? "LINE เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อม LINE"}</span></div>
                {lineUserId ? <Check className="h-4 w-4 text-emerald-500" /> : <CircleAlert className="h-4 w-4 text-red-500" />}
              </div>
              <label>LINE User ID<input className="mt-1.5 font-mono text-xs" value={lineUserId} onChange={(event) => setLineUserId(event.target.value)} placeholder="Uxxxxxxxxxxxxxxxx" /></label>
              <div className="flex gap-2 rounded-2xl bg-blue-50 p-3 text-xs leading-5 text-blue-700"><Info className="mt-0.5 h-4 w-4 flex-none" /><p>ลูกค้าต้องเพิ่ม LINE Official Account เป็นเพื่อนก่อน ระบบจึงจะส่ง Push Message ได้</p></div>
              <div className="flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" />ส่งหลังบันทึกทันที</span><span>{demoMode ? "โหมดจำลอง" : "พร้อมส่งจริง"}</span></div>
            </div>
          </section>

          <section className="premium-summary rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/15">
            <h2 className="font-semibold">สรุปยอดขาย</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-400"><span>ยอดสินค้า</span><strong className="text-white">{money(subtotal)}</strong></div>
              <label className="flex items-center justify-between gap-4 text-slate-400"><span>ส่วนลด</span><input className="h-9 max-w-28 border-white/10 bg-white/10 text-right text-white" type="number" min="0" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></label>
              <div className="flex justify-between text-slate-400"><span>VAT 7%</span><strong className="text-white">{money(vat)}</strong></div>
              <div className="border-t border-white/10 pt-4"><div className="flex items-end justify-between gap-3"><span className="text-sm text-slate-300">ยอดสุทธิ</span><strong className="text-2xl text-orange-400">{money(grandTotal)}</strong></div></div>
            </div>
            {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">{error}</p> : null}
            <button disabled={saving} className="premium-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 disabled:opacity-60">
              {saving ? "กำลังสร้างใบแจ้งหนี้..." : <><Send className="h-4 w-4" /> บันทึกและสร้างใบแจ้งหนี้</>}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-500">ระบบจะบันทึกประวัติการส่งทุกครั้ง</p>
          </section>
        </aside>
      </div>
    </form>
  );
}
