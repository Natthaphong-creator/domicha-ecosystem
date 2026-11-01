-- No invite tokens are stored. New staff must verify their own email via the private activation link.
create table public.customer_payment_reviewer_invites(
 email text primary key check(email=lower(email)),full_name text not null,
 user_id uuid references auth.users(id),created_by uuid not null references public.users(id),
 attempt_id uuid not null,generated_at timestamptz not null default now(),created_at timestamptz not null default now()
);
alter table public.customer_payment_reviewer_invites enable row level security;
revoke all on public.customer_payment_reviewer_invites from public,anon,authenticated;
grant all on public.customer_payment_reviewer_invites to service_role;

create function public.claim_customer_reviewer_invite(p_actor uuid,p_email text,p_name text,p_attempt uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare v public.customer_payment_reviewer_invites;u auth.users;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 p_email:=lower(trim(p_email));p_name:=trim(p_name);
 if p_email is null or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(p_email)>254 or p_name is null or length(p_name) not between 1 and 160 or p_attempt is null then raise exception 'INVALID_REVIEWER';end if;
 perform pg_advisory_xact_lock(hashtextextended('reviewer-invite:'||p_email,0));
 select * into v from public.customer_payment_reviewer_invites where email=p_email for update;
 if found and v.generated_at>now()-interval '60 seconds' then raise exception 'REVIEWER_INVITE_WAIT';end if;
 select * into u from auth.users where lower(email)=p_email;
 if found then
  if v.user_id is distinct from u.id or u.email_confirmed_at is not null or u.deleted_at is not null or coalesce(u.is_anonymous,false) or (u.banned_until is not null and u.banned_until>now()) then raise exception 'REVIEWER_ACCOUNT_EXISTS';end if;
  if not exists(select 1 from public.customer_payment_reviewers where user_id=u.id and active) then raise exception 'REVIEWER_INVITE_REVOKED';end if;
 end if;
 insert into public.customer_payment_reviewer_invites(email,full_name,created_by,attempt_id) values(p_email,p_name,p_actor,p_attempt)
 on conflict(email) do update set attempt_id=excluded.attempt_id,generated_at=now();
 select * into v from public.customer_payment_reviewer_invites where email=p_email;
 return jsonb_build_object('email',v.email,'name',v.full_name,'attempt',v.attempt_id,'user_id',v.user_id);
end $$;

create function public.complete_customer_reviewer_invite(p_actor uuid,p_email text,p_attempt uuid,p_user uuid)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v public.customer_payment_reviewer_invites;u auth.users;
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 select * into v from public.customer_payment_reviewer_invites where email=lower(trim(p_email)) and attempt_id=p_attempt and created_by=p_actor for update;
 if not found or v.generated_at<now()-interval '10 minutes' then raise exception 'REVIEWER_INVITE_CONFLICT';end if;
 select * into u from auth.users where id=p_user;
 if not found or lower(u.email)<>v.email or u.email_confirmed_at is not null or u.deleted_at is not null or coalesce(u.is_anonymous,false) or (u.banned_until is not null and u.banned_until>now()) then raise exception 'REVIEWER_INVITE_CONFLICT';end if;
 if v.user_id is null then
  if u.created_at<v.created_at-interval '5 seconds' or exists(select 1 from public.franchisee_profiles where user_id=u.id) or exists(select 1 from public.customer_payment_reviewers where user_id=u.id) then raise exception 'REVIEWER_INVITE_CONFLICT';end if;
  -- The existing auth trigger creates a default profile. Only this fresh, unconfirmed account is converted to staff.
  update public.users set full_name=v.full_name,role='Sales' where id=u.id and role='Franchisee';
  if not found then raise exception 'REVIEWER_INVITE_CONFLICT';end if;
  insert into public.customer_payment_reviewers(user_id,active,granted_by) values(u.id,true,p_actor);
 else
  if v.user_id<>u.id or not exists(select 1 from public.customer_payment_reviewers where user_id=u.id and active) then raise exception 'REVIEWER_INVITE_REVOKED';end if;
 end if;
 update public.customer_payment_reviewer_invites set user_id=u.id where email=v.email;
 insert into public.customer_sales_events(actor_id,event_type,subject_id,details) values(p_actor,'payment_reviewer_invited',u.id::text,'{}');
 return u.id;
end $$;

create or replace function public.list_customer_payment_reviewers(p_actor uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
begin
 if p_actor is null or p_actor<>'1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor and role='Admin') then raise exception 'OWNER_REQUIRED';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',r.user_id,'email',a.email,'name',u.full_name,'active',r.active,'confirmed',a.email_confirmed_at is not null,'updated_at',r.updated_at) order by r.updated_at desc) from public.customer_payment_reviewers r join auth.users a on a.id=r.user_id join public.users u on u.id=r.user_id),'[]'::jsonb);
end $$;
-- Revocation must work before activation too; granting existing accounts still requires confirmed email.
create or replace function public.set_customer_payment_reviewer(p_actor uuid,p_email text,p_active boolean)
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
revoke all on function public.claim_customer_reviewer_invite(uuid,text,text,uuid),public.complete_customer_reviewer_invite(uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_customer_reviewer_invite(uuid,text,text,uuid),public.complete_customer_reviewer_invite(uuid,text,uuid,uuid) to service_role;
