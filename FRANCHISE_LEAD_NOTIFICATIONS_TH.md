# ระบบแจ้งเตือน Lead แฟรนไชส์ DomiCha

ระบบฟอร์มแฟรนไชส์จะบันทึกข้อมูลเข้า Supabase ก่อน แล้วค่อยส่งแจ้งเตือนเสริมไปยัง Google Sheet/Email และ LINE OA

## ตัวเลือกที่แนะนำ

1. Google Sheet + Email
   - เหมาะสำหรับเก็บประวัติ lead แบบดูง่าย
   - ทีมขายเปิดดูย้อนหลังและกรองตามจังหวัด/งบประมาณได้
   - Apps Script จะส่งอีเมลแจ้งเตือนให้เจ้าของระบบอัตโนมัติ

2. LINE OA
   - เหมาะสำหรับแจ้งเตือนเร็วให้ทีมขาย
   - ต้องมี LINE Messaging API channel access token และ target ID

## Environment Variables บน Netlify

เพิ่มตัวแปรเหล่านี้ที่ Netlify → Site configuration → Environment variables

```bash
DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxKh68k9I6v_x4D2y8RYDOdNdpQ8zxQ306ojohAR5FiB9o47fdEiTGsUYZGnXn_xIKa/exec
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_FRANCHISE_LEAD_TARGET_ID=your-line-user-group-or-room-id
```

ถ้ายังไม่มี LINE OA สามารถตั้งเฉพาะ `DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL` ได้ก่อน

## ตั้งค่า LINE OA ให้แจ้งเตือนเข้าแชตทีม

หลัง deploy แล้ว ให้นำ URL นี้ไปใส่ใน LINE Developers → Messaging API → Webhook URL:

```text
https://domichathailand.com/api/line/webhook
```

จากนั้นเปิด Use webhook แล้วทัก LINE OA ด้วยข้อความ:

```text
ตั้งค่าแจ้งเตือน
```

ระบบจะจำแชตนั้นเป็นปลายทางแจ้งเตือน Lead แฟรนไชส์ ถ้าต้องการให้แจ้งเข้ากลุ่ม ให้เชิญ LINE OA เข้ากลุ่มทีมขาย แล้วพิมพ์คำสั่งเดียวกันในกลุ่มนั้น

## Apps Script

ไฟล์ตัวอย่างอยู่ที่:

```text
google-apps-script/franchise-lead-webhook/
```

เมื่อ deploy เป็น Web App แล้ว ให้นำ URL ที่ได้ไปใส่ใน `DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL`

Webhook ที่ตั้งไว้แล้ว:

```text
https://script.google.com/macros/s/AKfycbxKh68k9I6v_x4D2y8RYDOdNdpQ8zxQ306ojohAR5FiB9o47fdEiTGsUYZGnXn_xIKa/exec
```

Google Sheet สำหรับเก็บ Lead:

```text
https://docs.google.com/spreadsheets/d/1Aq9mZc_6Lhh6Gz2dntTjEtlkd3CRqKJbA9oExU8K-EA/edit
```
