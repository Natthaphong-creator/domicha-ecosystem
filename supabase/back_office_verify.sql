select
  role::text,
  count(*) as users
from public.users
group by role::text
order by role::text;

select
  key,
  value
from public.site_settings
where key = 'public_contact';

select
  count(*) as franchise_leads
from public.franchise_leads;
