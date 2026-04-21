-- Add user_id to notifications table for targeted notifications
alter table public.notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Drop old read policy
drop policy if exists "Anyone can read active notifications" on public.notifications;

-- Create new read policy (global + personal)
create policy "Users can read notifications"
  on public.notifications for select
  using (is_active = true and (user_id = auth.uid() or user_id is null));
