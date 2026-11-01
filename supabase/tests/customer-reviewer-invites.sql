begin;
do $$
declare owner_id uuid:='1148e8d2-679c-4241-ba67-b522a2b50d8b';member_id uuid:='0dc9a547-a00f-4c6a-92a3-18e64233290a';target uuid:=gen_random_uuid();attempt uuid:=gen_random_uuid();email text;v jsonb;
begin
 email:='invite-reviewer-'||target::text||'@example.invalid';
 begin perform public.claim_customer_reviewer_invite(member_id,email,'TEST',attempt);raise exception 'TEST_FAILED_NONOWNER';exception when others then if sqlerrm<>'OWNER_REQUIRED' then raise;end if;end;
 v:=public.claim_customer_reviewer_invite(owner_id,email,'TEST NEW REVIEWER',attempt);
 begin perform public.claim_customer_reviewer_invite(owner_id,email,'TEST',gen_random_uuid());raise exception 'TEST_FAILED_RATE';exception when others then if sqlerrm<>'REVIEWER_INVITE_WAIT' then raise;end if;end;
 insert into auth.users(id,email,is_anonymous,created_at,invited_at) values(target,email,false,now(),now());
 begin perform public.complete_customer_reviewer_invite(owner_id,email,gen_random_uuid(),target);raise exception 'TEST_FAILED_WRONG_ATTEMPT';exception when others then if sqlerrm<>'REVIEWER_INVITE_CONFLICT' then raise;end if;end;
 perform public.complete_customer_reviewer_invite(owner_id,email,attempt,target);
 if not exists(select 1 from public.users where id=target and role='Sales') or exists(select 1 from public.franchisee_profiles where user_id=target) then raise exception 'TEST_FAILED_STAFF_PROFILE';end if;
 begin perform public.require_customer_payment_reviewer(target);raise exception 'TEST_FAILED_UNCONFIRMED';exception when others then if sqlerrm<>'PAYMENT_REVIEWER_REQUIRED' then raise;end if;end;
 update auth.users set email_confirmed_at=now() where id=target;
 perform public.require_customer_payment_reviewer(target);
 update public.customer_payment_reviewer_invites i set generated_at=now()-interval '2 minutes' where i.email=v->>'email';
 begin perform public.claim_customer_reviewer_invite(owner_id,email,'TEST',gen_random_uuid());raise exception 'TEST_FAILED_EXISTING_ACCOUNT_RESET';exception when others then if sqlerrm<>'REVIEWER_ACCOUNT_EXISTS' then raise;end if;end;
 -- Revoking a pending invitation also blocks activation from creating access later.
 update auth.users set email_confirmed_at=null where id=target;
 perform public.set_customer_payment_reviewer(owner_id,email,false);
 begin perform public.complete_customer_reviewer_invite(owner_id,email,attempt,target);raise exception 'TEST_FAILED_REACTIVATION';exception when others then if sqlerrm<>'REVIEWER_INVITE_REVOKED' then raise;end if;end;
 update auth.users set email_confirmed_at=now() where id=target;
 begin perform public.require_customer_payment_reviewer(target);raise exception 'TEST_FAILED_REVOKED_ACTIVATION';exception when others then if sqlerrm<>'PAYMENT_REVIEWER_REQUIRED' then raise;end if;end;
 if has_table_privilege('authenticated','public.customer_payment_reviewer_invites','SELECT') or has_function_privilege('authenticated','public.claim_customer_reviewer_invite(uuid,text,text,uuid)','EXECUTE') then raise exception 'TEST_FAILED_INVITE_GRANTS';end if;
end $$;
select 'PASS: owner-only invitation, rate limit, attempt binding, staff-only profile, unconfirmed denied, confirmed permitted, no existing-account reset, revoked invitation cannot reactivate, service-only grants; ROLLBACK' as result;
rollback;
