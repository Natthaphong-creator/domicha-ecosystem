-- Service-only delegated payment review. No accounts are granted by this migration.
create table public.customer_payment_reviewers (
 user_id uuid primary key references public.users(id),
 active boolean not null default false,
 granted_by uuid not null references public.users(id),
 updated_at timestamptz not null default now()
);
alter table public.customer_payment_reviewers enable row level security;
revoke all on public.customer_payment_reviewers from public,anon,authenticated;
grant all on public.customer_payment_reviewers to service_role;

create function public.require_customer_payment_reviewer(p_actor uuid)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_actor='1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid and exists(select 1 from public.users where id=p_actor and role='Admin') then return;end if;
 -- Lock serializes a concurrent revocation with confirmation; permissions never come from JWT metadata.
 perform 1 from public.customer_payment_reviewers where user_id=p_actor and active for share;
 if not found then raise exception 'PAYMENT_REVIEWER_REQUIRED';end if;
 if not exists(select 1 from auth.users where id=p_actor and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null and (banned_until is null or banned_until<=now())) then raise exception 'PAYMENT_REVIEWER_REQUIRED';end if;
end $$;

create function public.set_customer_payment_reviewer(p_actor uuid,p_email text,p_active boolean)
returns uuid language plpgsql security invoker set search_path=public as $$
declare target uuid;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 if p_active is null or p_email is null or length(trim(p_email))>254 then raise exception 'INVALID_REVIEWER';end if;
 select a.id into target from auth.users a join public.users u on u.id=a.id where lower(a.email)=lower(trim(p_email)) and (not p_active or (a.email_confirmed_at is not null and not coalesce(a.is_anonymous,false) and a.deleted_at is null and (a.banned_until is null or a.banned_until<=now())));
 if target is null or target=p_actor then raise exception 'REVIEWER_ACCOUNT_REQUIRED';end if;
 insert into public.customer_payment_reviewers(user_id,active,granted_by) values(target,p_active,p_actor)
 on conflict(user_id) do update set active=excluded.active,granted_by=excluded.granted_by,updated_at=now();
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'payment_reviewer_changed',target::text,jsonb_build_object('active',p_active));
 return target;
end $$;

create function public.list_customer_payment_reviewers(p_actor uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',r.user_id,'email',a.email,'name',u.full_name,'active',r.active,'updated_at',r.updated_at) order by r.updated_at desc) from public.customer_payment_reviewers r join auth.users a on a.id=r.user_id join public.users u on u.id=r.user_id),'[]'::jsonb);
end $$;

revoke all on function public.require_customer_payment_reviewer(uuid),public.set_customer_payment_reviewer(uuid,text,boolean),public.list_customer_payment_reviewers(uuid) from public,anon,authenticated;
grant execute on function public.require_customer_payment_reviewer(uuid),public.set_customer_payment_reviewer(uuid,text,boolean),public.list_customer_payment_reviewers(uuid) to service_role;

create or replace function public.confirm_customer_payment(p_actor uuid,p_order uuid,p_version integer,p_amount_satang bigint,p_reference text,p_received_at timestamptz,p_checked boolean)
returns uuid language plpgsql security invoker set search_path=public as $$
declare o public.franchisee_orders;r public.customer_payment_requests;s public.customer_receipts;month_key text;counter bigint;num text;branch text;lines jsonb;
begin
 perform public.require_customer_payment_reviewer(p_actor);
 select * into o from public.franchisee_orders where id=p_order and sales_channel='customer-v1' for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if o.user_id=p_actor and p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid then raise exception 'SELF_PAYMENT_REVIEW';end if;
 if p_checked is distinct from true or p_reference is null or trim(p_reference) !~ '^[A-Za-z0-9][A-Za-z0-9._/ -]{5,119}$' or p_received_at is null then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
 p_reference:=regexp_replace(upper(trim(p_reference)),'[^A-Z0-9]','','g');
 if length(p_reference)<6 then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
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
 num:='DC-RC-'||month_key||'-'||lpad(counter::text,greatest(6,length(counter::text)),'0');
 insert into public.customer_receipts(order_id,number,received_at,confirmed_by,bank_reference,snapshot)
 values(o.id,num,p_received_at,p_actor,upper(trim(p_reference)),jsonb_build_object('version',1,'order_number',o.order_number,'customer_id',o.user_id,'branch_id',o.branch_id,'branch_name',branch,'buyer_name',coalesce(nullif(trim(o.billing_data->>'name'),''),o.recipient_name),'buyer_address',coalesce(nullif(trim(o.billing_data->>'address'),''),o.shipping_address,''),'seller',r.merchant-'promptpay_id','items',lines,'subtotal_satang',(o.subtotal*100)::bigint,'delivery_satang',(o.delivery_fee*100)::bigint,'total_satang',p_amount_satang,'payment_method','โอนเงิน','document_type','ใบเสร็จรับเงิน','tax_invoice',false)) returning * into s;
 update public.franchisee_orders set payment_status='Paid',payment_reference=upper(trim(p_reference)),payment_received_at=p_received_at,payment_confirmed_at=now(),payment_confirmed_by=p_actor,receipt_number=num,receipt_issued_at=s.issued_at,receipt_delivery_status='Pending',sales_revision=sales_revision+1 where id=o.id;
 insert into public.customer_receipt_jobs(receipt_id,kind) values(s.id,'drive'),(s.id,'line-owner');
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'payment_confirmed',o.id::text,jsonb_build_object('receipt_id',s.id,'amount_satang',p_amount_satang));
 return s.id;
end $$;
