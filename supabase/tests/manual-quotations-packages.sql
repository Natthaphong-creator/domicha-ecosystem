begin;
set local role service_role;
do $$
declare owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';q uuid;i uuid;r uuid;body jsonb;payment jsonb;pkg public.manual_franchise_packages;package_no integer;
begin
 payment:=jsonb_build_object('method','cash','amount',3900000,'reference','','receivedAt',now(),'checked',true);
 body:='{"kind":"quotation","packageId":1,"packageVersion":0,"buyer":{"name":"TEST QUOTATION ROLLBACK","address":"TEST ADDRESS","phone":"","taxId":""},"branch":"TEST BRANCH","items":[{"name":"FORGED","unit":"x","quantity":999,"price_satang":1}],"deliveryFee":0,"stockMode":"none"}';
 for package_no in 1..3 loop
  select * into pkg from public.manual_franchise_packages p where p.id=package_no;
  if pkg.price_satang<>(case package_no when 1 then 3900000 when 2 then 6900000 else 8900000 end) then raise exception 'TEST_FAILED_PACKAGE_PRICE';end if;
  q:=public.create_manual_sales_document(owner_id,gen_random_uuid(),body||jsonb_build_object('packageId',package_no,'packageVersion',pkg.version));
  if not exists(select 1 from public.manual_sales_documents where manual_sales_documents.id=q and document_kind='quotation' and number like 'DC-MQ-%' and jsonb_array_length(snapshot->'items')=1 and (snapshot->'items'->0->>'quantity')::integer=1 and (snapshot->>'total_satang')::bigint=pkg.price_satang and snapshot->'items'->0->>'name'='ค่าแฟรนไชส์ '||pkg.name) then raise exception 'TEST_FAILED_SINGLE_PACKAGE';end if;
 end loop;
 select * into pkg from public.manual_franchise_packages where manual_franchise_packages.id=1;
 q:=public.create_manual_sales_document(owner_id,gen_random_uuid(),body||jsonb_build_object('packageVersion',pkg.version));
 begin perform public.receive_manual_sales_document(owner_id,q,0,payment);raise exception 'TEST_FAILED_QUOTE_PAYMENT';exception when others then if sqlerrm<>'QUOTATION_NOT_PAYABLE' then raise;end if;end;
 perform public.save_manual_franchise_package(owner_id,1,pkg.version,pkg.name,'TEST NEW PRICE',4000000,true);
 begin perform public.create_manual_sales_document(owner_id,gen_random_uuid(),body||jsonb_build_object('packageVersion',pkg.version));raise exception 'TEST_FAILED_STALE_TEMPLATE';exception when others then if sqlerrm<>'PRICE_CHANGED' then raise;end if;end;
 i:=public.convert_manual_quotation(owner_id,q,0);
 if i<>public.convert_manual_quotation(owner_id,q,0) then raise exception 'TEST_FAILED_CONVERT_RETRY';end if;
 if not exists(select 1 from public.manual_sales_documents where manual_sales_documents.id=i and parent_document_id=q and document_kind='invoice' and (snapshot->>'total_satang')::bigint=3900000 and snapshot->>'quotation_number' is not null) then raise exception 'TEST_FAILED_PRICE_FREEZE';end if;
 r:=public.receive_manual_sales_document(owner_id,i,0,payment);
 if not exists(select 1 from public.customer_receipts where id=r and manual_document_id=i and (snapshot->>'total_satang')::bigint=3900000) then raise exception 'TEST_FAILED_RECEIPT';end if;
 if has_table_privilege('authenticated','public.manual_franchise_packages','SELECT') or has_function_privilege('authenticated','public.convert_manual_quotation(uuid,uuid,integer)','EXECUTE') then raise exception 'TEST_FAILED_GRANTS';end if;
end $$;
select 'PASS: M/L/XL user prices, one line only, server-priced templates, stale price rejected, quotation cannot receive cash, immutable quote-to-invoice-to-receipt, idempotent conversion and private grants; ROLLBACK' result;
rollback;
