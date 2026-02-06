/*
  # Internal Customer Number System

  1. New Column
    - `account_profiles.customer_number` (text, unique)
      - Format: "RN" + 7 random digits (e.g. RN4839201)
      - Non-sequential, pseudorandom, immutable

  2. New Functions
    - `generate_customer_number()`: Generates unique "RN#######" with collision retry
    - `assign_customer_number()`: Trigger function for auto-assignment on INSERT

  3. Trigger
    - `trg_assign_customer_number` on `account_profiles` BEFORE INSERT

  4. Backfill
    - All existing rows without customer_number get one assigned

  5. Security
    - Set by trigger only; existing RLS covers read access

  6. Updated Functions
    - `admin_get_users()` now includes customer_number

  7. Changelog
    - system_updates entry for this feature (update_type = 'free')
*/

-- 1. Add customer_number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'account_profiles'
      AND column_name = 'customer_number'
  ) THEN
    ALTER TABLE public.account_profiles ADD COLUMN customer_number text;
  END IF;
END $$;

-- 2. UNIQUE index
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_profiles_customer_number
  ON public.account_profiles(customer_number)
  WHERE customer_number IS NOT NULL;

-- 3. Generator function
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_number text;
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique customer number after 100 attempts';
    END IF;

    v_number := 'RN' || lpad(floor(random() * 10000000)::int::text, 7, '0');

    SELECT EXISTS(
      SELECT 1 FROM public.account_profiles WHERE customer_number = v_number
    ) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_number;
    END IF;
  END LOOP;
END;
$$;

-- 4. Trigger function
CREATE OR REPLACE FUNCTION public.assign_customer_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_number IS NULL THEN
    NEW.customer_number := generate_customer_number();
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Create trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assign_customer_number'
  ) THEN
    CREATE TRIGGER trg_assign_customer_number
      BEFORE INSERT ON public.account_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.assign_customer_number();
  END IF;
END $$;

-- 6. Backfill existing rows
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.account_profiles
    WHERE customer_number IS NULL
  LOOP
    UPDATE public.account_profiles
    SET customer_number = generate_customer_number()
    WHERE id = r.id AND customer_number IS NULL;
  END LOOP;
END $$;

-- 7. Drop and recreate admin_get_users with customer_number
DROP FUNCTION IF EXISTS public.admin_get_users();

CREATE FUNCTION public.admin_get_users()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  subscription_plan text,
  subscription_status text,
  first_name text,
  last_name text,
  company_name text,
  properties_count bigint,
  tenants_count bigint,
  is_admin boolean,
  banned boolean,
  ban_reason text,
  customer_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(bi.subscription_plan, 'free')::text as subscription_plan,
    COALESCE(bi.subscription_status, 'inactive')::text as subscription_status,
    ap.first_name,
    ap.last_name,
    ap.company_name,
    (SELECT COUNT(*) FROM public.properties WHERE properties.user_id = u.id) as properties_count,
    (SELECT COUNT(*) FROM public.tenants WHERE tenants.user_id = u.id) as tenants_count,
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = u.id) as is_admin,
    COALESCE(ap.banned, false) as banned,
    ap.ban_reason,
    ap.customer_number
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 8. Changelog entry
INSERT INTO public.system_updates (
  id,
  title,
  content,
  update_type,
  version,
  is_published,
  published_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Interne Kundennummern eingefuehrt',
  'Alle Nutzer erhalten ab sofort eine eindeutige, nicht-sequentielle Kundennummer im Format RN####### (z.B. RN4839201). Bestehende Nutzer wurden automatisch nachtraeglich mit einer Kundennummer versehen. Die Kundennummer ist im Profil und in der Admin-Benutzerverwaltung einsehbar.',
  'free',
  '2.6.0',
  true,
  now(),
  now(),
  now()
);
