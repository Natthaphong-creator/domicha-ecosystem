"use client";

import { EntityList } from "@/components/EntityList";
import { PageHeader } from "@/components/PageHeader";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="จัดการลูกค้า" description="เพิ่ม แก้ไข และดูข้อมูลลูกค้าสำหรับการออกใบเสนอราคา" actionHref="/customers/new" actionLabel="เพิ่มลูกค้า" />
      <EntityList<Customer>
        endpoint="/api/customers"
        editBasePath="/customers"
        columns={[
          { key: "customer_name", label: "ชื่อลูกค้า" },
          { key: "contact_person", label: "ผู้ติดต่อ" },
          { key: "phone", label: "โทรศัพท์" },
          { key: "customer_type", label: "ประเภท" },
          { key: "status", label: "สถานะ" }
        ]}
      />
    </>
  );
}
