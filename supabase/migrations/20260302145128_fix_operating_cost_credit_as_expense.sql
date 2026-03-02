/*
  # Korrektur: Nebenkosten-Guthaben als Ausgabe verbuchen

  1. Änderungen
    - Guthaben werden jetzt in expenses statt income_entries erstellt
    - Nachzahlungen bleiben als rent_payments
  
  2. Logik
    - Balance > 0: Mieter muss nachzahlen → rent_payment
    - Balance < 0: Vermieter schuldet Guthaben → expense
*/

-- Funktion zur automatischen Generierung von NK-Zahlungen/Guthaben (korrigiert)
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
        -- GUTHABEN: Erstelle expense als Verbindlichkeit
        INSERT INTO expenses (
          user_id,
          property_id,
          expense_date,
          amount,
          category,
          description,
          status,
          notes
        ) VALUES (
          v_result.user_id,
          v_result.property_id,
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
