/*
  # Multi-User RLS for maintenance_tasks + fix invitation flow for can_view_tasks

  ## Changes
  1. Add RLS policies for account members on `maintenance_tasks`
     - SELECT: members can view tasks owned by their account owner (scoped by property)
     - INSERT: writable members can create tasks for their account owner
     - UPDATE: writable members can update tasks for their account owner (scoped by property)
     - DELETE: writable members can delete tasks for their account owner
  2. Update `handle_new_user` trigger to pass `can_view_tasks` from invitation

  ## Existing policies preserved
  - "Users can view own maintenance tasks" (SELECT, user_id = auth.uid())
  - "Users can insert own maintenance tasks" (INSERT, user_id = auth.uid())
  - "Users can update own maintenance tasks" (UPDATE, user_id = auth.uid())
  - "Users can delete own maintenance tasks" (DELETE, user_id = auth.uid())

  ## Pattern
  Follows the same multi-user RLS pattern used by `properties`, `expenses`, and other tables:
  - SELECT uses `get_my_account_owner_id()` + `can_member_access_property()`
  - INSERT/UPDATE/DELETE use `is_writable_member_of()`

  ## Security
  - All new policies require authenticated role
  - Property-scoped members only see tasks for their assigned properties
  - Read-only members cannot insert/update/delete
*/

-- 1. Add multi-user SELECT policy (members can view account owner's tasks, scoped by property)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'maintenance_tasks'
    AND policyname = 'Account members can view owner tasks'
  ) THEN
    CREATE POLICY "Account members can view owner tasks"
      ON maintenance_tasks
      FOR SELECT
      TO authenticated
      USING (
        user_id = get_my_account_owner_id()
        AND can_member_access_property((SELECT auth.uid()), property_id)
      );
  END IF;
END $$;

-- 2. Add multi-user INSERT policy (writable members can insert for account owner)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'maintenance_tasks'
    AND policyname = 'Members can insert owner tasks'
  ) THEN
    CREATE POLICY "Members can insert owner tasks"
      ON maintenance_tasks
      FOR INSERT
      TO authenticated
      WITH CHECK (
        is_writable_member_of(user_id)
      );
  END IF;
END $$;

-- 3. Add multi-user UPDATE policy (writable members can update account owner's tasks, scoped by property)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'maintenance_tasks'
    AND policyname = 'Members can update owner tasks'
  ) THEN
    CREATE POLICY "Members can update owner tasks"
      ON maintenance_tasks
      FOR UPDATE
      TO authenticated
      USING (
        is_writable_member_of(user_id)
        AND can_member_access_property((SELECT auth.uid()), property_id)
      )
      WITH CHECK (
        is_writable_member_of(user_id)
      );
  END IF;
END $$;

-- 4. Add multi-user DELETE policy (writable members can delete account owner's tasks)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'maintenance_tasks'
    AND policyname = 'Members can delete owner tasks'
  ) THEN
    CREATE POLICY "Members can delete owner tasks"
      ON maintenance_tasks
      FOR DELETE
      TO authenticated
      USING (
        is_writable_member_of(user_id)
      );
  END IF;
END $$;

-- 5. Fix handle_new_user trigger to include can_view_tasks from invitation
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
        can_view_leases, can_view_messages, can_view_tasks,
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
        v_invitation.can_view_tasks,
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
