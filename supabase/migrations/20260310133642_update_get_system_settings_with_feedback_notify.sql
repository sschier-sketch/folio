/*
  # Update get_system_settings RPC to include notify_on_new_feedback

  1. Changes
    - Add `notify_on_new_feedback` column to the RPC result
*/

DROP FUNCTION IF EXISTS public.get_system_settings();

CREATE FUNCTION public.get_system_settings()
RETURNS TABLE (
  id integer,
  gtm_enabled boolean,
  gtm_container_id text,
  gtm_custom_head_html text,
  default_affiliate_commission_rate numeric,
  signup_custom_tracking_script text,
  notify_on_new_registration boolean,
  notify_on_new_feedback boolean,
  notification_email text,
  updated_at timestamptz,
  global_head_html text,
  global_head_html_updated_at timestamptz,
  monthly_feature_count integer
)
LANGUAGE sql
STABLE
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
notify_on_new_feedback,
notification_email,
updated_at,
global_head_html,
global_head_html_updated_at,
monthly_feature_count
FROM system_settings
WHERE id = 1
LIMIT 1;
$$;
