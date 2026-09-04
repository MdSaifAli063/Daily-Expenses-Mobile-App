-- Migration: 0001_create_shops.sql
-- Description: Creates the shops profile table with foreign key to auth.users, updated_at trigger, and strict RLS policies.

-- 1. Create shops table
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  shop_name text not null,
  owner_name text not null,
  email text,
  mobile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create index on user_id for fast queries
create index if not exists shops_user_id_idx on public.shops(user_id);

-- 3. Automatic updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_shops_updated on public.shops;
create trigger on_shops_updated
  before update on public.shops
  for each row
  execute function public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.shops enable row level security;

-- 5. Strict RLS Policies for Authenticated Users
-- SELECT: Users can only read their own shop profile
create policy "Users can view their own shop"
  on public.shops
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: Users can only insert a shop profile with their own user_id
create policy "Users can insert their own shop"
  on public.shops
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own shop profile
create policy "Users can update their own shop"
  on public.shops
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own shop profile
create policy "Users can delete their own shop"
  on public.shops
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 6. Permissions / Grants
grant select, insert, update, delete on table public.shops to authenticated;
revoke all on table public.shops from anon;
