do $$
begin
  if not exists (select 1 from pg_type where typname = 'franchise_lead_status') then
    create type public.franchise_lead_status as enum ('New', 'Contacted', 'Qualified', 'PackageSent', 'Won', 'Lost');
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

drop trigger if exists franchise_leads_set_updated_at on public.franchise_leads;
create trigger franchise_leads_set_updated_at before update on public.franchise_leads for each row execute function public.set_updated_at();

drop policy if exists "HQ users read franchise leads" on public.franchise_leads;
create policy "HQ users read franchise leads" on public.franchise_leads for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role in ('Admin', 'Sales')
  )
);

drop policy if exists "HQ users manage franchise leads" on public.franchise_leads;
create policy "HQ users manage franchise leads" on public.franchise_leads for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role in ('Admin', 'Sales')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role in ('Admin', 'Sales')
  )
);
