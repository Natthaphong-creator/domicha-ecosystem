import { PageHeader } from "@/components/PageHeader";
import { QuotationForm } from "@/components/QuotationForm";

export default function NewQuotationPage() {
  return (
    <>
      <PageHeader title="สร้างใบเสนอราคา" description="เลขใบเสนอราคาจะถูกสร้างอัตโนมัติรูปแบบ QT-YYYYMM-0001 หลังบันทึก" />
      <QuotationForm />
    </>
  );
}
