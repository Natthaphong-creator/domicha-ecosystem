"use client";

import { EntityList } from "@/components/EntityList";
import { PageHeader } from "@/components/PageHeader";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="จัดการสินค้า/วัตถุดิบ" description="ข้อมูลสินค้า วัตถุดิบ ราคา และซัพพลายเออร์" actionHref="/products/new" actionLabel="เพิ่มสินค้า" />
      <EntityList<Product>
        endpoint="/api/products"
        editBasePath="/products"
        columns={[
          { key: "product_code", label: "รหัส" },
          { key: "product_name", label: "ชื่อสินค้า" },
          { key: "category", label: "หมวดหมู่" },
          { key: "selling_price", label: "ราคาขาย", render: (row) => money(row.selling_price) },
          { key: "status", label: "สถานะ" }
        ]}
      />
    </>
  );
}
