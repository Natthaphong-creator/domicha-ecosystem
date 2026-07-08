# DomiCha Business

เว็บแอปบัญชีและบริหารธุรกิจสำหรับ DomiCha ออกแบบแนวเดียวกับระบบบัญชีออนไลน์สมัยใหม่ ครอบคลุมงานขาย ค่าใช้จ่าย ลูกค้า ซัพพลายเออร์ สินค้า กระแสเงินสด และรายงาน

## ทดลองระบบทันที

ถ้ายังไม่ได้กำหนด Supabase environment ระบบจะเข้า `Demo Mode` โดยอัตโนมัติ:

- เปิด `/login` แล้วกด `เข้าสู่ระบบตัวอย่าง`
- ข้อมูลลูกค้า ซัพพลายเออร์ สินค้า และใบเสนอราคาจะเก็บใน Local Storage
- หน้าเอกสารขายและรายจ่ายรองรับการเพิ่มรายการและเปลี่ยนสถานะเพื่อทดลอง workflow
- ข้อมูลตัวอย่างไม่ส่งออกจากเครื่องและรีเซ็ตได้ด้วยการล้าง Local Storage

## โครงสร้างโปรเจกต์

```text
domicha-ecosystem/
  app/
    (auth)/login, register
    (app)/dashboard
    (app)/customers
    (app)/suppliers
    (app)/products
    (app)/quotations
    api/
      customers, suppliers, products, quotations, dashboard
  components/
  lib/
  supabase/schema.sql
```

## ตั้งค่า Supabase

1. สร้าง Supabase project ใหม่
2. เปิด SQL Editor แล้วรันไฟล์ `supabase/schema.sql`
3. ไปที่ Authentication settings และตั้งค่า email confirmation ตามที่ต้องการ
4. ตรวจสอบว่า Storage bucket ชื่อ `documents` ถูกสร้างแล้ว

## ตั้งค่า Environment

คัดลอก `.env.example` เป็น `.env.local`

```bash
cp .env.example .env.local
```

ใส่ค่าจาก Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` ใช้เฉพาะฝั่งเซิร์ฟเวอร์สำหรับให้ HQ/Admin สร้างบัญชีแฟรนไชส์ซี ห้ามใช้ชื่อขึ้นต้นด้วย `NEXT_PUBLIC_*`

## รันบนเครื่อง

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

## โมดูลปัจจุบัน

- เข้าสู่ระบบ/ออกจากระบบด้วย Supabase Auth โดยปิดการสมัครเองใน Production
- role ผู้ใช้: Admin, Sales, Accountant, Franchisee
- Dashboard รายรับ รายจ่าย กำไร ยอดค้างรับ และเงินสด/ธนาคาร
- เอกสารขาย: ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จรับเงิน และใบกำกับภาษี
- บันทึกรับชำระและติดตามเอกสารเกินกำหนด
- รายจ่ายและหลักฐานค่าใช้จ่าย
- กระแสเงินสดและรายงานธุรกิจ
- Sales Flow: บันทึกการขาย สร้างใบแจ้งหนี้ และเลือกส่งผ่าน LINE อัตโนมัติ
- พอร์ทัลแฟรนไชส์ซี `/shop`: ต้องเข้าสู่ระบบด้วยบัญชีแฟรนไชส์ซีที่ HQ สร้างให้ก่อนสั่งซื้อวัตถุดิบ
- จัดการแฟรนไชส์ซี `/franchisees`: HQ/Admin สร้างบัญชีสาขาแบบ Private B2B Portal
- CRUD ลูกค้า
- CRUD ซัพพลายเออร์
- CRUD สินค้าและวัตถุดิบ
- สร้าง/แก้ไข/ดูใบเสนอราคา
- เลขใบเสนอราคาอัตโนมัติ `QT-YYYYMM-0001`
- คำนวณ subtotal, discount, VAT 7%, grand total
- ส่งออกใบเสนอราคาเป็น PDF และบันทึกข้อมูลไฟล์ใน `document_files`
- Dashboard สรุปจำนวนและสถานะใบเสนอราคา

## หมายเหตุ PDF ภาษาไทย

PDF export ใช้ `pdf-lib` และฟอนต์มาตรฐานในตัว ซึ่งรองรับตัวอักษร Latin ได้ดีที่สุด หากต้องการให้ PDF แสดงภาษาไทยสมบูรณ์ แนะนำเพิ่มไฟล์ฟอนต์ไทย เช่น Sarabun หรือ Noto Sans Thai แล้ว embed font ใน route `app/api/quotations/[id]/pdf/route.ts`

## ก่อนใช้งาน Production

โมดูลลูกค้า ซัพพลายเออร์ สินค้า และใบเสนอราคาเชื่อม Supabase schema เดิมแล้ว ส่วนโมดูลบัญชีใหม่ทำงานเป็น interactive demo ในรอบนี้ ขั้นต่อไปคือเพิ่ม migration/API สำหรับใบแจ้งหนี้ ใบเสร็จ รายจ่าย และการกระทบยอดธนาคารก่อนนำข้อมูลจริงเข้าระบบ

## ตั้งค่าส่งใบแจ้งหนี้ผ่าน LINE

1. สร้าง Messaging API channel และให้ลูกค้าเพิ่ม LINE Official Account เป็นเพื่อน
2. ใส่ `LINE_CHANNEL_ACCESS_TOKEN` ใน environment ฝั่งเซิร์ฟเวอร์ ห้ามใช้ตัวแปร `NEXT_PUBLIC_*`
3. บันทึก `line_user_id` และเปิด `auto_send_invoice_line` ในข้อมูลลูกค้า
4. ระบบจะส่ง Flex Message พร้อมยอด วันครบกำหนด และปุ่มเปิดใบแจ้งหนี้หลังบันทึกการขาย
5. รันส่วนเพิ่มใน `supabase/schema.sql` เพื่อสร้างตารางเอกสารขายและประวัติการส่ง LINE

เมื่อยังไม่มี Token ระบบจะอยู่ใน Demo Mode และจำลองผลการส่งโดยไม่ติดต่อ LINE จริง

## ตั้งค่ารับออเดอร์จากพอร์ทัลแฟรนไชส์ซีผ่าน LINE OA

พอร์ทัลแฟรนไชส์ซีเปิดที่ `/shop` และต้องเข้าสู่ระบบด้วยบัญชี role `Franchisee` ที่สถานะ `Active` เท่านั้น เมื่อยืนยันออเดอร์ API จะตรวจสิทธิ์ผู้ใช้ ตรวจสินค้า และคำนวณยอดใหม่จากราคาฝั่งเซิร์ฟเวอร์ก่อนบันทึกออเดอร์และส่ง Flex Message เข้า LINE OA

เพิ่มค่าต่อไปนี้ใน `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=service-role-key
LINE_CHANNEL_ACCESS_TOKEN=channel-access-token
LINE_OA_ORDER_TARGET_ID=user-group-or-room-id
```

`LINE_OA_ORDER_TARGET_ID` คือ User ID, Group ID หรือ Room ID ที่บอตมีสิทธิ์ส่งข้อความถึง หากยังไม่ตั้งค่า LINE ระบบจะยังบันทึกออเดอร์ได้ แต่จะไม่เรียก LINE API

## วิธีสร้างสมาชิกแฟรนไชส์ซี แบบ A

ถ้าเคยรัน `supabase/schema.sql` เวอร์ชันเดิมไว้แล้ว ให้รันไฟล์ `supabase/franchisee_migration.sql` เพิ่มใน Supabase SQL Editor เพื่อเพิ่มตารางและสิทธิ์ของระบบแฟรนไชส์ซี

1. ให้ HQ/Admin เข้าระบบหลังบ้าน
2. เปิดเมนู `/franchisees`
3. กรอกอีเมล รหัสผ่านเริ่มต้น ชื่อเจ้าของสาขา ชื่อสาขา เบอร์โทร และที่อยู่จัดส่ง
4. ตั้งสถานะเป็น `Active`
5. ส่งอีเมล/รหัสผ่านให้แฟรนไชส์ซี
6. แฟรนไชส์ซีเปิด `/shop` แล้วเข้าสู่ระบบเพื่อสั่งซื้อวัตถุดิบ

ระบบปิดหน้า `/register` สำหรับการสมัครเองแล้ว เพื่อไม่ให้ลูกค้าทั่วไปหรือบุคคลภายนอกสมัครเข้ามาเป็นแฟรนไชส์ซีเอง

## ติดตั้งเป็น App บนมือถือและแท็บเล็ต

ระบบรองรับ Progressive Web App (PWA), หน้าจอสัมผัส และ safe area ของอุปกรณ์:

- Android/Chrome: เปิดเว็บไซต์แล้วกด `ติดตั้ง DomiCha App`
- iPhone/iPad: เปิดด้วย Safari → กด Share → `เพิ่มไปยังหน้าจอโฮม`
- เมื่อติดตั้งแล้ว ระบบเปิดแบบ standalone ไม่มีแถบ address bar
- Service worker ใช้ network-first สำหรับหน้าเว็บและเก็บ icon/manifest สำหรับการติดตั้ง

การติดตั้งบนเครื่องอื่นต้อง Deploy เว็บไซต์ด้วย HTTPS ก่อน ไม่สามารถใช้ `127.0.0.1` จากโทรศัพท์หรือแท็บเล็ตเครื่องอื่นได้
