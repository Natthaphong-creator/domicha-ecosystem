import Image from "next/image";

type DocumentKind = "invoice" | "receipt";

type DocumentLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: string;
};

type FlowAccountDocumentTemplateProps = {
  kind: DocumentKind;
  pageNumber?: number;
  documentNumber: string;
  documentDate: string;
  dueDate?: string;
  seller?: string;
  reference?: string;
  customerName: string;
  customerAddress: string;
  customerTaxId?: string;
  items: DocumentLineItem[];
  amountText: string;
  payment?: {
    method: "cash" | "cheque" | "transfer" | "credit";
    bank?: string;
    accountNumber?: string;
    paidDate?: string;
    amount?: number;
  };
};

const company = {
  name: "DomiCha (โดมิชา) (บริษัทโดมิพลัสกรุ๊ป จำกัด) (สำนักงานใหญ่)",
  address: "77/44 หมู่ 5 หมู่บ้านแกรนด์ดี้เบย์ ต.เสม็ด อ.เมืองชลบุรี จ.ชลบุรี 20000",
  taxId: "0205567033352",
  phone: "0988247849",
  mobile: "0988247849"
};

const titles: Record<DocumentKind, { label: string; subLabel: string; color: string; receiver: string; approver: string }> = {
  invoice: { label: "ใบแจ้งหนี้", subLabel: "ต้นฉบับ", color: "#3498c9", receiver: "ผู้รับสินค้า / บริการ", approver: "ผู้อนุมัติ" },
  receipt: { label: "ใบเสร็จรับเงิน", subLabel: "ต้นฉบับ", color: "#52ae32", receiver: "ผู้จ่ายเงิน", approver: "ผู้รับเงิน" }
};

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function paymentLabel(method: string) {
  if (method === "cash") return "เงินสด";
  if (method === "cheque") return "เช็ค";
  if (method === "credit") return "บัตรเครดิต";
  return "โอนเงิน";
}

export function FlowAccountDocumentTemplate({
  kind,
  pageNumber = 1,
  documentNumber,
  documentDate,
  dueDate,
  seller = "ณัฐพงษ์ อุทระ",
  reference,
  customerName,
  customerAddress,
  customerTaxId,
  items,
  amountText,
  payment
}: FlowAccountDocumentTemplateProps) {
  const theme = titles[kind];
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <article className="flow-doc print-document mx-auto min-h-[1122px] max-w-[794px] bg-white px-[48px] py-[38px] text-[14px] leading-[1.55] text-black shadow-xl shadow-slate-950/10 print:min-h-0 print:max-w-none print:shadow-none">
      <header className="relative grid grid-cols-[1.05fr_.95fr] gap-12">
        <div>
          <Image src="/icons/domicha-original-logo.png" alt="DomiCha" width={82} height={82} className="h-[82px] w-[82px] object-contain" />
          <div className="mt-8 space-y-1.5">
            <p>{company.name}</p>
            <p>{company.address}</p>
            <p>เลขประจำตัวผู้เสียภาษี {company.taxId}</p>
            <p>โทร. {company.phone}</p>
            <p>เบอร์มือถือ {company.mobile}</p>
          </div>

          <div className="mt-7 space-y-1.5">
            <p style={{ color: theme.color }}>ลูกค้า</p>
            <p>{customerName}</p>
            <p>{customerAddress}</p>
            {customerTaxId ? <p>เลขประจำตัวผู้เสียภาษี {customerTaxId}</p> : null}
          </div>
        </div>

        <div className="pt-4">
          <div className="absolute right-[-26px] top-[-26px] h-0 w-0 border-l-[80px] border-t-[80px] border-l-transparent" style={{ borderTopColor: theme.color }} />
          <span className="absolute right-[-14px] top-[-12px] text-2xl text-white">{pageNumber}</span>
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-normal" style={{ color: theme.color }}>{theme.label}</h1>
            <p className="text-base" style={{ color: theme.color }}>{theme.subLabel}</p>
          </div>
          <div className="mt-5 border-y border-slate-300 py-4">
            <dl className="grid grid-cols-[120px_1fr] gap-y-1.5">
              <dt style={{ color: theme.color }}>เลขที่</dt>
              <dd>{documentNumber}</dd>
              <dt style={{ color: theme.color }}>วันที่</dt>
              <dd>{documentDate}</dd>
              {kind === "invoice" ? (
                <>
                  <dt style={{ color: theme.color }}>ครบกำหนด</dt>
                  <dd>{dueDate || documentDate}</dd>
                </>
              ) : null}
              <dt style={{ color: theme.color }}>ผู้ขาย</dt>
              <dd>{seller}</dd>
              {kind === "receipt" && reference ? (
                <>
                  <dt style={{ color: theme.color }}>อ้างอิง</dt>
                  <dd>{reference}</dd>
                </>
              ) : null}
            </dl>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-y border-slate-300">
              <th className="w-12 py-2 text-center font-normal">#</th>
              <th className="py-2 text-center font-normal">รายละเอียด</th>
              <th className="w-28 py-2 text-right font-normal">จำนวน</th>
              <th className="w-28 py-2 text-right font-normal">ราคาต่อหน่วย</th>
              <th className="w-24 py-2 text-right font-normal">ส่วนลด</th>
              <th className="w-28 py-2 text-right font-normal">มูลค่า</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const lineTotal = item.quantity * item.unitPrice;
              return (
                <tr key={`${item.description}-${index}`} className="border-b border-slate-300">
                  <td className="py-2 text-center">{index + 1}</td>
                  <td className="py-2 pl-3">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity.toLocaleString("th-TH")} <span className="ml-3">{item.unit}</span></td>
                  <td className="py-2 text-right">{baht(item.unitPrice)}</td>
                  <td className="py-2 text-right">{item.discount || "0.0 %"}</td>
                  <td className="py-2 text-right">{baht(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-[1fr_310px] gap-8">
          <p className="pt-12">({amountText})</p>
          <div className="space-y-3 text-[14px]">
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <span className="text-right" style={{ color: theme.color }}>รวมเป็นเงิน</span>
              <span className="text-right">{baht(subtotal)} บาท</span>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <span className="text-right" style={{ color: theme.color }}>จำนวนเงินรวมทั้งสิ้น</span>
              <span className="text-right">{baht(subtotal)} บาท</span>
            </div>
          </div>
        </div>
      </section>

      {kind === "receipt" && payment ? (
        <section className="mt-[460px] text-[13.5px]">
          <div className="flex items-center gap-5">
            <span>การชำระเงินจะสมบูรณ์เมื่อบริษัทได้รับเงินเรียบร้อยแล้ว</span>
            {(["cash", "cheque", "transfer", "credit"] as const).map((method) => (
              <span key={method} className="inline-flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded border border-slate-400 text-base leading-none">{payment.method === method ? "✓" : ""}</span>
                {paymentLabel(method)}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-[70px_1fr_60px_150px_50px_130px_80px_120px] items-end gap-2">
            <span>ธนาคาร</span><span className="border-b border-slate-300">{payment.bank || "-"}</span>
            <span>เลขที่</span><span className="border-b border-slate-300 text-center">{payment.accountNumber || "-"}</span>
            <span>วันที่</span><span className="border-b border-slate-300 text-center">{payment.paidDate || documentDate}</span>
            <span>จำนวนเงิน</span><span className="border-b border-slate-300 text-right">{baht(payment.amount || subtotal)}</span>
          </div>
        </section>
      ) : null}

      <footer className={kind === "receipt" ? "mt-12" : "mt-[440px]"}>
        <div className="grid grid-cols-2 gap-24 text-[13.5px]">
          <p>ในนาม {customerName}</p>
          <p>ในนาม {company.name.replace(" (สำนักงานใหญ่)", "")}</p>
        </div>
        <div className="mt-20 grid grid-cols-2 gap-24">
          <div className="grid grid-cols-2 gap-5 text-center text-[13px]">
            <div><div className="border-b border-slate-300" /> <p className="mt-2">{theme.receiver}</p></div>
            <div><div className="border-b border-slate-300" /> <p className="mt-2">วันที่</p></div>
          </div>
          <div className="grid grid-cols-2 gap-5 text-center text-[13px]">
            <div>
              <p className="-mt-8 mb-1 text-blue-700">ลายเซ็น</p>
              <div className="border-b border-slate-300" />
              <p className="mt-2">{theme.approver}</p>
            </div>
            <div><p className="-mt-8 mb-1">{documentDate}</p><div className="border-b border-slate-300" /><p className="mt-2">วันที่</p></div>
          </div>
        </div>
        <p className="mt-8 text-right text-xs text-slate-500">Template เอกสาร DomiCha</p>
      </footer>
    </article>
  );
}
