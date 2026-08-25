create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_name text not null,
  movement_type text not null check (movement_type in ('sale_out', 'adjustment_in', 'adjustment_out', 'return_in')),
  quantity numeric(12,2) not null check (quantity > 0),
  unit text,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  reference_type text not null default 'franchisee_order',
  reference_id uuid,
  reference_number text,
  franchisee_order_id uuid references public.franchisee_orders(id) on delete set null,
  sales_document_id uuid references public.sales_documents(id) on delete set null,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_id_idx on public.stock_movements(product_id);
create index if not exists stock_movements_reference_idx on public.stock_movements(reference_type, reference_id);
create index if not exists stock_movements_franchisee_order_id_idx on public.stock_movements(franchisee_order_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements(created_at desc);

alter table public.stock_movements enable row level security;

drop policy if exists "Back office users read stock movements" on public.stock_movements;
create policy "Back office users read stock movements"
  on public.stock_movements
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = (select auth.uid())
      and users.role::text in ('Admin', 'Executive', 'Manager', 'AssistantManager', 'Sales', 'Accountant')
    )
  );

drop policy if exists "Back office users insert stock movements" on public.stock_movements;
create policy "Back office users insert stock movements"
  on public.stock_movements
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = (select auth.uid())
      and users.role::text in ('Admin', 'Executive', 'Manager', 'AssistantManager', 'Sales', 'Accountant')
    )
  );

grant select, insert on public.stock_movements to authenticated;
