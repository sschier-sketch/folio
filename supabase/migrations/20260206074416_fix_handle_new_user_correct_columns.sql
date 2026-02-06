/*
  # Fix handle_new_user - Use Correct Column Names

  1. Problem
    - handle_new_user references non-existent columns:
      - user_settings.trial_started_at (trial fields are in billing_info)
      - user_settings.trial_ends_at (trial fields are in billing_info)
      - account_profiles.email (column does not exist)
    - This causes "Database error saving new user" on every registration

  2. Solution
    - Remove trial fields from user_settings insert (handled by create_billing_info trigger)
    - Remove email from account_profiles insert (column doesn't exist)
    - Only insert columns that actually exist in each table
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    referral_code,
    theme,
    notifications_enabled,
    language,
    role,
    can_invite_users,
    can_manage_properties,
    can_manage_tenants,
    can_manage_finances,
    can_view_analytics
  )
  VALUES (
    NEW.id,
    generate_referral_code(),
    'light',
    true,
    'de',
    'owner',
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.account_profiles (
    user_id,
    address_country,
    newsletter_opt_in
  )
  VALUES (
    NEW.id,
    'Deutschland',
    COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
