import { EntityForm } from "@/components/EntityForm";
import { PageHeader } from "@/components/PageHeader";
import { customerFields } from "@/lib/constants";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="เพิ่มลูกค้า" />
      <EntityForm title="ข้อมูลลูกค้า" fields={customerFields} endpoint="/api/customers" backHref="/customers" initialData={{ customer_type: "Retail", status: "Active" }} />
    </>
  );
}
