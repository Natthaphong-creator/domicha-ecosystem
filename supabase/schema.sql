create extension if not exists "pgcrypto";

create type user_role as enum ('Admin', 'Sales', 'Accountant', 'Franchisee');
create type status_type as enum ('Active', 'Inactive');
create type customer_type as enum ('Retail', 'Franchisee', 'Corporate');
create type vat_type as enum ('VAT 7%', 'No VAT', 'VAT Included');
create type quotation_status as enum ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');
create type document_type as enum ('quotation_pdf');
create type sales_document_type as enum ('Invoice', 'Receipt', 'TaxInvoice');
create type sales_document_status as enum ('Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled');
create type delivery_channel as enum ('LINE');
create type delivery_status as enum ('Queued', 'Sent', 'Failed', 'Skipped');
create type franchisee_status as enum ('Pending', 'Active', 'Suspended');
create type franchisee_order_status as enum ('Received', 'Confirmed', 'Packing', 'Shipped', 'Completed', 'Cancelled');
create type payment_status as enum ('Pending', 'Paid', 'Overdue', 'Cancelled');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  role user_role not null default 'Sales',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  branch_code text unique not null,
  branch_name text not null,
  province text,
  address text,
  status status_type not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.franchisee_profiles (
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

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact_person text,
  phone text,
  email text,
  tax_id text,
  billing_address text,
  shipping_address text,
  customer_type customer_type not null default 'Retail',
  status status_type not null default 'Active',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  contact_person text,
  phone text,
  email text,
  tax_id text,
  address text,
  payment_terms text,
  product_category_supplied text,
  status status_type not null default 'Active',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  product_name text not null,
  category text,
  unit text not null,
  cost_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  image_url text,
  vat_type vat_type not null default 'VAT 7%',
  minimum_stock numeric(12,2) not null default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status status_type not null default 'Active',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text unique not null,
  customer_id uuid not null references public.customers(id),
  quotation_date date not null default current_date,
  valid_until date,
  status quotation_status not null default 'Draft',
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  vat_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  notes text,
  history jsonb not null default '[]'::jsonb,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.document_files (
  id uuid primary key default gen_random_uuid(),
  related_table text not null,
  related_id uuid not null,
  document_type document_type not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists line_user_id text,
  add column if not exists auto_send_invoice_line boolean not null default false;

create table public.sales_documents (
  id uuid primary key default gen_random_uuid(),
  document_number text unique not null,
  document_type sales_document_type not null default 'Invoice',
  customer_id uuid not null references public.customers(id),
  issue_date date not null default current_date,
  due_date date,
  status sales_document_status not null default 'Draft',
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  vat_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  notes text,
  public_token uuid not null default gen_random_uuid(),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales_document_items (
  id uuid primary key default gen_random_uuid(),
  sales_document_id uuid not null references public.sales_documents(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.line_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  sales_document_id uuid references public.sales_documents(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  channel delivery_channel not null default 'LINE',
  recipient_id text not null,
  status delivery_status not null default 'Queued',
  line_request_id text,
  error_message text,
  attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  created_by uuid references public.users(id)
);

create table public.franchisee_orders (
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

create table public.franchisee_order_items (
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();
create trigger franchisee_profiles_set_updated_at before update on public.franchisee_profiles for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger quotations_set_updated_at before update on public.quotations for each row execute function public.set_updated_at();
create trigger sales_documents_set_updated_at before update on public.sales_documents for each row execute function public.set_updated_at();
create trigger franchisee_orders_set_updated_at before update on public.franchisee_orders for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'Sales')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.generate_quotation_number()
returns text
language plpgsql
as $$
declare
  ym text := to_char(current_date, 'YYYYMM');
  next_no integer;
begin
  select coalesce(max(substring(quotation_number from 11 for 4)::integer), 0) + 1
  into next_no
  from public.quotations
  where quotation_number like 'QT-' || ym || '-%';

  return 'QT-' || ym || '-' || lpad(next_no::text, 4, '0');
end;
$$;

create or replace function public.set_quotation_number()
returns trigger
language plpgsql
as $$
begin
  if new.quotation_number is null or new.quotation_number = '' then
    new.quotation_number := public.generate_quotation_number();
  end if;
  return new;
end;
$$;

create trigger quotations_set_number
  before insert on public.quotations
  for each row execute function public.set_quotation_number();

create or replace function public.append_quotation_history()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.history := jsonb_build_array(jsonb_build_object('at', now(), 'action', 'created', 'status', new.status));
  elsif old.status is distinct from new.status then
    new.history := old.history || jsonb_build_object('at', now(), 'action', 'status_changed', 'from', old.status, 'to', new.status);
  else
    new.history := old.history || jsonb_build_object('at', now(), 'action', 'updated', 'status', new.status);
  end if;
  return new;
end;
$$;

create trigger quotations_history
  before insert or update on public.quotations
  for each row execute function public.append_quotation_history();

alter table public.users enable row level security;
alter table public.branches enable row level security;
alter table public.franchisee_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.document_files enable row level security;
alter table public.sales_documents enable row level security;
alter table public.sales_document_items enable row level security;
alter table public.line_delivery_logs enable row level security;
alter table public.franchisee_orders enable row level security;
alter table public.franchisee_order_items enable row level security;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Authenticated users read active branches" on public.branches for select using (auth.role() = 'authenticated');
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

create policy "Franchisees read own profile" on public.franchisee_profiles for select using (user_id = auth.uid());
create policy "HQ users read franchisees" on public.franchisee_profiles for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);
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

create policy "Authenticated users read customers" on public.customers for select using (auth.role() = 'authenticated');
create policy "Authenticated users write customers" on public.customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users read suppliers" on public.suppliers for select using (auth.role() = 'authenticated');
create policy "Authenticated users write suppliers" on public.suppliers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users read products" on public.products for select using (auth.role() = 'authenticated');
create policy "Authenticated users write products" on public.products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users read quotations" on public.quotations for select using (auth.role() = 'authenticated');
create policy "Authenticated users write quotations" on public.quotations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users read quotation items" on public.quotation_items for select using (auth.role() = 'authenticated');
create policy "Authenticated users write quotation items" on public.quotation_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users read document files" on public.document_files for select using (auth.role() = 'authenticated');
create policy "Authenticated users write document files" on public.document_files for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users read sales documents" on public.sales_documents for select using (auth.role() = 'authenticated');
create policy "Authenticated users write sales documents" on public.sales_documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users read sales document items" on public.sales_document_items for select using (auth.role() = 'authenticated');
create policy "Authenticated users write sales document items" on public.sales_document_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users read LINE delivery logs" on public.line_delivery_logs for select using (auth.role() = 'authenticated');
create policy "Authenticated users write LINE delivery logs" on public.line_delivery_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Franchisees read own orders" on public.franchisee_orders for select using (user_id = auth.uid());
create policy "Franchisees create own orders" on public.franchisee_orders for insert with check (user_id = auth.uid());
create policy "HQ users read franchisee orders" on public.franchisee_orders for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);
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

create policy "Franchisees read own order items" on public.franchisee_order_items for select using (
  exists (
    select 1 from public.franchisee_orders o
    where o.id = franchisee_order_id and o.user_id = auth.uid()
  )
);
create policy "Franchisees create own order items" on public.franchisee_order_items for insert with check (
  exists (
    select 1 from public.franchisee_orders o
    where o.id = franchisee_order_id and o.user_id = auth.uid()
  )
);
create policy "HQ users read franchisee order items" on public.franchisee_order_items for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('Admin', 'Sales', 'Accountant')
  )
);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Authenticated users read documents"
on storage.objects for select
using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Authenticated users write documents"
on storage.objects for insert
with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Authenticated users update documents"
on storage.objects for update
using (bucket_id = 'documents' and auth.role() = 'authenticated')
with check (bucket_id = 'documents' and auth.role() = 'authenticated');
