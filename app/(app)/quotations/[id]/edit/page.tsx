import { PageHeader } from "@/components/PageHeader";
import { QuotationEditLoader } from "@/components/QuotationEditLoader";

export default function EditQuotationPage({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="แก้ไขใบเสนอราคา" />
      <QuotationEditLoader id={params.id} />
    </>
  );
}
