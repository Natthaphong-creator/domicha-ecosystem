create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'franchise_lead_status'
      and n.nspname = 'public'
  ) then
    create type public.franchise_lead_status as enum (
      'New',
      'Contacted',
      'Qualified',
      'PackageSent',
      'Won',
      'Lost'
    );
  end if;
end $$;

create table if not exists public.franchise_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  location text,
  budget text,
  note text,
  source text not null default 'DomiCha Website',
  status public.franchise_lead_status not null default 'New',
  assigned_to uuid references public.users(id) on delete set null,
  last_contacted_at timestamptz,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.franchise_leads enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update on public.franchise_leads to authenticated, service_role;
grant select on public.users to authenticated, service_role;

drop trigger if exists franchise_leads_set_updated_at on public.franchise_leads;
create trigger franchise_leads_set_updated_at
before update on public.franchise_leads
for each row execute function public.set_updated_at();

drop policy if exists "HQ users read franchise leads" on public.franchise_leads;
create policy "HQ users read franchise leads" on public.franchise_leads
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.role::text in ('Admin', 'Executive', 'Manager', 'AssistantManager')
  )
);

drop policy if exists "HQ users manage franchise leads" on public.franchise_leads;
create policy "HQ users manage franchise leads" on public.franchise_leads
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.role::text in ('Admin', 'Manager', 'AssistantManager')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.role::text in ('Admin', 'Manager', 'AssistantManager')
  )
);

notify pgrst, 'reload schema';
