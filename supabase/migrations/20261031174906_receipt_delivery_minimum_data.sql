create or replace function public.claim_customer_receipt_job(p_kinds text[])
returns jsonb language plpgsql security invoker set search_path=public as $$
declare j public.customer_receipt_jobs;r public.customer_receipts;
begin
 select * into j from public.customer_receipt_jobs where kind=any(p_kinds) and attempts<10 and next_attempt_at<=now() and (status in ('pending','failed') or (status='processing' and lease_until<now())) order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 update public.customer_receipt_jobs set status='processing',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '10 minutes' where id=j.id returning * into j;
 select * into r from public.customer_receipts where id=j.receipt_id;
 return jsonb_build_object('job',to_jsonb(j),'receipt',jsonb_build_object('id',r.id,'number',r.number,'issued_at',r.issued_at,'received_at',r.received_at,'snapshot',r.snapshot));
end $$;

create or replace function public.confirm_customer_payment(p_actor uuid,p_order uuid,p_version integer,p_amount_satang bigint,p_reference text,p_received_at timestamptz,p_checked boolean)
returns uuid language plpgsql security invoker set search_path=public as $$
declare o public.franchisee_orders;r public.customer_payment_requests;s public.customer_receipts;month_key text;counter bigint;num text;branch text;lines jsonb;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 select * into o from public.franchisee_orders where id=p_order and sales_channel='customer-v1' for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
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
