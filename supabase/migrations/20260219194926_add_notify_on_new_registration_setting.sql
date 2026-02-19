/*
  # Add Admin Notification on New User Registration Setting

  1. Modified Tables
    - `system_settings`
      - Added `notify_on_new_registration` (boolean, default false) - when enabled,
        the system sends an email to hello@rentab.ly every time a new user registers

  2. Updated Functions
    - `get_system_settings` - recreated to include the new column

  3. Notes
    - Only admins can toggle this setting (existing RLS policies apply)
    - The notification email is queued via the handle_new_user trigger
    - Default is OFF so existing behavior is unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'notify_on_new_registration'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN notify_on_new_registration boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_system_settings();

CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS TABLE (
  id integer,
  gtm_enabled boolean,
  gtm_container_id text,
  gtm_custom_head_html text,
  default_affiliate_commission_rate numeric,
  signup_custom_tracking_script text,
  notify_on_new_registration boolean,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id,
    gtm_enabled,
    gtm_container_id,
    gtm_custom_head_html,
    default_affiliate_commission_rate,
    signup_custom_tracking_script,
    notify_on_new_registration,
    updated_at
  FROM system_settings
  WHERE id = 1
  LIMIT 1;
$$;
