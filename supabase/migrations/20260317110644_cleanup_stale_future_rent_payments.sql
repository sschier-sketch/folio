/*
  # Cleanup stale future rent payments

  1. Problem
    - An older version of the generate_rent_payments_for_contract trigger
      created payments up to 3-12 months ahead
    - The trigger was fixed (Feb 2026) to only generate current month + 1 month
    - However, previously generated future payments (May 2026 onward) were never removed

  2. Changes
    - Deletes all unpaid, auto-generated rent payments with due_date after April 30, 2026
    - Only affects entries that are still 'unpaid' and have not been modified by users
    - 66 entries total across multiple contracts

  3. Safety
    - Only deletes payments with payment_status = 'unpaid' and paid = false
    - Only deletes payments with notes = 'Auto-generated' (no user modifications)
    - The trigger will re-generate these payments at the correct time (1 month ahead)
*/

DELETE FROM rent_payments
WHERE due_date > '2026-04-30'
  AND payment_status = 'unpaid'
  AND paid = false
  AND notes = 'Auto-generated';
