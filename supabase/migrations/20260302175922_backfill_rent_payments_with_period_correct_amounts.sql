/*
  # Backfill rent payments with period-correct amounts

  ## Problem
  Existing unpaid rent_payments may have stale amounts that don't match
  the applicable rent_history period for their due_date. This affects
  the bank import auto-allocation which shows wrong expected amounts.

  ## Solution
  Run `sync_rent_payment_amounts` for every active contract that has
  rent_history entries, correcting all unpaid rent_payment amounts to
  match the period that was valid at each payment's due_date.

  ## Safety
  - Only updates unpaid, non-paid rent_payments
  - Preserves paid and partially-paid records
  - Uses the new `calculate_rent_for_period` function which considers
    rent_history periods AND separate unit costs (e.g. Stellplatz)
*/

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT rc.id
    FROM rental_contracts rc
    WHERE rc.status = 'active'
      AND EXISTS (
        SELECT 1 FROM rent_payments rp
        WHERE rp.contract_id = rc.id
          AND rp.paid = false
          AND rp.payment_status = 'unpaid'
      )
  LOOP
    PERFORM sync_rent_payment_amounts(rec.id);
  END LOOP;
END $$;
