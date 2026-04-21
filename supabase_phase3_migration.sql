-- ====================================================
-- AIRAX AI — Phase 3 Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ====================================================

-- 1. Chat Sessions Table
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Percakapan Baru',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Chat Sessions
alter table public.chat_sessions enable row level security;

create policy "Users can view own chat sessions"
  on public.chat_sessions for select
  using (user_id = auth.uid());

create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert
  with check (user_id = auth.uid());

create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  using (user_id = auth.uid());

create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  using (user_id = auth.uid());

-- 2. Chat Messages Table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  image_url text, -- For vision capabilities (user uploads)
  media_result jsonb, -- For storing generated image/video URLs by the assistant
  created_at timestamptz default now()
);

-- RLS for Chat Messages
alter table public.chat_messages enable row level security;

create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (user_id = auth.uid());

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (user_id = auth.uid());

-- Trigger to update chat_sessions updated_at on new message
create or replace function public.update_chat_session_timestamp()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.chat_sessions
  set updated_at = now()
  where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists on_chat_message_inserted on public.chat_messages;
create trigger on_chat_message_inserted
  after insert on public.chat_messages
  for each row execute procedure public.update_chat_session_timestamp();
