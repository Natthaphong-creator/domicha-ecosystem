# Deploy DomiCha Business บน Netlify

โปรเจกต์นี้เป็น Next.js app มีทั้งหน้าร้าน `/shop`, ระบบหลังบ้าน และ API สำหรับส่ง LINE OA ดังนั้นต้อง deploy แบบ Next.js Runtime ของ Netlify ไม่ใช่ static upload อย่างเดียว

## วิธีที่แนะนำ: Deploy ผ่าน GitHub

1. อัปโหลดโฟลเดอร์ `domicha-ecosystem` ขึ้น GitHub
2. เข้า Netlify → `Add new site` → `Import an existing project`
3. เลือก GitHub repository
4. ตั้งค่า build:

```text
Base directory: เว้นว่าง ถ้า repo คือ domicha-ecosystem
Build command: npm run build
Publish directory: .next
```

ถ้าอัปโหลดทั้งโฟลเดอร์ `Domicha` เป็น repo ใหญ่ ให้ตั้ง:

```text
Base directory: domicha-ecosystem
Build command: npm run build
Publish directory: .next
```

## Environment Variables

ไปที่ Netlify → Site configuration → Environment variables แล้วเพิ่ม:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_OA_ORDER_TARGET_ID=your-line-user-group-or-room-id
NEXT_PUBLIC_APP_URL=https://your-netlify-site.netlify.app
```

`SUPABASE_SERVICE_ROLE_KEY` จำเป็นสำหรับหน้า `/franchisees` ที่ HQ/Admin ใช้สร้างบัญชีแฟรนไชส์ซี ห้ามตั้งชื่อนี้เป็น `NEXT_PUBLIC_*`

ถ้ายังไม่มี LINE token ระบบจะบันทึกออเดอร์ได้ แต่จะยังไม่ส่งเข้า LINE จริง

## หน้าใช้งานหลัง Deploy

- พอร์ทัลแฟรนไชส์ซี: `https://your-site.netlify.app/shop`
- ระบบหลังบ้าน: `https://your-site.netlify.app/dashboard`
- Login: `https://your-site.netlify.app/login`

## ติดตั้งเป็นแอปมือถือ / แท็บเล็ต

หลัง deploy สำเร็จและได้ HTTPS:

- Android/Chrome: เปิดเว็บ → กด `ติดตั้งแอป`
- iPhone/iPad/Safari: กด Share → `เพิ่มไปยังหน้าจอโฮม`

## หมายเหตุ

ไฟล์ `netlify.toml` ในโปรเจกต์นี้ตั้งค่า Next.js Runtime แล้ว และใช้ `@netlify/plugin-nextjs` เพื่อให้ API routes เช่น `/api/orders` ทำงานบน Netlify Functions ได้
