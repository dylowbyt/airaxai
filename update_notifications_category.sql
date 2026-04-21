-- Update notifications table with category
alter table public.notifications add column if not exists category text default 'system' check (category in ('system', 'social'));

-- Update status check to include social types if needed, or just use category
-- Let's add a 'social' status just in case
alter table public.notifications drop constraint if exists notifications_status_check;
alter table public.notifications add constraint notifications_status_check check (status in ('maintenance', 'promo', 'general', 'like', 'save', 'social'));

-- Policy for social notifications
create policy "Users can insert social notifications"
  on public.notifications for insert
  with check (category = 'social');
