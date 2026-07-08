"use client";

import { EntityList } from "@/components/EntityList";
import { PageHeader } from "@/components/PageHeader";
import type { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  return (
    <>
      <PageHeader title="จัดการซัพพลายเออร์" description="ข้อมูลคู่ค้าสำหรับสินค้าและวัตถุดิบ" actionHref="/suppliers/new" actionLabel="เพิ่มซัพพลายเออร์" />
      <EntityList<Supplier>
        endpoint="/api/suppliers"
        editBasePath="/suppliers"
        columns={[
          { key: "supplier_name", label: "ชื่อซัพพลายเออร์" },
          { key: "contact_person", label: "ผู้ติดต่อ" },
          { key: "phone", label: "โทรศัพท์" },
          { key: "product_category_supplied", label: "หมวดสินค้า" },
          { key: "status", label: "สถานะ" }
        ]}
      />
    </>
  );
}
