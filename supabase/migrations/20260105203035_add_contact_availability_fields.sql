/*
  # Add Availability Fields to Property Contacts

  1. Changes
    - Add availability fields to property_contacts table
      - `availability_days` (text array): Days of week the contact is available
      - `availability_time_start` (time): Start of availability window
      - `availability_time_end` (time): End of availability window
      - `availability_notes` (text): Additional availability information

  2. Notes
    - These fields allow tracking when contacts are reachable
    - Days array can contain: monday, tuesday, wednesday, thursday, friday, saturday, sunday
    - Time fields allow flexible scheduling
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_contacts' AND column_name = 'availability_days'
  ) THEN
    ALTER TABLE property_contacts 
    ADD COLUMN availability_days text[] DEFAULT NULL,
    ADD COLUMN availability_time_start time DEFAULT NULL,
    ADD COLUMN availability_time_end time DEFAULT NULL,
    ADD COLUMN availability_notes text DEFAULT NULL;
  END IF;
END $$;