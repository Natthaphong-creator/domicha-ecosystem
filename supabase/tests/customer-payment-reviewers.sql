begin;
do $$
declare reviewer uuid:=gen_random_uuid();member_id uuid:='0dc9a547-a00f-4c6a-92a3-18e64233290a';owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';email text;oid uuid;rid uuid;p public.customer_sale_products;items jsonb;received timestamptz:=now();
begin
 email:='reviewer-test-'||reviewer::text||'@example.invalid';
 insert into auth.users(id,email,email_confirmed_at,is_anonymous) values(reviewer,email,now(),false);
 insert into public.users(id,email,full_name,role) values(reviewer,email,'TEST REVIEWER','Sales') on conflict(id) do update set role='Sales';
 begin perform public.set_customer_payment_reviewer(member_id,email,true);raise exception 'TEST_FAILED_NONOWNER_GRANT';exception when others then if sqlerrm<>'OWNER_REQUIRED' then raise;end if;end;
 begin perform public.require_customer_payment_reviewer(reviewer);raise exception 'TEST_FAILED_UNASSIGNED';exception when others then if sqlerrm<>'PAYMENT_REVIEWER_REQUIRED' then raise;end if;end;
 perform public.set_customer_payment_reviewer(owner_id,email,true);
 perform public.require_customer_payment_reviewer(reviewer);
 select * into p from public.customer_sale_products where id='tea-red';
 items:=jsonb_build_array(jsonb_build_object('id',p.id,'quantity',1,'expected_price_satang',p.price_satang));
 oid:=public.create_customer_sales_order_billing(member_id,gen_random_uuid(),items,'TEST','0000000000','pickup','','REVIEWER TEST ROLLBACK','{}');
 perform public.review_customer_sales_order(owner_id,oid,'confirm',0,0,true);
 perform public.prepare_customer_payment(member_id,oid);
 begin perform public.save_customer_payment_settings(reviewer,0,false,'','','','','{}');raise exception 'TEST_FAILED_REVIEWER_SETTINGS';exception when others then if sqlerrm<>'OWNER_REQUIRED' then raise;end if;end;
 rid:=public.confirm_customer_payment(reviewer,oid,1,p.price_satang,'TEST-REVIEWER-'||replace(reviewer::text,'-',''),received,true);
 if not exists(select 1 from public.customer_receipts where id=rid and confirmed_by=reviewer) or not exists(select 1 from public.customer_sales_events where actor_id=reviewer and event_type='payment_confirmed' and subject_id=oid::text) then raise exception 'TEST_FAILED_AUDIT';end if;
 if (select count(*) from public.customer_receipt_jobs where receipt_id=rid)<>2 then raise exception 'TEST_FAILED_DELIVERY';end if;
 perform public.set_customer_payment_reviewer(owner_id,email,false);
 begin perform public.confirm_customer_payment(reviewer,oid,1,p.price_satang,'TEST-REVIEWER-'||replace(reviewer::text,'-',''),received,true);raise exception 'TEST_FAILED_REVOKED';exception when others then if sqlerrm<>'PAYMENT_REVIEWER_REQUIRED' then raise;end if;end;
 -- Members who are also reviewers cannot approve their own orders.
 insert into public.customer_payment_reviewers(user_id,active,granted_by) values(member_id,true,owner_id);
 begin perform public.confirm_customer_payment(member_id,oid,1,p.price_satang,'TEST-SELF-REVIEW',received,true);raise exception 'TEST_FAILED_SELF_APPROVAL';exception when others then if sqlerrm<>'SELF_PAYMENT_REVIEW' then raise;end if;end;
 if has_table_privilege('authenticated','public.customer_payment_reviewers','SELECT') or has_table_privilege('authenticated','public.customer_payment_reviewers','INSERT') or has_function_privilege('authenticated','public.set_customer_payment_reviewer(uuid,text,boolean)','EXECUTE') then raise exception 'TEST_FAILED_GRANTS';end if;
end $$;
select 'PASS: owner grant/revoke, delegated confirmation, no settings rights, actor audit/outbox, revoked retries denied, own-order confirmation denied, service-only grants; all rolled back' as result;
rollback;
