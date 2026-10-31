-- Private to the onboarding Edge Function. No direct customer Data API grants.
create table public.customer_applications (
 id uuid primary key default gen_random_uuid(), source_key text unique not null,
 source_row integer not null check(source_row>=2), submitted_at text not null,
 party_type text not null, full_name text not null, phone text not null,
 email text not null check(email=lower(email)), contract_address text not null, branch_hint text not null default '',
 status text not null default 'pending' check(status in ('pending','processing','approved','rejected','needs_review')),
 auth_user_id uuid references auth.users(id), branch_id uuid references public.branches(id),
 approved_by uuid references public.users(id), approved_at timestamptz,
 invite_attempt_id uuid, invite_generated_at timestamptz,
 invitation_status text not null default 'unsent' check(invitation_status in ('unsent','ready','sent','failed')),
 invitation_sent_at timestamptz, created_at timestamptz not null default now()
);
create unique index customer_applications_one_membership_email on public.customer_applications(lower(email)) where status in ('processing','approved','needs_review');
create table public.customer_onboarding_bridge (
 spreadsheet_id text primary key, secret_sha256 text not null check(length(secret_sha256)=64),
 updated_by uuid not null references public.users(id), updated_at timestamptz not null default now()
);
create table public.customer_onboarding_events (
 id bigint generated always as identity primary key, application_id uuid references public.customer_applications(id),
 actor_id uuid references public.users(id), event_type text not null, created_at timestamptz not null default now()
);
alter table public.customer_applications enable row level security;
alter table public.customer_onboarding_bridge enable row level security;
alter table public.customer_onboarding_events enable row level security;
revoke all on public.customer_applications,public.customer_onboarding_bridge,public.customer_onboarding_events from public,anon,authenticated;
grant all on public.customer_applications,public.customer_onboarding_bridge,public.customer_onboarding_events to service_role;
grant usage,select on sequence public.customer_onboarding_events_id_seq to service_role;

create function public.finalize_customer_application(p_application_id uuid,p_user_id uuid,p_actor_id uuid,p_branch_id uuid,p_branch_code text,p_branch_name text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare a public.customer_applications; b public.branches; u public.users;
begin
 if p_actor_id <> '1148e8d2-679c-4241-ba67-b522a2b50d8b'::uuid or not exists(select 1 from public.users where id=p_actor_id and role='Admin') then raise exception 'OWNER_REQUIRED'; end if;
 select * into a from public.customer_applications where id=p_application_id for update;
 if not found then raise exception 'APPLICATION_NOT_FOUND'; end if;
 if a.status='approved' and a.auth_user_id=p_user_id then return jsonb_build_object('id',a.id,'branch_id',a.branch_id); end if;
 if a.status<>'processing' or a.auth_user_id is distinct from p_user_id then raise exception 'APPLICATION_STATE_CONFLICT'; end if;
 select * into u from public.users where id=p_user_id for update;
 if not found or u.role<>'Franchisee' or lower(u.email)<>a.email then raise exception 'ACCOUNT_CONFLICT'; end if;
 if exists(select 1 from public.franchisee_profiles where user_id=p_user_id) then raise exception 'MEMBERSHIP_ALREADY_EXISTS'; end if;
 if p_branch_id is not null then
  select * into b from public.branches where id=p_branch_id and status='Active' for share;
  if not found then raise exception 'BRANCH_NOT_ACTIVE'; end if;
 else
  if p_branch_code is null or p_branch_code !~ '^[A-Z0-9][A-Z0-9-]{1,31}$' or length(trim(coalesce(p_branch_name,'')))<1 or length(p_branch_name)>140 then raise exception 'INVALID_BRANCH'; end if;
  -- Never overwrite an existing branch on a conflicting code.
  insert into public.branches(branch_code,branch_name,status) values(p_branch_code,trim(p_branch_name),'Active') returning * into b;
 end if;
 update public.users set full_name=a.full_name where id=p_user_id;
 insert into public.franchisee_profiles(user_id,branch_id,branch_name,owner_name,phone,email,status,created_by)
 values(p_user_id,b.id,b.branch_name,a.full_name,a.phone,a.email,'Active',p_actor_id);
 -- Contract address is not assumed to be a shipping address.
 update public.customer_applications set status='approved',branch_id=b.id,approved_by=p_actor_id,approved_at=now() where id=a.id;
 insert into public.customer_onboarding_events(application_id,actor_id,event_type) values(a.id,p_actor_id,'approved');
 return jsonb_build_object('id',a.id,'branch_id',b.id);
end $$;
revoke all on function public.finalize_customer_application(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finalize_customer_application(uuid,uuid,uuid,uuid,text,text) to service_role;
