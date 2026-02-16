/*
  # Add portal_invited_at tracking field to tenants

  1. Modified Tables
    - `tenants`
      - `portal_invited_at` (timestamptz, nullable) - Tracks when the portal invitation email was sent

  2. Purpose
    - Distinguish between "invitation pending" (portal enabled, no invite sent)
      and "invitation sent" (portal enabled, invite email sent, tenant not yet activated)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'portal_invited_at'
  ) THEN
    ALTER TABLE tenants ADD COLUMN portal_invited_at timestamptz;
  END IF;
END $$;
