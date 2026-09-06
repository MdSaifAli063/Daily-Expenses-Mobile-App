-- Migration: 0006_performance_optimization.sql
-- Description: Adds high-performance composite indexes and server-side aggregation RPC for 100k user scalability.

-- 1. Functional Expression Index on shops for O(1) clean 10-digit mobile lookup
-- This replaces sequential table scans during login (get_auth_email_for_mobile) and password reset
create index if not exists idx_shops_clean_mobile
  on public.shops ((right(regexp_replace(coalesce(mobile, ''), '\D', '', 'g'), 10)));

-- 2. Composite Indexes on daily_entries for fast date range filtering and sorting
-- Eliminates bitmap index joins and sorting overhead on Home, Entries, and Reports queries
create index if not exists idx_daily_entries_shop_date
  on public.daily_entries (shop_id, entry_date desc);

create index if not exists idx_daily_entries_user_date
  on public.daily_entries (user_id, entry_date desc);

-- 3. Composite Index on other_expenses for fast join and category-based financial aggregation
create index if not exists idx_other_expenses_entry_category
  on public.other_expenses (daily_entry_id, category);

-- 4. Composite Index on report_exports for fast export history retrieval
create index if not exists idx_report_exports_shop_created
  on public.report_exports (shop_id, created_at desc);

-- 5. High-Performance Server-Side RPC to calculate Monthly Summary directly in PostgreSQL
-- Eliminates transferring the entire month of daily entries and other expenses to the mobile device
create or replace function public.get_month_summary(
  p_year int,
  p_month int,
  p_shop_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_start_date date;
  v_next_month_date date;
  v_total_collection numeric := 0;
  v_fixed_home_expense numeric := 0;
  v_oe_business numeric := 0;
  v_oe_home numeric := 0;
  v_oe_other numeric := 0;
  v_working_days int := 0;
  v_holidays int := 0;
  v_total_expense numeric := 0;
  v_total_profit numeric := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify user ownership of the shop
  if not exists (
    select 1 from public.shops
    where id = p_shop_id and user_id = v_user_id
  ) then
    raise exception 'Shop not found or unauthorized';
  end if;

  -- Calculate date boundaries for the given month
  v_start_date := make_date(p_year, p_month, 1);
  v_next_month_date := (v_start_date + interval '1 month')::date;

  -- 1. Aggregate collections, fixed home expenses, working days, and holidays from daily_entries
  select
    coalesce(sum(collection), 0),
    coalesce(sum(home_expense), 0),
    coalesce(count(*) filter (where day_type = 'working'), 0),
    coalesce(count(*) filter (where day_type = 'holiday'), 0)
  into
    v_total_collection,
    v_fixed_home_expense,
    v_working_days,
    v_holidays
  from public.daily_entries
  where shop_id = p_shop_id
    and entry_date >= v_start_date
    and entry_date < v_next_month_date;

  -- 2. Aggregate other_expenses grouped by category for the same month
  select
    coalesce(sum(case when oe.category in ('Business', 'Staff', 'Transport', 'Utilities') then oe.amount else 0 end), 0),
    coalesce(sum(case when oe.category in ('Personal', 'Household') then oe.amount else 0 end), 0),
    coalesce(sum(case when oe.category not in ('Business', 'Staff', 'Transport', 'Utilities', 'Personal', 'Household') then oe.amount else 0 end), 0)
  into
    v_oe_business,
    v_oe_home,
    v_oe_other
  from public.other_expenses oe
  join public.daily_entries de on de.id = oe.daily_entry_id
  where de.shop_id = p_shop_id
    and de.entry_date >= v_start_date
    and de.entry_date < v_next_month_date;

  -- 3. Compute final totals matching exact application logic
  -- Total Expense = fixedHomeExpense + (business + otherHome + otherBusiness)
  v_total_expense := v_fixed_home_expense + v_oe_business + v_oe_home + v_oe_other;
  v_total_profit := v_total_collection - v_total_expense;

  return jsonb_build_object(
    'totalCollection', v_total_collection,
    'totalExpense', v_total_expense,
    'totalProfit', v_total_profit,
    'workingDays', v_working_days,
    'holidays', v_holidays
  );
end;
$$;

grant execute on function public.get_month_summary(int, int, uuid) to authenticated;
revoke execute on function public.get_month_summary(int, int, uuid) from anon;

-- 6. Harden search_path on existing security definer functions
alter function public.save_daily_entry(date, text, numeric, numeric, numeric, numeric, text, jsonb)
  set search_path = public, auth;

