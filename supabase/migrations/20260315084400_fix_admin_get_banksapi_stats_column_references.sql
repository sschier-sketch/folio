/*
  # Fix admin_get_banksapi_stats RPC function

  1. Bug Fix
    - `account_profiles` has no `email` or `full_name` columns
    - Email must come from `auth.users`
    - Full name built from `first_name || ' ' || last_name`
    - `last_import` was returned as nested jsonb but frontend expects flat fields
    - Now returns `last_import_status`, `last_import_imported` as flat columns

  2. Changes
    - Replace `ap.email` with join to `auth.users` for email
    - Replace `ap.full_name` with concat of first_name/last_name
    - Flatten last_import subquery into individual fields
    - Add total_accounts from bank_products per connection
*/

CREATE OR REPLACE FUNCTION admin_get_banksapi_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Zugriff verweigert';
  END IF;

  WITH conn_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status IN ('connected', 'syncing')) AS total_active,
      COUNT(*) FILTER (WHERE status = 'requires_sca') AS requires_sca,
      COUNT(*) FILTER (WHERE status = 'error') AS with_errors,
      COUNT(*) FILTER (WHERE status = 'disconnected') AS disconnected,
      COUNT(*) AS total_all
    FROM banksapi_connections
  ),
  product_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE bp.selected_for_import = true) AS selected_accounts,
      COUNT(*) AS total_accounts
    FROM banksapi_bank_products bp
    JOIN banksapi_connections bc ON bc.id = bp.connection_id
    WHERE bc.status NOT IN ('disconnected')
  ),
  import_stats_24h AS (
    SELECT
      COUNT(*) AS runs_24h,
      COALESCE(SUM(total_new_transactions_imported), 0) AS imported_24h,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs_24h,
      COUNT(*) FILTER (WHERE status = 'requires_sca') AS sca_runs_24h
    FROM banksapi_import_logs
    WHERE started_at > now() - interval '24 hours'
  ),
  last_cron AS (
    SELECT
      started_at,
      finished_at,
      status,
      total_new_transactions_imported,
      error_message
    FROM banksapi_import_logs
    WHERE trigger_type = 'cron'
    ORDER BY started_at DESC
    LIMIT 1
  ),
  user_conn_list AS (
    SELECT
      bc.id AS connection_id,
      bc.user_id,
      NULLIF(TRIM(COALESCE(ap.first_name, '') || ' ' || COALESCE(ap.last_name, '')), '') AS full_name,
      au.email AS user_email,
      bc.bank_name,
      bc.status,
      bc.last_sync_at,
      bc.last_attempted_sync_at,
      bc.last_issue_message,
      bc.error_message,
      bc.consent_expires_at,
      bc.created_at,
      (SELECT COUNT(*) FROM banksapi_bank_products bp WHERE bp.connection_id = bc.id AND bp.selected_for_import = true) AS selected_accounts,
      (SELECT COUNT(*) FROM banksapi_bank_products bp2 WHERE bp2.connection_id = bc.id) AS total_accounts,
      (SELECT il.status FROM banksapi_import_logs il WHERE il.connection_id = bc.id ORDER BY il.started_at DESC LIMIT 1) AS last_import_status,
      (SELECT il.total_new_transactions_imported FROM banksapi_import_logs il WHERE il.connection_id = bc.id ORDER BY il.started_at DESC LIMIT 1) AS last_import_imported
    FROM banksapi_connections bc
    LEFT JOIN account_profiles ap ON ap.user_id = bc.user_id
    LEFT JOIN auth.users au ON au.id = bc.user_id
    WHERE bc.status != 'disconnected'
    ORDER BY bc.created_at DESC
    LIMIT 100
  )
  SELECT jsonb_build_object(
    'connections', (SELECT row_to_json(cs)::jsonb FROM conn_stats cs),
    'products', (SELECT row_to_json(ps)::jsonb FROM product_stats ps),
    'import_24h', (SELECT row_to_json(is24)::jsonb FROM import_stats_24h is24),
    'last_cron', (SELECT row_to_json(lc)::jsonb FROM last_cron lc),
    'connection_list', COALESCE((SELECT jsonb_agg(row_to_json(ucl)::jsonb) FROM user_conn_list ucl), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
