/*
  # Extend rent_history for robust rent period tracking

  This migration enhances the existing `rent_history` table to support:
  - Planned future rent increases (status field)
  - VPI (Verbraucherpreisindex) storage for index rent increases
  - Initial backfill for contracts without rent history

  1. Modified Tables
    - `rent_history`
      - Added `status` (text, default 'active') - 'active' or 'planned'
      - Added `vpi_old_month` (date, nullable) - Reference month for old VPI value
      - Added `vpi_old_value` (numeric(10,3), nullable) - Old VPI index value
      - Added `vpi_new_month` (date, nullable) - Reference month for new VPI value
      - Added `vpi_new_value` (numeric(10,3), nullable) - New VPI index value
      - Updated `reason` CHECK constraint to include 'migration' and 'manual'

  2. New Functions
    - `get_current_rent(contract_id)` - Returns current active rent period
    - `activate_planned_rent_periods()` - Activates planned periods whose date has arrived

  3. Data Migration
    - Backfills initial rent_history entries for contracts without any history

  4. Important Notes
    - Existing code reading from rental_contracts is NOT affected
    - The `status` column defaults to 'active' so all existing rows remain active
    - VPI fields are nullable - only populated for index rent increases
*/

-- ============================================================
-- 1. Add new columns to rent_history
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_history' AND column_name = 'status'
  ) THEN
    ALTER TABLE rent_history ADD COLUMN status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_history' AND column_name = 'vpi_old_month'
  ) THEN
    ALTER TABLE rent_history ADD COLUMN vpi_old_month date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_history' AND column_name = 'vpi_old_value'
  ) THEN
    ALTER TABLE rent_history ADD COLUMN vpi_old_value numeric(10,3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_history' AND column_name = 'vpi_new_month'
  ) THEN
    ALTER TABLE rent_history ADD COLUMN vpi_new_month date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_history' AND column_name = 'vpi_new_value'
  ) THEN
    ALTER TABLE rent_history ADD COLUMN vpi_new_value numeric(10,3);
  END IF;
END $$;

-- ============================================================
-- 2. Add CHECK constraint for status
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'rent_history_status_check'
  ) THEN
    ALTER TABLE rent_history ADD CONSTRAINT rent_history_status_check
      CHECK (status IN ('active', 'planned'));
  END IF;
END $$;

-- ============================================================
-- 3. Update reason CHECK constraint to allow additional values
-- ============================================================
ALTER TABLE rent_history DROP CONSTRAINT IF EXISTS rent_history_reason_check;
ALTER TABLE rent_history ADD CONSTRAINT rent_history_reason_check
  CHECK (reason IN ('initial', 'increase', 'index', 'stepped', 'migration', 'manual', 'import'));

-- ============================================================
-- 4. Add composite index for efficient "current rent" lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rent_history_current_rent
  ON rent_history (contract_id, effective_date DESC, created_at DESC)
  WHERE (status IS NULL OR status = 'active');

-- ============================================================
-- 5. RPC: get_current_rent - returns the active rent period for a contract
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_rent(p_contract_id uuid)
RETURNS TABLE(
  rent_period_id uuid,
  cold_rent numeric,
  utilities numeric,
  effective_date date,
  reason text,
  period_status text,
  vpi_old_month date,
  vpi_old_value numeric,
  vpi_new_month date,
  vpi_new_value numeric,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rh.id,
    rh.cold_rent::numeric,
    rh.utilities::numeric,
    rh.effective_date,
    rh.reason,
    COALESCE(rh.status, 'active'),
    rh.vpi_old_month,
    rh.vpi_old_value,
    rh.vpi_new_month,
    rh.vpi_new_value,
    rh.notes
  FROM rent_history rh
  WHERE rh.contract_id = p_contract_id
    AND COALESCE(rh.status, 'active') = 'active'
    AND rh.effective_date <= CURRENT_DATE
  ORDER BY rh.effective_date DESC, rh.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      NULL::uuid,
      COALESCE(rc.monthly_rent, rc.cold_rent, rc.base_rent, rc.flat_rate_amount, 0)::numeric,
      COALESCE(rc.additional_costs, rc.utilities_advance, 0)::numeric,
      COALESCE(rc.contract_start, rc.created_at::date),
      'initial'::text,
      'active'::text,
      NULL::date,
      NULL::numeric(10,3),
      NULL::date,
      NULL::numeric(10,3),
      NULL::text
    FROM rental_contracts rc
    WHERE rc.id = p_contract_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 6. RPC: activate_planned_rent_periods
--    Activates planned periods whose effective_date has arrived,
--    and syncs the new rent to rental_contracts.
-- ============================================================
CREATE OR REPLACE FUNCTION activate_planned_rent_periods()
RETURNS integer AS $$
DECLARE
  activated_count integer := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT rh.id, rh.contract_id, rh.cold_rent, rh.utilities
    FROM rent_history rh
    WHERE rh.status = 'planned'
      AND rh.effective_date <= CURRENT_DATE
    ORDER BY rh.effective_date ASC
  LOOP
    UPDATE rent_history SET status = 'active' WHERE id = rec.id;

    UPDATE rental_contracts SET
      monthly_rent = rec.cold_rent,
      base_rent = rec.cold_rent,
      total_rent = rec.cold_rent + COALESCE(rec.utilities, 0)
    WHERE id = rec.contract_id;

    activated_count := activated_count + 1;
  END LOOP;

  RETURN activated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Backfill: Create initial rent_history entries for contracts
--    that currently have NO rent_history rows at all.
-- ============================================================
INSERT INTO rent_history (user_id, contract_id, effective_date, cold_rent, utilities, reason, status, notes)
SELECT
  rc.user_id,
  rc.id,
  COALESCE(rc.contract_start, rc.created_at::date, CURRENT_DATE),
  COALESCE(rc.monthly_rent, rc.cold_rent, rc.base_rent, rc.flat_rate_amount, 0),
  COALESCE(rc.additional_costs, rc.utilities_advance, 0),
  'initial',
  'active',
  'Automatisch erstellt aus Vertragsdaten'
FROM rental_contracts rc
WHERE NOT EXISTS (
  SELECT 1 FROM rent_history rh WHERE rh.contract_id = rc.id
);
