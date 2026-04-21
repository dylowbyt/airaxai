-- ====================================================
-- AIRAX AI — COMPLETE SUPABASE DATABASE SETUP
-- Run this in: Supabase Dashboard → SQL Editor
-- This script contains all tables, policies, and triggers from Phase 1 to Phase 5.
-- ====================================================

-- ====================================================
-- 1. PROFILES TABLE (EXTENDS AUTH.USERS)
-- ====================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_role text not null default 'user' check (user_role in ('user', 'admin')),
  full_name text,
  avatar_url text,
  tokens integer not null default 50,
  daily_chat_count integer not null default 0,
  daily_image_count integer not null default 0,
  daily_video_count integer not null default 0,
  last_usage_reset date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup with initial tokens
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, tokens)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    50
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_role = 'admin'
    )
  );

-- Function to reset daily usage counters
create or replace function public.reset_daily_usage()
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set daily_chat_count = 0,
      daily_image_count = 0,
      daily_video_count = 0,
      last_usage_reset = current_date
  where last_usage_reset < current_date;
end;
$$;

-- ====================================================
-- 2. APP SETTINGS (DYNAMIC PRICING & CONFIG)
-- ====================================================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

alter table public.app_settings enable row level security;

create policy "Anyone can read app settings"
  on public.app_settings for select
  using (true);

create policy "Admins can manage app settings"
  on public.app_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_role = 'admin'
    )
  );

-- Seed default app_settings
insert into public.app_settings (key, value, description) values
  ('token_packages', '[
    {"id": "starter", "name": "Paket Starter", "tokens": 100, "price": 15000, "popular": false},
    {"id": "creator", "name": "Paket Creator", "tokens": 500, "price": 65000, "popular": true},
    {"id": "pro", "name": "Paket Pro", "tokens": 1500, "price": 175000, "popular": false},
    {"id": "business", "name": "Paket Business", "tokens": 5000, "price": 499000, "popular": false}
  ]'::jsonb, 'Token top-up packages with prices'),
  ('generation_costs', '{
    "chat": 0,
    "image": 5,
    "video": 20,
    "audio": 3
  }'::jsonb, 'Token cost per generation type'),
  ('free_limits', '{
    "daily_chat": 15,
    "daily_image": 3,
    "daily_video": 1
  }'::jsonb, 'Free user daily generation limits'),
  ('subscription_prices', '{
    "pro_monthly": 149000,
    "enterprise_monthly": 499000
  }'::jsonb, 'Subscription plan prices (Rp)')
on conflict (key) do nothing;

-- ====================================================
-- 3. TRANSACTIONS TABLE (PAYMENT LOG)
-- ====================================================
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_id text,
  merchant_ref text,
  amount integer not null default 0,
  tokens_awarded integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'success', 'expired', 'failed')),
  payment_gateway text not null default 'sakurupiah',
  payment_method text,
  package_name text,
  checkout_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (user_id = auth.uid());

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (user_id = auth.uid());

create policy "Admins can view all transactions"
  on public.transactions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_role = 'admin'
    )
  );

-- ====================================================
-- 4. NOTIFICATIONS TABLE
-- ====================================================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  status text not null default 'general' check (status in ('maintenance', 'promo', 'general')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  expires_at timestamptz
);

alter table public.notifications enable row level security;

create policy "Anyone can read active notifications"
  on public.notifications for select
  using (is_active = true);

create policy "Admins can manage notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_role = 'admin'
    )
  );

-- Make sure publication exists before adding
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.notifications;

-- Sample notification
insert into public.notifications (title, message, status, is_active)
values
  ('Selamat Datang di AIRAX AI!', 'Platform AI kreator konten terbaru sudah siap. Mulai buat konten sekarang!', 'general', true)
on conflict do nothing;

-- ====================================================
-- 5. CONTENT TABLES (REELS, SHORTS, HISTORY)
-- ====================================================
create table if not exists public.reels (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  prompt text not null,
  image_url text,
  video_url text,
  caption text,
  caption_position text default 'bottom' check (caption_position in ('top', 'center', 'bottom')),
  caption_style text default 'bold' check (caption_style in ('bold', 'outline', 'glow')),
  likes integer default 0,
  is_public boolean default true,
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table public.reels enable row level security;
create policy "Public reels visible to all" on public.reels for select using (is_public = true or user_id = auth.uid());
create policy "Users can insert own reels" on public.reels for insert with check (user_id = auth.uid());
create policy "Users can update own reels" on public.reels for update using (user_id = auth.uid());
create policy "Users can delete own reels" on public.reels for delete using (user_id = auth.uid());

create table if not exists public.shorts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  prompt text not null,
  image_url text,
  video_url text,
  caption text,
  status text default 'completed' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz default now()
);
alter table public.shorts enable row level security;
create policy "Users can view own shorts" on public.shorts for select using (user_id = auth.uid());
create policy "Users can insert own shorts" on public.shorts for insert with check (user_id = auth.uid());

create table if not exists public.history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('shorts', 'reels', 'image')),
  title text,
  prompt text,
  thumbnail_url text,
  status text default 'completed' check (status in ('processing', 'completed', 'failed')),
  reference_id uuid,
  created_at timestamptz default now()
);
alter table public.history enable row level security;
create policy "Users can view own history" on public.history for select using (user_id = auth.uid());
create policy "Users can insert own history" on public.history for insert with check (user_id = auth.uid());

-- ====================================================
-- 6. CHAT TABLES
-- ====================================================
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Percakapan Baru',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.chat_sessions enable row level security;
create policy "Users can view own chat sessions" on public.chat_sessions for select using (user_id = auth.uid());
create policy "Users can insert own chat sessions" on public.chat_sessions for insert with check (user_id = auth.uid());
create policy "Users can update own chat sessions" on public.chat_sessions for update using (user_id = auth.uid());
create policy "Users can delete own chat sessions" on public.chat_sessions for delete using (user_id = auth.uid());

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  image_url text,
  media_result jsonb,
  created_at timestamptz default now()
);
alter table public.chat_messages enable row level security;
create policy "Users can view own chat messages" on public.chat_messages for select using (user_id = auth.uid());
create policy "Users can insert own chat messages" on public.chat_messages for insert with check (user_id = auth.uid());

create or replace function public.update_chat_session_timestamp()
returns trigger language plpgsql security definer as $$
begin
  update public.chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists on_chat_message_inserted on public.chat_messages;
create trigger on_chat_message_inserted after insert on public.chat_messages for each row execute procedure public.update_chat_session_timestamp();
