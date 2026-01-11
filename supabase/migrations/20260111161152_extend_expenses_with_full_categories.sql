/*
  # Expense Categories und Felder erweitern

  1. Erweitere expense_categories
    - `skr04_account` - SKR04 Kontonummer

  2. Erweitere expenses
    - `vat_rate` - Mehrwertsteuersatz (0, 5, 7, 19)
    - `is_labor_cost` - Lohnkosten
    - `exclude_from_operating_costs` haben wir schon

  3. Füge alle Kategorien ein
    - Anschaffungskosten
    - Betriebs-/Nebenkosten
    - Finanzierung
    - Renovierung/Reparatur
    - Sonstige Ausgaben
    - Sonstige Einnahmen
*/

-- 1. Expense Categories erweitern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_categories' AND column_name = 'skr04_account'
  ) THEN
    ALTER TABLE expense_categories ADD COLUMN skr04_account text;
  END IF;
END $$;

-- 2. Expenses Tabelle erweitern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE expenses ADD COLUMN vat_rate decimal(4,2) DEFAULT 19.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_labor_cost'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_labor_cost boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- 3. Lösche alte Kategorien (nur wenn vorhanden)
DELETE FROM expense_categories WHERE user_id IS NULL;

-- 4. Füge alle neuen Kategorien ein
-- Anschaffungskosten
INSERT INTO expense_categories (name, tax_category, skr04_account) VALUES
('Abbruch', 'Anschaffungskosten', '140'),
('Anwalt', 'Anschaffungskosten', '140'),
('Architekt', 'Anschaffungskosten', '140'),
('Ausstattung', 'Anschaffungskosten', '148'),
('Baukosten', 'Anschaffungskosten', '140'),
('Erschließung', 'Anschaffungskosten', '140'),
('Gerichtsk.', 'Anschaffungskosten', '140'),
('Grundbuch', 'Anschaffungskosten', '140'),
('Grundst.', 'Anschaffungskosten', '140'),
('Gutachter', 'Anschaffungskosten', '140'),
('Kauf Garage', 'Anschaffungskosten', '110'),
('Kauf Objekt', 'Anschaffungskosten', '140'),
('Kauf Sonst.', 'Anschaffungskosten', '140'),
('Kauf Stellplatz', 'Anschaffungskosten', '110'),
('Provision', 'Anschaffungskosten', '140'),
('Notar', 'Anschaffungskosten', '140'),
('Sonst. Anschaffungen', 'Anschaffungskosten', '115'),
('Vermesser', 'Anschaffungskosten', '140'),

-- Betriebs-/Nebenkosten
('Abwasser', 'Betriebs-/Nebenkosten', '4270'),
('Allgemeinstrom', 'Betriebs-/Nebenkosten', '4240'),
('Antenne', 'Betriebs-/Nebenkosten', '4801'),
('Aufzug', 'Betriebs-/Nebenkosten', '4800'),
('Einm. Ungezieferbek.', 'Betriebs-/Nebenkosten', '4801'),
('Wäschepflege', 'Betriebs-/Nebenkosten', '4260'),
('Entwässerung', 'Betriebs-/Nebenkosten', '4270'),
('Fassadenreinigung', 'Betriebs-/Nebenkosten', '4270'),
('Frischwasser', 'Betriebs-/Nebenkosten', '4240'),
('Fußwegreinigung', 'Betriebs-/Nebenkosten', '4809'),
('Gartenpflege', 'Betriebs-/Nebenkosten', '4801'),
('Gebäudereinigung', 'Betriebs-/Nebenkosten', '4260'),
('Grundsteuer', 'Betriebs-/Nebenkosten', '2375'),
('Gutschrift', 'Betriebs-/Nebenkosten', '4228'),
('Hausverwalter', 'Betriebs-/Nebenkosten', '4900'),
('Hausmeister', 'Betriebs-/Nebenkosten', '4909'),
('Heizwasserkosten', 'Betriebs-/Nebenkosten', '4240'),
('Heizkosten', 'Betriebs-/Nebenkosten', '4240'),
('Kosten Brennstoff', 'Betriebs-/Nebenkosten', '4240'),
('Kosten Leerstand', 'Betriebs-/Nebenkosten', '4228'),
('Legionellenunt.', 'Betriebs-/Nebenkosten', '4280'),
('Müllbeseitigung', 'Betriebs-/Nebenkosten', '4270'),
('Nachzahlung', 'Betriebs-/Nebenkosten', '4228'),
('Gebühren', 'Betriebs-/Nebenkosten', '4800'),
('Rechtschutzvers.', 'Betriebs-/Nebenkosten', '4360'),
('Reg. Dachrinnenr.', 'Betriebs-/Nebenkosten', '4801'),
('Reg. Ungezieferbek.', 'Betriebs-/Nebenkosten', '4801'),
('Reinigung Öltank', 'Betriebs-/Nebenkosten', '4800'),
('Versicherung', 'Betriebs-/Nebenkosten', '4366'),
('Schornsteinr.', 'Betriebs-/Nebenkosten', '4260'),
('Sonst. Betr.-kosten', 'Betriebs-/Nebenkosten', '4228'),
('Straßenreinigung', 'Betriebs-/Nebenkosten', '4270'),
('Therme', 'Betriebs-/Nebenkosten', '4800'),
('Verwaltungsk. Verm.', 'Betriebs-/Nebenkosten', '4900'),
('Verwaltungsk. Sozial', 'Betriebs-/Nebenkosten', '4900'),
('Warmwasserkosten', 'Betriebs-/Nebenkosten', '4240'),
('Wartung Feuer', 'Betriebs-/Nebenkosten', '4801'),
('Wartung Heizung', 'Betriebs-/Nebenkosten', '4800'),
('Winterdienst', 'Betriebs-/Nebenkosten', '4801'),

-- Finanzierung, Kredite & Versicherungen
('Geb.-versicherung', 'Finanzierung', '4366'),
('Geldbeschaffung', 'Finanzierung', '6855'),
('Konto', 'Finanzierung', '4970'),
('Kreditauszahlung', 'Finanzierung', '631'),
('Kreditrate', 'Finanzierung', '631'),
('Kredittilgung', 'Finanzierung', '631'),
('Kreditzinsen', 'Finanzierung', '2120'),
('Sondertilgung', 'Finanzierung', '631'),
('Sonst. Versicherung', 'Finanzierung', '4360'),
('Entschädigung', 'Finanzierung', '2126'),

-- Renovierungs-/Reparaturkosten & Investitionen
('Außenanlage', 'Renovierung/Reparatur', '4801'),
('Bad', 'Renovierung/Reparatur', '4260'),
('Balkon', 'Renovierung/Reparatur', '4801'),
('Dach, Fassade', 'Renovierung/Reparatur', '4801'),
('Elektro', 'Renovierung/Reparatur', '4260'),
('Fenster, Türen', 'Renovierung/Reparatur', '4801'),
('Stellplätze', 'Renovierung/Reparatur', '4801'),
('Heizung', 'Renovierung/Reparatur', '4800'),
('Innenbereich', 'Renovierung/Reparatur', '4260'),
('Sanitär', 'Renovierung/Reparatur', '4260'),
('Schadensbeseit.', 'Renovierung/Reparatur', '4801'),
('Sonstiges', 'Renovierung/Reparatur', '4801'),
('Müllentsorgung', 'Renovierung/Reparatur', '4969'),
('Streichen', 'Renovierung/Reparatur', '4801'),
('Dämmung', 'Renovierung/Reparatur', '4801'),

-- Sonstige Ausgaben
('ESt.', 'Sonstige Ausgaben', '1810'),
('Entsorgung', 'Sonstige Ausgaben', '4969'),
('Erbpacht', 'Sonstige Ausgaben', '4220'),
('Fahrtkosten', 'Sonstige Ausgaben', '4673'),
('Gebühren Sonst.', 'Sonstige Ausgaben', '4970'),
('Gericht', 'Sonstige Ausgaben', '4950'),
('Hausgeld', 'Sonstige Ausgaben', '4228'),
('Inserat', 'Sonstige Ausgaben', '4600'),
('Rücklage', 'Sonstige Ausgaben', '971'),
('Privatentnahme', 'Sonstige Ausgaben', '1800'),
('Rechtsberatung', 'Sonstige Ausgaben', '4950'),
('Reinigung', 'Sonstige Ausgaben', '4260'),
('Rückz. Kaution', 'Sonstige Ausgaben', '1525'),
('Sonst. Ausgaben', 'Sonstige Ausgaben', '4900'),
('Steuerberater', 'Sonstige Ausgaben', '4955'),
('USt.-Vorauszahlung', 'Sonstige Ausgaben', '1780'),
('Vermietung', 'Sonstige Ausgaben', '2751'),
('Wachdienst', 'Sonstige Ausgaben', '4909'),

-- Sonstige Einnahmen
('Einz. Kaution', 'Sonstige Einnahmen', '1525'),
('Guthabenzins', 'Sonstige Einnahmen', '2700'),
('Hausgeld Einnahme', 'Sonstige Einnahmen', '4228'),
('Kapitalertragsst.', 'Sonstige Einnahmen', '2705'),
('Privateinlage', 'Sonstige Einnahmen', '1890'),
('Sonst. Einnahmen', 'Sonstige Einnahmen', '2705'),
('Vermietung Einnahme', 'Sonstige Einnahmen', '2751')
ON CONFLICT DO NOTHING;