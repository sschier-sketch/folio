/*
  # Create Rental Contract Units Junction Table and Fix Auto-Status Triggers

  ## Summary
  Creates a junction table to link rental contracts to multiple property units,
  enabling one lease to cover multiple units (e.g., apartment + parking spot).
  Updates status triggers to use this new table instead of lease_units.

  ## New Tables
  ### `rental_contract_units`
  - `id` (uuid, primary key) - Unique identifier
  - `contract_id` (uuid, not null) - Reference to rental_contracts
  - `unit_id` (uuid, not null) - Reference to property_units
  - `user_id` (uuid, not null) - Owner for RLS
  - `created_at` (timestamptz) - Creation timestamp

  ## Changes
  - Updated auto-status triggers to use rental_contract_units instead of lease_units
  - Backfilled existing rental_contracts unit_id entries into rental_contract_units
  - Updated unit_vacancy_stats view

  ## Security
  - RLS enabled with user-scoped policies
*/

-- Create the junction table
CREATE TABLE IF NOT EXISTS rental_contract_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contract_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_rcu_contract_id ON rental_contract_units(contract_id);
CREATE INDEX IF NOT EXISTS idx_rcu_unit_id ON rental_contract_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_rcu_user_id ON rental_contract_units(user_id);

ALTER TABLE rental_contract_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rental_contract_units"
  ON rental_contract_units FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rental_contract_units"
  ON rental_contract_units FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rental_contract_units"
  ON rental_contract_units FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rental_contract_units"
  ON rental_contract_units FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update trigger: set unit to rented when contract_unit is inserted
CREATE OR REPLACE FUNCTION set_unit_rented_on_contract_unit_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE property_units
  SET
    status = 'rented',
    updated_at = now()
  WHERE id = NEW.unit_id
    AND status NOT IN ('owner_occupied');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger: set unit to vacant when contract_unit is deleted (if no other active contracts)
CREATE OR REPLACE FUNCTION set_unit_vacant_on_contract_unit_delete()
RETURNS TRIGGER AS $$
DECLARE
  other_active INTEGER;
BEGIN
  SELECT COUNT(*) INTO other_active
  FROM rental_contract_units rcu
  INNER JOIN rental_contracts rc ON rcu.contract_id = rc.id
  WHERE rcu.unit_id = OLD.unit_id
    AND rcu.id != OLD.id
    AND rc.status = 'active';

  IF other_active = 0 THEN
    UPDATE property_units
    SET
      status = 'vacant',
      updated_at = now()
    WHERE id = OLD.unit_id
      AND status NOT IN ('owner_occupied');
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the prevent manual rented status trigger to check rental_contract_units
CREATE OR REPLACE FUNCTION prevent_manual_rented_status()
RETURNS TRIGGER AS $$
DECLARE
  has_active_contract BOOLEAN;
BEGIN
  IF NEW.status = 'rented' THEN
    SELECT EXISTS (
      SELECT 1
      FROM rental_contract_units rcu
      INNER JOIN rental_contracts rc ON rcu.contract_id = rc.id
      WHERE rcu.unit_id = NEW.id
        AND rc.status = 'active'
    ) INTO has_active_contract;

    IF NOT has_active_contract AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'rented') THEN
      RAISE EXCEPTION 'Status "vermietet" kann nur automatisch durch ein Mietverhältnis gesetzt werden. Bitte legen Sie ein Mietverhältnis an.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on rental_contract_units
DROP TRIGGER IF EXISTS trigger_rcu_set_rented ON rental_contract_units;
CREATE TRIGGER trigger_rcu_set_rented
  AFTER INSERT ON rental_contract_units
  FOR EACH ROW
  EXECUTE FUNCTION set_unit_rented_on_contract_unit_insert();

DROP TRIGGER IF EXISTS trigger_rcu_set_vacant ON rental_contract_units;
CREATE TRIGGER trigger_rcu_set_vacant
  AFTER DELETE ON rental_contract_units
  FOR EACH ROW
  EXECUTE FUNCTION set_unit_vacant_on_contract_unit_delete();

-- Ensure the prevent manual rented trigger exists on property_units
DROP TRIGGER IF EXISTS trigger_prevent_manual_rented ON property_units;
CREATE TRIGGER trigger_prevent_manual_rented
  BEFORE UPDATE OF status ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION prevent_manual_rented_status();

-- Backfill: insert entries for existing rental_contracts that have unit_id
INSERT INTO rental_contract_units (contract_id, unit_id, user_id)
SELECT rc.id, rc.unit_id, rc.user_id
FROM rental_contracts rc
WHERE rc.unit_id IS NOT NULL
  AND rc.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM rental_contract_units rcu
    WHERE rcu.contract_id = rc.id AND rcu.unit_id = rc.unit_id
  );

-- Update the vacancy stats view to use rental_contract_units
CREATE OR REPLACE VIEW unit_vacancy_stats AS
SELECT
  property_id,
  COUNT(*) FILTER (WHERE status = 'vacant') as vacant_count,
  COUNT(*) FILTER (WHERE status = 'rented') as rented_count,
  COUNT(*) FILTER (WHERE status = 'owner_occupied') as owner_occupied_count,
  COUNT(*) FILTER (WHERE status NOT IN ('owner_occupied')) as rentable_count,
  COUNT(*) as total_count
FROM property_units
GROUP BY property_id;
