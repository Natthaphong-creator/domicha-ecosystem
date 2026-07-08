import { EntityEditLoader } from "@/components/EntityEditLoader";
import { PageHeader } from "@/components/PageHeader";
import { supplierFields } from "@/lib/constants";

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="แก้ไขซัพพลายเออร์" />
      <EntityEditLoader id={params.id} title="ข้อมูลซัพพลายเออร์" fields={supplierFields} endpoint="/api/suppliers" backHref="/suppliers" />
    </>
  );
}
