alter type public.user_role add value if not exists 'Executive';
alter type public.user_role add value if not exists 'Manager';
alter type public.user_role add value if not exists 'AssistantManager';

update public.users
set role = 'Manager'::public.user_role,
    updated_at = now()
where role::text = 'Sales';

update public.users
set role = 'Executive'::public.user_role,
    updated_at = now()
where role::text = 'Accountant';

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
