/*
  # Korrektur: Mietzahlungen für Mietverträge mit mehreren Mietern

  ## Änderungen
  
  ### 1. Datenstruktur
  - tenant_id in rent_payments wird nullable (da eine Zahlung für den gesamten Vertrag gilt)
  - Zahlungen werden pro Mietvertrag generiert, nicht pro Mieter
  
  ### 2. Funktion aktualisieren
  - generate_rent_payments_for_contract() verwendet jetzt NULL für tenant_id
  - Die Zahlung gilt für den gesamten Vertrag mit allen Mietern
  
  ### 3. Bestehende Daten bereinigen
  - Duplikate für Mieter im selben Vertrag werden entfernt
  - Nur eine Zahlung pro Vertrag und Monat bleibt erhalten
  
  ### 4. Security
  - Bestehende RLS-Policies bleiben unverändert
*/

-- Schritt 1: tenant_id nullable machen
ALTER TABLE rent_payments ALTER COLUMN tenant_id DROP NOT NULL;

-- Schritt 2: Duplikate entfernen - behalte nur eine Zahlung pro Vertrag und Monat
DELETE FROM rent_payments rp1
WHERE EXISTS (
  SELECT 1 FROM rent_payments rp2
  WHERE rp1.contract_id = rp2.contract_id
  AND rp1.due_date = rp2.due_date
  AND rp1.id > rp2.id
);

-- Schritt 3: tenant_id auf NULL setzen für alle verbleibenden Zahlungen
UPDATE rent_payments SET tenant_id = NULL WHERE tenant_id IS NOT NULL;

-- Schritt 4: Funktion aktualisieren
CREATE OR REPLACE FUNCTION public.generate_rent_payments_for_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month date;
  end_month date;
  existing_count int;
BEGIN
  current_month := date_trunc('month', NEW.contract_start)::date;
  
  end_month := GREATEST(
    date_trunc('month', CURRENT_DATE)::date + interval '3 months',
    date_trunc('month', NEW.contract_start)::date + interval '12 months'
  )::date;
  
  IF NEW.contract_end IS NOT NULL THEN
    end_month := LEAST(end_month, date_trunc('month', NEW.contract_end)::date);
  END IF;
  
  WHILE current_month <= end_month LOOP
    SELECT COUNT(*) INTO existing_count
    FROM public.rent_payments
    WHERE contract_id = NEW.id
    AND due_date = current_month;
    
    IF existing_count = 0 THEN
      INSERT INTO public.rent_payments (
        contract_id,
        property_id,
        tenant_id,
        user_id,
        due_date,
        amount,
        paid,
        notes
      ) VALUES (
        NEW.id,
        NEW.property_id,
        NULL,
        NEW.user_id,
        current_month,
        NEW.total_rent,
        false,
        'Auto-generated'
      );
    END IF;
    
    current_month := (current_month + interval '1 month')::date;
  END LOOP;
  
  RETURN NEW;
END;
$$;
