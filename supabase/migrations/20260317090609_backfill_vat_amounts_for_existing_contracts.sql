/*
  # Backfill VAT amounts for existing contracts

  1. Changes
    - Updates all unpaid rent payments for contracts with vat_applicable = true
    - Calculates the gross amount (net + 19% VAT) and stores vat_amount
    - Only affects unpaid payments to avoid changing historical paid records

  2. Important
    - Paid payments are NOT modified to preserve accounting accuracy
    - Only contracts with vat_applicable = true are affected
*/

UPDATE rent_payments rp
SET amount = rp.amount * 1.19,
    vat_amount = ROUND(rp.amount * 0.19, 2)
FROM rental_contracts rc
WHERE rp.contract_id = rc.id
  AND rc.vat_applicable = true
  AND rp.payment_status = 'unpaid'
  AND rp.paid = false
  AND COALESCE(rp.vat_amount, 0) = 0;
