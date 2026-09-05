-- ==============================================================================
-- 0004_reports.sql: Phase 7 Report Exports and Supabase Storage Setup
-- ==============================================================================

-- 1. Create public.report_exports table
create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  report_type text not null check (report_type in ('day', 'week', 'month', 'custom')),
  start_date date not null,
  end_date date not null,
  file_type text not null check (file_type in ('pdf', 'xlsx')),
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

-- 2. Performance indexes
create index if not exists idx_report_exports_user_id on public.report_exports(user_id);
create index if not exists idx_report_exports_shop_id on public.report_exports(shop_id);
create index if not exists idx_report_exports_created_at on public.report_exports(created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.report_exports enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can view their own report exports" on public.report_exports;
drop policy if exists "Users can insert their own report exports" on public.report_exports;
drop policy if exists "Users can delete their own report exports" on public.report_exports;

-- Strict user ownership policies
create policy "Users can view their own report exports"
  on public.report_exports
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own report exports"
  on public.report_exports
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own report exports"
  on public.report_exports
  for delete
  using (auth.uid() = user_id);

-- 4. Supabase Storage: Private bucket setup
insert into storage.buckets (id, name, public)
values ('report-exports', 'report-exports', false)
on conflict (id) do nothing;

-- 5. Storage RLS Policies for report-exports bucket
-- Allows authenticated users to manage files strictly within their own user_id folder: {userId}/*
drop policy if exists "Authenticated users can read own report exports" on storage.objects;
drop policy if exists "Authenticated users can upload own report exports" on storage.objects;
drop policy if exists "Authenticated users can delete own report exports" on storage.objects;

create policy "Authenticated users can read own report exports"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can upload own report exports"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'report-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can delete own report exports"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'report-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
