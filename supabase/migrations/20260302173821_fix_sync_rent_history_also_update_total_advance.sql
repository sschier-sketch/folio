/*
  # Fix sync_rent_history_to_contract to also sync total_advance

  1. Changes
    - When the trigger syncs rent history to the contract, it now also updates
      `total_advance` to match `utilities_advance` for contracts with rent_type
      'cold_rent_advance'
    - This prevents the "Vorauszahlung" field in the edit form from showing
      a stale value after rent periods are updated

  2. Important Notes
    - total_advance, operating_costs, heating_costs are rent-type-specific fields
    - utilities_advance / additional_costs are the canonical fields always kept in sync
    - This ensures total_advance stays in sync as well
*/

CREATE OR REPLACE FUNCTION public.sync_rent_history_to_contract()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_separate_total numeric;
  v_rent_type text;
BEGIN
  IF NEW.contract_id IS NOT NULL THEN
    SELECT COALESCE(SUM(
      CASE WHEN NOT rent_included THEN COALESCE(separate_rent, 0) + COALESCE(separate_additional_costs, 0) ELSE 0 END
    ), 0) INTO v_separate_total
    FROM rental_contract_units
    WHERE contract_id = NEW.contract_id;

    SELECT rent_type INTO v_rent_type
    FROM rental_contracts
    WHERE id = NEW.contract_id;

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
      total_advance = CASE
        WHEN v_rent_type = 'cold_rent_advance' THEN NEW.utilities
        ELSE total_advance
      END,
      total_rent = NEW.cold_rent + COALESCE(NEW.utilities, 0) + v_separate_total
    WHERE id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$function$;
