-- Migration: 0005_forgot_password.sql
-- Description: Adds secure RPC functions to allow shopkeepers to reset passwords via shop verification or lookup recovery email.

-- 1. Ensure pgcrypto is enabled for password hashing
create extension if not exists pgcrypto with schema extensions;

-- 2. Function: Reset password using 10-digit mobile and registered shop_name or owner_name verification
create or replace function public.reset_password_with_shop_verification(
  p_mobile text,
  p_shop_verification text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_clean_mobile text;
  v_user_id uuid;
  v_db_shop_name text;
  v_db_owner_name text;
  v_input_verify text;
begin
  -- 1. Validate 10-digit mobile number
  v_clean_mobile := right(regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g'), 10);
  if length(v_clean_mobile) < 10 then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid 10-digit mobile number.');
  end if;

  -- 2. Validate password length
  if length(coalesce(p_new_password, '')) < 6 then
    return jsonb_build_object('success', false, 'error', 'New password must be at least 6 characters.');
  end if;

  -- 3. Lookup shop record
  select user_id, shop_name, owner_name 
  into v_user_id, v_db_shop_name, v_db_owner_name
  from public.shops
  where right(regexp_replace(coalesce(mobile, ''), '\D', '', 'g'), 10) = v_clean_mobile
  order by created_at desc
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No shop found registered with this mobile number.');
  end if;

  -- 4. Match verification text against Shop Name or Owner Name (case-insensitive, trimmed)
  v_input_verify := lower(trim(coalesce(p_shop_verification, '')));
  if v_input_verify = '' or (
    v_input_verify != lower(trim(v_db_shop_name)) and 
    v_input_verify != lower(trim(v_db_owner_name))
  ) then
    return jsonb_build_object(
      'success', false, 
      'error', 'The shop name or owner name does not match our records for this mobile number.'
    );
  end if;

  -- 5. Update auth.users password securely with bcrypt
  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Password updated successfully. You can now sign in with your new password.'
  );
end;
$$;

grant execute on function public.reset_password_with_shop_verification(text, text, text) to anon, authenticated;
