/*
  # Create delete_account_member_data function

  1. New Function
    - `delete_account_member_data(p_member_user_id uuid)` - Permanently deletes all data for a sub-user
      - Verifies caller is the account owner or has manage_users permission
      - Prevents deletion of account owner
      - Deletes from all tables in correct FK dependency order
      - Returns deletion summary as JSONB

  2. Security
    - SECURITY DEFINER to access auth.users
    - Only account owner or admins with can_manage_users permission can call
    - Cannot delete account owner
    - Cannot self-delete

  3. Important Notes
    - This function deletes PUBLIC schema data only
    - The auth.users record must be deleted separately via service role in edge function
    - Follows same deletion order as admin_delete_user_data
*/

CREATE OR REPLACE FUNCTION public.delete_account_member_data(p_member_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_uid uuid := auth.uid();
  v_member_owner_id uuid;
  v_member_role text;
  v_member_email text;
  deleted_counts jsonb := '{}'::jsonb;
  row_count integer;
BEGIN
  IF v_caller_uid = p_member_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  SELECT account_owner_id, role INTO v_member_owner_id, v_member_role
  FROM user_settings
  WHERE user_id = p_member_user_id;

  IF v_member_owner_id IS NULL AND v_member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot delete an account owner';
  END IF;

  IF v_member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot delete an account owner';
  END IF;

  IF v_caller_uid != v_member_owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = v_caller_uid
        AND account_owner_id = v_member_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND removed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized: only account owner or user manager can delete members';
    END IF;
  END IF;

  SELECT u.email::text INTO v_member_email
  FROM auth.users u WHERE u.id = p_member_user_id;

  PERFORM log_user_management_action(
    v_caller_uid,
    'member_deleted',
    'Benutzer dauerhaft gelöscht',
    p_member_user_id,
    v_member_email
  );

  DELETE FROM account_member_properties WHERE member_user_id = p_member_user_id;

  DELETE FROM ticket_messages WHERE ticket_id IN (
    SELECT id FROM tickets WHERE user_id = p_member_user_id
  );
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('ticket_messages', row_count);

  DELETE FROM feedback_votes WHERE user_id = p_member_user_id;
  DELETE FROM feedback_votes WHERE feedback_id IN (
    SELECT id FROM user_feedback WHERE user_id = p_member_user_id
  );

  DELETE FROM rent_payments WHERE user_id = p_member_user_id;
  DELETE FROM rent_history WHERE user_id = p_member_user_id;
  DELETE FROM rent_payment_reminders WHERE user_id = p_member_user_id;
  DELETE FROM deposit_history WHERE user_id = p_member_user_id;
  DELETE FROM index_rent_calculations WHERE user_id = p_member_user_id;
  DELETE FROM contract_documents WHERE user_id = p_member_user_id;
  DELETE FROM tenant_communications WHERE user_id = p_member_user_id;
  DELETE FROM tenant_impersonation_tokens WHERE tenant_id IN (
    SELECT id FROM tenants WHERE user_id = p_member_user_id
  );
  DELETE FROM payment_reminders WHERE user_id = p_member_user_id;

  DELETE FROM operating_cost_send_logs WHERE statement_id IN (
    SELECT id FROM operating_cost_statements WHERE user_id = p_member_user_id
  );
  DELETE FROM operating_cost_results WHERE statement_id IN (
    SELECT id FROM operating_cost_statements WHERE user_id = p_member_user_id
  );
  DELETE FROM operating_cost_line_items WHERE statement_id IN (
    SELECT id FROM operating_cost_statements WHERE user_id = p_member_user_id
  );
  DELETE FROM operating_cost_pdfs WHERE user_id = p_member_user_id;

  DELETE FROM loan_reminders WHERE user_id = p_member_user_id;
  DELETE FROM document_history WHERE user_id = p_member_user_id;
  DELETE FROM dunning_email_templates WHERE user_id = p_member_user_id;
  DELETE FROM income_entries WHERE user_id = p_member_user_id;
  DELETE FROM receipts WHERE user_id = p_member_user_id;
  DELETE FROM email_logs WHERE user_id = p_member_user_id;
  DELETE FROM user_update_views WHERE user_id = p_member_user_id;
  DELETE FROM referral_rewards WHERE user_id = p_member_user_id;

  DELETE FROM property_contacts WHERE user_id = p_member_user_id;
  DELETE FROM property_documents WHERE user_id = p_member_user_id;
  DELETE FROM property_equipment WHERE user_id = p_member_user_id;
  DELETE FROM property_history WHERE user_id = p_member_user_id;
  DELETE FROM property_images WHERE user_id = p_member_user_id;
  DELETE FROM property_labels WHERE user_id = p_member_user_id;
  DELETE FROM property_value_history WHERE user_id = p_member_user_id;
  DELETE FROM maintenance_tasks WHERE user_id = p_member_user_id;

  DELETE FROM billing_allocations WHERE tenant_id IN (
    SELECT id FROM tenants WHERE user_id = p_member_user_id
  );
  DELETE FROM expense_splits WHERE property_id IN (
    SELECT id FROM properties WHERE user_id = p_member_user_id
  );

  DELETE FROM handover_protocols WHERE user_id = p_member_user_id;

  DELETE FROM operating_cost_statements WHERE user_id = p_member_user_id;
  DELETE FROM rental_contracts WHERE user_id = p_member_user_id;
  DELETE FROM meters WHERE user_id = p_member_user_id;
  DELETE FROM loans WHERE user_id = p_member_user_id;
  DELETE FROM dunning_settings WHERE user_id = p_member_user_id;
  DELETE FROM expenses WHERE user_id = p_member_user_id;
  DELETE FROM cost_types WHERE user_id = p_member_user_id;
  DELETE FROM expense_categories WHERE user_id = p_member_user_id;
  DELETE FROM billing_periods WHERE user_id = p_member_user_id;
  DELETE FROM templates WHERE user_id = p_member_user_id;
  DELETE FROM tickets WHERE user_id = p_member_user_id;
  DELETE FROM user_feedback WHERE user_id = p_member_user_id;
  DELETE FROM handover_checklist_templates WHERE user_id = p_member_user_id;
  DELETE FROM documents WHERE user_id = p_member_user_id;

  DELETE FROM tenants WHERE user_id = p_member_user_id;
  DELETE FROM property_units WHERE user_id = p_member_user_id;
  DELETE FROM properties WHERE user_id = p_member_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('properties', row_count);

  DELETE FROM affiliate_referrals WHERE referred_user_id = p_member_user_id;
  DELETE FROM affiliate_commission_adjustments WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = p_member_user_id
  );
  DELETE FROM affiliate_commissions WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = p_member_user_id
  );
  DELETE FROM affiliate_payout_methods WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = p_member_user_id
  );
  DELETE FROM affiliate_payout_requests WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = p_member_user_id
  );
  DELETE FROM affiliate_referrals WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = p_member_user_id
  );
  DELETE FROM affiliates WHERE user_id = p_member_user_id;

  DELETE FROM stripe_subscriptions WHERE customer_id IN (
    SELECT customer_id FROM stripe_customers WHERE user_id = p_member_user_id
  );
  DELETE FROM stripe_customers WHERE user_id = p_member_user_id;
  DELETE FROM billing_info WHERE user_id = p_member_user_id;

  DELETE FROM bank_connections WHERE user_id = p_member_user_id;
  DELETE FROM user_bank_details WHERE user_id = p_member_user_id;
  DELETE FROM user_settings WHERE user_id = p_member_user_id;
  DELETE FROM password_reset_requests WHERE email = v_member_email;
  DELETE FROM account_profiles WHERE user_id = p_member_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', p_member_user_id,
    'details', deleted_counts
  );
END;
$$;
