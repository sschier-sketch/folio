/*
  # Fix Function Search Path Mutable (Security Scanner Finding)

  ## Problem
  ~50 functions in the `public` schema have mutable search_path,
  which could theoretically allow search_path hijacking attacks.

  ## Fix
  Set `search_path = 'public'` on each affected function via ALTER FUNCTION.
  This is the safest approach because:
  - It does NOT modify function bodies
  - It does NOT change SECURITY DEFINER/INVOKER status
  - It does NOT change ownership or grants
  - All functions reference tables in the `public` schema, so `search_path = 'public'` is correct

  ## Affected Functions (50 total)
  All functions listed below are in the `public` schema.
  Two overloads of `calculate_days_overdue` with different signatures.

  ## Notes
  - Functions that already had `SET search_path` (e.g. from prior migrations) are unaffected
  - ALTER FUNCTION SET is idempotent and safe to re-run
*/

-- Simple updated_at trigger functions (no args)
ALTER FUNCTION public.update_documents_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_index_rent_calculations_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_operating_cost_statement_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_handover_protocols_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_property_images_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_leases_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_account_profile_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_referral_rewards_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_system_settings_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_seo_updated_at() SET search_path = 'public';
ALTER FUNCTION public.mag_set_updated_at() SET search_path = 'public';

-- Trigger functions (no args)
ALTER FUNCTION public.update_days_overdue() SET search_path = 'public';
ALTER FUNCTION public.update_rent_payment_fields() SET search_path = 'public';
ALTER FUNCTION public.ensure_single_cover_image() SET search_path = 'public';
ALTER FUNCTION public.set_unit_rented_on_lease_unit_insert() SET search_path = 'public';
ALTER FUNCTION public.set_unit_vacant_on_lease_unit_delete() SET search_path = 'public';
ALTER FUNCTION public.set_unit_rented_on_contract_unit_insert() SET search_path = 'public';
ALTER FUNCTION public.set_unit_vacant_on_contract_unit_delete() SET search_path = 'public';
ALTER FUNCTION public.log_document_change() SET search_path = 'public';
ALTER FUNCTION public.update_feedback_vote_counts() SET search_path = 'public';
ALTER FUNCTION public.mag_track_slug_change() SET search_path = 'public';
ALTER FUNCTION public.move_unread_to_inbox() SET search_path = 'public';
ALTER FUNCTION public.prevent_manual_rented_status() SET search_path = 'public';
ALTER FUNCTION public.sync_rent_history_to_contract() SET search_path = 'public';

-- Pure computation functions (with args)
ALTER FUNCTION public.calculate_days_overdue(due_date date, is_paid boolean) SET search_path = 'public';
ALTER FUNCTION public.calculate_days_overdue(due_date date, status text) SET search_path = 'public';
ALTER FUNCTION public.sanitize_email_to_alias(raw_email text) SET search_path = 'public';
ALTER FUNCTION public.is_profile_complete(profile_record account_profiles) SET search_path = 'public';
ALTER FUNCTION public.generate_unique_alias(base_alias text) SET search_path = 'public';

-- RPC / business logic functions (no args)
ALTER FUNCTION public.cleanup_old_password_reset_requests() SET search_path = 'public';
ALTER FUNCTION public.check_and_create_index_rent_calculations() SET search_path = 'public';
ALTER FUNCTION public.create_loan_reminders() SET search_path = 'public';
ALTER FUNCTION public.create_rent_increase_reminder_tickets() SET search_path = 'public';
ALTER FUNCTION public.generate_customer_number() SET search_path = 'public';
ALTER FUNCTION public.get_my_stripe_subscription() SET search_path = 'public';
ALTER FUNCTION public.trigger_loan_reminders() SET search_path = 'public';
ALTER FUNCTION public.cleanup_expired_referral_sessions() SET search_path = 'public';
ALTER FUNCTION public.admin_get_users() SET search_path = 'public';
ALTER FUNCTION public.admin_get_affiliates() SET search_path = 'public';
ALTER FUNCTION public.process_welcome_email_queue() SET search_path = 'public';
ALTER FUNCTION public.activate_planned_rent_periods() SET search_path = 'public';
ALTER FUNCTION public.get_system_settings() SET search_path = 'public';

-- RPC / business logic functions (with args)
ALTER FUNCTION public.get_current_rent_net_cold(p_tenant_id uuid) SET search_path = 'public';
ALTER FUNCTION public.get_latest_vpi_values(p_tenant_id uuid) SET search_path = 'public';
ALTER FUNCTION public.assign_thread_to_tenant(p_thread_id uuid, p_tenant_id uuid) SET search_path = 'public';
ALTER FUNCTION public.get_referral_analytics(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_granularity text) SET search_path = 'public';
ALTER FUNCTION public.increment_thread_message_count(p_thread_id uuid) SET search_path = 'public';
ALTER FUNCTION public.admin_get_affiliate_referrals(p_affiliate_id uuid) SET search_path = 'public';
ALTER FUNCTION public.get_current_rent(p_contract_id uuid) SET search_path = 'public';
