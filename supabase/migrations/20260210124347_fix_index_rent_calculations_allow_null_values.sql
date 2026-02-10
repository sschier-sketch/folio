/*
  # Fix index rent calculations - allow NULL values for pending calculations

  1. Modified Columns
    - `index_rent_calculations.basis_index` - DROP NOT NULL (pending calculations have no index yet)
    - `index_rent_calculations.aktueller_index` - DROP NOT NULL (pending calculations have no index yet)
    - `index_rent_calculations.neue_miete_eur_qm` - DROP NOT NULL (calculated later)

  2. Reason
    - The run_automatic_index_rent_calculations function creates reminder-style entries
      where index values are not yet known and are set to NULL.
    - The NOT NULL constraints on these columns prevented the insert from succeeding.
*/

ALTER TABLE index_rent_calculations ALTER COLUMN basis_index DROP NOT NULL;
ALTER TABLE index_rent_calculations ALTER COLUMN aktueller_index DROP NOT NULL;
ALTER TABLE index_rent_calculations ALTER COLUMN neue_miete_eur_qm DROP NOT NULL;
