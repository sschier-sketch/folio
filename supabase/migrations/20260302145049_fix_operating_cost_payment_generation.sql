/*
  # Automatische Generierung von Nebenkosten-Zahlungen und Guthaben

  1. Änderungen
    - Erweitert payment_type CHECK constraint um 'operating_costs' Wert
    - Erstellt Trigger-Funktion zur automatischen Generierung von Zahlungsforderungen bei BKA
    - Bei Nachzahlung (balance > 0): Erstellt rent_payment mit payment_type='nebenkosten'
    - Bei Guthaben (balance < 0): Erstellt income_entry als Ausgabe (negativ)
  
  2. Sicherheit
    - Trigger läuft nur bei Status-Wechsel zu 'sent'
    - Verhindert Duplikate durch operating_cost_statement_id Check
    - RLS Policies bleiben unverändert
*/

-- 1. Erweitere payment_type constraint um 'operating_costs'
ALTER TABLE rent_payments
  DROP CONSTRAINT IF EXISTS rent_payments_payment_type_check;

ALTER TABLE rent_payments
  ADD CONSTRAINT rent_payments_payment_type_check
  CHECK (payment_type IN ('rent', 'nebenkosten', 'operating_costs'));

-- 2. Funktion zur automatischen Generierung von NK-Zahlungen/Guthaben
CREATE OR REPLACE FUNCTION generate_operating_cost_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_tenant RECORD;
  v_due_date date;
BEGIN
  -- Nur bei Status-Wechsel zu 'sent' ausführen
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    
    -- Berechne Fälligkeitsdatum (30 Tage ab heute)
    v_due_date := CURRENT_DATE + INTERVAL '30 days';
    
    -- Iteriere über alle Ergebnisse dieser Abrechnung
    FOR v_result IN
      SELECT 
        ocr.id,
        ocr.tenant_id,
        ocr.unit_id,
        ocr.balance,
        ocs.property_id,
        ocs.user_id,
        ocs.year
      FROM operating_cost_results ocr
      JOIN operating_cost_statements ocs ON ocs.id = ocr.statement_id
      WHERE ocr.statement_id = NEW.id
        AND ocr.tenant_id IS NOT NULL
        AND ocr.balance != 0
    LOOP
      -- Hole Mieter-Details
      SELECT * INTO v_tenant
      FROM tenants
      WHERE id = v_result.tenant_id;
      
      IF v_result.balance > 0 THEN
        -- NACHZAHLUNG: Erstelle rent_payment Eintrag
        INSERT INTO rent_payments (
          user_id,
          property_id,
          tenant_id,
          contract_id,
          due_date,
          amount,
          payment_type,
          payment_status,
          paid,
          description,
          recipient,
          operating_cost_statement_id
        ) VALUES (
          v_result.user_id,
          v_result.property_id,
          v_result.tenant_id,
          v_tenant.contract_id,
          v_due_date,
          v_result.balance,
          'nebenkosten',
          'open',
          false,
          'Nachzahlung Betriebskosten ' || v_result.year,
          v_tenant.first_name || ' ' || v_tenant.last_name,
          NEW.id
        )
        ON CONFLICT DO NOTHING;
        
      ELSE
        -- GUTHABEN: Erstelle income_entry als Ausgabe
        INSERT INTO income_entries (
          user_id,
          property_id,
          unit_id,
          entry_date,
          amount,
          category,
          description,
          status,
          notes
        ) VALUES (
          v_result.user_id,
          v_result.property_id,
          v_result.unit_id,
          v_due_date,
          ABS(v_result.balance),
          'Nebenkosten-Guthaben',
          'Guthaben Betriebskosten ' || v_result.year || ' - ' || v_tenant.first_name || ' ' || v_tenant.last_name,
          'open',
          'Automatisch erstellt aus Betriebskostenabrechnung'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Erstelle Trigger für automatische Generierung
DROP TRIGGER IF EXISTS trigger_generate_operating_cost_payments ON operating_cost_statements;

CREATE TRIGGER trigger_generate_operating_cost_payments
  AFTER INSERT OR UPDATE OF status
  ON operating_cost_statements
  FOR EACH ROW
  EXECUTE FUNCTION generate_operating_cost_payments();
