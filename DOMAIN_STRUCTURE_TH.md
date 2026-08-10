# โครงสร้างโดเมน Domichathailand

โดเมนหลักที่แนะนำ: `domichathailand.com`

## โครงสร้าง URL

- `www.domichathailand.com`  
  หน้าเว็บสาธารณะสำหรับลูกค้าทั่วไป เมนู จุดเด่นแบรนด์ และช่องทางติดต่อ

- `www.domichathailand.com/franchise`  
  หน้า Landing Page สำหรับผู้สนใจแฟรนไชส์ พร้อมฟอร์มฝากข้อมูล

- `order.domichathailand.com`  
  พอร์ทัลสั่งซื้อของสำหรับแฟรนไชส์ซี ระบบจะพาไปที่ `/shop`

- `admin.domichathailand.com`  
  ระบบหลังบ้านสำหรับเจ้าของแบรนด์ ระบบจะพาไปที่ `/dashboard`

## DNS หลังจดโดเมน

ถ้าใช้ Netlify:

```text
Type: CNAME
Name: www
Value: your-site-name.netlify.app
Proxy: DNS only
```

```text
Type: CNAME
Name: admin
Value: your-site-name.netlify.app
Proxy: DNS only
```

```text
Type: CNAME
Name: order
Value: your-site-name.netlify.app
Proxy: DNS only
```

ถ้าต้องการให้ `domichathailand.com` ไม่ใส่ www ใช้งานได้ด้วย ให้เพิ่มตามคำแนะนำของ hosting ที่เลือก และ redirect ไป `www.domichathailand.com`

## แก้ข้อมูลเว็บภายหลัง

ข้อมูลที่เจ้าของแก้เองได้ในหลังบ้าน:

- เบอร์โทรแบรนด์
- LINE URL
- ชื่อ LINE ที่แสดง
- ข้อความนำฟอร์มติดต่อ

เข้าเมนู: `admin.domichathailand.com/settings`

## สิ่งที่ต้อง deploy ใหม่

ต้อง deploy ใหม่เมื่อแก้:

- โครงหน้าเว็บ
- รูปภาพหลัก
- section ใหม่
- logic ของฟอร์ม/API
- ระบบหลังบ้านหรือระบบสั่งซื้อ

ไม่ต้อง deploy ใหม่เมื่อแก้:

- เบอร์โทร
- LINE
- ข้อความติดต่อที่หน้าเว็บ
