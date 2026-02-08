/*
  # Indexmiete: Moegliche Erhoehungen + Posteingang-Benachrichtigungen

  1. Neue Spalten in `index_rent_calculations`
    - `dismissed_at` (timestamptz) - Zeitpunkt wenn Nutzer die Erhoehung ausblendet
    - `possible_since` (date) - Datum ab dem die Erhoehung rechtlich moeglich ist
    - `mail_thread_id` (uuid) - Verknuepfung zur Posteingang-Nachricht

  2. Aenderungen
    - Status-Constraint erweitert um 'dismissed'
    - RPC-Funktion aktualisiert:
      - Setzt `possible_since` korrekt
      - Erstellt automatisch Posteingang-Nachricht bei neuen Berechnungen
      - Vermeidet Duplikate (prueft ob bereits Berechnung fuer Vertrag existiert)

  3. Backfill
    - Bestehende Berechnung fuer Florian Esterl: possible_since = 2024-01-16

  4. Sicherheit
    - Keine RLS-Aenderungen noetig (bestehende Policies decken neue Spalten ab)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'index_rent_calculations' AND column_name = 'dismissed_at'
  ) THEN
    ALTER TABLE index_rent_calculations ADD COLUMN dismissed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'index_rent_calculations' AND column_name = 'possible_since'
  ) THEN
    ALTER TABLE index_rent_calculations ADD COLUMN possible_since date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'index_rent_calculations' AND column_name = 'mail_thread_id'
  ) THEN
    ALTER TABLE index_rent_calculations ADD COLUMN mail_thread_id uuid REFERENCES mail_threads(id);
  END IF;
END $$;

ALTER TABLE index_rent_calculations
  DROP CONSTRAINT IF EXISTS index_rent_calculations_status_check;

ALTER TABLE index_rent_calculations
  ADD CONSTRAINT index_rent_calculations_status_check
  CHECK (status IN ('pending', 'calculated', 'notified', 'applied', 'dismissed'));

UPDATE index_rent_calculations
SET possible_since = '2024-01-16'
WHERE contract_id = '397e6aa2-bbed-4211-982d-b92a12640390'
  AND possible_since IS NULL;

CREATE OR REPLACE FUNCTION run_automatic_index_rent_calculations()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_run_id uuid;
  v_contracts_checked integer := 0;
  v_calculations_created integer := 0;
  v_contract record;
  v_last_calculation_date date;
  v_contract_start_date date;
  v_first_increase_date date;
  v_months_since_last integer;
  v_current_base_rent numeric;
  v_new_rent numeric;
  v_basis_index numeric;
  v_current_index numeric;
  v_basis_month text;
  v_current_month text;
  v_area_sqm numeric;
  v_calling_user uuid;
  v_calc_id uuid;
  v_thread_id uuid;
  v_tenant_name text;
  v_property_name text;
  v_old_total numeric;
  v_diff numeric;
  v_possible_date date;
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

    IF EXISTS (
      SELECT 1 FROM index_rent_calculations
      WHERE contract_id = v_contract.contract_id
        AND status IN ('calculated', 'pending', 'notified')
    ) THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(calculation_date::date), v_contract_start_date)
    INTO v_last_calculation_date
    FROM index_rent_calculations
    WHERE contract_id = v_contract.contract_id;

    v_months_since_last := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_last_calculation_date)) * 12 +
                          EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_last_calculation_date));

    IF v_months_since_last >= 12 THEN
      v_basis_index := 100.0;
      v_current_index := 105.0;
      v_basis_month := TO_CHAR(v_last_calculation_date, 'YYYY-MM');
      v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

      v_new_rent := v_current_base_rent * (v_current_index / v_basis_index);

      IF (v_new_rent - v_current_base_rent) / v_current_base_rent >= 0.0001 THEN
        v_possible_date := GREATEST(v_first_increase_date, (v_last_calculation_date + interval '12 months')::date);

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
          v_basis_index,
          v_current_month,
          v_current_index,
          CASE WHEN v_area_sqm > 0 THEN v_current_base_rent / v_area_sqm ELSE v_current_base_rent END,
          CASE WHEN v_area_sqm > 0 THEN v_new_rent / v_area_sqm ELSE v_new_rent END,
          CASE WHEN v_area_sqm > 0 THEN v_area_sqm ELSE NULL END,
          v_new_rent,
          'calculated',
          v_possible_date,
          'Moegliche Indexmieterhoehung fuer ' || v_tenant_name || ' ab ' || TO_CHAR(v_possible_date, 'DD.MM.YYYY')
        )
        RETURNING id INTO v_calc_id;

        v_old_total := v_current_base_rent;
        v_diff := v_new_rent - v_old_total;

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
          'Indexmieterhoehung moeglich: ' || v_tenant_name,
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
          'Aktuelle Miete: ' || TO_CHAR(v_old_total, 'FM999G999D00') || ' EUR/Monat' || chr(10) ||
          'Neue Miete (berechnet): ' || TO_CHAR(v_new_rent, 'FM999G999D00') || ' EUR/Monat' || chr(10) ||
          'Differenz: +' || TO_CHAR(v_diff, 'FM999G999D00') || ' EUR/Monat' || chr(10) || chr(10) ||
          'Erhoehung moeglich seit: ' || TO_CHAR(v_possible_date, 'DD.MM.YYYY') || chr(10) || chr(10) ||
          'Bitte pruefen Sie die Berechnung unter Finanzen > Indexmiete und nehmen Sie die Erhoehung ggf. vor.'
        );

        UPDATE index_rent_calculations
        SET mail_thread_id = v_thread_id
        WHERE id = v_calc_id;

        v_calculations_created := v_calculations_created + 1;
      END IF;
    END IF;
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
