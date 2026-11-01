-- Historical receipt snapshots retain their existing payment wording.
alter table public.customer_receipts add column payment_method_code text not null default 'legacy' check(payment_method_code in ('legacy','transfer','promptpay','cash'));
alter table public.customer_receipts alter column bank_reference drop not null;
alter table public.customer_receipts add constraint customer_receipts_method_reference check((payment_method_code='cash' and bank_reference is null) or (payment_method_code<>'cash' and bank_reference is not null));
create or replace function public.confirm_customer_payment_by_method(p_actor uuid,p_order uuid,p_version integer,p_amount_satang bigint,p_reference text,p_received_at timestamptz,p_checked boolean,p_method text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare o public.franchisee_orders;r public.customer_payment_requests;s public.customer_receipts;month_key text;counter bigint;num text;branch text;lines jsonb;settings public.customer_payment_settings;method_label text;
begin
 perform public.require_customer_payment_reviewer(p_actor);
 if p_method is null or p_method not in ('transfer','promptpay','cash') then raise exception 'PAYMENT_METHOD_REQUIRED';end if;
 method_label:=case p_method when 'cash' then 'เงินสด' when 'promptpay' then 'QR พร้อมเพย์' else 'โอนผ่านบัญชี' end;
 select * into o from public.franchisee_orders where id=p_order and sales_channel='customer-v1' for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if o.user_id=p_actor and p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid then raise exception 'SELF_PAYMENT_REVIEW';end if;
 if p_checked is distinct from true or p_received_at is null then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
 if p_method='cash' then p_reference:=null;
 else
  if p_reference is null or trim(p_reference) !~ '^[A-Za-z0-9][A-Za-z0-9._/ -]{5,119}$' then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
  p_reference:=regexp_replace(upper(trim(p_reference)),'[^A-Z0-9]','','g');
  if length(p_reference)<6 then raise exception 'PAYMENT_EVIDENCE_REQUIRED';end if;
 end if;
 -- Idempotent network retry returns the same receipt; mismatched facts never overwrite it.
 select * into s from public.customer_receipts where order_id=o.id;
 if found then
  if (s.payment_method_code<>p_method and not(s.payment_method_code='legacy' and p_method='transfer')) or s.bank_reference is distinct from p_reference or (s.snapshot->>'total_satang')::bigint is distinct from p_amount_satang or s.received_at<>p_received_at then raise exception 'PAYMENT_ALREADY_CONFIRMED';end if;
  return s.id;
 end if;
 if o.sales_revision is distinct from p_version then raise exception 'VERSION_CONFLICT';end if;
 if o.quote_state<>'confirmed' or o.payment_status<>'Pending' or o.order_status<>'Confirmed' or not o.stock_checked then raise exception 'ORDER_LOCKED';end if;
 select * into r from public.customer_payment_requests where order_id=o.id;
 if not found then
  select * into settings from public.customer_payment_settings where id=true for share;
  if settings.id is null or length(trim(coalesce(settings.seller_name,'')))=0 or length(trim(coalesce(settings.seller_address,'')))=0 then raise exception 'PAYMENT_SETTINGS_REQUIRED';end if;
  if p_method<>'cash' and settings.enabled is distinct from true then raise exception 'PAYMENT_NOT_READY';end if;
  insert into public.customer_payment_requests(order_id,amount_satang,quote_revision,merchant) values(o.id,(o.grand_total*100)::bigint,o.sales_revision,jsonb_build_object('promptpay_id',settings.promptpay_id,'account_name',settings.account_name,'seller_name',settings.seller_name,'seller_address',settings.seller_address)||settings.details) returning * into r;
 end if;
 if p_amount_satang is distinct from r.amount_satang or p_amount_satang is distinct from (o.grand_total*100)::bigint or r.quote_revision<>o.sales_revision then raise exception 'PAYMENT_AMOUNT_MISMATCH';end if;
 if p_received_at<o.created_at-interval '15 minutes' or p_received_at>now()+interval '5 minutes' then raise exception 'INVALID_PAYMENT_TIME';end if;
 select branch_name into branch from public.branches where id=o.branch_id;
 select jsonb_agg(jsonb_build_object('name',product_name,'unit',unit,'quantity',quantity,'price_satang',(unit_price*100)::bigint,'total_satang',(line_total*100)::bigint) order by created_at,id) into lines from public.franchisee_order_items where franchisee_order_id=o.id;
 if lines is null then raise exception 'INVALID_ITEMS';end if;
 month_key:=to_char(now() at time zone 'Asia/Bangkok','YYYYMM');
 insert into public.customer_receipt_counters(month,next_number) values(month_key,1) on conflict(month) do update set next_number=customer_receipt_counters.next_number+1 returning next_number into counter;
 num:='DC-RC-'||month_key||'-'||lpad(counter::text,greatest(6,length(counter::text)),'0');
 insert into public.customer_receipts(order_id,number,received_at,confirmed_by,bank_reference,payment_method_code,snapshot)
 values(o.id,num,p_received_at,p_actor,p_reference,p_method,jsonb_build_object('version',1,'order_number',o.order_number,'customer_id',o.user_id,'branch_id',o.branch_id,'branch_name',branch,'buyer_name',coalesce(nullif(trim(o.billing_data->>'name'),''),o.recipient_name),'buyer_address',coalesce(nullif(trim(o.billing_data->>'address'),''),o.shipping_address,''),'seller',r.merchant-'promptpay_id','items',lines,'subtotal_satang',(o.subtotal*100)::bigint,'delivery_satang',(o.delivery_fee*100)::bigint,'total_satang',p_amount_satang,'payment_method',method_label,'payment_method_code',p_method,'document_type','ใบเสร็จรับเงิน','tax_invoice',false)) returning * into s;
 update public.franchisee_orders set payment_status='Paid',payment_reference=case when p_method='cash' then 'CASH:'||num else p_reference end,payment_received_at=p_received_at,payment_confirmed_at=now(),payment_confirmed_by=p_actor,receipt_number=num,receipt_issued_at=s.issued_at,receipt_delivery_status='Pending',sales_revision=sales_revision+1 where id=o.id;
 insert into public.customer_receipt_jobs(receipt_id,kind) values(s.id,'drive'),(s.id,'line-owner');
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'payment_confirmed',o.id::text,jsonb_build_object('receipt_id',s.id,'amount_satang',p_amount_satang,'payment_method_code',p_method));
 return s.id;
end $$;

-- Backward-compatible callers still record a bank transfer; only the new endpoint may select cash/QR.
create or replace function public.confirm_customer_payment(p_actor uuid,p_order uuid,p_version integer,p_amount_satang bigint,p_reference text,p_received_at timestamptz,p_checked boolean)
returns uuid language sql security invoker set search_path=public as $$
 select public.confirm_customer_payment_by_method(p_actor,p_order,p_version,p_amount_satang,p_reference,p_received_at,p_checked,'transfer');
$$;
revoke all on function public.confirm_customer_payment_by_method(uuid,uuid,integer,bigint,text,timestamptz,boolean,text) from public,anon,authenticated;
grant execute on function public.confirm_customer_payment_by_method(uuid,uuid,integer,bigint,text,timestamptz,boolean,text) to service_role;
