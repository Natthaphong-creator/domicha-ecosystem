begin;
set local role service_role;
do $$
declare actor uuid:='0dc9a547-a00f-4c6a-92a3-18e64233290a';owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';oid uuid;rid uuid;p public.customer_sale_products;items jsonb;s public.customer_payment_settings;received timestamptz:=now();method text;
begin
select * into p from public.customer_sale_products where id='tea-red';items:=jsonb_build_array(jsonb_build_object('id',p.id,'quantity',1,'expected_price_satang',p.price_satang));
select * into s from public.customer_payment_settings where id=true;
perform public.save_customer_payment_settings(owner_id,s.version,true,'0999999999','TEST ACCOUNT','TEST SELLER','TEST ADDRESS','{}');
foreach method in array array['cash','cash','promptpay','transfer'] loop
 oid:=public.create_customer_sales_order_billing(actor,gen_random_uuid(),items,'TEST','0000000000','pickup','','METHOD TEST ROLLBACK','{}');
 perform public.review_customer_sales_order(owner_id,oid,'confirm',0,0,true);
 begin perform public.confirm_customer_payment_by_method(owner_id,oid,1,p.price_satang,'TEST-'||oid,received,false,method);raise exception 'TEST_FAILED_UNCHECKED';exception when others then if sqlerrm<>'PAYMENT_EVIDENCE_REQUIRED' then raise;end if;end;
 begin perform public.confirm_customer_payment_by_method(owner_id,oid,1,p.price_satang+1,'TEST-'||oid,received,true,method);raise exception 'TEST_FAILED_AMOUNT';exception when others then if sqlerrm<>'PAYMENT_AMOUNT_MISMATCH' then raise;end if;end;
 rid:=public.confirm_customer_payment_by_method(owner_id,oid,1,p.price_satang,'TEST-'||oid,received,true,method);
 if rid<>public.confirm_customer_payment_by_method(owner_id,oid,1,p.price_satang,'TEST-'||oid,received,true,method) then raise exception 'TEST_FAILED_RETRY';end if;
 if not exists(select 1 from public.customer_receipts where id=rid and payment_method_code=method and snapshot->>'payment_method_code'=method and (method<>'cash' or bank_reference is null)) then raise exception 'TEST_FAILED_SNAPSHOT';end if;
 begin perform public.confirm_customer_payment_by_method(owner_id,oid,1,p.price_satang,'TEST-'||oid,received,true,case when method='cash' then 'transfer' else 'cash' end);raise exception 'TEST_FAILED_CHANGED_METHOD';exception when others then if sqlerrm<>'PAYMENT_ALREADY_CONFIRMED' then raise;end if;end;
 if (select count(*) from public.customer_receipt_jobs where receipt_id=rid)<>2 then raise exception 'TEST_FAILED_DUPLICATE_JOBS';end if;
end loop;
if has_function_privilege('authenticated','public.confirm_customer_payment_by_method(uuid,uuid,integer,bigint,text,timestamptz,boolean,text)','EXECUTE') then raise exception 'TEST_FAILED_PUBLIC_GRANT';end if;
end $$;
select 'PASS: service role cash twice without QR or bank reference, transfer/QR, exact totals, counted funds, immutable methods, idempotency, outbox; ROLLBACK' result;
rollback;
