/*
  # Update Property Contacts - Add Phone Fields
  
  1. Changes
    - Rename existing phone field to phone_mobile
    - Add phone_landline field for landline numbers
    - Update contact_role to include 'service_provider' instead of 'contractor'
    
  2. Notes
    - Preserves existing data by renaming instead of dropping
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'property_contacts' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE property_contacts RENAME COLUMN phone TO phone_mobile;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'property_contacts' 
    AND column_name = 'phone_landline'
  ) THEN
    ALTER TABLE property_contacts ADD COLUMN phone_landline text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'property_contacts_contact_role_check'
  ) THEN
    ALTER TABLE property_contacts DROP CONSTRAINT property_contacts_contact_role_check;
  END IF;
END $$;

ALTER TABLE property_contacts
ADD CONSTRAINT property_contacts_contact_role_check
CHECK (contact_role IN ('caretaker', 'service_provider', 'owner', 'manager', 'other'));