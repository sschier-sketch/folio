/*
  # Backfill total_rent to include separate unit rents (parking, storage, etc.)

  1. Changes
    - Updates total_rent on all rental_contracts that have rental_contract_units
      with rent_included = false and separate_rent > 0
    - total_rent = base_rent + additional_costs + SUM(separate_rent + separate_additional_costs)
    - Also updates future unpaid rent_payments to reflect the corrected total_rent

  2. Important Notes
    - Only contracts with separate unit rents are affected
    - Only unpaid rent_payments with due_date >= current month are updated
    - Already paid payments are NOT modified to preserve financial records
*/

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      rc.id AS contract_id,
      rc.base_rent,
      rc.additional_costs,
      COALESCE(SUM(
        CASE WHEN NOT rcu.rent_included
          THEN COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)
          ELSE 0
        END
      ), 0) AS separate_total
    FROM rental_contracts rc
    JOIN rental_contract_units rcu ON rcu.contract_id = rc.id
    WHERE rc.status = 'active'
    GROUP BY rc.id, rc.base_rent, rc.additional_costs
    HAVING COALESCE(SUM(
      CASE WHEN NOT rcu.rent_included
        THEN COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)
        ELSE 0
      END
    ), 0) > 0
  LOOP
    UPDATE rental_contracts
    SET total_rent = rec.base_rent + rec.additional_costs + rec.separate_total
    WHERE id = rec.contract_id;

    UPDATE rent_payments
    SET amount = rec.base_rent + rec.additional_costs + rec.separate_total
    WHERE contract_id = rec.contract_id
      AND payment_status = 'unpaid'
      AND paid = false
      AND due_date >= date_trunc('month', CURRENT_DATE)::date;
  END LOOP;
END $$;
