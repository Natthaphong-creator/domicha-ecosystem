begin;
do $$
declare owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';target uuid:=gen_random_uuid();attempt uuid:=gen_random_uuid();email text;
begin
 email:='service-reviewer-test-'||target::text||'@example.invalid';
 execute 'set local role service_role';
 perform public.list_customer_payment_reviewers(owner_id);
 perform public.require_customer_payment_reviewer(owner_id);
 perform public.claim_customer_reviewer_invite(owner_id,email,'TEST SERVICE ROLE',attempt);
 execute 'reset role';
 -- Auth is populated only as a transactional fixture, never by the service SQL role.
 insert into auth.users(id,email,is_anonymous,created_at,invited_at) values(target,email,false,now(),now());
 execute 'set local role service_role';
 perform public.complete_customer_reviewer_invite(owner_id,email,attempt,target);
 perform public.require_customer_payment_reviewer(target);
 if jsonb_array_length(public.list_customer_payment_reviewers(owner_id))<>1 then raise exception 'TEST_FAILED_SERVICE_LIST';end if;
 perform public.set_customer_payment_reviewer(owner_id,email,false);
 begin perform public.require_customer_payment_reviewer(target);raise exception 'TEST_FAILED_SERVICE_REVOKE';exception when others then if sqlerrm<>'PAYMENT_REVIEWER_REQUIRED' then raise;end if;end;
 if has_table_privilege('service_role','auth.users','SELECT') or has_column_privilege('service_role','auth.users','encrypted_password','SELECT') then raise exception 'TEST_FAILED_BROAD_AUTH_GRANTS';end if;
 execute 'reset role';
end $$;
select 'PASS: list, invite reservation/finalization, authorization and revoke under actual service_role; no auth table/password reads; all fixtures rolled back' as result;
rollback;
