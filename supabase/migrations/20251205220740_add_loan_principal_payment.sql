/*
  # Tilgungsfeld für Kredite hinzufügen

  1. Änderungen an loans Tabelle
    - `monthly_principal` (numeric) - Monatliche Tilgung in EUR
    
  2. Hinweise
    - Dieses Feld wird für die Finanzanalyse und ROI-Berechnungen benötigt
    - Rate = Zinsen + Tilgung (monthly_payment = monthly_interest + monthly_principal)
*/

-- Erweitere loans Tabelle um Tilgungsfeld
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'monthly_principal'
  ) THEN
    ALTER TABLE loans ADD COLUMN monthly_principal numeric DEFAULT 0;
  END IF;
END $$;
