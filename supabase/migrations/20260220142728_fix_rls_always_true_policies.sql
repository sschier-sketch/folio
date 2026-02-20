/*
  # Fix RLS "Always True" Policies (Security Scanner Finding)

  ## Problem
  Four tables have INSERT/UPDATE policies with `WITH CHECK (true)` which the
  security scanner flags as "always true" bypass conditions.

  ## Analysis of Each Table

  ### 1. index_rent_calculation_runs
  - INSERT comes from `run_automatic_index_rent_calculations()` which is SECURITY DEFINER
  - SECURITY DEFINER bypasses RLS entirely
  - The `true` INSERT policy for `authenticated` is unnecessary and overly permissive
  - SELECT policy for `authenticated` with `true` is KEPT (frontend reads this table, and
    the data is non-sensitive run metadata -- no user-scoped data exists in this table)
  - Fix: Restrict INSERT to service_role only

  ### 2. logging_failures
  - INSERT comes from `robust_audit_trigger()` which is SECURITY DEFINER
  - The `true` INSERT policy for `authenticated` is unnecessary
  - Fix: Restrict INSERT to service_role only

  ### 3. referral_click_events
  - ALL inserts come from edge functions using service_role key
  - Frontend calls edge function `track-referral-click`, never writes directly
  - The `true` INSERT policy for `anon,authenticated` is unnecessary
  - Fix: Restrict INSERT to service_role only

  ### 4. referral_sessions
  - ALL inserts AND updates come from edge functions using service_role key
  - Frontend never queries this table directly (only stores ref_sid in localStorage)
  - The `true` INSERT and UPDATE policies for `anon,authenticated` are unnecessary
  - The `true` SELECT policy for `anon,authenticated` is also unnecessary
  - Fix: Restrict INSERT/UPDATE/SELECT to service_role only, keep admin DELETE

  ## Safety
  - service_role bypasses RLS entirely, so these policy changes do NOT affect
    edge functions or SECURITY DEFINER functions
  - The only client-side access is SELECT on index_rent_calculation_runs (kept as-is)
  - No frontend code directly writes to any of these 4 tables
*/

-- ============================================================
-- 1. index_rent_calculation_runs: Replace INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "System can insert calculation runs" ON index_rent_calculation_runs;

CREATE POLICY "Service role can insert calculation runs"
  ON index_rent_calculation_runs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- 2. logging_failures: Replace INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "System can insert logging failures" ON logging_failures;

CREATE POLICY "Service role can insert logging failures"
  ON logging_failures
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- 3. referral_click_events: Replace INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert click events" ON referral_click_events;

CREATE POLICY "Service role can insert click events"
  ON referral_click_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- 4. referral_sessions: Replace INSERT, UPDATE, SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert referral sessions" ON referral_sessions;
DROP POLICY IF EXISTS "Anyone can update referral sessions" ON referral_sessions;
DROP POLICY IF EXISTS "Anyone can read referral sessions" ON referral_sessions;

CREATE POLICY "Service role can insert referral sessions"
  ON referral_sessions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update referral sessions"
  ON referral_sessions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can read referral sessions"
  ON referral_sessions
  FOR SELECT
  TO service_role
  USING (true);
