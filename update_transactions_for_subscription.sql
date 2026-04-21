-- Update transactions table for subscription support
alter table public.transactions add column if not exists transaction_type text default 'topup' check (transaction_type in ('topup', 'subscription'));
alter table public.transactions add column if not exists subscription_tier text;
