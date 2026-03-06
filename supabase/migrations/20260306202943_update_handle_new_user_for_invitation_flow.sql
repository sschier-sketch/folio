/*
  # Update handle_new_user trigger for invitation flow

  When a new user signs up via an invitation link, their `raw_user_meta_data`
  will contain `invitation_token`. The trigger will:
  1. Validate the invitation token
  2. Set up the user as a member of the inviting account
  3. Copy permissions from the invitation to user_settings
  4. Mark the invitation as accepted
  5. Set up property assignments if configured

  If no invitation_token is present, the existing behavior is unchanged
  (user is created as a standalone owner account).

  ## Important
  - Existing users/accounts are NOT affected
  - The trigger is replaced with an enhanced version that handles both flows
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
BEGIN
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';

  IF v_invitation_token IS NOT NULL AND v_invitation_token != '' THEN
    SELECT * INTO v_invitation
    FROM account_invitations
    WHERE token = v_invitation_token
      AND status = 'pending'
      AND expires_at > now()
    LIMIT 1;

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
