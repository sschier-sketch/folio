/*
  # Admin Delete User Function

  1. New Functions
    - `admin_delete_user_data(target_user_id uuid)` - Deletes all public schema data for a user
      - Runs as SECURITY DEFINER in a single transaction
      - Verifies caller is admin
      - Prevents self-deletion
      - Logs deletion to admin_activity_log BEFORE removing data
      - Deletes from all 60+ tables in correct FK dependency order
      - Strategy: Hard delete all user-owned data. Auth user deletion handled separately by edge function.

  2. Deletion Order (respects FK constraints)
    - Level 1: Deepest leaf tables (no children reference them)
    - Level 2: Mid-level tables (children already deleted)
    - Level 3: Parent tables (properties, tenants, etc.)
    - Level 4: Top-level user tables (profile, settings, billing)

  3. Security
    - Only admins (in admin_users table) can execute
    - Self-deletion blocked
    - Full audit trail in admin_activity_log
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid;
  target_email text;
  deleted_counts jsonb := '{}'::jsonb;
  row_count integer;
BEGIN
  caller_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = caller_id
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  IF target_user_id = caller_id THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  INSERT INTO admin_activity_log (admin_user_id, action, target_user_id, details)
  VALUES (
    caller_id,
    'user_deleted',
    target_user_id,
    jsonb_build_object(
      'deleted_at', now(),
      'target_email_hash', md5(target_email)
    )
  );

  -- === LEVEL 1: Deepest leaf / child tables ===

  DELETE FROM ticket_messages WHERE ticket_id IN (
    SELECT id FROM tickets WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('ticket_messages', row_count);

  DELETE FROM feedback_votes WHERE user_id = target_user_id;
  DELETE FROM feedback_votes WHERE feedback_id IN (
    SELECT id FROM user_feedback WHERE user_id = target_user_id
  );

  DELETE FROM rent_payments WHERE user_id = target_user_id;
  DELETE FROM rent_history WHERE user_id = target_user_id;
  DELETE FROM rent_payment_reminders WHERE user_id = target_user_id;
  DELETE FROM deposit_history WHERE user_id = target_user_id;
  DELETE FROM index_rent_calculations WHERE user_id = target_user_id;
  DELETE FROM contract_documents WHERE user_id = target_user_id;
  DELETE FROM tenant_communications WHERE user_id = target_user_id;
  DELETE FROM tenant_impersonation_tokens WHERE tenant_id IN (
    SELECT id FROM tenants WHERE user_id = target_user_id
  );
  DELETE FROM payment_reminders WHERE user_id = target_user_id;

  DELETE FROM operating_cost_send_logs WHERE statement_id IN (
    SELECT id FROM operating_cost_statements WHERE user_id = target_user_id
  );
  DELETE FROM operating_cost_results WHERE statement_id IN (
    SELECT id FROM operating_cost_statements WHERE user_id = target_user_id
  );
  DELETE FROM operating_cost_line_items WHERE statement_id IN (
    SELECT id FROM operating_cost_statements WHERE user_id = target_user_id
  );
  DELETE FROM operating_cost_pdfs WHERE user_id = target_user_id;

  DELETE FROM loan_reminders WHERE user_id = target_user_id;
  DELETE FROM document_history WHERE user_id = target_user_id;
  DELETE FROM dunning_email_templates WHERE user_id = target_user_id;
  DELETE FROM income_entries WHERE user_id = target_user_id;
  DELETE FROM receipts WHERE user_id = target_user_id;
  DELETE FROM email_logs WHERE user_id = target_user_id;
  DELETE FROM user_update_views WHERE user_id = target_user_id;
  DELETE FROM referral_rewards WHERE user_id = target_user_id;

  DELETE FROM property_contacts WHERE user_id = target_user_id;
  DELETE FROM property_documents WHERE user_id = target_user_id;
  DELETE FROM property_equipment WHERE user_id = target_user_id;
  DELETE FROM property_history WHERE user_id = target_user_id;
  DELETE FROM property_images WHERE user_id = target_user_id;
  DELETE FROM property_labels WHERE user_id = target_user_id;
  DELETE FROM property_value_history WHERE user_id = target_user_id;
  DELETE FROM maintenance_tasks WHERE user_id = target_user_id;

  DELETE FROM billing_allocations WHERE tenant_id IN (
    SELECT id FROM tenants WHERE user_id = target_user_id
  );
  DELETE FROM expense_splits WHERE property_id IN (
    SELECT id FROM properties WHERE user_id = target_user_id
  );

  DELETE FROM handover_protocols WHERE user_id = target_user_id;

  -- === LEVEL 2: Mid-level tables ===

  DELETE FROM operating_cost_statements WHERE user_id = target_user_id;
  DELETE FROM rental_contracts WHERE user_id = target_user_id;
  DELETE FROM meters WHERE user_id = target_user_id;
  DELETE FROM loans WHERE user_id = target_user_id;
  DELETE FROM dunning_settings WHERE user_id = target_user_id;
  DELETE FROM expenses WHERE user_id = target_user_id;
  DELETE FROM cost_types WHERE user_id = target_user_id;
  DELETE FROM expense_categories WHERE user_id = target_user_id;
  DELETE FROM billing_periods WHERE user_id = target_user_id;
  DELETE FROM templates WHERE user_id = target_user_id;
  DELETE FROM tickets WHERE user_id = target_user_id;
  DELETE FROM user_feedback WHERE user_id = target_user_id;
  DELETE FROM handover_checklist_templates WHERE user_id = target_user_id;
  DELETE FROM documents WHERE user_id = target_user_id;

  -- === LEVEL 3: Parent tables ===

  DELETE FROM tenants WHERE user_id = target_user_id;
  DELETE FROM property_units WHERE user_id = target_user_id;
  DELETE FROM properties WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('properties', row_count);

  -- === LEVEL 4: Affiliate / Referral cleanup ===

  DELETE FROM affiliate_referrals WHERE referred_user_id = target_user_id;
  DELETE FROM affiliate_commission_adjustments WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = target_user_id
  );
  DELETE FROM affiliate_commissions WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = target_user_id
  );
  DELETE FROM affiliate_payout_methods WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = target_user_id
  );
  DELETE FROM affiliate_payout_requests WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = target_user_id
  );
  DELETE FROM affiliate_referrals WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = target_user_id
  );
  DELETE FROM affiliates WHERE user_id = target_user_id;

  -- === LEVEL 5: Billing / Stripe cleanup ===

  DELETE FROM stripe_subscriptions WHERE customer_id IN (
    SELECT customer_id FROM stripe_customers WHERE user_id = target_user_id
  );
  DELETE FROM stripe_customers WHERE user_id = target_user_id;
  DELETE FROM billing_info WHERE user_id = target_user_id;

  -- === LEVEL 6: User profile / settings ===

  DELETE FROM bank_connections WHERE user_id = target_user_id;
  DELETE FROM user_bank_details WHERE user_id = target_user_id;
  DELETE FROM user_settings WHERE user_id = target_user_id;
  DELETE FROM password_reset_requests WHERE email = target_email;
  DELETE FROM account_profiles WHERE user_id = target_user_id;
  DELETE FROM admin_users WHERE user_id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', target_user_id,
    'details', deleted_counts
  );
END;
$function$;
