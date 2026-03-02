/*
  # Extend rent_history sync trigger to also fire on UPDATE

  1. Changes
    - Drops the existing INSERT-only trigger `trg_sync_rent_history_to_contract`
    - Recreates it as INSERT OR UPDATE trigger
    - The trigger function `sync_rent_history_to_contract()` already handles
      syncing cold_rent, utilities, additional_costs, utilities_advance, and total_rent
    - Now when a user edits an existing rent period's Nebenkosten, the trigger
      ensures the contract fields stay in sync even if the app code fails to do so

  2. Important Notes
    - The WHEN clause still excludes rows where source = 'migration' or 'initial'
    - The function is SECURITY DEFINER so it can update rental_contracts regardless of RLS
    - This is a defense-in-depth measure; the app code also syncs on UPDATE
*/

DROP TRIGGER IF EXISTS trg_sync_rent_history_to_contract ON rent_history;

CREATE TRIGGER trg_sync_rent_history_to_contract
  AFTER INSERT OR UPDATE ON rent_history
  FOR EACH ROW
  WHEN (
    NEW.source IS DISTINCT FROM 'migration'
    AND NEW.source IS DISTINCT FROM 'initial'
  )
  EXECUTE FUNCTION sync_rent_history_to_contract();
