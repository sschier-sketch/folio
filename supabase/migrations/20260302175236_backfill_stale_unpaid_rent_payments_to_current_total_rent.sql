/*
  # Backfill stale unpaid rent payments to match current contract total_rent

  ## Problem
  Some existing unpaid rent_payments have stale amounts that don't match
  their contract's current total_rent. This happens when total_rent was
  updated (e.g. Stellplatz added, Nebenkosten changed) but the trigger
  previously only created new records and didn't update existing ones.

  ## Solution
  One-time update of all unpaid rent_payments (for current and future months)
  where the amount differs from the contract's current total_rent.

  ## Safety
  - Only updates `payment_status = 'unpaid'` and `paid = false` records
  - Only updates `due_date >= current month` (does not rewrite history)
  - Excludes nebenkosten payment types
  - Preserves all paid and partially paid records
*/

UPDATE rent_payments rp
SET amount = rc.total_rent
FROM rental_contracts rc
WHERE rp.contract_id = rc.id
  AND rc.status = 'active'
  AND rp.paid = false
  AND rp.payment_status = 'unpaid'
  AND rp.due_date >= date_trunc('month', CURRENT_DATE)::date
  AND (rp.payment_type IS NULL OR rp.payment_type = 'rent')
  AND rp.amount IS DISTINCT FROM rc.total_rent;
