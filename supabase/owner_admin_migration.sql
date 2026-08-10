-- Promote the DomiCha owner account to the highest back-office role.
-- Run this in Supabase SQL Editor after the auth user exists.

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
