/*
  # Add BANKSapi Operational Fields and Admin Diagnostics

  1. Modified Tables
    - `banksapi_connections`
      - `last_attempted_sync_at` (timestamptz) - Timestamp of last sync attempt, regardless of success
      - `last_issue_message` (text) - Latest issue/error from BanksAPI issues API
      - `last_issue_code` (text) - Issue code for admin diagnostics
      - `consent_expires_at` (timestamptz) - When PSD2 consent expires (approx 180 days)

  2. New RPC Functions
    - `admin_get_banksapi_stats()` - Returns aggregated statistics for admin dashboard
      Shows: total active connections, connections requiring SCA, connections with errors,
      total accounts selected for import, last cron run result, total imported in last 24h

  3. Notes
    - No data deletion or destructive changes
    - RLS unchanged - admin RPC uses SECURITY DEFINER with admin check
    - These fields support the operational UX and admin diagnostics requirements
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banksapi_connections' AND column_name = 'last_attempted_sync_at'
  ) THEN
    ALTER TABLE banksapi_connections ADD COLUMN last_attempted_sync_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banksapi_connections' AND column_name = 'last_issue_message'
  ) THEN
    ALTER TABLE banksapi_connections ADD COLUMN last_issue_message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banksapi_connections' AND column_name = 'last_issue_code'
  ) THEN
    ALTER TABLE banksapi_connections ADD COLUMN last_issue_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banksapi_connections' AND column_name = 'consent_expires_at'
  ) THEN
    ALTER TABLE banksapi_connections ADD COLUMN consent_expires_at timestamptz;
  END IF;
END $$;

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
      ap.full_name,
      ap.email,
      bc.bank_name,
      bc.status,
      bc.last_sync_at,
      bc.last_attempted_sync_at,
      bc.last_issue_message,
      bc.error_message,
      bc.consent_expires_at,
      bc.created_at,
      (SELECT COUNT(*) FROM banksapi_bank_products bp WHERE bp.connection_id = bc.id AND bp.selected_for_import = true) AS selected_accounts,
      (SELECT jsonb_build_object(
        'started_at', il.started_at,
        'status', il.status,
        'imported', il.total_new_transactions_imported,
        'duplicates', il.total_duplicates_skipped,
        'error', il.error_message
      ) FROM banksapi_import_logs il WHERE il.connection_id = bc.id ORDER BY il.started_at DESC LIMIT 1) AS last_import
    FROM banksapi_connections bc
    LEFT JOIN account_profiles ap ON ap.user_id = bc.user_id
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
