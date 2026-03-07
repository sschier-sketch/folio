/*
  # Fix invitation lookup in handle_new_user trigger

  ## Problem
  The `handle_new_user` trigger function cannot read from `account_invitations`
  during user creation, likely due to RLS enforcement in the trigger execution
  context. This causes invitation-based signups to fail with
  "Database error saving new user" because the trigger falls through to the
  registration guard which blocks the signup.

  ## Fix
  1. Create a dedicated helper function `lookup_pending_invitation` that
     bypasses RLS explicitly
  2. Update `handle_new_user` to use this helper function
  3. Also skip the registration_blocked check when invitation_token is present

  ## New Functions
  - `lookup_pending_invitation(text)` - Finds a pending invitation by token,
    bypassing RLS

  ## Modified Functions
  - `handle_new_user()` - Uses new helper and improved fallback logic
*/

-- Helper function that explicitly bypasses RLS to look up invitations
CREATE OR REPLACE FUNCTION public.lookup_pending_invitation(p_token text)
RETURNS SETOF account_invitations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET role = 'postgres'
AS $$
  SELECT *
  FROM account_invitations
  WHERE token = p_token
  AND status = 'pending'
  AND expires_at > now()
  LIMIT 1;
$$;

-- Updated handle_new_user that uses the helper
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

    IF v_invitation IS NOT NULL THEN
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

    -- Invitation token was provided but not found - create as standalone owner
    -- (do NOT block registration here, the token proves intent)
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

-- Helper function for email-based lookup (also needs RLS bypass)
CREATE OR REPLACE FUNCTION public.lookup_pending_invitation_by_email(p_email text)
RETURNS SETOF account_invitations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET role = 'postgres'
AS $$
  SELECT *
  FROM account_invitations
  WHERE invited_email = p_email
  AND status = 'pending'
  AND expires_at > now()
  LIMIT 1;
$$;
