-- Payment settings are closed until the linked owner verifies the receiving account.
create table public.customer_payment_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 promptpay_id text not null default '', account_name text not null default '',
 seller_name text not null default '', seller_address text not null default '',details jsonb not null default '{}',
 version integer not null default 1,updated_at timestamptz not null default now(),updated_by uuid references public.users(id)
);
insert into public.customer_payment_settings(id) values(true);
create table public.customer_payment_requests (
 order_id uuid primary key references public.franchisee_orders(id),amount_satang bigint not null check(amount_satang>0),
 quote_revision integer not null,merchant jsonb not null,created_at timestamptz not null default now()
);
create table public.customer_receipt_counters(month text primary key,next_number bigint not null);
create table public.customer_receipts (
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.franchisee_orders(id),
 number text not null unique,issued_at timestamptz not null default now(),received_at timestamptz not null,
 confirmed_by uuid not null references public.users(id),bank_reference text not null unique,
 snapshot jsonb not null
);
create table public.customer_receipt_jobs (
 id uuid primary key default gen_random_uuid(),receipt_id uuid not null references public.customer_receipts(id),
 kind text not null check(kind in ('drive','line-owner')),status text not null default 'pending' check(status in ('pending','processing','succeeded','failed')),
 attempts integer not null default 0,lease_id uuid,lease_until timestamptz,next_attempt_at timestamptz not null default now(),
 result_url text,last_error text,created_at timestamptz not null default now(),completed_at timestamptz,
 unique(receipt_id,kind)
);
create table public.customer_payment_worker (
 id boolean primary key default true check(id),secret_sha256 text not null,updated_by uuid not null references public.users(id),updated_at timestamptz not null default now()
);
alter table public.franchisee_orders add column billing_data jsonb;
alter table public.customer_payment_settings enable row level security;
alter table public.customer_payment_requests enable row level security;
alter table public.customer_receipt_counters enable row level security;
alter table public.customer_receipts enable row level security;
alter table public.customer_receipt_jobs enable row level security;
alter table public.customer_payment_worker enable row level security;
revoke all on public.customer_payment_settings,public.customer_payment_requests,public.customer_receipt_counters,public.customer_receipts,public.customer_receipt_jobs,public.customer_payment_worker from public,anon,authenticated;
grant all on public.customer_payment_settings,public.customer_payment_requests,public.customer_receipt_counters,public.customer_receipts,public.customer_receipt_jobs,public.customer_payment_worker to service_role;

create function public.save_customer_payment_settings(p_actor uuid,p_version integer,p_enabled boolean,p_promptpay text,p_account text,p_seller text,p_address text,p_details jsonb)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 if p_enabled is null or p_promptpay is null or (p_promptpay<>'' and p_promptpay !~ '^(0[0-9]{9}|[0-9]{13})$') or length(coalesce(p_account,''))>160 or length(coalesce(p_seller,''))>200 or length(coalesce(p_address,''))>1500 then raise exception 'INVALID_PAYMENT_SETTINGS';end if;
 if p_details is null or jsonb_typeof(p_details)<>'object' or length(p_details::text)>1000 or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('bank_name','bank_account','seller_tax_id','seller_phone')) then raise exception 'INVALID_PAYMENT_SETTINGS';end if;
 if p_enabled and (p_promptpay='' or length(trim(coalesce(p_account,'')))=0 or length(trim(coalesce(p_seller,'')))=0 or length(trim(coalesce(p_address,'')))=0) then raise exception 'PAYMENT_SETTINGS_REQUIRED';end if;
 update public.customer_payment_settings set enabled=p_enabled,promptpay_id=p_promptpay,account_name=trim(p_account),seller_name=trim(p_seller),seller_address=trim(p_address),details=p_details,version=version+1,updated_at=now(),updated_by=p_actor where id=true and version=p_version;
 if not found then raise exception 'VERSION_CONFLICT';end if;
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'payment_settings_changed','brand',jsonb_build_object('enabled',p_enabled));
end $$;

create function public.create_customer_sales_order_billing(p_actor uuid,p_request_id uuid,p_items jsonb,p_recipient text,p_phone text,p_delivery text,p_address text,p_note text,p_billing jsonb)
returns uuid language plpgsql security invoker set search_path=public as $$
declare oid uuid;previous jsonb;
begin
 if p_billing is null or jsonb_typeof(p_billing)<>'object' or length(coalesce(p_billing->>'name',''))>200 or length(coalesce(p_billing->>'address',''))>1500 or exists(select 1 from jsonb_object_keys(p_billing) k where k not in ('name','address')) then raise exception 'INVALID_BILLING';end if;
 oid:=public.create_customer_sales_order(p_actor,p_request_id,p_items,p_recipient,p_phone,p_delivery,p_address,p_note);
 select billing_data into previous from public.franchisee_orders where id=oid for update;
 if previous is not null and previous<>p_billing then raise exception 'REQUEST_CONFLICT';end if;
 if previous is null then update public.franchisee_orders set billing_data=p_billing where id=oid;end if;
 return oid;
end $$;

create function public.prepare_customer_payment(p_actor uuid,p_order uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare o public.franchisee_orders;s public.customer_payment_settings;r public.customer_payment_requests;
begin
 select * into o from public.franchisee_orders where id=p_order and sales_channel='customer-v1' for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if p_actor is null or (p_actor<>o.user_id and not(p_actor='1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid and exists(select 1 from public.users where id=p_actor and role='Admin'))) then raise exception 'ORDER_NOT_FOUND';end if;
 if o.quote_state<>'confirmed' or o.payment_status<>'Pending' or o.order_status<>'Confirmed' or not o.stock_checked then raise exception 'ORDER_LOCKED';end if;
 select * into s from public.customer_payment_settings where id=true for share;
 if not s.enabled then raise exception 'PAYMENT_NOT_READY';end if;
 select * into r from public.customer_payment_requests where order_id=o.id;
 if found then return to_jsonb(r);end if;
 insert into public.customer_payment_requests(order_id,amount_satang,quote_revision,merchant)
 values(o.id,(o.grand_total*100)::bigint,o.sales_revision,jsonb_build_object('promptpay_id',s.promptpay_id,'account_name',s.account_name,'seller_name',s.seller_name,'seller_address',s.seller_address)||s.details) returning * into r;
 return to_jsonb(r);
end $$;

create function public.confirm_customer_payment(p_actor uuid,p_order uuid,p_version integer,p_amount_satang bigint,p_reference text,p_received_at timestamptz,p_checked boolean)
returns uuid language plpgsql security invoker set search_path=public as $$
declare o public.franchisee_orders;r public.customer_payment_requests;s public.customer_receipts;month_key text;counter bigint;num text;branch text;lines jsonb;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 select * into o from public.franchisee_orders where id=p_order and sales_channel='customer-v1' for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if p_checked is distinct from true or p_reference is null or trim(p_reference) !~ '^[A-Za-z0-9][A-Za-z0-9._/-]{5,119}$' or p_received_at is null then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
 -- Idempotent network retry returns the same receipt; mismatched facts never overwrite it.
 select * into s from public.customer_receipts where order_id=o.id;
 if found then
  if s.bank_reference<>upper(trim(p_reference)) or (s.snapshot->>'total_satang')::bigint is distinct from p_amount_satang or s.received_at<>p_received_at then raise exception 'PAYMENT_ALREADY_CONFIRMED';end if;
  return s.id;
 end if;
 if o.sales_revision is distinct from p_version then raise exception 'VERSION_CONFLICT';end if;
 if o.quote_state<>'confirmed' or o.payment_status<>'Pending' or o.order_status<>'Confirmed' or not o.stock_checked then raise exception 'ORDER_LOCKED';end if;
 select * into r from public.customer_payment_requests where order_id=o.id;
 if not found then raise exception 'PAYMENT_REQUEST_REQUIRED';end if;
 if p_amount_satang is distinct from r.amount_satang or p_amount_satang is distinct from (o.grand_total*100)::bigint or r.quote_revision<>o.sales_revision then raise exception 'PAYMENT_AMOUNT_MISMATCH';end if;
 if p_received_at<o.created_at-interval '15 minutes' or p_received_at>now()+interval '5 minutes' then raise exception 'INVALID_PAYMENT_TIME';end if;
 select branch_name into branch from public.branches where id=o.branch_id;
 select jsonb_agg(jsonb_build_object('name',product_name,'unit',unit,'quantity',quantity,'price_satang',(unit_price*100)::bigint,'total_satang',(line_total*100)::bigint) order by created_at,id) into lines from public.franchisee_order_items where franchisee_order_id=o.id;
 if lines is null then raise exception 'INVALID_ITEMS';end if;
 month_key:=to_char(now() at time zone 'Asia/Bangkok','YYYYMM');
 insert into public.customer_receipt_counters(month,next_number) values(month_key,1) on conflict(month) do update set next_number=customer_receipt_counters.next_number+1 returning next_number into counter;
 num:='DC-RC-'||month_key||'-'||lpad(counter::text,6,'0');
 insert into public.customer_receipts(order_id,number,received_at,confirmed_by,bank_reference,snapshot)
 values(o.id,num,p_received_at,p_actor,upper(trim(p_reference)),jsonb_build_object('version',1,'order_number',o.order_number,'customer_id',o.user_id,'branch_id',o.branch_id,'branch_name',branch,'buyer_name',coalesce(nullif(trim(o.billing_data->>'name'),''),o.recipient_name),'buyer_address',coalesce(nullif(trim(o.billing_data->>'address'),''),o.shipping_address,''),'seller',r.merchant-'promptpay_id','items',lines,'subtotal_satang',(o.subtotal*100)::bigint,'delivery_satang',(o.delivery_fee*100)::bigint,'total_satang',p_amount_satang,'payment_method','โอนผ่านพร้อมเพย์','document_type','ใบเสร็จรับเงิน','tax_invoice',false)) returning * into s;
 update public.franchisee_orders set payment_status='Paid',payment_reference=upper(trim(p_reference)),payment_received_at=p_received_at,payment_confirmed_at=now(),payment_confirmed_by=p_actor,receipt_number=num,receipt_issued_at=s.issued_at,receipt_delivery_status='Pending',sales_revision=sales_revision+1 where id=o.id;
 insert into public.customer_receipt_jobs(receipt_id,kind) values(s.id,'drive'),(s.id,'line-owner');
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'payment_confirmed',o.id::text,jsonb_build_object('receipt_id',s.id,'amount_satang',p_amount_satang));
 return s.id;
end $$;

create function public.claim_customer_receipt_job(p_kinds text[])
returns jsonb language plpgsql security invoker set search_path=public as $$
declare j public.customer_receipt_jobs;r public.customer_receipts;
begin
 select * into j from public.customer_receipt_jobs where kind=any(p_kinds) and attempts<10 and next_attempt_at<=now() and (status in ('pending','failed') or (status='processing' and lease_until<now())) order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 update public.customer_receipt_jobs set status='processing',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '10 minutes' where id=j.id returning * into j;
 select * into r from public.customer_receipts where id=j.receipt_id;
 return jsonb_build_object('job',to_jsonb(j),'receipt',to_jsonb(r));
end $$;
create function public.finish_customer_receipt_job(p_id uuid,p_lease uuid,p_success boolean,p_url text,p_error text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare j public.customer_receipt_jobs;
begin
 if p_success and p_url is null and exists(select 1 from public.customer_receipt_jobs where id=p_id and kind='drive') then raise exception 'DRIVE_URL_REQUIRED';end if;
 if p_success and p_url is not null and p_url !~ '^https://drive.google.com/file/d/[A-Za-z0-9_-]+/view$' then raise exception 'INVALID_DRIVE_URL';end if;
 update public.customer_receipt_jobs set status=case when p_success then 'succeeded' else 'failed' end,result_url=case when p_success then p_url else null end,last_error=case when p_success then null else left(p_error,200) end,lease_until=null,next_attempt_at=now()+interval '5 minutes',completed_at=case when p_success then now() else null end where id=p_id and lease_id=p_lease and status='processing' and lease_until>now() returning * into j;
 if not found then return false;end if;
 if p_success and j.kind='drive' then update public.franchisee_orders set receipt_drive_file_url=p_url,receipt_delivery_status='Archived',receipt_month_folder_name=to_char(r.issued_at at time zone 'Asia/Bangkok','YYYY-MM') from public.customer_receipts r where r.id=j.receipt_id and franchisee_orders.id=r.order_id;end if;
 return true;
end $$;
revoke all on function public.save_customer_payment_settings(uuid,integer,boolean,text,text,text,text,jsonb),public.create_customer_sales_order_billing(uuid,uuid,jsonb,text,text,text,text,text,jsonb),public.prepare_customer_payment(uuid,uuid),public.confirm_customer_payment(uuid,uuid,integer,bigint,text,timestamptz,boolean),public.claim_customer_receipt_job(text[]),public.finish_customer_receipt_job(uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.save_customer_payment_settings(uuid,integer,boolean,text,text,text,text,jsonb),public.create_customer_sales_order_billing(uuid,uuid,jsonb,text,text,text,text,text,jsonb),public.prepare_customer_payment(uuid,uuid),public.confirm_customer_payment(uuid,uuid,integer,bigint,text,timestamptz,boolean),public.claim_customer_receipt_job(text[]),public.finish_customer_receipt_job(uuid,uuid,boolean,text,text) to service_role;
