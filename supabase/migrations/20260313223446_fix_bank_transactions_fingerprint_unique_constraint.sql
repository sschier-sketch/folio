/*
  # Fix bank_transactions fingerprint unique constraint

  1. Problem
    - The existing unique index on `fingerprint` is a partial index (WHERE fingerprint IS NOT NULL)
    - Supabase JS client's `upsert()` with `onConflict: "fingerprint"` generates
      `ON CONFLICT (fingerprint)` which does not match a partial unique index
    - This causes all BanksAPI transaction imports to fail with:
      "there is no unique or exclusion constraint matching the ON CONFLICT specification"

  2. Fix
    - Drop the partial unique index
    - Add a proper unique constraint on `fingerprint` that works with ON CONFLICT
    - NULL values are still allowed (PostgreSQL treats NULLs as distinct in unique constraints)

  3. Safety
    - No data loss - only index/constraint change
    - Verified: zero NULL fingerprints and zero duplicates exist in production
*/

DROP INDEX IF EXISTS idx_bank_transactions_fingerprint;

ALTER TABLE bank_transactions
  ADD CONSTRAINT bank_transactions_fingerprint_unique UNIQUE (fingerprint);
