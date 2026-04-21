-- ====================================================
-- AIRAX AI — Phase 5 Supabase Migration
-- Tokenomics, Payments, Dynamic Pricing
-- Run this in: Supabase Dashboard → SQL Editor
-- ====================================================

-- 1. Add token & usage columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tokens integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS daily_chat_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_image_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_video_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_usage_reset date NOT NULL DEFAULT CURRENT_DATE;

-- Update existing users who have 0 tokens to get the initial 50
UPDATE public.profiles SET tokens = 50 WHERE tokens = 0;

-- 2. Update handle_new_user() to set initial tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, tokens)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    50  -- Initial token grant
  );
  RETURN new;
END;
$$;

-- 3. Transactions table (payment log)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id text,  -- Sakurupiah trx_id
  merchant_ref text,    -- Our internal reference
  amount integer NOT NULL DEFAULT 0,
  tokens_awarded integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'expired', 'failed')),
  payment_gateway text NOT NULL DEFAULT 'sakurupiah',
  payment_method text,  -- QRIS, BCAVA, DANA, etc.
  package_name text,     -- e.g. "Paket Starter"
  checkout_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert own transactions (for creating invoice)
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Service role bypass (for webhook)
-- Note: supabase admin client bypasses RLS automatically

-- 4. App Settings table (dynamic pricing & config)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for pricing display)
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only admins can write settings
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- 5. Seed default app_settings
INSERT INTO public.app_settings (key, value, description) VALUES
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

ON CONFLICT (key) DO NOTHING;

-- 6. Function to reset daily usage counters
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET daily_chat_count = 0,
      daily_image_count = 0,
      daily_video_count = 0,
      last_usage_reset = CURRENT_DATE
  WHERE last_usage_reset < CURRENT_DATE;
END;
$$;

-- 7. Add admin view policy for profiles (for admin stats)
-- (Only if not exists — idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles for stats'
  ) THEN
    CREATE POLICY "Admins can view all profiles for stats"
      ON public.profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.user_role = 'admin'
        )
      );
  END IF;
END $$;
