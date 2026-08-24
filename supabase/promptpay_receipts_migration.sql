-- DomiCha PromptPay + receipt workflow
-- Run this in Supabase SQL Editor before deploying the payment/receipt UI.

alter table public.franchisee_orders
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references public.users(id),
  add column if not exists payment_received_at timestamptz,
  add column if not exists payment_reference text,
  add column if not exists promptpay_payload text,
  add column if not exists promptpay_account_name text,
  add column if not exists invoice_number text unique,
  add column if not exists invoice_issued_at timestamptz,
  add column if not exists invoice_due_at timestamptz,
  add column if not exists invoice_delivery_status text not null default 'Not sent',
  add column if not exists invoice_email_sent_at timestamptz,
  add column if not exists invoice_drive_file_url text,
  add column if not exists invoice_month_folder_name text,
  add column if not exists invoice_delivery_error text,
  add column if not exists receipt_number text unique,
  add column if not exists receipt_issued_at timestamptz,
  add column if not exists receipt_delivery_status text not null default 'Not sent',
  add column if not exists receipt_email_sent_at timestamptz,
  add column if not exists receipt_drive_file_url text,
  add column if not exists receipt_month_folder_name text,
  add column if not exists receipt_delivery_error text;

create index if not exists franchisee_orders_payment_status_idx
  on public.franchisee_orders(payment_status);

create index if not exists franchisee_orders_payment_received_at_idx
  on public.franchisee_orders(payment_received_at);

create index if not exists franchisee_orders_invoice_number_idx
  on public.franchisee_orders(invoice_number)
  where invoice_number is not null;

create index if not exists franchisee_orders_invoice_delivery_status_idx
  on public.franchisee_orders(invoice_delivery_status);

create index if not exists franchisee_orders_receipt_number_idx
  on public.franchisee_orders(receipt_number)
  where receipt_number is not null;

create index if not exists franchisee_orders_receipt_delivery_status_idx
  on public.franchisee_orders(receipt_delivery_status);

notify pgrst, 'reload schema';
