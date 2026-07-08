-- DomiCha Franchisee Portal migration
-- ใช้ไฟล์นี้เมื่อเคยรัน supabase/schema.sql เดิมแล้ว และต้องการเพิ่มระบบแฟรนไชส์ซีแบบ A

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'franchisee_status') then
    create type public.franchisee_status as enum ('Pending', 'Active', 'Suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'franchisee_order_status') then
    create type public.franchisee_order_status as enum ('Received', 'Confirmed', 'Packing', 'Shipped', 'Completed', 'Cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('Pending', 'Paid', 'Overdue', 'Cancelled');
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    alter type public.user_role add value if not exists 'Franchisee';
  end if;
end $$;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  branch_code text unique not null,
  branch_name text not null,
  province text,
  address text,
  status status_type not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.franchisee_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  branch_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  province text,
  shipping_address text,
  tax_id text,
  credit_limit numeric(12,2) not null default 0,
  payment_terms text not null default 'ชำระก่อนจัดส่ง',
  status franchisee_status not null default 'Pending',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.franchisee_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  franchisee_id uuid not null references public.franchisee_profiles(id),
  user_id uuid not null references public.users(id),
  branch_id uuid references public.branches(id) on delete set null,
  delivery_method text not null default 'delivery',
  shipping_address text,
  payment_method text not null default 'transfer',
  order_status franchisee_order_status not null default 'Received',
  payment_status payment_status not null default 'Pending',
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  note text,
  line_request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.franchisee_order_items (
  id uuid primary key default gen_random_uuid(),
  franchisee_order_id uuid not null references public.franchisee_orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  unit text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.branches enable row level security;
alter table public.franchisee_profiles enable row level security;
alter table public.franchisee_orders enable row level security;
alter table public.franchisee_order_items enable row level security;

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();

drop trigger if exists franchisee_profiles_set_updated_at on public.franchisee_profiles;
create trigger franchisee_profiles_set_updated_at before update on public.franchisee_profiles for each row execute function public.set_updated_at();

drop trigger if exists franchisee_orders_set_updated_at on public.franchisee_orders;
create trigger franchisee_orders_set_updated_at before update on public.franchisee_orders for each row execute function public.set_updated_at();

drop policy if exists "Authenticated users read active branches" on public.branches;
create policy "Authenticated users read active branches" on public.branches for select using (auth.role() = 'authenticated');

drop policy if exists "HQ users manage branches" on public.branches;
create policy "HQ users manage branches" on public.branches for all using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
) with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);

drop policy if exists "Franchisees read own profile" on public.franchisee_profiles;
create policy "Franchisees read own profile" on public.franchisee_profiles for select using (user_id = auth.uid());

drop policy if exists "HQ users read franchisees" on public.franchisee_profiles;
create policy "HQ users read franchisees" on public.franchisee_profiles for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);

drop policy if exists "HQ users manage franchisees" on public.franchisee_profiles;
create policy "HQ users manage franchisees" on public.franchisee_profiles for all using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
) with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);

drop policy if exists "Franchisees read own orders" on public.franchisee_orders;
create policy "Franchisees read own orders" on public.franchisee_orders for select using (user_id = auth.uid());

drop policy if exists "Franchisees create own orders" on public.franchisee_orders;
create policy "Franchisees create own orders" on public.franchisee_orders for insert with check (user_id = auth.uid());

drop policy if exists "HQ users read franchisee orders" on public.franchisee_orders;
create policy "HQ users read franchisee orders" on public.franchisee_orders for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);

drop policy if exists "HQ users manage franchisee orders" on public.franchisee_orders;
create policy "HQ users manage franchisee orders" on public.franchisee_orders for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
) with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);

drop policy if exists "Franchisees read own order items" on public.franchisee_order_items;
create policy "Franchisees read own order items" on public.franchisee_order_items for select using (
  exists (
    select 1 from public.franchisee_orders o
    where o.id = franchisee_order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "Franchisees create own order items" on public.franchisee_order_items;
create policy "Franchisees create own order items" on public.franchisee_order_items for insert with check (
  exists (
    select 1 from public.franchisee_orders o
    where o.id = franchisee_order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "HQ users read franchisee order items" on public.franchisee_order_items;
create policy "HQ users read franchisee order items" on public.franchisee_order_items for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);
