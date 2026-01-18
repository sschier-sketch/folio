/*
  # Automatisches Indexmieten-Berechnungssystem V3

  ## Übersicht
  Erstellt ein System zur automatischen Berechnung von Indexmieten mit Tracking der letzten Ausführung.
  Die automatische Ausführung erfolgt über eine Edge Function die täglich aufgerufen werden kann.

  ## Änderungen
  1. Erstelle Tabelle für Berechnungs-Tracking
  2. Erstelle Funktion für automatische Berechnung
  3. Speichere Ergebnisse für Frontend-Anzeige

  ## Neue Tabellen
  - `index_rent_calculation_runs`
    - `id` (uuid, primary key)
    - `run_date` (timestamptz) - Zeitpunkt der Berechnung
    - `contracts_checked` (integer) - Anzahl geprüfter Verträge
    - `calculations_created` (integer) - Anzahl erstellter Berechnungen
    - `status` (text) - success, error, no_contracts
    - `error_message` (text) - Fehlermeldung falls vorhanden
    - `created_at` (timestamptz)

  ## Security
  - RLS aktiviert für index_rent_calculation_runs
  - Alle authentifizierten Benutzer können System-Läufe sehen
*/

-- =====================================================
-- 1. ERSTELLE TABELLE FÜR BERECHNUNGS-TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS index_rent_calculation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date timestamptz NOT NULL DEFAULT now(),
  contracts_checked integer DEFAULT 0,
  calculations_created integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'error', 'no_contracts', 'pending')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE index_rent_calculation_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view calculation runs" ON index_rent_calculation_runs;
DROP POLICY IF EXISTS "System can insert calculation runs" ON index_rent_calculation_runs;

-- Create public read policy (all users can see system runs)
CREATE POLICY "Anyone can view calculation runs"
  ON index_rent_calculation_runs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create system insert policy
CREATE POLICY "System can insert calculation runs"
  ON index_rent_calculation_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calculation_runs_run_date 
  ON index_rent_calculation_runs(run_date DESC);

-- =====================================================
-- 2. ERSTELLE FUNKTION FÜR AUTOMATISCHE BERECHNUNG
-- =====================================================

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
      rc.base_rent,
      rc.contract_start,
      rc.rent_type,
      pu.area_sqm
    FROM rental_contracts rc
    LEFT JOIN property_units pu ON pu.id = rc.unit_id
    WHERE rc.rent_type = 'index_rent'
      AND rc.contract_start IS NOT NULL
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
      v_basis_index := 100.0; -- Beispielwert
      v_current_index := 105.0; -- Beispielwert (5% Steigerung)
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

-- =====================================================
-- 3. KOMMENTAR UND DOKUMENTATION
-- =====================================================

COMMENT ON TABLE index_rent_calculation_runs IS 
'Tracking-Tabelle für automatische Indexmieten-Berechnungen. Speichert jeden Berechnungslauf mit Statistiken.';

COMMENT ON FUNCTION run_automatic_index_rent_calculations() IS 
'Führt automatische Indexmieten-Berechnungen für alle Verträge mit Indexmiete durch. Kann täglich über eine Edge Function aufgerufen werden.';
