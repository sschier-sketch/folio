/*
  # Fix index rent calculation to use all rent history entries

  1. Changes
    - The `basis_monat` now uses the latest rent_history entry regardless of reason
      (manual, index, stepped, etc.), not just index-type entries
    - This ensures that after a manual rent increase, the next index calculation
      uses the correct basis month from that manual increase
    - The `possible_since` already correctly uses all rent history entries
    - Invalidates existing 'calculated' entries when a newer rent_history entry
      exists that wasn't considered (its effective_date > the calculation's basis_monat)

  2. Important Notes
    - After a manual rent increase to 01.05.2025, the next index rent calculation
      should use 2025-05 as basis_monat, not the original contract start
    - The 12-month waiting period applies from ANY rent change, not just index changes
*/

CREATE OR REPLACE FUNCTION run_automatic_index_rent_calculations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_run_id uuid;
v_contracts_checked integer := 0;
v_calculations_created integer := 0;
v_contract record;
v_last_calculation_date date;
v_last_rent_change_date date;
v_contract_start_date date;
v_first_increase_date date;
v_months_since_last integer;
v_current_base_rent numeric;
v_area_sqm numeric;
v_calling_user uuid;
v_calc_id uuid;
v_thread_id uuid;
v_tenant_name text;
v_property_name text;
v_possible_date date;
v_basis_month text;
v_current_month text;
v_last_rent_history_date date;
BEGIN
v_calling_user := auth.uid();

INSERT INTO index_rent_calculation_runs (run_date, status)
VALUES (now(), 'pending')
RETURNING id INTO v_run_id;

FOR v_contract IN
SELECT
rc.id as contract_id,
rc.user_id,
rc.property_id,
rc.unit_id,
rc.tenant_id,
rc.monthly_rent as base_rent,
rc.contract_start,
rc.start_date,
rc.rent_increase_type,
rc.index_first_increase_date,
pu.area_sqm,
t.name as tenant_name,
p.name as property_name
FROM rental_contracts rc
LEFT JOIN property_units pu ON pu.id = rc.unit_id
LEFT JOIN tenants t ON t.id = rc.tenant_id
LEFT JOIN properties p ON p.id = rc.property_id
WHERE rc.rent_increase_type = 'index'
AND rc.contract_start IS NOT NULL
AND (rc.contract_end IS NULL OR rc.contract_end >= CURRENT_DATE)
AND (v_calling_user IS NULL OR rc.user_id = v_calling_user)
LOOP
v_contracts_checked := v_contracts_checked + 1;
v_contract_start_date := v_contract.contract_start::date;
v_current_base_rent := v_contract.base_rent;
v_area_sqm := COALESCE(v_contract.area_sqm, 0);
v_tenant_name := COALESCE(v_contract.tenant_name, 'Unbekannter Mieter');
v_property_name := COALESCE(v_contract.property_name, 'Unbekannte Immobilie');

v_first_increase_date := COALESCE(
v_contract.index_first_increase_date::date,
(v_contract_start_date + interval '12 months')::date
);

IF CURRENT_DATE < v_first_increase_date THEN
CONTINUE;
END IF;

SELECT MAX(effective_date::date)
INTO v_last_rent_change_date
FROM rent_history
WHERE contract_id = v_contract.contract_id
AND (status IS NULL OR status = 'active')
AND effective_date <= CURRENT_DATE;

v_last_rent_change_date := COALESCE(v_last_rent_change_date, v_contract_start_date);

v_months_since_last := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_last_rent_change_date)) * 12 +
EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_last_rent_change_date));

IF v_months_since_last < 12 THEN
UPDATE index_rent_calculations
SET status = 'dismissed',
    dismissed_at = now(),
    notes = 'Automatisch verworfen: Letzte Mietaenderung am ' || TO_CHAR(v_last_rent_change_date, 'DD.MM.YYYY') || ' - 12 Monate muessen abgewartet werden.'
WHERE contract_id = v_contract.contract_id
AND status IN ('calculated', 'pending')
AND possible_since < v_last_rent_change_date;
CONTINUE;
END IF;

IF EXISTS (
SELECT 1 FROM index_rent_calculations
WHERE contract_id = v_contract.contract_id
AND status IN ('calculated', 'pending', 'notified')
AND possible_since >= v_last_rent_change_date
) THEN
CONTINUE;
END IF;

UPDATE index_rent_calculations
SET status = 'dismissed',
    dismissed_at = now(),
    notes = 'Automatisch verworfen: Neuere Mietaenderung am ' || TO_CHAR(v_last_rent_change_date, 'DD.MM.YYYY') || ' erfordert Neuberechnung.'
WHERE contract_id = v_contract.contract_id
AND status IN ('calculated', 'pending')
AND possible_since < v_last_rent_change_date;

v_possible_date := GREATEST(v_first_increase_date, (v_last_rent_change_date + interval '12 months')::date);

v_basis_month := TO_CHAR(v_last_rent_change_date, 'YYYY-MM');

v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

INSERT INTO index_rent_calculations (
contract_id,
user_id,
calculation_date,
basis_monat,
basis_index,
aktueller_monat,
aktueller_index,
ausgangsmiete_eur_qm,
neue_miete_eur_qm,
wohnflaeche_qm,
gesamtmiete_eur,
status,
possible_since,
notes
) VALUES (
v_contract.contract_id,
v_contract.user_id,
CURRENT_DATE,
v_basis_month,
NULL,
v_current_month,
NULL,
CASE WHEN v_area_sqm > 0 THEN v_current_base_rent / v_area_sqm ELSE v_current_base_rent END,
NULL,
CASE WHEN v_area_sqm > 0 THEN v_area_sqm ELSE NULL END,
NULL,
'calculated',
v_possible_date,
'Indexmieterhoehung pruefen fuer ' || v_tenant_name || ' - Erhoehung moeglich seit ' || TO_CHAR(v_possible_date, 'DD.MM.YYYY') || '. Bitte aktuellen VPI-Wert pruefen.'
)
RETURNING id INTO v_calc_id;

INSERT INTO mail_threads (
user_id,
tenant_id,
subject,
folder,
status,
last_message_at,
message_count,
priority,
category
) VALUES (
v_contract.user_id,
v_contract.tenant_id,
'Indexmieterhoehung pruefen: ' || v_tenant_name,
'inbox',
'unread',
now(),
1,
'high',
'Indexmiete'
)
RETURNING id INTO v_thread_id;

INSERT INTO mail_messages (
thread_id,
user_id,
direction,
sender_address,
sender_name,
recipient_address,
recipient_name,
body_text
) VALUES (
v_thread_id,
v_contract.user_id,
'inbound',
'system@rentably.de',
'Rentably System',
'',
v_tenant_name,
'Fuer den Mieter ' || v_tenant_name || ' (' || v_property_name || ') ist eine Indexmieterhoehung moeglich.' || chr(10) || chr(10) ||
'Aktuelle Miete: ' || TO_CHAR(v_current_base_rent, 'FM999G999D00') || ' EUR/Monat' || chr(10) ||
'Erhoehung moeglich seit: ' || TO_CHAR(v_possible_date, 'DD.MM.YYYY') || chr(10) ||
'Basismonat: ' || v_basis_month || chr(10) || chr(10) ||
'Bitte pruefen Sie den aktuellen Verbraucherpreisindex (VPI) und berechnen Sie die Erhoehung manuell.' || chr(10) ||
'Details finden Sie unter Finanzen > Indexmiete.'
);

UPDATE index_rent_calculations
SET mail_thread_id = v_thread_id
WHERE id = v_calc_id;

v_calculations_created := v_calculations_created + 1;
END LOOP;

UPDATE index_rent_calculation_runs
SET
contracts_checked = v_contracts_checked,
calculations_created = v_calculations_created,
status = CASE
WHEN v_contracts_checked = 0 THEN 'no_contracts'
ELSE 'success'
END
WHERE id = v_run_id;

RETURN jsonb_build_object(
'run_id', v_run_id,
'contracts_checked', v_contracts_checked,
'calculations_created', v_calculations_created,
'status', 'success'
);

EXCEPTION
WHEN OTHERS THEN
UPDATE index_rent_calculation_runs
SET
status = 'error',
error_message = SQLERRM
WHERE id = v_run_id;

RETURN jsonb_build_object(
'run_id', v_run_id,
'status', 'error',
'error_message', SQLERRM
);
END;
$$;
