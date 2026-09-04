-- Migration: 0002_daily_entry_system.sql
-- Description: Creates daily_entries and other_expenses tables with foreign keys, constraints, indexes, RLS, and an atomic save_daily_entry RPC.

-- 1. Create daily_entries table
create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  day_type text not null default 'working' check (day_type in ('working', 'holiday')),
  collection numeric(12,2) not null default 0 check (collection >= 0),
  milk_expense numeric(12,2) not null default 0 check (milk_expense >= 0),
  vimal_expense numeric(12,2) not null default 0 check (vimal_expense >= 0),
  home_expense numeric(12,2) not null default 0 check (home_expense >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_entries_shop_date_key unique (shop_id, entry_date)
);

-- Indexes on daily_entries
create index if not exists daily_entries_shop_id_idx on public.daily_entries(shop_id);
create index if not exists daily_entries_entry_date_idx on public.daily_entries(entry_date);
create index if not exists daily_entries_user_id_idx on public.daily_entries(user_id);

-- Automatic updated_at trigger for daily_entries
drop trigger if exists on_daily_entries_updated on public.daily_entries;
create trigger on_daily_entries_updated
  before update on public.daily_entries
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security on daily_entries
alter table public.daily_entries enable row level security;

-- Policies on daily_entries
create policy "Users can view their own daily entries"
  on public.daily_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own daily entries"
  on public.daily_entries
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.shops
      where id = shop_id and user_id = (select auth.uid())
    )
  );

create policy "Users can update their own daily entries"
  on public.daily_entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own daily entries"
  on public.daily_entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.daily_entries to authenticated;
revoke all on table public.daily_entries from anon;


-- 2. Create other_expenses table
create table if not exists public.other_expenses (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_name text not null check (length(trim(expense_name)) > 0),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  category text not null default 'Business',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes on other_expenses
create index if not exists other_expenses_daily_entry_id_idx on public.other_expenses(daily_entry_id);
create index if not exists other_expenses_shop_id_idx on public.other_expenses(shop_id);
create index if not exists other_expenses_user_id_idx on public.other_expenses(user_id);

-- Automatic updated_at trigger for other_expenses
drop trigger if exists on_other_expenses_updated on public.other_expenses;
create trigger on_other_expenses_updated
  before update on public.other_expenses
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security on other_expenses
alter table public.other_expenses enable row level security;

-- Policies on other_expenses
create policy "Users can view their own other expenses"
  on public.other_expenses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own other expenses"
  on public.other_expenses
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.daily_entries
      where id = daily_entry_id and user_id = (select auth.uid())
    )
  );

create policy "Users can update their own other expenses"
  on public.other_expenses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own other expenses"
  on public.other_expenses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.other_expenses to authenticated;
revoke all on table public.other_expenses from anon;


-- 3. Atomic RPC Function to Save Daily Entry and Other Expenses
create or replace function public.save_daily_entry(
  p_entry_date date,
  p_day_type text,
  p_collection numeric,
  p_milk_expense numeric,
  p_vimal_expense numeric,
  p_home_expense numeric,
  p_notes text,
  p_other_expenses jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_shop_id uuid;
  v_entry_id uuid;
  v_item jsonb;
  v_name text;
  v_amount numeric;
  v_category text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Look up shop for user
  select id into v_shop_id
  from public.shops
  where user_id = v_user_id
  limit 1;

  if v_shop_id is null then
    raise exception 'Shop not found for user';
  end if;

  -- Validate day_type
  if p_day_type not in ('working', 'holiday') then
    raise exception 'Invalid day type. Must be working or holiday';
  end if;

  -- Upsert daily_entry on conflict (shop_id, entry_date)
  insert into public.daily_entries (
    shop_id,
    user_id,
    entry_date,
    day_type,
    collection,
    milk_expense,
    vimal_expense,
    home_expense,
    notes
  ) values (
    v_shop_id,
    v_user_id,
    p_entry_date,
    p_day_type,
    coalesce(p_collection, 0),
    coalesce(p_milk_expense, 0),
    coalesce(p_vimal_expense, 0),
    coalesce(p_home_expense, 0),
    nullif(trim(p_notes), '')
  )
  on conflict (shop_id, entry_date) do update set
    day_type = excluded.day_type,
    collection = excluded.collection,
    milk_expense = excluded.milk_expense,
    vimal_expense = excluded.vimal_expense,
    home_expense = excluded.home_expense,
    notes = excluded.notes,
    updated_at = now()
  returning id into v_entry_id;

  -- Synchronize other_expenses: delete existing rows for this daily_entry and re-insert
  delete from public.other_expenses
  where daily_entry_id = v_entry_id and user_id = v_user_id;

  if p_other_expenses is not null and jsonb_array_length(p_other_expenses) > 0 then
    for v_item in select * from jsonb_array_elements(p_other_expenses) loop
      v_name := trim(v_item->>'expense_name');
      v_amount := coalesce((v_item->>'amount')::numeric, 0);
      v_category := coalesce(nullif(trim(v_item->>'category'), ''), 'Business');

      if v_name is not null and length(v_name) > 0 and v_amount >= 0 then
        insert into public.other_expenses (
          daily_entry_id,
          shop_id,
          user_id,
          expense_name,
          amount,
          category
        ) values (
          v_entry_id,
          v_shop_id,
          v_user_id,
          v_name,
          v_amount,
          v_category
        );
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'success', true,
    'daily_entry_id', v_entry_id,
    'entry_date', p_entry_date
  );
end;
$$;

grant execute on function public.save_daily_entry(date, text, numeric, numeric, numeric, numeric, text, jsonb) to authenticated;
revoke execute on function public.save_daily_entry(date, text, numeric, numeric, numeric, numeric, text, jsonb) from anon;
