-- Hapus policy lama yang menyebabkan infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles for stats" ON public.profiles;

-- Buat fungsi aman (SECURITY DEFINER) yang kebal terhadap rekursi
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin'
  );
$$;

-- Buat ulang policy dengan fungsi yang aman
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( public.is_admin() );
