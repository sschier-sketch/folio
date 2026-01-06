/*
  # Extended Property and Tenant Management Features

  1. Property Extensions
    - Add `usable_area_sqm` (Nutzfläche) to properties table
    - Add purchase cost breakdown fields (broker, notary, lawyer, taxes, etc.)
    - Add custom additional costs as JSONB
    - Add guest_wc and housing_permit to equipment
    - Add custom equipment features as JSONB

  2. Loan Extensions
    - Add contact person fields (name, email, phone)

  3. Rental Contract Extensions
    - Add `is_sublet` flag for sublease indication
    - Add `company_name` for business tenants
    - Add `date_of_birth` for tenant
    - Add `vat_applicable` flag for VAT calculation
    - Add graduated rent fields (Staffelmiete)

  4. Maintenance Task Extensions
    - Add email notification settings
    - Add notification lead time in days

  5. Security
    - All new fields respect existing RLS policies
*/

-- Add new fields to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'usable_area_sqm'
  ) THEN
    ALTER TABLE properties ADD COLUMN usable_area_sqm numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'broker_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN broker_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'notary_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN notary_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'lawyer_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN lawyer_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'real_estate_transfer_tax'
  ) THEN
    ALTER TABLE properties ADD COLUMN real_estate_transfer_tax numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'registration_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN registration_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'expert_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN expert_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'additional_purchase_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN additional_purchase_costs jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add equipment fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'guest_wc'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN guest_wc boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'housing_permit'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN housing_permit boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'custom_features'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN custom_features jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add loan contact fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'contact_person_name'
  ) THEN
    ALTER TABLE loans ADD COLUMN contact_person_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'contact_person_email'
  ) THEN
    ALTER TABLE loans ADD COLUMN contact_person_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'contact_person_phone'
  ) THEN
    ALTER TABLE loans ADD COLUMN contact_person_phone text;
  END IF;
END $$;

-- Add rental contract extensions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'is_sublet'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN is_sublet boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'vat_applicable'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN vat_applicable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'graduated_rent_date'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN graduated_rent_date text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'graduated_rent_schedule'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN graduated_rent_schedule jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add tenant date of birth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE tenants ADD COLUMN date_of_birth date;
  END IF;
END $$;

-- Add maintenance task notification fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_tasks' AND column_name = 'email_notification_enabled'
  ) THEN
    ALTER TABLE maintenance_tasks ADD COLUMN email_notification_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_tasks' AND column_name = 'notification_days_before'
  ) THEN
    ALTER TABLE maintenance_tasks ADD COLUMN notification_days_before integer;
  END IF;
END $$;

-- Update rent_type constraint to include 'graduated'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rental_contracts_rent_type_check'
    AND table_name = 'rental_contracts'
  ) THEN
    ALTER TABLE rental_contracts DROP CONSTRAINT rental_contracts_rent_type_check;
  END IF;
  
  ALTER TABLE rental_contracts
  ADD CONSTRAINT rental_contracts_rent_type_check
  CHECK (rent_type = ANY (ARRAY['flat_rate'::text, 'cold_rent_advance'::text, 'cold_rent_utilities_heating'::text, 'graduated'::text]));
END $$;

-- Comment on new fields
COMMENT ON COLUMN properties.usable_area_sqm IS 'Nutzfläche in Quadratmetern';
COMMENT ON COLUMN properties.broker_costs IS 'Maklerkosten beim Kauf';
COMMENT ON COLUMN properties.notary_costs IS 'Notarkosten beim Kauf';
COMMENT ON COLUMN properties.lawyer_costs IS 'Anwaltskosten beim Kauf';
COMMENT ON COLUMN properties.real_estate_transfer_tax IS 'Grunderwerbsteuer';
COMMENT ON COLUMN properties.registration_costs IS 'Eintragungskosten';
COMMENT ON COLUMN properties.expert_costs IS 'Gutachterkosten';
COMMENT ON COLUMN properties.additional_purchase_costs IS 'Zusätzliche Kaufnebenkosten als JSON Array mit {name, amount}';

COMMENT ON COLUMN property_equipment.guest_wc IS 'Gäste-WC vorhanden';
COMMENT ON COLUMN property_equipment.housing_permit IS 'Wohnberechtigungsschein erforderlich';
COMMENT ON COLUMN property_equipment.custom_features IS 'Eigene Ausstattungsmerkmale als JSON Array';

COMMENT ON COLUMN loans.contact_person_name IS 'Ansprechpartner beim Kreditgeber';
COMMENT ON COLUMN loans.contact_person_email IS 'E-Mail des Ansprechpartners';
COMMENT ON COLUMN loans.contact_person_phone IS 'Telefon des Ansprechpartners';

COMMENT ON COLUMN rental_contracts.is_sublet IS 'Ist dies ein Untermietverhältnis?';
COMMENT ON COLUMN rental_contracts.company_name IS 'Firmenname (für gewerbliche Mieter)';
COMMENT ON COLUMN rental_contracts.vat_applicable IS 'Mehrwertsteuer anwendbar?';
COMMENT ON COLUMN rental_contracts.graduated_rent_date IS 'Datum der jährlichen Staffelmieterhöhung (Format: MM-DD)';
COMMENT ON COLUMN rental_contracts.graduated_rent_schedule IS 'Staffelmietplan als JSON Array mit {year, amount}';

COMMENT ON COLUMN tenants.date_of_birth IS 'Geburtsdatum des Mieters';

COMMENT ON COLUMN maintenance_tasks.email_notification_enabled IS 'E-Mail-Benachrichtigung aktiviert';
COMMENT ON COLUMN maintenance_tasks.notification_days_before IS 'Tage vor Fälligkeit für Benachrichtigung';