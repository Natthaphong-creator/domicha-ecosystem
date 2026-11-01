-- Run with execute_sql / an administrative SQL connection. Every change rolls back.
begin;
do $$
declare actor uuid:='0dc9a547-a00f-4c6a-92a3-18e64233290a';owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';p public.customer_sale_products;oid uuid;request uuid:=gen_random_uuid();items jsonb;error_text text;before_count bigint;
begin
 select * into p from public.customer_sale_products where sale_status='active' order by id limit 1;
 items:=jsonb_build_array(jsonb_build_object('id',p.id,'quantity',2,'expected_price_satang',p.price_satang));
 select count(*) into before_count from public.franchisee_orders;
 begin
  perform public.create_customer_sales_order(actor,gen_random_uuid(),jsonb_build_array(jsonb_build_object('id',p.id,'quantity',2,'expected_price_satang',1)),'TEST','0000000000','pickup','','TEST');
  raise exception 'TEST_FAILED_PRICE';
 exception when others then if sqlerrm<>'PRICE_CHANGED' then raise;end if;end;
 if (select count(*) from public.franchisee_orders)<>before_count then raise exception 'TEST_FAILED_ATOMICITY';end if;
 begin
  perform public.set_customer_sale_status(actor,p.id,'hidden',p.version);raise exception 'TEST_FAILED_OWNER';
 exception when others then if sqlerrm<>'OWNER_REQUIRED' then raise;end if;end;
 perform public.set_customer_sale_status(owner_id,p.id,'hidden',p.version);
 begin
  perform public.create_customer_sales_order(actor,request,items,'TEST','0000000000','pickup','','TEST');raise exception 'TEST_FAILED_HIDDEN';
 exception when others then if sqlerrm<>'PRODUCT_UNAVAILABLE' then raise;end if;end;
 perform public.set_customer_sale_status(owner_id,p.id,'paused',p.version+1);
 begin
  perform public.create_customer_sales_order(actor,request,items,'TEST','0000000000','pickup','','TEST');raise exception 'TEST_FAILED_PAUSED';
 exception when others then if sqlerrm<>'PRODUCT_UNAVAILABLE' then raise;end if;end;
 perform public.set_customer_sale_status(owner_id,p.id,'active',p.version+2);
 oid:=public.create_customer_sales_order(actor,request,items,'TEST','0000000000','pickup','','TEST');
 if oid<>public.create_customer_sales_order(actor,request,items,'TEST','0000000000','pickup','','TEST') then raise exception 'TEST_FAILED_DEDUPE';end if;
 if (select count(*) from public.franchisee_orders)<>before_count+1 then raise exception 'TEST_FAILED_COUNT';end if;
 begin
  perform public.create_customer_sales_order(actor,request,items,'CHANGED','0000000000','pickup','','TEST');raise exception 'TEST_FAILED_REQUEST_CONFLICT';
 exception when others then if sqlerrm<>'REQUEST_CONFLICT' then raise;end if;end;
 begin
  perform public.review_customer_sales_order(owner_id,oid,'confirm',0,0,false);raise exception 'TEST_FAILED_STOCK';
 exception when others then if sqlerrm<>'STOCK_CHECK_REQUIRED' then raise;end if;end;
 begin
  perform public.review_customer_sales_order(owner_id,oid,'confirm',0,100,true);raise exception 'TEST_FAILED_PICKUP_FEE';
 exception when others then if sqlerrm<>'INVALID_DELIVERY_FEE' then raise;end if;end;
 perform public.review_customer_sales_order(owner_id,oid,'confirm',0,0,true);
 if not exists(select 1 from public.franchisee_orders where id=oid and quote_state='confirmed' and payment_status='Pending' and stock_checked and grand_total=p.price_satang*2::numeric/100 and receipt_number is null) then raise exception 'TEST_FAILED_CONFIRM';end if;
 begin
  perform public.review_customer_sales_order(owner_id,oid,'cancel',0,0,false);raise exception 'TEST_FAILED_STALE';
 exception when others then if sqlerrm<>'VERSION_CONFLICT' then raise;end if;end;
 perform public.review_customer_sales_order(owner_id,oid,'cancel',1,0,false);
 if not exists(select 1 from public.franchisee_orders where id=oid and quote_state='cancelled' and order_status='Cancelled') then raise exception 'TEST_FAILED_CANCEL';end if;
 if has_table_privilege('authenticated','public.customer_sale_products','SELECT') or has_table_privilege('anon','public.customer_sale_products','SELECT') or has_function_privilege('authenticated','public.create_customer_sales_order(uuid,uuid,jsonb,text,text,text,text,text)','EXECUTE') or has_function_privilege('anon','public.set_customer_sale_status(uuid,text,text,integer)','EXECUTE') then raise exception 'TEST_FAILED_GRANTS';end if;
end $$;
select 'PASS: price, atomicity, owner authorization, hidden/paused, idempotency, stock check, fee, confirmation, stale revision, cancel, grants; changes rolled back' as result;
rollback;
