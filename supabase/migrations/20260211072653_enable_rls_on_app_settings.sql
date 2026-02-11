/*
  # Enable RLS on public.app_settings

  ## Problem
  - `public.app_settings` has no Row Level Security enabled
  - The table contains sensitive internal configuration (email system config
    with service_role_key placeholder, internal URLs)
  - Without RLS, any anonymous or authenticated user can read/write this table

  ## Analysis of Usage
  - The table is NOT read by any client-side code (src/)
  - The table is NOT read by any Edge Function
  - The table is NOT used by the contact form or any public feature
  - Only one row exists: key='email_system' with internal config values
  - The PostgreSQL GUC `current_setting('app.settings...')` used by
    `trigger_loan_reminders` is separate from this table

  ## Changes
  1. Enable RLS on `public.app_settings`
  2. Add `is_public` column (boolean, default false) for future-proofing:
     allows marking specific keys as publicly readable if ever needed
  3. Policies:
     - **SELECT (admin):** Admins (via admin_users table) can read all rows
     - **INSERT (admin):** Admins can insert new settings
     - **UPDATE (admin):** Admins can update existing settings
     - **DELETE (admin):** Admins can delete settings
     - No anon/public access since all current data is sensitive
     - No authenticated non-admin access needed

  ## Security
  - RLS enabled and enforced
  - All policies restricted to admin users via admin_users table lookup
  - Service Role (Edge Functions, triggers) bypasses RLS automatically
  - Contact form and all public features are unaffected (they never access
    this table)

  ## Public Keys
  - Currently none. All existing keys contain internal configuration.
  - If a public-readable setting is needed in the future, set is_public=true
    on that row and add an anon SELECT policy filtered by is_public.
*/

-- 1. Add is_public column for future-proofing (default false = private)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_settings'
      AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.app_settings
      ADD COLUMN is_public boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Admin SELECT policy
CREATE POLICY "Admins can read app_settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 4. Admin INSERT policy
CREATE POLICY "Admins can insert app_settings"
  ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 5. Admin UPDATE policy
CREATE POLICY "Admins can update app_settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 6. Admin DELETE policy
CREATE POLICY "Admins can delete app_settings"
  ON public.app_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );