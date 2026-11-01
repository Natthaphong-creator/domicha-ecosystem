begin;
set local role service_role;
do $$
declare owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';p public.manual_franchise_packages;q uuid;i uuid;r uuid;b jsonb;pay jsonb;
begin
 select * into p from public.manual_franchise_packages where id=1;
 b:=jsonb_build_object('kind','quotation','packageId',1,'packageVersion',p.version,'buyer',jsonb_build_object('name','TEST CONTENTS ROLLBACK','address','TEST ADDRESS'),'branch','TEST','deliveryFee',0,'stockMode','none','packageTemplate',jsonb_build_object('contents','FORGED'));
 q:=public.create_manual_sales_document(owner_id,gen_random_uuid(),b);
 if not exists(select 1 from public.manual_sales_documents where id=q and snapshot->'package_template'->'contents'=p.contents and jsonb_array_length(snapshot->'items')=1) then raise exception 'TEST_FAILED_SERVER_CONTENTS';end if;
 begin perform public.save_manual_franchise_package_details(owner_id,1,p.version,p.name,p.description,p.price_satang,true,'{"equipment":[3]}');raise exception 'TEST_FAILED_CONTENT_VALIDATION';exception when others then if sqlerrm<>'INVALID_PACKAGE' then raise;end if;end;
 perform public.save_manual_franchise_package_details(owner_id,1,p.version,p.name,p.description,p.price_satang,true,'{"package":["TEST UPDATED ONLY"]}');
 i:=public.convert_manual_quotation(owner_id,q,0);
 pay:=jsonb_build_object('method','cash','amount',p.price_satang,'reference','','receivedAt',now(),'checked',true);
 r:=public.receive_manual_sales_document(owner_id,i,0,pay);
 if not exists(select 1 from public.customer_receipts where id=r and snapshot->'package_template'->'contents'=p.contents and jsonb_array_length(snapshot->'package_template'->'contents'->'equipment')=34 and jsonb_array_length(snapshot->'package_template'->'contents'->'ingredients')=39) then raise exception 'TEST_FAILED_IMMUTABLE_CONTENTS';end if;
 if has_function_privilege('authenticated','public.save_manual_franchise_package_details(uuid,integer,integer,text,text,bigint,boolean,jsonb)','EXECUTE') then raise exception 'TEST_FAILED_GRANTS';end if;
end $$;
select 'PASS: 34/39 contents originate on server, one priced package row, validated owner edits, contents immutable through quotation/invoice/receipt; ROLLBACK' result;
rollback;
