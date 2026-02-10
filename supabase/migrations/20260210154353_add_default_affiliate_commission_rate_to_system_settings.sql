/*
  # Add default affiliate commission rate to system_settings

  1. Modified Tables
    - `system_settings`
      - `default_affiliate_commission_rate` (decimal(4,3), default 0.250 = 25%)
        Controls the default commission rate applied to new affiliates.
        Admins can override per-user via the affiliates table.

  2. Notes
    - Existing affiliates keep their current commission_rate
    - New affiliates created by the handle_new_user trigger will use this default
    - The trigger function is updated to read from system_settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'default_affiliate_commission_rate'
  ) THEN
    ALTER TABLE system_settings
    ADD COLUMN default_affiliate_commission_rate decimal(4,3) NOT NULL DEFAULT 0.250
    CHECK (default_affiliate_commission_rate >= 0 AND default_affiliate_commission_rate <= 1);
  END IF;
END $$;

UPDATE system_settings
SET default_affiliate_commission_rate = 0.250
WHERE id = 1 AND default_affiliate_commission_rate IS NULL;
