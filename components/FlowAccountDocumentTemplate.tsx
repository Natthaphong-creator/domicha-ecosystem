import Image from "next/image";

type DocumentKind = "invoice" | "receipt" | "taxInvoice";

type DocumentLineItem = {
  code?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount?: number;
  vatRate?: number;
};

type PaymentMethod = "cash" | "cheque" | "transfer" | "credit";

type FlowAccountDocumentTemplateProps = {
  kind: DocumentKind;
  pageNumber?: number;
  documentNumber: string;
  documentDate: string;
  dueDate?: string;
  seller?: string;
  reference?: string;
  poNumber?: string;
  customerName: string;
  customerAddress: string;
  customerBranch?: string;
  customerTaxId?: string;
  items: DocumentLineItem[];
  amountText: string;
  creditTerm?: string;
  deliveryMethod?: string;
  note?: string;
  withholdingTax?: number;
  payment?: {
    method: PaymentMethod;
    bank?: string;
    accountNumber?: string;
    paidDate?: string;
    amount?: number;
    transactionRef?: string;
  };
};

const company = {
  name: "DomiCha (โดมิชา)",
  legalName: "บริษัทโดมิพลัสกรุ๊ป จำกัด",
  branch: "สำนักงานใหญ่",
  address: "77/44 หมู่ 5 หมู่บ้านแกรนด์ดี้เบย์ ต.เสม็ด อ.เมืองชลบุรี จ.ชลบุรี 20000",
  taxId: "0205567033352",
  phone: "0988247849",
  email: "domicha.accounting@example.com"
};

const themes: Record<DocumentKind, { label: string; subLabel: string; color: string; bg: string; receiver: string; approver: string }> = {
  invoice: { label: "ใบแจ้งหนี้", subLabel: "Invoice", color: "#2488b8", bg: "#eaf6fb", receiver: "ผู้รับสินค้า / บริการ", approver: "ผู้อนุมัติ" },
  receipt: { label: "ใบเสร็จรับเงิน", subLabel: "Receipt", color: "#3f9f28", bg: "#edf8e8", receiver: "ผู้จ่ายเงิน", approver: "ผู้รับเงิน" },
  taxInvoice: { label: "ใบกำกับภาษี", subLabel: "Tax Invoice", color: "#7c3aed", bg: "#f3efff", receiver: "ผู้รับสินค้า / บริการ", approver: "ผู้อนุมัติ" }
};

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function paymentLabel(method: PaymentMethod) {
  if (method === "cash") return "เงินสด";
  if (method === "cheque") return "เช็ค";
  if (method === "credit") return "บัตรเครดิต";
  return "โอนเงิน";
}

function lineNet(item: DocumentLineItem) {
  return item.quantity * item.unitPrice - (item.discountAmount || 0);
}

function lineVat(item: DocumentLineItem) {
  return lineNet(item) * ((item.vatRate ?? 7) / 100);
}

export function FlowAccountDocumentTemplate({
  kind,
  pageNumber = 1,
  documentNumber,
  documentDate,
  dueDate,
  seller = "ณัฐพงษ์ อุทระ",
  reference,
  poNumber,
  customerName,
  customerAddress,
  customerBranch = "สำนักงานใหญ่",
  customerTaxId,
  items,
  amountText,
  creditTerm = "ชำระทันที",
  deliveryMethod = "จัดส่งโดย DomiCha",
  note = "กรุณาตรวจสอบรายการสินค้า จำนวน ราคา ภาษี และเอกสารอ้างอิงให้ถูกต้องก่อนบันทึกบัญชี",
  withholdingTax = 0,
  payment
}: FlowAccountDocumentTemplateProps) {
  const theme = themes[kind];
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const beforeVat = items.reduce((sum, item) => sum + lineNet(item), 0);
  const vatTotal = items.reduce((sum, item) => sum + lineVat(item), 0);
  const grandTotal = beforeVat + vatTotal - withholdingTax;

  return (
    <article className="print-document mx-auto min-h-[1122px] max-w-[794px] overflow-hidden bg-white text-[12.5px] leading-[1.5] text-slate-950 shadow-xl shadow-slate-950/10 print:min-h-0 print:max-w-none print:shadow-none">
      <div className="relative px-[42px] py-[34px]">
        <div className="absolute right-0 top-0 h-0 w-0 border-l-[92px] border-t-[92px] border-l-transparent" style={{ borderTopColor: theme.color }} />
        <span className="absolute right-4 top-4 text-2xl font-light text-white">{pageNumber}</span>

        <header className="grid grid-cols-[1fr_310px] gap-10">
          <section>
            <div className="flex items-start gap-4">
              <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={78} height={78} className="h-[78px] w-[78px] object-contain" />
              <div>
                <h2 className="text-lg font-bold">{company.name}</h2>
                <p>{company.legalName} ({company.branch})</p>
                <p className="mt-1 max-w-[360px] text-slate-600">{company.address}</p>
                <p className="mt-1 text-slate-600">เลขประจำตัวผู้เสียภาษี {company.taxId}</p>
                <p className="text-slate-600">โทร. {company.phone} • อีเมล {company.email}</p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-[.16em]" style={{ color: theme.color }}>Customer</p>
              <h3 className="mt-1 text-base font-bold">{customerName}</h3>
              <p className="mt-1 text-slate-600">{customerAddress}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-slate-600">
                <p>สาขา: <b className="text-slate-900">{customerBranch}</b></p>
                <p>เลขผู้เสียภาษี: <b className="text-slate-900">{customerTaxId || "-"}</b></p>
              </div>
            </div>
          </section>

          <section>
            <div className="rounded-3xl p-5 text-center" style={{ backgroundColor: theme.bg }}>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.color }}>{theme.label}</h1>
              <p className="text-sm font-semibold" style={{ color: theme.color }}>{theme.subLabel} / ต้นฉบับ</p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <dl className="grid grid-cols-[92px_1fr] gap-y-2">
                <dt className="font-semibold" style={{ color: theme.color }}>เลขที่</dt><dd>{documentNumber}</dd>
                <dt className="font-semibold" style={{ color: theme.color }}>วันที่</dt><dd>{documentDate}</dd>
                <dt className="font-semibold" style={{ color: theme.color }}>ครบกำหนด</dt><dd>{dueDate || documentDate}</dd>
                <dt className="font-semibold" style={{ color: theme.color }}>เครดิต</dt><dd>{creditTerm}</dd>
                <dt className="font-semibold" style={{ color: theme.color }}>ผู้ขาย</dt><dd>{seller}</dd>
                <dt className="font-semibold" style={{ color: theme.color }}>PO/Ref</dt><dd>{poNumber || reference || "-"}</dd>
              </dl>
            </div>
          </section>
        </header>

        <section className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["วิธีจัดส่ง", deliveryMethod],
            ["เอกสารอ้างอิง", reference || "-"],
            ["สถานะภาษี", "VAT 7% แยกภาษี"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-5">
          <table className="w-full border-collapse overflow-hidden text-[12px]">
            <thead>
              <tr style={{ backgroundColor: theme.color }} className="text-white">
                <th className="w-9 rounded-l-xl px-2 py-2.5 text-center">#</th>
                <th className="w-20 px-2 py-2.5 text-left">รหัส</th>
                <th className="px-2 py-2.5 text-left">รายละเอียด</th>
                <th className="w-20 px-2 py-2.5 text-right">จำนวน</th>
                <th className="w-20 px-2 py-2.5 text-right">ราคา</th>
                <th className="w-20 px-2 py-2.5 text-right">ส่วนลด</th>
                <th className="w-16 px-2 py-2.5 text-right">VAT</th>
                <th className="w-24 rounded-r-xl px-2 py-2.5 text-right">มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const net = lineNet(item);
                return (
                  <tr key={`${item.description}-${index}`} className="border-b border-slate-200">
                    <td className="px-2 py-2.5 text-center text-slate-500">{index + 1}</td>
                    <td className="px-2 py-2.5 text-slate-500">{item.code || "-"}</td>
                    <td className="px-2 py-2.5 font-medium">{item.description}</td>
                    <td className="px-2 py-2.5 text-right">{item.quantity.toLocaleString("th-TH")} {item.unit}</td>
                    <td className="px-2 py-2.5 text-right">{baht(item.unitPrice)}</td>
                    <td className="px-2 py-2.5 text-right">{baht(item.discountAmount || 0)}</td>
                    <td className="px-2 py-2.5 text-right">{item.vatRate ?? 7}%</td>
                    <td className="px-2 py-2.5 text-right font-semibold">{baht(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="mt-5 grid grid-cols-[1fr_310px] gap-6">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Amount in words</p>
              <p className="mt-2 font-semibold">({amountText})</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Audit note</p>
              <p className="mt-2 text-slate-600">{note}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            {[
              ["รวมก่อนส่วนลด", subtotal],
              ["ส่วนลดรวม", discountTotal],
              ["มูลค่าก่อน VAT", beforeVat],
              ["ภาษีมูลค่าเพิ่ม", vatTotal],
              ["หัก ณ ที่จ่าย", withholdingTax]
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-4 py-1.5">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold">{baht(Number(value))}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between gap-4 border-t border-slate-200 pt-3">
              <span className="font-bold">ยอดสุทธิ</span>
              <span className="text-xl font-black" style={{ color: theme.color }}>{baht(grandTotal)} บาท</span>
            </div>
          </div>
        </section>

        {payment ? (
          <section className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold">ข้อมูลรับชำระ</span>
              {(["cash", "cheque", "transfer", "credit"] as const).map((method) => (
                <span key={method} className="inline-flex items-center gap-1.5">
                  <span className="grid h-5 w-5 place-items-center rounded border border-slate-400 text-base leading-none">{payment.method === method ? "✓" : ""}</span>
                  {paymentLabel(method)}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 text-slate-600">
              <p>ธนาคาร: <b className="text-slate-900">{payment.bank || "-"}</b></p>
              <p>เลขที่บัญชี: <b className="text-slate-900">{payment.accountNumber || "-"}</b></p>
              <p>วันที่รับเงิน: <b className="text-slate-900">{payment.paidDate || documentDate}</b></p>
              <p>เลขอ้างอิง: <b className="text-slate-900">{payment.transactionRef || "-"}</b></p>
            </div>
          </section>
        ) : null}

        <footer className="mt-10">
          <div className="grid grid-cols-3 gap-5 text-center">
            {[
              ["ผู้จัดทำ", seller],
              ["ผู้ตรวจสอบ", ""],
              [theme.approver, ""]
            ].map(([label, value]) => (
              <div key={label} className="pt-10">
                <p className="mb-2 h-5 text-blue-700">{value}</p>
                <div className="border-b border-slate-300" />
                <p className="mt-2 text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xs text-slate-400">วันที่ ____ / ____ / ______</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 text-xs text-slate-500">
            <p>ผู้รับเอกสาร: ________________________________ วันที่ ____ / ____ / ______</p>
            <p className="text-right">เอกสารควบคุมภายใน DomiCha • ใช้ประกอบการบันทึกบัญชีและตรวจสอบย้อนหลัง</p>
          </div>
        </footer>
      </div>
    </article>
  );
}
