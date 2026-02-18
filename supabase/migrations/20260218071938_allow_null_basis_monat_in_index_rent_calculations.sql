/*
  # Allow NULL basis_monat in index_rent_calculations

  1. Changes
    - Drops the NOT NULL constraint on basis_monat column
    - When no prior index increase has been performed through the system,
      basis_monat should be NULL to indicate "unknown"
    - The UI will display "Unbekannt" in this case

  2. Important
    - No existing data is modified
    - Only the column constraint changes
*/

ALTER TABLE index_rent_calculations ALTER COLUMN basis_monat DROP NOT NULL;
