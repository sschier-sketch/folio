/*
  # Add Custom Signup Tracking Script Setting

  1. Modified Tables
    - `system_settings`
      - Added `signup_custom_tracking_script` (text, nullable) - stores custom JavaScript
        that admins can define to run client-side after a successful user registration

  2. Updated Functions
    - `get_system_settings` - dropped and recreated to include the new column

  3. Notes
    - This setting is only editable by admins (existing RLS policies apply)
    - The script is executed client-side only, never on the server
    - No PII is involved in the execution context
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'signup_custom_tracking_script'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN signup_custom_tracking_script text;
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
    updated_at
  FROM system_settings
  WHERE id = 1
  LIMIT 1;
$$;
