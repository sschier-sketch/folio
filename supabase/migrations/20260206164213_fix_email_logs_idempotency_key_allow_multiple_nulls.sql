/*
  # Fix email_logs idempotency_key unique constraint

  1. Changes
    - Drop the existing `unique_idempotency_key` constraint which uses NULLS NOT DISTINCT
    - Recreate it with NULLS DISTINCT so multiple rows can have NULL idempotency_key
  
  2. Problem
    - The old constraint treated NULL values as equal, meaning only ONE email log
      without an idempotency_key could ever exist
    - This caused "Failed to create email log" errors for all normal email sends
    
  3. Fix
    - NULLS DISTINCT allows unlimited NULL values while still enforcing uniqueness
      for non-NULL idempotency keys
*/

ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS unique_idempotency_key;

ALTER TABLE email_logs ADD CONSTRAINT unique_idempotency_key UNIQUE NULLS DISTINCT (idempotency_key);
