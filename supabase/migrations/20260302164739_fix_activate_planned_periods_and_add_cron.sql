/*
  # Fix activate_planned_rent_periods and schedule daily cron

  1. Modified Functions
    - `activate_planned_rent_periods()` - Now also syncs `additional_costs`,
      `utilities_advance`, and `cold_rent` fields to rental_contracts when
      activating a planned period

  2. New Cron Job
    - `daily-activate-planned-rent-periods` runs at 00:05 UTC daily
    - Calls `activate_planned_rent_periods()` to activate any planned
      rent periods whose effective_date has arrived

  3. Important Notes
    - This ensures planned Mietperioden automatically become active
      on their effective date
    - The contract's current rent fields are updated to match
*/

CREATE OR REPLACE FUNCTION activate_planned_rent_periods()
RETURNS integer AS $$
DECLARE
  activated_count integer := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT rh.id, rh.contract_id, rh.cold_rent, rh.utilities
    FROM rent_history rh
    WHERE rh.status = 'planned'
      AND rh.effective_date <= CURRENT_DATE
    ORDER BY rh.effective_date ASC
  LOOP
    UPDATE rent_history SET status = 'active' WHERE id = rec.id;

    UPDATE rental_contracts SET
      monthly_rent = rec.cold_rent,
      base_rent = rec.cold_rent,
      cold_rent = rec.cold_rent,
      additional_costs = COALESCE(rec.utilities, 0),
      utilities_advance = COALESCE(rec.utilities, 0),
      total_rent = rec.cold_rent + COALESCE(rec.utilities, 0)
    WHERE id = rec.contract_id;

    activated_count := activated_count + 1;
  END LOOP;

  RETURN activated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

SELECT cron.schedule(
  'daily-activate-planned-rent-periods',
  '5 0 * * *',
  $$SELECT activate_planned_rent_periods();$$
);
