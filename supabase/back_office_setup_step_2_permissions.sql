create type if not exists public.franchise_lead_status as enum (
  'New',
  'Contacted',
  'Qualified',
  'PackageSent',
  'Won',
  'Lost'
);

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
create trigger franchise_leads_set_updated_at
before update on public.franchise_leads
for each row execute function public.set_updated_at();

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || '{"full_name":"DomiCha Owner","role":"Admin"}'::jsonb
where id = '1148e8d2-679c-4241-ba67-b522a2b50d8b';

insert into public.users (id, email, full_name, role)
select
  id,
  email,
  coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), email, 'DomiCha Owner'),
  'Admin'::public.user_role
from auth.users
where id = '1148e8d2-679c-4241-ba67-b522a2b50d8b'
on conflict (id) do update
set
  email = coalesce(excluded.email, public.users.email),
  full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name),
  role = 'Admin'::public.user_role,
  updated_at = now();

update public.users
set role = 'Manager'::public.user_role,
    updated_at = now()
where role::text = 'Sales';

update public.users
set role = 'Executive'::public.user_role,
    updated_at = now()
where role::text = 'Accountant';

insert into public.site_settings (key, value)
values (
  'public_contact',
  '{"brandPhone":"","lineUrl":"https://line.me/R/ti/p/@domicha","lineLabel":"@domicha","contactNote":"ฝากข้อมูลเบื้องต้นเพื่อให้ทีมงานแนะนำแพ็กเกจตามงบ ทำเล และรูปแบบร้านที่ต้องการ"}'::jsonb
)
on conflict (key) do update
set value = public.site_settings.value || excluded.value,
    updated_at = now();

drop policy if exists "HQ users manage branches" on public.branches;
create policy "HQ users manage branches" on public.branches for all
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager')
  )
);

drop policy if exists "HQ users read franchisees" on public.franchisee_profiles;
create policy "HQ users read franchisees" on public.franchisee_profiles for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Executive', 'Manager')
  )
);

drop policy if exists "HQ users manage franchisees" on public.franchisee_profiles;
create policy "HQ users manage franchisees" on public.franchisee_profiles for all
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager')
  )
);

drop policy if exists "HQ users read franchise leads" on public.franchise_leads;
create policy "HQ users read franchise leads" on public.franchise_leads for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Executive', 'Manager', 'AssistantManager')
  )
);

drop policy if exists "HQ users manage franchise leads" on public.franchise_leads;
create policy "HQ users manage franchise leads" on public.franchise_leads for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager', 'AssistantManager')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager', 'AssistantManager')
  )
);

drop policy if exists "HQ users manage site settings" on public.site_settings;
create policy "HQ users manage site settings" on public.site_settings for all
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text = 'Admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text = 'Admin'
  )
);

drop policy if exists "HQ users read franchisee orders" on public.franchisee_orders;
create policy "HQ users read franchisee orders" on public.franchisee_orders for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Executive', 'Manager', 'AssistantManager')
  )
);

drop policy if exists "HQ users manage franchisee orders" on public.franchisee_orders;
create policy "HQ users manage franchisee orders" on public.franchisee_orders for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Manager')
  )
);

drop policy if exists "HQ users read franchisee order items" on public.franchisee_order_items;
create policy "HQ users read franchisee order items" on public.franchisee_order_items for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role::text in ('Admin', 'Executive', 'Manager', 'AssistantManager')
  )
);
