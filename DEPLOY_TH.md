# วิธี Deploy DomiCha Business / พอร์ทัลแฟรนไชส์ซี

โปรเจกต์นี้เป็น Next.js app พร้อมหน้าแอดมินและพอร์ทัลแฟรนไชส์ซี `/shop`

## Deploy แนะนำ: Vercel หรือ Netlify

ถ้าต้องการใช้ Netlify ให้ดูไฟล์ `NETLIFY_DEPLOY_TH.md` เพิ่มเติม โปรเจกต์นี้มี `netlify.toml` พร้อมแล้ว และใช้ Next.js Runtime ของ Netlify เพื่อให้ API routes เช่น `/api/orders` ทำงานได้

1. อัปโหลดโฟลเดอร์ `domicha-ecosystem` ขึ้น GitHub
2. เข้า Vercel แล้วกด `Add New Project`
3. เลือก repository ที่อัปโหลด
4. ตั้งค่า Framework เป็น `Next.js`
5. Build command: `npm run build`
6. Install command: `npm install`
7. กด Deploy

## Environment Variables

นำค่าจากไฟล์ `.env.production.example` ไปใส่ใน Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_OA_ORDER_TARGET_ID=your-line-user-group-or-room-id
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

`SUPABASE_SERVICE_ROLE_KEY` ใช้สำหรับให้ HQ/Admin สร้างบัญชีแฟรนไชส์ซีในหน้า `/franchisees`

ถ้ายังไม่มี LINE token ระบบยังบันทึกออเดอร์ได้ แต่จะยังไม่ส่ง LINE จริง

## หลัง Deploy แล้วใช้งานยังไง

- พอร์ทัลแฟรนไชส์ซี: `https://your-domain.com/shop`
- ระบบหลังบ้าน: `https://your-domain.com/dashboard`
- หน้า Login: `https://your-domain.com/login`

## ติดตั้งเป็นแอปบนมือถือ / แท็บเล็ต

หลังมีลิงก์ HTTPS แล้ว:

- Android: เปิดเว็บด้วย Chrome แล้วกด `ติดตั้งแอป`
- iPhone/iPad: เปิดด้วย Safari → Share → `เพิ่มไปยังหน้าจอโฮม`

## ทดสอบก่อนปล่อยจริง

รันคำสั่งนี้บนเครื่อง:

```bash
npm install
npm run build
npm run start
```

แล้วเปิด `http://localhost:3000/shop`
