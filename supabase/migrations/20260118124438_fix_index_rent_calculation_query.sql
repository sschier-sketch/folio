/*
  # Fix Indexmieten-Berechnung Query

  ## Problem
  Die Funktion `run_automatic_index_rent_calculations` sucht nach `rent_type = 'index_rent'`,
  aber das richtige Feld ist `rent_increase_type = 'index'`.

  ## Lösung
  - Ändere die WHERE-Bedingung von `rent_type = 'index_rent'` zu `rent_increase_type = 'index'`
  - Zusätzliche Validierung: index_first_increase_date darf nicht NULL sein

  ## Änderungen
  1. Korrigiere die Query in der Funktion
*/

CREATE OR REPLACE FUNCTION run_automatic_index_rent_calculations()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_run_id uuid;
  v_contracts_checked integer := 0;
  v_calculations_created integer := 0;
  v_contract record;
  v_last_calculation_date date;
  v_contract_start_date date;
  v_months_since_last integer;
  v_current_base_rent numeric;
  v_new_rent numeric;
  v_basis_index numeric;
  v_current_index numeric;
  v_basis_month text;
  v_current_month text;
  v_area_sqm numeric;
BEGIN
  -- Create tracking record
  INSERT INTO index_rent_calculation_runs (run_date, status)
  VALUES (now(), 'pending')
  RETURNING id INTO v_run_id;

  -- Hole alle Verträge mit Indexmiete die aktiv sind
  FOR v_contract IN 
    SELECT 
      rc.id as contract_id,
      rc.user_id,
      rc.property_id,
      rc.unit_id,
      rc.monthly_rent as base_rent,
      rc.contract_start,
      rc.rent_increase_type,
      rc.index_first_increase_date,
      pu.area_sqm
    FROM rental_contracts rc
    LEFT JOIN property_units pu ON pu.id = rc.unit_id
    WHERE rc.rent_increase_type = 'index'
      AND rc.contract_start IS NOT NULL
      AND rc.index_first_increase_date IS NOT NULL
      AND (rc.contract_end IS NULL OR rc.contract_end >= CURRENT_DATE)
  LOOP
    v_contracts_checked := v_contracts_checked + 1;
    v_contract_start_date := v_contract.contract_start::date;
    v_current_base_rent := v_contract.base_rent;
    v_area_sqm := COALESCE(v_contract.area_sqm, 0);

    -- Hole letzte Berechnung für diesen Vertrag
    SELECT COALESCE(MAX(calculation_date::date), v_contract_start_date)
    INTO v_last_calculation_date
    FROM index_rent_calculations
    WHERE contract_id = v_contract.contract_id;

    -- Berechne Monate seit letzter Berechnung
    v_months_since_last := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_last_calculation_date)) * 12 +
                          EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_last_calculation_date));

    -- Nur berechnen wenn mindestens 12 Monate seit letzter Berechnung vergangen sind
    IF v_months_since_last >= 12 THEN
      -- Für Demo-Zwecke verwenden wir Beispielwerte
      -- In Produktion würde hier die API der Deutschen Bundesbank abgerufen
      v_basis_index := 100.0;
      v_current_index := 105.0;
      v_basis_month := TO_CHAR(v_last_calculation_date, 'YYYY-MM');
      v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
      
      -- Berechne neue Miete: alte Miete × (neuer Index ÷ Basis-Index)
      v_new_rent := v_current_base_rent * (v_current_index / v_basis_index);
      
      -- Nur speichern wenn Änderung mindestens 1% beträgt
      IF (v_new_rent - v_current_base_rent) / v_current_base_rent >= 0.01 THEN
        -- Erstelle Berechnungseintrag
        INSERT INTO index_rent_calculations (
          contract_id,
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
          notes
        ) VALUES (
          v_contract.contract_id,
          CURRENT_DATE,
          v_basis_month,
          v_basis_index,
          v_current_month,
          v_current_index,
          CASE WHEN v_area_sqm > 0 THEN v_current_base_rent / v_area_sqm ELSE v_current_base_rent END,
          CASE WHEN v_area_sqm > 0 THEN v_new_rent / v_area_sqm ELSE v_new_rent END,
          CASE WHEN v_area_sqm > 0 THEN v_area_sqm ELSE NULL END,
          v_new_rent,
          'calculated',
          'Automatisch berechnet am ' || TO_CHAR(CURRENT_DATE, 'DD.MM.YYYY')
        );
        
        v_calculations_created := v_calculations_created + 1;
      END IF;
    END IF;
  END LOOP;

  -- Update tracking record
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
    -- Update tracking record with error
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

COMMENT ON FUNCTION run_automatic_index_rent_calculations() IS 
'Führt automatische Indexmieten-Berechnungen für alle Verträge mit rent_increase_type = index durch.';