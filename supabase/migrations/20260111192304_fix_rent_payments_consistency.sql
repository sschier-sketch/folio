/*
  # Fix rent_payments consistency
  
  1. Synchronize `paid` and `payment_status` fields
    - Update trigger to keep both fields in sync
    - Fix days_overdue calculation to use payment_status
  
  2. Security
    - No RLS changes needed
*/

-- Update the days_overdue calculation function to use payment_status
CREATE OR REPLACE FUNCTION calculate_days_overdue(due_date date, status text)
RETURNS integer AS $$
BEGIN
  IF status = 'paid' THEN
    RETURN 0;
  END IF;
  
  RETURN GREATEST(0, (CURRENT_DATE - due_date));
END;
$$ LANGUAGE plpgsql;

-- Update trigger to keep paid and payment_status in sync
CREATE OR REPLACE FUNCTION update_rent_payment_fields()
RETURNS trigger AS $$
BEGIN
  -- Sync paid boolean with payment_status
  IF NEW.payment_status = 'paid' THEN
    NEW.paid := true;
  ELSE
    NEW.paid := false;
  END IF;
  
  -- Calculate days overdue based on payment_status
  NEW.days_overdue := calculate_days_overdue(NEW.due_date, NEW.payment_status);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger
DROP TRIGGER IF EXISTS trg_update_days_overdue ON rent_payments;

CREATE TRIGGER trg_update_rent_payment_fields
BEFORE INSERT OR UPDATE ON rent_payments
FOR EACH ROW
EXECUTE FUNCTION update_rent_payment_fields();

-- Update existing payments to ensure consistency
UPDATE rent_payments
SET payment_status = CASE
  WHEN paid = true THEN 'paid'
  WHEN paid_amount > 0 AND paid_amount < amount THEN 'partial'
  ELSE 'unpaid'
END,
days_overdue = calculate_days_overdue(due_date, CASE
  WHEN paid = true THEN 'paid'
  WHEN paid_amount > 0 AND paid_amount < amount THEN 'partial'
  ELSE 'unpaid'
END);
