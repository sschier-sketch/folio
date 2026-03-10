/*
  # Harden handle_new_user trigger with defensive exception handling

  1. Changes
    - Wraps the standalone signup flow (Flow 2) in a nested BEGIN/EXCEPTION block
    - If user_settings or account_profiles creation fails unexpectedly,
      the error is logged to registration_error_logs and the trigger
      still returns NEW (allowing the auth.users row to be created)
    - The registration guard exceptions (registration_blocked:*) are
      explicitly RE-RAISED so they still block signup as intended
    - This ensures that unexpected DB errors (constraint violations,
      missing columns from bad migrations, etc.) don't prevent user creation
    - The user can always log in and missing data can be repaired

  2. What is NOT changed
    - Flow 1 (invitation-based signup) is left as-is because it has
      complex multi-table operations that should fail atomically
    - The registration guard logic is unchanged
    - All existing behavior for successful signups is identical

  3. Security
    - No changes to RLS policies
    - Error logging uses direct INSERT (trigger runs as SECURITY DEFINER)
    - No sensitive data (passwords, tokens) is logged
*/

CREATE OR REPLACE FUNCTION handle_new_user()
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

  -- Flow 1: Invitation-based signup (unchanged, must fail atomically)
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

  -- Defensive block: create user_settings and account_profiles
  -- If this fails, log the error but still allow the user to be created
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but do NOT block user creation
    BEGIN
      INSERT INTO registration_error_logs (
        email, source, step, error_message, error_code, error_details,
        metadata
      ) VALUES (
        v_email,
        'db_trigger',
        'handle_new_user',
        SQLERRM,
        SQLSTATE,
        'Trigger exception in standalone signup flow',
        jsonb_build_object(
          'user_id', NEW.id,
          'trigger', 'handle_new_user',
          'flow', 'standalone'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: failed to log error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;
