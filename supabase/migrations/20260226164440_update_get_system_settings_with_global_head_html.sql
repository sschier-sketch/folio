/*
  # Update get_system_settings RPC to include global_head_html

  1. Changes
    - Drops and recreates `get_system_settings` to add new return columns
    - Returns `global_head_html` and `global_head_html_updated_at`
*/

DROP FUNCTION IF EXISTS get_system_settings();

CREATE FUNCTION get_system_settings()
RETURNS TABLE (
  id integer,
  gtm_enabled boolean,
  gtm_container_id text,
  gtm_custom_head_html text,
  default_affiliate_commission_rate numeric,
  signup_custom_tracking_script text,
  notify_on_new_registration boolean,
  notification_email text,
  updated_at timestamptz,
  global_head_html text,
  global_head_html_updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  id,
  gtm_enabled,
  gtm_container_id,
  gtm_custom_head_html,
  default_affiliate_commission_rate,
  signup_custom_tracking_script,
  notify_on_new_registration,
  notification_email,
  updated_at,
  global_head_html,
  global_head_html_updated_at
FROM system_settings
WHERE id = 1
LIMIT 1;
$$;
