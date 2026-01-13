/*
  # Fix trigger functions to bypass RLS policies

  1. Changes
    - Recreate all auth trigger functions with SECURITY DEFINER
    - This allows triggers to bypass RLS policies when creating initial user records
  
  2. Security
    - Required because auth.uid() is not yet set during user creation
    - Functions are safe because they only insert records for NEW.id (the user being created)
*/

-- Recreate handle_new_user function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
    'admin',
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.account_profiles (
    user_id,
    address_country
  )
  VALUES (
    NEW.id,
    'Deutschland'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate create_billing_info function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_billing_info()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.billing_info (user_id, billing_email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate create_default_dunning_templates function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_default_dunning_templates()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO dunning_email_templates (user_id, dunning_level, subject, message)
  VALUES
  (
    NEW.id,
    1,
    'Freundliche Erinnerung: Mietzahlung',
    'Sehr geehrte/r [TENANT_NAME],

wir möchten Sie freundlich daran erinnern, dass die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] zum [DUE_DATE] fällig war.

Möglicherweise haben Sie die Überweisung vergessen. Bitte überweisen Sie den Betrag zeitnah.

Mit freundlichen Grüßen'
  ),
  (
    NEW.id,
    2,
    'Zahlungsaufforderung: Ausstehende Miete',
    'Sehr geehrte/r [TENANT_NAME],

trotz freundlicher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir fordern Sie hiermit formell auf, den Betrag innerhalb von 7 Tagen zu überweisen. Andernfalls müssen wir weitere Schritte einleiten.

Mit freundlichen Grüßen'
  ),
  (
    NEW.id,
    3,
    'MAHNUNG: Überfällige Mietzahlung',
    'Sehr geehrte/r [TENANT_NAME],

trotz mehrfacher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir mahnen Sie hiermit offiziell und fordern Sie auf, den ausstehenden Betrag zzgl. Mahngebühren in Höhe von 5,00 € (Gesamt: [TOTAL_AMOUNT]) innerhalb von 5 Tagen zu überweisen.

Bei weiterer Nichtzahlung behalten wir uns rechtliche Schritte vor.

Mit freundlichen Grüßen'
  );
  RETURN NEW;
END;
$$;