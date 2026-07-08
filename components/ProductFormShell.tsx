"use client";

import { useEffect, useState } from "react";
import { EntityEditLoader } from "@/components/EntityEditLoader";
import { EntityForm } from "@/components/EntityForm";
import { apiFetch } from "@/lib/apiClient";
import { productFields } from "@/lib/constants";
import type { Supplier } from "@/lib/types";

export function ProductFormShell({ id }: { id?: string }) {
  const [supplierOptions, setSupplierOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    apiFetch<Supplier[]>("/api/suppliers")
      .then((suppliers) => setSupplierOptions(suppliers.map((supplier) => ({ label: supplier.supplier_name, value: supplier.id }))))
      .catch(() => setSupplierOptions([]));
  }, []);

  const extraOptions = { supplier_id: supplierOptions };

  if (id) {
    return <EntityEditLoader id={id} title="แก้ไขสินค้า/วัตถุดิบ" fields={productFields} endpoint="/api/products" backHref="/products" extraOptions={extraOptions} />;
  }

  return <EntityForm title="เพิ่มสินค้า/วัตถุดิบ" fields={productFields} endpoint="/api/products" backHref="/products" initialData={{ status: "Active", vat_type: "VAT 7%" }} extraOptions={extraOptions} />;
}
