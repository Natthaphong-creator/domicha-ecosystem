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
DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL=https://script.google.com/macros/s/your-domicha-lead-web-app/exec
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_FRANCHISE_LEAD_TARGET_ID=your-line-user-group-or-room-id
```

ถ้ายังไม่มี LINE OA สามารถตั้งเฉพาะ `DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL` ได้ก่อน

## Apps Script

ไฟล์ตัวอย่างอยู่ที่:

```text
google-apps-script/franchise-lead-webhook/
```

เมื่อ deploy เป็น Web App แล้ว ให้นำ URL ที่ได้ไปใส่ใน `DOMICHA_FRANCHISE_LEAD_WEBHOOK_URL` บน Netlify โดยไม่ต้องใส่ URL จริงลง GitHub
