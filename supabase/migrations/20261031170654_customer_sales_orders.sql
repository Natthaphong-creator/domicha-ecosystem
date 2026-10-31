create table public.customer_sale_products (
 id text primary key, name text not null, category text not null, unit text not null,
 price_satang bigint check(price_satang>0 and price_satang<=999999999999), image_path text not null default '',
 sale_status text not null default 'paused' check(sale_status in ('active','paused','hidden')),
 version integer not null default 1, updated_at timestamptz not null default now(),
 check(sale_status<>'active' or price_satang is not null)
);
alter table public.customer_sale_products enable row level security;
revoke all on public.customer_sale_products from public,anon,authenticated;
grant all on public.customer_sale_products to service_role;
create table public.customer_sales_events (
 id bigint generated always as identity primary key,actor_id uuid references public.users(id),
 event_type text not null,subject_id text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);
alter table public.customer_sales_events enable row level security;
revoke all on public.customer_sales_events from public,anon,authenticated;
grant all on public.customer_sales_events to service_role;
grant usage,select on sequence public.customer_sales_events_id_seq to service_role;

-- Existing legacy orders are left outside this new workflow (sales_channel is null).
alter table public.franchisee_orders
 add column sales_channel text,
 add column client_request_id uuid,
 add column request_fingerprint text,
 add column recipient_name text,
 add column contact_phone text,
 add column quote_state text check(quote_state in ('pending','confirmed','cancelled')),
 add column quote_confirmed_at timestamptz,
 add column quote_confirmed_by uuid references public.users(id),
 add column stock_checked boolean not null default false,
 add column sales_revision integer not null default 0;
create unique index customer_order_request_unique on public.franchisee_orders(user_id,client_request_id) where client_request_id is not null;
create index customer_order_channel_created on public.franchisee_orders(created_at desc,id) where sales_channel='customer-v1';

create function public.create_customer_sales_order(p_actor uuid,p_request_id uuid,p_items jsonb,p_recipient text,p_phone text,p_delivery text,p_address text,p_note text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare f public.franchisee_profiles;b public.branches;p public.customer_sale_products;x jsonb;
 o public.franchisee_orders;new_id uuid:=gen_random_uuid();sum_satang bigint:=0;qty integer;fingerprint text;
begin
 if p_request_id is null or not exists(select 1 from public.users where id=p_actor and role='Franchisee') then raise exception 'MEMBER_REQUIRED';end if;
 select fp.* into f from public.franchisee_profiles fp join public.branches br on br.id=fp.branch_id where fp.user_id=p_actor and fp.status='Active' and br.status='Active' for share of fp,br;
 if not found then raise exception 'MEMBER_REQUIRED';end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>100 then raise exception 'INVALID_ITEMS';end if;
 if p_recipient is null or length(trim(p_recipient)) not between 1 and 120 or p_phone is null or p_phone !~ '^0[0-9]{8,9}$' or p_delivery is null or p_delivery not in ('delivery','pickup') or length(coalesce(p_note,''))>500 then raise exception 'INVALID_DETAILS';end if;
 if p_delivery='delivery' and (p_address is null or length(trim(p_address)) not between 1 and 1500) then raise exception 'ADDRESS_REQUIRED';end if;
 fingerprint:=md5(jsonb_build_object('items',p_items,'recipient',trim(p_recipient),'phone',p_phone,'delivery',p_delivery,'address',case when p_delivery='delivery' then trim(p_address) else '' end,'note',coalesce(p_note,''))::text);
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request_id::text,0));
 select * into o from public.franchisee_orders where user_id=p_actor and client_request_id=p_request_id;
 if found then if o.request_fingerprint<>fingerprint then raise exception 'REQUEST_CONFLICT';end if;return o.id;end if;
 if (select count(*) from jsonb_array_elements(p_items))<>(select count(distinct value->>'id') from jsonb_array_elements(p_items)) then raise exception 'DUPLICATE_ITEM';end if;
 for x in select value from jsonb_array_elements(p_items) order by value->>'id' loop
  if x->>'quantity' is null or x->>'quantity' !~ '^[1-9][0-9]{0,2}$' then raise exception 'INVALID_QUANTITY';end if;
  qty:=(x->>'quantity')::integer;
  select * into p from public.customer_sale_products where id=x->>'id' for share;
  if not found or p.sale_status<>'active' or p.price_satang is null then raise exception 'PRODUCT_UNAVAILABLE';end if;
  if x->>'expected_price_satang' is null or x->>'expected_price_satang' !~ '^[0-9]{1,12}$' or (x->>'expected_price_satang')::bigint<>p.price_satang then raise exception 'PRICE_CHANGED';end if;
  sum_satang:=sum_satang+p.price_satang*qty;
 end loop;
 if sum_satang>999999999999 then raise exception 'TOTAL_TOO_LARGE';end if;
 insert into public.franchisee_orders(id,order_number,franchisee_id,user_id,branch_id,delivery_method,shipping_address,payment_method,order_status,payment_status,subtotal,delivery_fee,grand_total,note,sales_channel,client_request_id,request_fingerprint,recipient_name,contact_phone,quote_state)
 values(new_id,'DC-'||to_char(now() at time zone 'Asia/Bangkok','YYYYMMDD')||'-'||upper(replace(new_id::text,'-','')),f.id,p_actor,f.branch_id,p_delivery,case when p_delivery='delivery' then trim(p_address) else '' end,'transfer','Received','Pending',sum_satang::numeric/100,0,sum_satang::numeric/100,coalesce(p_note,''),'customer-v1',p_request_id,fingerprint,trim(p_recipient),p_phone,'pending');
 insert into public.franchisee_order_items(franchisee_order_id,product_id,product_name,unit,quantity,unit_price,line_total)
 select new_id,product.id,product.name,product.unit,(x.value->>'quantity')::integer,product.price_satang::numeric/100,product.price_satang::numeric*(x.value->>'quantity')::integer/100 from jsonb_array_elements(p_items) x join public.customer_sale_products product on product.id=(x.value->>'id');
 insert into public.customer_sales_events(actor_id,event_type,subject_id) values(p_actor,'order_submitted',new_id::text);
 return new_id;
end $$;

create function public.set_customer_sale_status(p_actor uuid,p_product text,p_status text,p_version integer)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.customer_sale_products;previous text;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 if p_status is null or p_status not in ('active','paused','hidden') then raise exception 'INVALID_STATUS';end if;
 select * into p from public.customer_sale_products where id=p_product for update;
 if not found then raise exception 'PRODUCT_NOT_FOUND';end if;
 if p.version is distinct from p_version then raise exception 'VERSION_CONFLICT';end if;
 if p_status='active' and p.price_satang is null then raise exception 'PRICE_REQUIRED';end if;
 previous:=p.sale_status;
 update public.customer_sale_products set sale_status=p_status,version=version+1,updated_at=now() where id=p_product returning * into p;
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'sale_status_changed',p_product,jsonb_build_object('from',previous,'to',p_status));
 return to_jsonb(p);
end $$;

create function public.review_customer_sales_order(p_actor uuid,p_order uuid,p_action text,p_version integer,p_delivery_fee_satang bigint,p_stock_checked boolean)
returns uuid language plpgsql security invoker set search_path=public as $$
declare o public.franchisee_orders;sum_satang bigint;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 if p_action is null or p_action not in ('confirm','cancel') then raise exception 'INVALID_ACTION';end if;
 select * into o from public.franchisee_orders where id=p_order and sales_channel='customer-v1' for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if o.sales_revision is distinct from p_version then raise exception 'VERSION_CONFLICT';end if;
 if o.payment_status<>'Pending' or o.receipt_number is not null or o.invoice_number is not null then raise exception 'ORDER_LOCKED';end if;
 if p_action='cancel' then
  if o.quote_state not in ('pending','confirmed') then raise exception 'ORDER_LOCKED';end if;
  update public.franchisee_orders set quote_state='cancelled',order_status='Cancelled',payment_status='Cancelled',sales_revision=sales_revision+1 where id=o.id;
 else
  if o.quote_state<>'pending' or o.order_status<>'Received' then raise exception 'ORDER_LOCKED';end if;
  if p_stock_checked is distinct from true then raise exception 'STOCK_CHECK_REQUIRED';end if;
  if p_delivery_fee_satang is null or p_delivery_fee_satang<0 or p_delivery_fee_satang>999999999999 or (o.delivery_method='pickup' and p_delivery_fee_satang<>0) then raise exception 'INVALID_DELIVERY_FEE';end if;
  -- Reject newly paused/hidden items and recheck active membership before confirmation.
  perform 1 from public.franchisee_profiles f join public.branches b on b.id=f.branch_id where f.id=o.franchisee_id and f.user_id=o.user_id and f.branch_id=o.branch_id and f.status='Active' and b.status='Active' for share of f,b;
  if not found then raise exception 'MEMBER_REQUIRED';end if;
  perform p.id from public.customer_sale_products p join public.franchisee_order_items i on i.product_id=p.id where i.franchisee_order_id=o.id order by p.id for share of p;
  if exists(select 1 from public.franchisee_order_items i left join public.customer_sale_products p on p.id=i.product_id where i.franchisee_order_id=o.id and (p.id is null or p.sale_status<>'active')) then raise exception 'PRODUCT_UNAVAILABLE';end if;
  select (sum(line_total)*100)::bigint into sum_satang from public.franchisee_order_items where franchisee_order_id=o.id;
  if sum_satang is null or sum_satang<=0 or sum_satang+p_delivery_fee_satang>999999999999 then raise exception 'INVALID_TOTAL';end if;
  update public.franchisee_orders set subtotal=sum_satang::numeric/100,delivery_fee=p_delivery_fee_satang::numeric/100,grand_total=(sum_satang+p_delivery_fee_satang)::numeric/100,quote_state='confirmed',order_status='Confirmed',stock_checked=true,quote_confirmed_at=now(),quote_confirmed_by=p_actor,sales_revision=sales_revision+1 where id=o.id;
 end if;
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'order_'||p_action,p_order::text,jsonb_build_object('delivery_fee_satang',case when p_action='confirm' then p_delivery_fee_satang else null end));
 return o.id;
end $$;
revoke all on function public.create_customer_sales_order(uuid,uuid,jsonb,text,text,text,text,text),public.set_customer_sale_status(uuid,text,text,integer),public.review_customer_sales_order(uuid,uuid,text,integer,bigint,boolean) from public,anon,authenticated;
grant execute on function public.create_customer_sales_order(uuid,uuid,jsonb,text,text,text,text,text),public.set_customer_sale_status(uuid,text,text,integer),public.review_customer_sales_order(uuid,uuid,text,integer,bigint,boolean) to service_role;

insert into public.customer_sale_products(id,name,category,unit,price_satang,image_path,sale_status) values
('milk-evap','นมข้นจืด','นม ครีม และความหวาน','หน่วย','5300','assets/products/d07161585ac6e1704e99.jpg','active'),
('milk-sweet','นมข้นหวาน','นม ครีม และความหวาน','หน่วย','11000','assets/products/499f6684d69ec7e61c6e.jpg','active'),
('creamer','ครีมเทียม','นม ครีม และความหวาน','หน่วย','7800','assets/products/e9885dd1d2b005e73962.jpg','active'),
('stock-8b0aefeb3cd613','น้ำตาลแดง','นม ครีม และความหวาน','หน่วย','2700','assets/products/c63ae0dc5e69c2ee17be.jpg','active'),
('stock-71916cf78481ae','น้ำตาลทราย','นม ครีม และความหวาน','หน่วย','2900','assets/products/b633d61b1c727300b9c0.jpg','active'),
('stock-e2493e470db464','เนสกาแฟ','กาแฟ โกโก้ และมอลต์','หน่วย','14800','assets/products/96f9e8bfae4f7f4c984a-cutout.webp','active'),
('stock-686f99e0007983','กาแฟมอคโคน่า','กาแฟ โกโก้ และมอลต์','หน่วย','16000','assets/products/368f0e2c8054f647eb69.jpg','active'),
('cocoa','โกโก้','กาแฟ โกโก้ และมอลต์','หน่วย','37000','assets/products/1128c690b84bd3e59329.jpg','active'),
('stock-c5d97de2d905ca','โอวัลติน','กาแฟ โกโก้ และมอลต์','หน่วย','15700','assets/products/75d0398fcf8bbd1cc3e0.jpg','active'),
('stock-8d970b961372e3','น้ำเขียว','ไซรัปและน้ำผลไม้','หน่วย','7000','assets/products/8f7c6a4e2ee472e54f92.jpg','active'),
('stock-824210d5a8b112','โซดา','เครื่องดื่มพื้นฐาน','หน่วย','700','assets/products/2a743c02a2d48580caa5.jpg','active'),
('stock-3a0a255d465c3b','ผงมะนาว','ผงชงและผงรสชาติ','หน่วย','7900','assets/products/e7211bd2cae618b8c19a.jpg','active'),
('pearl','ไข่มุก','ท็อปปิ้ง','หน่วย','3600','assets/products/9d9fbad666a5e92c3363-cutout.webp','active'),
('stock-254bec9f3a40d5','น้ำผึ้ง','นม ครีม และความหวาน','หน่วย','8500','assets/products/8fd7f5166457e5c4b6ff.jpg','active'),
('tea-red','ชาแดง','ชา','หน่วย','4000','assets/products/c445a082d8dafba0053b-cutout.webp','active'),
('tea-green','ชาเขียว','ชา','หน่วย','4000','assets/products/4ae93b8a0facf13a6186-cutout.webp','active'),
('stock-b1d79861a1b240','ชาไต้หวัน','ชา','หน่วย','4000','assets/products/6c37a9361cf7776f221f-cutout.webp','active'),
('stock-d9419f671c4e54','ชามะลิ','ชา','หน่วย','4000','assets/products/d80de720176d2397e84a-cutout.webp','active'),
('stock-5005d326a1ed70','ผงชาพีช','ชา','หน่วย','15000','assets/products/f50d6bf4dd1a8d671f94.jpg','active'),
('stock-4e03557ee38659','ผงเผือก','ผงชงและผงรสชาติ','หน่วย','15000','assets/products/477d44b90a5231e89688-cutout.webp','active'),
('stock-6b34fc0c08b459','ผงแคนตาลูป','ผงชงและผงรสชาติ','หน่วย','15000','assets/products/cc84167f7a0e896cd544-cutout.webp','active'),
('stock-fd439a8d87e445','ผงพั๊น','ผงชงและผงรสชาติ','หน่วย','12000','assets/products/9de4c3b21a30bc47a77e-cutout.webp','active'),
('stock-8ed190f275c760','ผงกล้วยหอม','ผงชงและผงรสชาติ','หน่วย','15000','assets/products/05fa53eaf8c86404e1ff.jpg','active'),
('stock-b9da2ee554512f','ผงมันม่วง','ผงชงและผงรสชาติ','หน่วย','14500','assets/products/2f95fc77d9e6947fddf5.jpg','active'),
('stock-91f9775e5d4163','น้ำบราวชูก้า','ไซรัปและน้ำผลไม้','หน่วย','7900','assets/products/6ca6475731c34cb76f14.jpg','active'),
('stock-3c6ed0f0ff3404','น้ำลิ้นจี่','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/b99ea7b5f1fd73fdd83b.jpg','active'),
('stock-ce1c4a8bfaa7f1','ผงเฟรปเป้','ผงชงและผงรสชาติ','หน่วย','7300','assets/products/8fed1685984334e51d5a-cutout.webp','active'),
('stock-04511124d9131a','น้ำแอปเปิ้ล','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/142721699be94dcf8b88.jpg','active'),
('stock-1a24ef95b2c3ca','น้ำองุ่น','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/3e096939d67dcc02a5c9.jpg','active'),
('stock-c2976271956d65','น้ำบลูฮาวาย','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/3240dde97a374c1ed554.jpg','active'),
('stock-28dc1c8fe588a8','น้ำเสาวรส','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/a9494dbf18056d05e357.jpg','active'),
('stock-bde4f6ec415963','น้ำมะม่วง','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/975eaa70679250ea5075.jpg','active'),
('stock-8b0697b27a490f','น้ำแคนตาลูป','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/752259c581acc1680f58.jpg','active'),
('stock-1350083b678057','น้ำกีวี่','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/9fee0de36ec6efd7ca08.jpg','active'),
('stock-60ea55487c227d','น้ำผึ้งมะนาว','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/e8bf02b7a606c2b6018c.jpg','active'),
('stock-f2bff6a027a09f','น้ำส้ม','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/a3b3e0a6856ae92f67c5.jpg','active'),
('stock-4b7b16eb531683','น้ำมะพร้าว','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/74ec13878f1a9ee487f9-cutout.webp','active'),
('stock-e6f0c4a03440e8','น้ำมะนาว','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/35845f9abe5563fe4e20.jpg','active'),
('stock-c618b702f57f33','น้ำบ๊วย','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/db39bcf89b37a2900728.jpg','active'),
('stock-46eca1a21607ba','น้ำแดงเฟรชชี่','ไซรัปและน้ำผลไม้','หน่วย','6900','assets/products/99f837ca4fe5d02efb5f.jpg','active'),
('stock-4be804f3e7d0bf','อัญชันมะนาว','ผงชงและผงรสชาติ','หน่วย','12000','assets/products/d1fb4a9271822dbcbdd6.jpg','active'),
('konjac','บุกบราวน์','ท็อปปิ้ง','หน่วย','4900','assets/products/5b1b6395ea81ab07cd94.jpg','active'),
('stock-39e6108d3f9d89','บุกแพนด้า','ท็อปปิ้ง','หน่วย','4900','assets/products/136056425c46e65d3e34-cutout.webp','active'),
('stock-f8c181514b32af','ฟรุ๊ตสลัด','ท็อปปิ้ง','หน่วย','4900','assets/products/3ad95f1be0a74dd6d47d-cutout.webp','active'),
('cups','แก้วโดมิ','บรรจุภัณฑ์','หน่วย','150','assets/products/dd96a224a76ce4425978.jpg','active'),
('stock-2a3a0944ef91c9','ฝาโดม','บรรจุภัณฑ์','หน่วย','4500','assets/products/0b87b0d661dfa87c3b25-cutout.webp','active'),
('stock-6f0baddf65fa0e','หลอดเล็ก','บรรจุภัณฑ์','หน่วย','2500','assets/products/a1ebb7ad1def00c025cc.jpg','active'),
('straws','หลอดไข่มุก','บรรจุภัณฑ์','หน่วย','4000','assets/products/314c53686a060d09d196.jpg','active'),
('stock-1e3d3b42ef8871','ถุงสายเดี่ยว','บรรจุภัณฑ์','หน่วย','2100','assets/products/56d4f19955280e84608d-cutout.webp','active'),
('stock-d6188c4f7f276b','ม้วนซีล','บรรจุภัณฑ์','หน่วย','96000','assets/products/19d517bef84a80d796c8-cutout.webp','active'),
('stock-847f4a3bd1f984','ถุง 8x16','บรรจุภัณฑ์','หน่วย','4900','assets/products/c0b4c9cf87ffb79d74f8-cutout.webp','active'),
('stock-7eab216c17bee4','ถุง 7x15','บรรจุภัณฑ์','หน่วย','4900','assets/products/947c62057a42ecdb8b84-cutout.webp','active'),
('stock-6670d935c26acc','ถุง 9x18','บรรจุภัณฑ์','หน่วย','4900','assets/products/b39a4d115f9776ce6865-cutout.webp','active'),
('stock-3e9006f98d32c4','ถุง 6x14','บรรจุภัณฑ์','หน่วย','3500','assets/products/11b24ec224178891f9a0-cutout.webp','active'),
('stock-ed6486af390a5f','กระดาษปริ้น','บรรจุภัณฑ์','หน่วย','4500','assets/products/e6881b34f43fe3e8809c-cutout.webp','active'),
('stock-a0afc6f1b3dccc','เสื้อ Domicha( L)','สินค้าเสริม','หน่วย','1800','assets/products/3a5f7f228f691a0fceb1-cutout.webp','active'),
('stock-97be6bec595480','เสื้อ Domicha( M)','สินค้าเสริม','หน่วย','1800','assets/products/3a5f7f228f691a0fceb1-cutout.webp','active'),
('stock-c63b3094b25412','เสื้อ Domicha( XL)','สินค้าเสริม','หน่วย','1800','assets/products/3a5f7f228f691a0fceb1-cutout.webp','active'),
('stock-37596ebc0bd25c','สับปะรด','ไซรัปและน้ำผลไม้','หน่วย',null,'assets/products/96090ce82e88f4ad4917.jpg','paused'),
('stock-bfa70e74e5ebc5','น้ำสตรอ','ไซรัปและน้ำผลไม้','หน่วย','7300','assets/products/dd425989c4446258e148.jpg','active'),
('stock-56b9b7f04bab39','เสื้อ Domicha( S)','สินค้าเสริม','หน่วย',null,'assets/products/3a5f7f228f691a0fceb1-cutout.webp','paused'),
('stock-c006be013ee754','ผงสมูทตี้','ผงชงและผงรสชาติ','หน่วย','150','assets/products/94036c395db24a7b2c7c-cutout.webp','active'),
('stock-1927dd17a999b1','แดงเฮลบลูบอย','ไซรัปและน้ำผลไม้','หน่วย','6900','assets/products/4760ad466a73afadaf77.jpg','active'),
('stock-bf873342a07d82','เสื้อ Domicha( 2XL)','สินค้าเสริม','หน่วย','25000','assets/products/3a5f7f228f691a0fceb1-cutout.webp','active'),
('stock-00241c07713ace','เอี๊ยม Domicha','สินค้าเสริม','หน่วย','18000','assets/products/903e3a4bef5eb27186be.jpg','active'),
('stock-72446adba25859','ถุงขยะ M: 26x34','บรรจุภัณฑ์','หน่วย',null,'assets/products/3703c0f88af4afa2f2fb.jpg','paused'),
('stock-91625367dd008b','ถุงขยะ L: 30x40','บรรจุภัณฑ์','หน่วย',null,'assets/products/e89d5ed5576b4e3664cb.jpg','paused'),
('stock-e451b34797302a','น้ำบลูเบอร์รี่','ไซรัปและน้ำผลไม้','หน่วย',null,'assets/products/6357a4874d5f69853674-cutout.webp','paused');
