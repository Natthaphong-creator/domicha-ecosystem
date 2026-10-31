begin;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $function$
begin
 insert into public.users(id,email,full_name,role)
 values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'Franchisee');
 return new;
end;
$function$;
revoke all on function public.handle_new_user() from public,anon,authenticated;
revoke update on public.users from anon,authenticated;
create policy "Approved franchise membership required to order" on public.franchisee_orders
as restrictive for insert to authenticated
with check (
 user_id=auth.uid()
 and exists(select 1 from public.users u join public.franchisee_profiles f on f.user_id=u.id join public.branches b on b.id=f.branch_id
 where u.id=auth.uid() and u.role='Franchisee' and f.status='Active' and b.status='Active'
 and f.id=franchisee_orders.franchisee_id and f.branch_id=franchisee_orders.branch_id)
);
commit;

-- Explicitly approved by the owner for franchise login; RLS remains enabled.
grant select (id,user_id,branch_id,branch_name,status) on public.franchisee_profiles to authenticated;
grant select (id,branch_name,status) on public.branches to authenticated;
