-- ====================================================
-- AIRAX AI — Phase 2 Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ====================================================

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_role text not null default 'user' check (user_role in ('user', 'admin')),
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
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

-- ====================================================
-- 2. Notifications table (admin-controlled)
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

-- All logged-in users can read active notifications
create policy "Anyone can read active notifications"
  on public.notifications for select
  using (is_active = true);

-- Only admins can write notifications
create policy "Admins can manage notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_role = 'admin'
    )
  );

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;

-- ====================================================
-- 3. Reels table
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

create policy "Public reels visible to all"
  on public.reels for select
  using (is_public = true or user_id = auth.uid());

create policy "Users can insert own reels"
  on public.reels for insert
  with check (user_id = auth.uid());

create policy "Users can update own reels"
  on public.reels for update
  using (user_id = auth.uid());

create policy "Users can delete own reels"
  on public.reels for delete
  using (user_id = auth.uid());

-- ====================================================
-- 4. Shorts table
-- ====================================================
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

create policy "Users can view own shorts"
  on public.shorts for select
  using (user_id = auth.uid());

create policy "Users can insert own shorts"
  on public.shorts for insert
  with check (user_id = auth.uid());

-- ====================================================
-- 5. History table (combined activity log)
-- ====================================================
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

create policy "Users can view own history"
  on public.history for select
  using (user_id = auth.uid());

create policy "Users can insert own history"
  on public.history for insert
  with check (user_id = auth.uid());

-- ====================================================
-- 6. Seed: Make first user admin (run manually)
-- Replace 'your-user-id' with actual UUID from auth.users
-- ====================================================
-- update public.profiles set user_role = 'admin' where id = 'your-user-id';

-- ====================================================
-- 7. Sample notification for testing
-- ====================================================
insert into public.notifications (title, message, status, is_active)
values
  ('Selamat Datang di AIRAX AI!', 'Platform AI kreator konten terbaru sudah siap. Mulai buat Shorts dan Reels kamu sekarang!', 'general', true),
  ('🎉 Promo Spesial Launch', 'Dapatkan 500 kredit bonus untuk pengguna baru! Berlaku hingga akhir bulan.', 'promo', true)
on conflict do nothing;
