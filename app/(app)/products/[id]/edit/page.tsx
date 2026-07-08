import { PageHeader } from "@/components/PageHeader";
import { ProductFormShell } from "@/components/ProductFormShell";

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="แก้ไขสินค้า/วัตถุดิบ" />
      <ProductFormShell id={params.id} />
    </>
  );
}
