/*
  # Fix handle_new_user - record null check bug

  ## Problem
  `SELECT * INTO v_invitation FROM lookup_pending_invitation(token)` returns a
  row from a SETOF function, but `v_invitation IS NOT NULL` evaluates to false
  because PostgreSQL's composite-type IS NOT NULL check requires ALL fields to
  be non-null. This caused invited users to bypass Flow 1 and hit the
  registration_blocked guard in Flow 2.

  ## Fix
  1. Changed the null check from `v_invitation IS NOT NULL` to
     `v_invitation.id IS NOT NULL` which correctly detects if a row was found
  2. Removed debug logging table dependency
  3. Applied same fix to the email-based lookup in Flow 2

  ## Modified Functions
  - `handle_new_user()` - Fixed record null check
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_token text;
  v_invitation record;
  v_email text;
BEGIN
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';
  v_email := lower(trim(NEW.email));

  -- Flow 1: Invitation-based signup
  IF v_invitation_token IS NOT NULL AND v_invitation_token != '' THEN
    SELECT * INTO v_invitation FROM lookup_pending_invitation(v_invitation_token);

    IF v_invitation.id IS NOT NULL THEN
      INSERT INTO public.user_settings (
        user_id, referral_code, theme, notifications_enabled, language,
        role, can_invite_users, can_manage_properties, can_manage_tenants,
        can_manage_finances, can_view_analytics,
        account_owner_id, is_active_member, is_read_only,
        can_manage_billing, can_manage_users,
        can_view_finances, can_view_statements, can_view_rent_payments,
        can_view_leases, can_view_messages,
        property_scope, property_access
      ) VALUES (
        NEW.id, generate_referral_code(), 'light', true, 'de',
        v_invitation.role,
        v_invitation.can_manage_users,
        v_invitation.can_manage_properties,
        v_invitation.can_manage_tenants,
        v_invitation.can_manage_finances,
        v_invitation.can_view_analytics,
        v_invitation.account_owner_id,
        true,
        v_invitation.is_read_only,
        v_invitation.can_manage_billing,
        v_invitation.can_manage_users,
        v_invitation.can_view_finances,
        v_invitation.can_view_statements,
        v_invitation.can_view_rent_payments,
        v_invitation.can_view_leases,
        v_invitation.can_view_messages,
        v_invitation.property_scope,
        v_invitation.property_access
      ) ON CONFLICT (user_id) DO NOTHING;

      IF v_invitation.property_scope = 'selected' AND array_length(v_invitation.property_ids, 1) > 0 THEN
        INSERT INTO account_member_properties (member_user_id, property_id, account_owner_id)
        SELECT NEW.id, unnest(v_invitation.property_ids), v_invitation.account_owner_id;
      END IF;

      UPDATE account_invitations
      SET status = 'accepted',
          accepted_by = NEW.id,
          accepted_at = now(),
          updated_at = now()
      WHERE id = v_invitation.id;

      INSERT INTO public.account_profiles (
        user_id, address_country, newsletter_opt_in
      ) VALUES (
        NEW.id, 'Deutschland', false
      ) ON CONFLICT (user_id) DO NOTHING;

      RETURN NEW;
    END IF;

    -- Token provided but invitation not found/expired - create as standalone owner
    INSERT INTO public.user_settings (
      user_id, referral_code, theme, notifications_enabled, language,
      role, can_invite_users, can_manage_properties,
      can_manage_tenants, can_manage_finances, can_view_analytics
    ) VALUES (
      NEW.id, generate_referral_code(), 'light', true, 'de',
      'owner', true, true, true, true, true
    ) ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.account_profiles (
      user_id, address_country, newsletter_opt_in
    ) VALUES (
      NEW.id, 'Deutschland', false
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
  END IF;

  -- Flow 2: Standalone signup -- enforce registration rule V1
  IF EXISTS (
    SELECT 1 FROM lookup_pending_invitation_by_email(v_email)
  ) THEN
    RAISE EXCEPTION 'registration_blocked:pending_invitation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN user_settings us ON us.user_id = u.id
    WHERE u.email = v_email
    AND us.account_owner_id IS NOT NULL
    AND us.removed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'registration_blocked:active_member';
  END IF;

  INSERT INTO public.user_settings (
    user_id, referral_code, theme, notifications_enabled, language,
    role, can_invite_users, can_manage_properties,
    can_manage_tenants, can_manage_finances, can_view_analytics
  ) VALUES (
    NEW.id, generate_referral_code(), 'light', true, 'de',
    'owner', true, true, true, true, true
  ) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.account_profiles (
    user_id, address_country, newsletter_opt_in
  ) VALUES (
    NEW.id, 'Deutschland',
    COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  ) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
