grant usage on schema public to anon, authenticated;

grant select on public.users to authenticated;

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
