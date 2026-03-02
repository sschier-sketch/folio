/*
  # Fix sync_rent_history_to_contract to include separate unit rents

  1. Changes
    - Updates the trigger function `sync_rent_history_to_contract()` to also
      sum `separate_rent` and `separate_additional_costs` from `rental_contract_units`
      where `rent_included = false`
    - The total_rent on the contract now correctly includes parking spot rent
      and any other separately billed unit rents

  2. Important Notes
    - This ensures that when a rent period is inserted or updated, the contract's
      total_rent reflects the full monthly payment including parking/storage rents
    - base_rent, monthly_rent, additional_costs, utilities_advance remain unchanged
      (they reflect only the main unit's rent)
    - Only total_rent is augmented with separate unit rents
*/

CREATE OR REPLACE FUNCTION public.sync_rent_history_to_contract()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_separate_total numeric;
BEGIN
  IF NEW.contract_id IS NOT NULL THEN
    SELECT COALESCE(SUM(
      CASE WHEN NOT rent_included THEN COALESCE(separate_rent, 0) + COALESCE(separate_additional_costs, 0) ELSE 0 END
    ), 0) INTO v_separate_total
    FROM rental_contract_units
    WHERE contract_id = NEW.contract_id;

    UPDATE rental_contracts SET
      monthly_rent = NEW.cold_rent,
      base_rent = NEW.cold_rent,
      cold_rent = CASE
        WHEN rent_type != 'flat_rate' THEN NEW.cold_rent
        ELSE cold_rent
      END,
      flat_rate_amount = CASE
        WHEN rent_type = 'flat_rate' THEN NEW.cold_rent
        ELSE flat_rate_amount
      END,
      utilities_advance = NEW.utilities,
      additional_costs = NEW.utilities,
      total_rent = NEW.cold_rent + COALESCE(NEW.utilities, 0) + v_separate_total
    WHERE id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$function$;
