-- Migration: 0003_phone_login_support.sql
-- Description: Adds index on shops.mobile and helper function to resolve phone numbers to authentication emails for seamless mobile-number login.

-- 1. Index on shops.mobile for fast phone lookups
create index if not exists shops_mobile_idx on public.shops(mobile);

-- 2. Add category column to other_expenses if not present
alter table if exists public.other_expenses add column if not exists category text not null default 'Business';

-- 3. Function to resolve mobile number to auth email
create or replace function public.get_auth_email_for_mobile(p_mobile text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_clean_mobile text;
begin
  -- Strip non-digits and keep last 10 digits
  v_clean_mobile := right(regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g'), 10);

  if length(v_clean_mobile) < 10 then
    return null;
  end if;

  -- 1. Find email from public.shops where mobile ends with the 10 digits
  select s.email into v_email
  from public.shops s
  where right(regexp_replace(coalesce(s.mobile, ''), '\D', '', 'g'), 10) = v_clean_mobile
  order by s.created_at desc
  limit 1;

  if v_email is not null and length(v_email) > 0 then
    return v_email;
  end if;

  -- 2. Find email from auth.users metadata
  select u.email into v_email
  from auth.users u
  where right(regexp_replace(coalesce(u.raw_user_meta_data->>'mobile', ''), '\D', '', 'g'), 10) = v_clean_mobile
  order by u.created_at desc
  limit 1;

  if v_email is not null and length(v_email) > 0 then
    return v_email;
  end if;

  -- 3. Fallback: deterministic phone email
  return v_clean_mobile || '@dailyexpenses.app';
end;
$$;

grant execute on function public.get_auth_email_for_mobile(text) to anon, authenticated;
