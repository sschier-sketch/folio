/*
  # Backfill total_advance to match additional_costs for cold_rent_advance contracts

  1. Changes
    - For all contracts with rent_type = 'cold_rent_advance', sets total_advance
      equal to additional_costs so both fields are consistent
    - This fixes stale total_advance values that drifted when rent periods were
      updated without syncing total_advance

  2. Important Notes
    - Only affects contracts where total_advance differs from additional_costs
    - Does not change any other fields
*/

UPDATE rental_contracts
SET total_advance = additional_costs
WHERE rent_type = 'cold_rent_advance'
  AND total_advance IS DISTINCT FROM additional_costs;
