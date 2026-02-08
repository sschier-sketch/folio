/*
  # Backfill deposit history for contracts marked as complete

  When a rental contract was created with the deposit marked as fully paid 
  (deposit_status = 'complete'), no transaction was recorded in deposit_history.
  This caused the "Aktuell vorhandener Betrag" (current available amount) to 
  show 0 even though the deposit was fully paid.

  1. Changes
    - For each contract where deposit_status = 'complete' and deposit_amount > 0 
      (or deposit > 0) but no deposit_history payment exists, insert a payment 
      transaction with the contract_start date
    - Also syncs deposit_amount = deposit for contracts where deposit_amount is 0 
      but deposit > 0

  2. Impact
    - Fixes "Aktuell vorhandener Betrag" display for existing contracts
    - No existing data is modified, only new deposit_history rows are inserted
    - deposit_amount column is synced to match deposit where it was missing
*/

DO $$
BEGIN
  UPDATE rental_contracts
  SET deposit_amount = deposit
  WHERE deposit > 0
    AND (deposit_amount IS NULL OR deposit_amount = 0);
END $$;

INSERT INTO deposit_history (contract_id, user_id, transaction_date, amount, transaction_type, notes)
SELECT
  rc.id,
  rc.user_id,
  COALESCE(rc.contract_start, CURRENT_DATE),
  COALESCE(rc.deposit_amount, rc.deposit),
  'payment',
  'Kaution bei Mietbeginn erhalten (nachgebucht)'
FROM rental_contracts rc
WHERE rc.deposit_status = 'complete'
  AND COALESCE(rc.deposit_amount, rc.deposit) > 0
  AND NOT EXISTS (
    SELECT 1 FROM deposit_history dh
    WHERE dh.contract_id = rc.id
    AND dh.transaction_type = 'payment'
  );
