"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { apiFetch } from "@/lib/apiClient";
import { money } from "@/lib/format";
import type { Customer, Product } from "@/lib/types";

type SaleItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CustomerOption = Customer & {
  line_user_id?: string | null;
  auto_send_invoice_line?: boolean | null;
};

type DeliveryResult = {
  invoiceNumber: string;
  lineStatus: "sent" | "skipped" | "failed" | "not_configured";
};

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function newItem(): SaleItem {
  return { id: crypto.randomUUID(), productId: "", name: "", quantity: 1, unitPrice: 0 };
}

export default function NewSalePage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(todayText());
  const [paymentTermDays, setPaymentTermDays] = useState(7);
  const [dueDate, setDueDate] = useState(addDays(todayText(), 7));
  const [items, setItems] = useState<SaleItem[]>([newItem()]);
  const [discount, setDiscount] = useState(0);
  const [sendLine, setSendLine] = useState(true);
  const [lineUserId, setLineUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);

  useEffect(() => {
    async function loadReferenceData() {
      setLoadingData(true);
      try {
        const [customerRows, productRows] = await Promise.all([
          apiFetch<CustomerOption[]>("/api/customers"),
          apiFetch<Product[]>("/api/products")
        ]);
        const activeCustomers = (customerRows || []).filter((customer) => customer.status === "Active");
        const activeProducts = (productRows || []).filter((product) => product.status === "Active");
        if (activeCustomers.length > 0) {
          setCustomers(activeCustomers);
          setCustomerId(activeCustomers[0].id);
          setLineUserId(activeCustomers[0].line_user_id || "");
          setSendLine(Boolean(activeCustomers[0].auto_send_invoice_line || activeCustomers[0].line_user_id));
        }
        if (activeProducts.length > 0) {
          setProducts(activeProducts);
          setItems([
            {
              id: crypto.randomUUID(),
              productId: activeProducts[0].id,
              name: activeProducts[0].product_name,
              quantity: 1,
              unitPrice: Number(activeProducts[0].selling_price || 0)
            }
          ]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลลูกค้า/สินค้าไม่สำเร็จ");
      } finally {
        setLoadingData(false);
      }
    }

    loadReferenceData();
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === customerId) || null;
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * 0.07;
  const grandTotal = taxable + vat;

  function selectCustomer(value: string) {
    const customer = customers.find((row) => row.id === value);
    setCustomerId(value);
    setLineUserId(customer?.line_user_id || "");
    setSendLine(Boolean(customer?.auto_send_invoice_line || customer?.line_user_id));
  }

  function updateIssueDate(value: string) {
    setIssueDate(value);
    setDueDate(addDays(value, paymentTermDays));
  }

  function updatePaymentTerm(value: number) {
    setPaymentTermDays(value);
    setDueDate(addDays(issueDate, value));
  }

  function updateItem(id: string, patch: Partial<SaleItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function selectProduct(itemId: string, productId: string) {
    const product = products.find((row) => row.id === productId);
    updateItem(itemId, { productId, name: product?.product_name || "", unitPrice: Number(product?.selling_price || 0) });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (!customerId) {
      setError("กรุณาเลือกลูกค้า");
      return;
    }
    if (validItems.length === 0) {
      setError("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    if (sendLine && !lineUserId) {
      setError("ลูกค้ารายนี้ยังไม่มี LINE User ID กรุณาเชื่อมบัญชี LINE ก่อน");
      return;
    }

    setSaving(true);
    try {
      const payload = await apiFetch<DeliveryResult>("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          issueDate,
          paymentTermDays,
          dueDate,
          discount,
          sendLine,
          lineUserId,
          items: validItems.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        })
      });
      setResult(payload);
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
              <span className={`grid h-11 w-11 flex-none place-items-center rounded-2xl ${result.lineStatus === "sent" ? "bg-[#06c755]/10 text-[#06a846]" : "bg-slate-100 text-slate-500"}`}>
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">การจัดส่งผ่าน LINE</h2>
                  {result.lineStatus === "sent" ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">สำเร็จ</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {result.lineStatus === "sent"
                    ? `ส่งใบแจ้งหนี้ให้ ${selectedCustomer?.customer_name || "ลูกค้า"} แล้ว`
                    : result.lineStatus === "not_configured"
                      ? "บันทึกขายแล้ว แต่ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN"
                      : result.lineStatus === "failed"
                        ? "บันทึกขายแล้ว แต่ LINE ส่งไม่สำเร็จ กรุณาตรวจ LINE User ID"
                        : "บันทึกขายแล้ว และไม่ได้เลือกส่งใบแจ้งหนี้ผ่าน LINE"}
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
            <p className="mt-2 max-w-2xl text-sm text-slate-400">ระบบจะสร้างใบแจ้งหนี้ คำนวณภาษี และเชื่อมยอดขายเข้าหน้า Dashboard อัตโนมัติ</p>
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
              <label>ลูกค้า<select className="mt-1.5" value={customerId} onChange={(event) => selectCustomer(event.target.value)} disabled={loadingData || customers.length === 0}>
                {customers.length === 0 ? <option value="">ยังไม่มีลูกค้าในระบบ</option> : null}
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customer_name}</option>)}
              </select></label>
              <label>วันที่ขาย<input className="mt-1.5" type="date" value={issueDate} onChange={(event) => updateIssueDate(event.target.value)} /></label>
              <label>เงื่อนไขการชำระ<select className="mt-1.5" value={paymentTermDays} onChange={(event) => updatePaymentTerm(Number(event.target.value))}><option value="0">ชำระทันที</option><option value="7">ภายใน 7 วัน</option><option value="15">ภายใน 15 วัน</option><option value="30">ภายใน 30 วัน</option></select></label>
              <label>ครบกำหนด<input className="mt-1.5" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
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
                  <label>สินค้า<select className="mt-1" value={item.productId} onChange={(event) => selectProduct(item.id, event.target.value)}><option value="">เลือกสินค้า</option>{products.map((product) => <option key={product.id} value={product.id}>{product.product_name}</option>)}</select></label>
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
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 font-bold text-orange-700">{(selectedCustomer?.customer_name || "D").slice(0, 1)}</span>
                <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{selectedCustomer?.customer_name || "ยังไม่ได้เลือกลูกค้า"}</strong><span className={`text-xs ${lineUserId ? "text-emerald-600" : "text-red-500"}`}>{lineUserId ? "LINE เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อม LINE"}</span></div>
                {lineUserId ? <Check className="h-4 w-4 text-emerald-500" /> : <CircleAlert className="h-4 w-4 text-red-500" />}
              </div>
              <label>LINE User ID<input className="mt-1.5 font-mono text-xs" value={lineUserId} onChange={(event) => setLineUserId(event.target.value)} placeholder="Uxxxxxxxxxxxxxxxx" /></label>
              <div className="flex gap-2 rounded-2xl bg-blue-50 p-3 text-xs leading-5 text-blue-700"><Info className="mt-0.5 h-4 w-4 flex-none" /><p>ลูกค้าต้องเพิ่ม LINE Official Account เป็นเพื่อนก่อน ระบบจึงจะส่ง Push Message ได้</p></div>
              <div className="flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" />ส่งหลังบันทึกทันที</span><span>พร้อมส่งจริง</span></div>
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
            <button disabled={saving || loadingData} className="premium-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 disabled:opacity-60">
              {saving ? "กำลังสร้างใบแจ้งหนี้..." : <><Send className="h-4 w-4" /> บันทึกและสร้างใบแจ้งหนี้</>}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-500">บันทึกแล้ว Dashboard จะอัปเดตจากเอกสารขายจริง</p>
          </section>
        </aside>
      </div>
    </form>
  );
}
