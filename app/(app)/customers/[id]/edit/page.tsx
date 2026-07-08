import { EntityEditLoader } from "@/components/EntityEditLoader";
import { PageHeader } from "@/components/PageHeader";
import { customerFields } from "@/lib/constants";

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="แก้ไขลูกค้า" />
      <EntityEditLoader id={params.id} title="ข้อมูลลูกค้า" fields={customerFields} endpoint="/api/customers" backHref="/customers" />
    </>
  );
}
