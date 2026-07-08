-- DomiCha Ecosystem product image migration
-- ใช้ไฟล์นี้ใน Supabase SQL Editor เมื่อต้องการเพิ่มรูปสินค้าในหน้า Products

alter table public.products
  add column if not exists image_url text;
