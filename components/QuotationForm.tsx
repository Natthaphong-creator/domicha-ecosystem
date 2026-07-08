"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { money } from "@/lib/format";
import { calculateQuotation } from "@/lib/quotationMath";
import type { Customer, Product, Quotation, QuotationItem, QuotationStatus } from "@/lib/types";

const statusOptions = [
  { label: "ร่าง", value: "Draft" },
  { label: "ส่งแล้ว", value: "Sent" },
  { label: "ยอมรับ", value: "Accepted" },
  { label: "ปฏิเสธ", value: "Rejected" },
  { label: "หมดอายุ", value: "Expired" }
];

const emptyItem: QuotationItem = {
  product_id: "",
  product_name: "",
  quantity: 1,
  unit_price: 0,
  discount: 0
};

export function QuotationForm({ initialData }: { initialData?: Quotation }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState(initialData?.customer_id || "");
  const [quotationDate, setQuotationDate] = useState(initialData?.quotation_date || new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(initialData?.valid_until || "");
  const [status, setStatus] = useState<QuotationStatus>(initialData?.status || "Draft");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [items, setItems] = useState<QuotationItem[]>(initialData?.quotation_items?.length ? initialData.quotation_items : [{ ...emptyItem }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([apiFetch<Customer[]>("/api/customers"), apiFetch<Product[]>("/api/products")]).then(([customerRows, productRows]) => {
      setCustomers(customerRows.filter((customer) => customer.status === "Active"));
      setProducts(productRows.filter((product) => product.status === "Active"));
    });
  }, []);

  const totals = useMemo(() => calculateQuotation(items), [items]);

  function updateItem(index: number, patch: Partial<QuotationItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((row) => row.id === productId);
    updateItem(index, {
      product_id: productId,
      product_name: product?.product_name || "",
      unit_price: Number(product?.selling_price || 0)
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        customer_id: customerId,
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        status,
        notes,
        items: totals.items.filter((item) => item.product_name || item.product_id)
      };

      const saved = await apiFetch<Quotation>(initialData?.id ? `/api/quotations/${initialData.id}` : "/api/quotations", {
        method: initialData?.id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      router.push(`/quotations/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกใบเสนอราคาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-md border border-domicha-line bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label htmlFor="customer">ลูกค้า</label>
            <select id="customer" required value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">เลือกลูกค้า</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quotation_date">วันที่ใบเสนอราคา</label>
            <input id="quotation_date" type="date" required value={quotationDate} onChange={(event) => setQuotationDate(event.target.value)} />
          </div>
          <div>
            <label htmlFor="valid_until">ใช้ได้ถึงวันที่</label>
            <input id="valid_until" type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
          </div>
          <div>
            <label htmlFor="status">สถานะ</label>
            <select id="status" value={status} onChange={(event) => setStatus(event.target.value as QuotationStatus)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="notes">หมายเหตุ</label>
            <input id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-domicha-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">รายการสินค้า</h2>
          <button type="button" onClick={() => setItems((current) => [...current, { ...emptyItem }])} className="inline-flex items-center gap-2 rounded-md border border-domicha-line px-3 py-2 text-sm">
            <Plus className="h-4 w-4" />
            เพิ่มรายการ
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md bg-domicha-milk p-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <label>สินค้า</label>
                <select value={item.product_id} onChange={(event) => selectProduct(index, event.target.value)}>
                  <option value="">เลือกรายการ</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_code} - {product.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label>จำนวน</label>
                <input type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <label>ราคาต่อหน่วย</label>
                <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateItem(index, { unit_price: Number(event.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <label>ส่วนลด</label>
                <input type="number" min="0" step="0.01" value={item.discount} onChange={(event) => updateItem(index, { discount: Number(event.target.value) })} />
              </div>
              <div className="flex items-end justify-between gap-2 md:col-span-2">
                <div>
                  <label>รวม</label>
                  <p className="rounded-md bg-white px-3 py-2 text-sm font-semibold">{money(totals.items[index]?.line_total || 0)}</p>
                </div>
                <button type="button" className="rounded-md border border-red-100 p-2 text-red-600" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="ลบรายการ">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-domicha-line bg-white p-5 shadow-sm">
        <div className="ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span>ยอดก่อนส่วนลด/VAT</span>
            <strong>{money(totals.subtotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span>ส่วนลดรวม</span>
            <strong>{money(totals.discount_total)}</strong>
          </div>
          <div className="flex justify-between">
            <span>VAT 7%</span>
            <strong>{money(totals.vat_total)}</strong>
          </div>
          <div className="flex justify-between border-t border-domicha-line pt-3 text-lg text-domicha-tea">
            <span>ยอดสุทธิ</span>
            <strong>{money(totals.grand_total)}</strong>
          </div>
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => router.push("/quotations")} className="rounded-md border border-domicha-line px-4 py-2 text-sm">
            ยกเลิก
          </button>
          <button disabled={saving} className="rounded-md bg-domicha-tea px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "กำลังบันทึก..." : "บันทึกใบเสนอราคา"}
          </button>
        </div>
      </section>
    </form>
  );
}
