import { EntityForm } from "@/components/EntityForm";
import { PageHeader } from "@/components/PageHeader";
import { supplierFields } from "@/lib/constants";

export default function NewSupplierPage() {
  return (
    <>
      <PageHeader title="เพิ่มซัพพลายเออร์" />
      <EntityForm title="ข้อมูลซัพพลายเออร์" fields={supplierFields} endpoint="/api/suppliers" backHref="/suppliers" initialData={{ status: "Active" }} />
    </>
  );
}
