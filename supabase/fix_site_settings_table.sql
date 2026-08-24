create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (key, value)
values (
  'public_contact',
  '{
    "brandPhone": "",
    "lineUrl": "https://line.me/R/ti/p/@domicha",
    "lineLabel": "@domicha",
    "contactNote": "ฝากข้อมูลเบื้องต้นเพื่อให้ทีมงานแนะนำแพ็กเกจตามงบ ทำเล และรูปแบบร้านที่ต้องการ"
  }'::jsonb
)
on conflict (key) do update
set value = public.site_settings.value || excluded.value,
    updated_at = now();

drop policy if exists "Anyone can read public site settings" on public.site_settings;
create policy "Anyone can read public site settings" on public.site_settings
for select
to anon, authenticated
using (key = 'public_contact');

drop policy if exists "HQ users manage site settings" on public.site_settings;
create policy "HQ users manage site settings" on public.site_settings
for all
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
