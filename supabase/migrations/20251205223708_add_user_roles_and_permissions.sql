/*
  # User Roles and Permissions System

  This migration adds a comprehensive role-based access control system:

  ## 1. New Columns in user_settings
  Adds role and permissions columns:
    - `role` (text): User role (admin, member, viewer)
    - `can_invite_users` (boolean): Permission to invite users
    - `can_manage_properties` (boolean): Permission to manage properties
    - `can_manage_tenants` (boolean): Permission to manage tenants
    - `can_manage_finances` (boolean): Permission to manage finances
    - `can_view_analytics` (boolean): Permission to view analytics

  ## 2. Billing Information
  Creates a new table for billing and subscription data:
    - company_name
    - vat_id
    - billing_address
    - billing_email
    - payment_method
    - stripe_customer_id
    - subscription_plan
    - subscription_status

  ## 3. Invoices Table
  Creates a table to store invoice records

  ## 4. Security
  Adds RLS policies for proper access control
*/

-- =====================================================
-- 1. ADD ROLE AND PERMISSIONS TO USER_SETTINGS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN role text DEFAULT 'admin' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_invite_users'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN can_invite_users boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_manage_properties'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN can_manage_properties boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_manage_tenants'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN can_manage_tenants boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_manage_finances'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN can_manage_finances boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_view_analytics'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN can_view_analytics boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add check constraint for role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_role_check'
  ) THEN
    ALTER TABLE public.user_settings
    ADD CONSTRAINT user_settings_role_check
    CHECK (role IN ('admin', 'member', 'viewer'));
  END IF;
END $$;

-- =====================================================
-- 2. CREATE BILLING_INFO TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.billing_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text,
  vat_id text,
  billing_address text,
  billing_email text,
  payment_method text DEFAULT 'none',
  stripe_customer_id text,
  subscription_plan text DEFAULT 'free' NOT NULL,
  subscription_status text DEFAULT 'active' NOT NULL,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing info"
  ON public.billing_info FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own billing info"
  ON public.billing_info FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own billing info"
  ON public.billing_info FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON public.billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_stripe_customer ON public.billing_info(stripe_customer_id);

CREATE TRIGGER update_billing_info_updated_at
  BEFORE UPDATE ON public.billing_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 3. CREATE INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  stripe_invoice_id text,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'EUR' NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  invoice_date timestamptz NOT NULL,
  due_date timestamptz,
  paid_at timestamptz,
  invoice_pdf_url text,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. ADD ROLE COLUMN TO USER_INVITATIONS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_invitations' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_invitations ADD COLUMN role text DEFAULT 'member' NOT NULL;
  END IF;
END $$;

-- Add check constraint for invitation role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_invitations_role_check'
  ) THEN
    ALTER TABLE public.user_invitations
    ADD CONSTRAINT user_invitations_role_check
    CHECK (role IN ('admin', 'member', 'viewer'));
  END IF;
END $$;

-- =====================================================
-- 5. CREATE FUNCTION TO INITIALIZE BILLING INFO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_billing_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.billing_info (user_id, billing_email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create billing info for new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_billing'
  ) THEN
    CREATE TRIGGER on_auth_user_created_billing
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_billing_info();
  END IF;
END $$;
