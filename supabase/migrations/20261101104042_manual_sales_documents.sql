-- Owner-only manual sales. No inventory mutation or VAT invoice issuance.
create table public.manual_document_parties(id uuid primary key default gen_random_uuid(),identity_key text not null unique,buyer jsonb not null,created_at timestamptz not null default now());
create table public.manual_sales_documents(
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique,request_fingerprint text not null,
 number text not null unique,status text not null default 'Unpaid' check(status in ('Unpaid','Paid','Cancelled')),
 version integer not null default 0,snapshot jsonb not null,created_by uuid not null references public.users(id),created_at timestamptz not null default now()
);
alter table public.manual_document_parties enable row level security;
alter table public.manual_sales_documents enable row level security;
revoke all on public.manual_document_parties,public.manual_sales_documents from public,anon,authenticated;
grant all on public.manual_document_parties,public.manual_sales_documents to service_role;
alter table public.customer_receipts add column manual_document_id uuid unique references public.manual_sales_documents(id);
alter table public.customer_receipts alter column order_id drop not null;
alter table public.customer_receipts add constraint customer_receipt_one_source check((order_id is null)<>(manual_document_id is null));
create function public.require_manual_document_owner(p_actor uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
end $$;
create function public.receive_manual_sales_document(p_actor uuid,p_id uuid,p_version integer,p_payment jsonb) returns uuid language plpgsql security invoker set search_path=public as $$
declare d public.manual_sales_documents;r public.customer_receipts;method text;ref text;received timestamptz;amount bigint;counter bigint;month_key text;num text;label text;
begin
 perform public.require_manual_document_owner(p_actor);
 if jsonb_typeof(p_payment) is distinct from 'object' or p_payment->'checked' is distinct from 'true'::jsonb then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
 method:=p_payment->>'method';if method is null or method not in ('transfer','promptpay','cash') then raise exception 'PAYMENT_METHOD_REQUIRED';end if;
 if coalesce(p_payment->>'amount','') !~ '^[1-9][0-9]{0,11}$' then raise exception 'PAYMENT_AMOUNT_MISMATCH';end if;
 amount:=(p_payment->>'amount')::bigint;
 if coalesce(p_payment->>'receivedAt','')='' then raise exception 'INVALID_PAYMENT_TIME';end if;
 received:=(p_payment->>'receivedAt')::timestamptz;
 if received<'2000-01-01' or received>now()+interval '5 minutes' then raise exception 'INVALID_PAYMENT_TIME';end if;
 if method='cash' then ref:=null;label:='เงินสด';
 else
  if coalesce(p_payment->>'reference','') !~ '^[A-Za-z0-9][A-Za-z0-9._/ -]{5,119}$' then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
  ref:=regexp_replace(upper(trim(p_payment->>'reference')),'[^A-Z0-9]','','g');if length(ref)<6 then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
  label:=case when method='promptpay' then 'QR พร้อมเพย์' else 'โอนผ่านบัญชี' end;
 end if;
 select * into d from public.manual_sales_documents where id=p_id for update;if not found then raise exception 'ORDER_NOT_FOUND';end if;
 select * into r from public.customer_receipts where manual_document_id=d.id;
 if found then
  if r.payment_method_code<>method or r.bank_reference is distinct from ref or r.received_at<>received or (r.snapshot->>'total_satang')::bigint<>amount then raise exception 'PAYMENT_ALREADY_CONFIRMED';end if;
  return r.id;
 end if;
 if d.status<>'Unpaid' then raise exception 'ORDER_LOCKED';end if;
 if d.version is distinct from p_version then raise exception 'VERSION_CONFLICT';end if;
 if (d.snapshot->>'total_satang')::bigint<>amount then raise exception 'PAYMENT_AMOUNT_MISMATCH';end if;
 month_key:=to_char(now() at time zone 'Asia/Bangkok','YYYYMM');
 insert into public.customer_receipt_counters(month,next_number) values(month_key,1) on conflict(month) do update set next_number=customer_receipt_counters.next_number+1 returning next_number into counter;
 num:='DC-RC-'||month_key||'-'||lpad(counter::text,greatest(6,length(counter::text)),'0');
 insert into public.customer_receipts(manual_document_id,number,received_at,confirmed_by,bank_reference,payment_method_code,snapshot)
 values(d.id,num,received,p_actor,ref,method,d.snapshot||jsonb_build_object('payment_method',label,'payment_method_code',method,'bank_reference',ref,'document_type','ใบเสร็จรับเงิน','tax_invoice',false)) returning * into r;
 update public.manual_sales_documents set status='Paid',version=version+1 where id=d.id;
 insert into public.customer_receipt_jobs(receipt_id,kind) values(r.id,'drive'),(r.id,'line-owner');
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'manual_payment_confirmed',d.id::text,jsonb_build_object('receipt_id',r.id,'amount_satang',amount,'method',method));
 return r.id;
end $$;
create function public.create_manual_sales_document(p_actor uuid,p_request uuid,p_body jsonb,p_payment jsonb default null) returns uuid language plpgsql security invoker set search_path=public as $$
declare d public.manual_sales_documents;b jsonb;x jsonb;lines jsonb:='[]';qty integer;price bigint;subtotal bigint:=0;fee bigint;party_id uuid;customer_id uuid;branch_id uuid;settings public.customer_payment_settings;counter bigint;month_key text;name text;branch text;fingerprint text;rid uuid;
begin
 perform public.require_manual_document_owner(p_actor);
 if p_request is null or jsonb_typeof(p_body) is distinct from 'object' or length(p_body::text)>30000 or p_body->>'stockMode' is distinct from 'none' or coalesce(p_body->>'taxInvoice','false')<>'false' then raise exception 'INVALID_MANUAL_DOCUMENT';end if;
 fingerprint:=md5(jsonb_build_object('body',p_body,'payment',p_payment)::text);
 perform pg_advisory_xact_lock(hashtextextended('manual:'||p_request::text,0));
 select * into d from public.manual_sales_documents where request_id=p_request;
 if found then if d.request_fingerprint<>fingerprint then raise exception 'REQUEST_CONFLICT';end if;return d.id;end if;
 b:=p_body->'buyer';name:=trim(b->>'name');branch:=trim(p_body->>'branch');
 if jsonb_typeof(b) is distinct from 'object' or length(coalesce(name,'')) not between 1 and 200 or length(coalesce(branch,'')) not between 1 and 200 or length(trim(coalesce(b->>'address',''))) not between 1 and 1500 or length(coalesce(b->>'phone',''))>30 or (coalesce(b->>'taxId','')<>'' and b->>'taxId' !~ '^[0-9]{13}$') or length(coalesce(p_body->>'note',''))>500 then raise exception 'INVALID_MANUAL_DOCUMENT';end if;
 b:=jsonb_build_object('name',name,'address',trim(b->>'address'),'phone',coalesce(b->>'phone',''),'taxId',coalesce(b->>'taxId',''));
 if jsonb_typeof(p_body->'items') is distinct from 'array' then raise exception 'INVALID_ITEMS';end if;
 if jsonb_array_length(p_body->'items') not between 1 and 50 then raise exception 'INVALID_ITEMS';end if;
 for x in select value from jsonb_array_elements(p_body->'items') loop
  if length(trim(coalesce(x->>'name',''))) not between 1 and 200 or length(trim(coalesce(x->>'unit',''))) not between 1 and 40 or coalesce(x->>'quantity','') !~ '^[1-9][0-9]{0,5}$' or coalesce(x->>'price_satang','') !~ '^(0|[1-9][0-9]{0,8})$' then raise exception 'INVALID_ITEMS';end if;
  qty:=(x->>'quantity')::integer;price:=(x->>'price_satang')::bigint;subtotal:=subtotal+qty*price;
  lines:=lines||jsonb_build_array(jsonb_build_object('name',trim(x->>'name'),'unit',trim(x->>'unit'),'quantity',qty,'price_satang',price,'total_satang',qty*price));
 end loop;
 if coalesce(p_body->>'deliveryFee','') !~ '^(0|[1-9][0-9]{0,8})$' then raise exception 'INVALID_MANUAL_DOCUMENT';end if;
 fee:=(p_body->>'deliveryFee')::bigint;
 if subtotal+fee not between 1 and 99999999999 then raise exception 'INVALID_MANUAL_DOCUMENT';end if;
 select * into settings from public.customer_payment_settings where id=true for share;
 if length(trim(coalesce(settings.seller_name,'')))=0 or length(trim(coalesce(settings.seller_address,'')))=0 then raise exception 'PAYMENT_SETTINGS_REQUIRED';end if;
 if coalesce(p_body->>'customerId','')<>'' then
  select fp.user_id,fp.branch_id into customer_id,branch_id from public.franchisee_profiles fp join public.branches br on br.id=fp.branch_id where fp.user_id=(p_body->>'customerId')::uuid and fp.status='Active' and br.status='Active' for share of fp,br;
  if not found then raise exception 'MEMBER_REQUIRED';end if;
 else
  insert into public.manual_document_parties(identity_key,buyer) values(md5(b::text),b) on conflict(identity_key) do update set identity_key=excluded.identity_key returning id into party_id;
  customer_id:=party_id;branch_id:=md5(party_id::text||':'||branch)::uuid;
 end if;
 month_key:=to_char(now() at time zone 'Asia/Bangkok','YYYYMM');
 insert into public.customer_receipt_counters(month,next_number) values('MANUAL-'||month_key,1) on conflict(month) do update set next_number=customer_receipt_counters.next_number+1 returning next_number into counter;
 insert into public.manual_sales_documents(request_id,request_fingerprint,number,created_by,snapshot) values(p_request,fingerprint,'DC-MI-'||month_key||'-'||lpad(counter::text,greatest(6,length(counter::text)),'0'),p_actor,jsonb_build_object('version',1,'source','manual','stock_mode','none','recorded_by',(select coalesce(full_name,'เจ้าของแบรนด์') from public.users where id=p_actor),'tax_invoice',false,'buyer_name',b->>'name','buyer_address',b->>'address','buyer_phone',b->>'phone','buyer_tax_id',b->>'taxId','branch_name',branch,'customer_id',customer_id,'branch_id',branch_id,'seller',jsonb_build_object('seller_name',settings.seller_name,'seller_address',settings.seller_address,'account_name',settings.account_name)||settings.details,'items',lines,'subtotal_satang',subtotal,'delivery_satang',fee,'total_satang',subtotal+fee,'note',coalesce(p_body->>'note',''))) returning * into d;
 update public.manual_sales_documents set snapshot=snapshot||jsonb_build_object('order_number',d.number) where id=d.id;
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'manual_document_created',d.id::text,jsonb_build_object('stock_mode','none','amount_satang',subtotal+fee));
 if p_payment is not null then rid:=public.receive_manual_sales_document(p_actor,d.id,0,p_payment);end if;
 return d.id;
end $$;
create function public.cancel_manual_sales_document(p_actor uuid,p_id uuid,p_version integer) returns void language plpgsql security invoker set search_path=public as $$
begin
 perform public.require_manual_document_owner(p_actor);
 update public.manual_sales_documents set status='Cancelled',version=version+1 where id=p_id and version=p_version and status='Unpaid';
 if not found then raise exception 'ORDER_LOCKED';end if;
 insert into public.customer_sales_events(actor_id,event_type,subject_id) values(p_actor,'manual_document_cancelled',p_id::text);
end $$;
create function public.manual_document_customers(p_actor uuid) returns jsonb language plpgsql security invoker set search_path=public as $$
begin
 perform public.require_manual_document_owner(p_actor);
 return coalesce((select jsonb_agg(jsonb_build_object('id',fp.user_id,'name',fp.owner_name,'branch',br.branch_name) order by br.branch_name,fp.user_id) from public.franchisee_profiles fp join public.branches br on br.id=fp.branch_id where fp.status='Active' and br.status='Active'),'[]');
end $$;
revoke all on function public.require_manual_document_owner(uuid),public.receive_manual_sales_document(uuid,uuid,integer,jsonb),public.create_manual_sales_document(uuid,uuid,jsonb,jsonb),public.cancel_manual_sales_document(uuid,uuid,integer),public.manual_document_customers(uuid) from public,anon,authenticated;
grant execute on function public.require_manual_document_owner(uuid),public.receive_manual_sales_document(uuid,uuid,integer,jsonb),public.create_manual_sales_document(uuid,uuid,jsonb,jsonb),public.cancel_manual_sales_document(uuid,uuid,integer),public.manual_document_customers(uuid) to service_role;
