-- Add subscription tracking to profiles
alter table public.profiles add column if not exists subscription_tier text default 'free';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;

-- Index for cron job performance
create index if not exists idx_profiles_subscription_expires_at on public.profiles(subscription_expires_at);
