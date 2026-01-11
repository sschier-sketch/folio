/*
  # Fix Expense Categories - Namen mit SKR04 Nummern

  1. Korrektur
    - Alle Kategorien mit korrekten Namen (inkl. SKR04 in Klammern)
    - Lösche alte Kategorien und erstelle neue

  2. Hinweis
    - Die Nummern in Klammern sind die SKR04 Kontonummern
*/

-- Lösche alle bestehenden System-Kategorien (user_id IS NULL)
DELETE FROM expense_categories WHERE user_id IS NULL;

-- Anschaffungskosten
INSERT INTO expense_categories (name, tax_category, skr04_account) VALUES
('Abbruch (140)', 'Anschaffungskosten', '140'),
('Anwalt (140)', 'Anschaffungskosten', '140'),
('Architekt (140)', 'Anschaffungskosten', '140'),
('Ausstattung (148)', 'Anschaffungskosten', '148'),
('Baukosten (140)', 'Anschaffungskosten', '140'),
('Erschließung (140)', 'Anschaffungskosten', '140'),
('Gerichtsk. (140)', 'Anschaffungskosten', '140'),
('Grundbuch (140)', 'Anschaffungskosten', '140'),
('Grundst. (140)', 'Anschaffungskosten', '140'),
('Gutachter (140)', 'Anschaffungskosten', '140'),
('Kauf Garage (110)', 'Anschaffungskosten', '110'),
('Kauf Objekt (140)', 'Anschaffungskosten', '140'),
('Kauf Sonst. (140)', 'Anschaffungskosten', '140'),
('Kauf Stellplatz (110)', 'Anschaffungskosten', '110'),
('Provision (140)', 'Anschaffungskosten', '140'),
('Notar (140)', 'Anschaffungskosten', '140'),
('Sonst. Anschaffungen (115)', 'Anschaffungskosten', '115'),
('Vermesser (140)', 'Anschaffungskosten', '140'),

-- Betriebs-/Nebenkosten
('Abwasser (4270)', 'Betriebs-/Nebenkosten', '4270'),
('Allgemeinstrom (4240)', 'Betriebs-/Nebenkosten', '4240'),
('Antenne (4801)', 'Betriebs-/Nebenkosten', '4801'),
('Aufzug (4800)', 'Betriebs-/Nebenkosten', '4800'),
('Einm. Ungezieferbek. (4801)', 'Betriebs-/Nebenkosten', '4801'),
('Wäschepflege (4260)', 'Betriebs-/Nebenkosten', '4260'),
('Entwässerung (4270)', 'Betriebs-/Nebenkosten', '4270'),
('Fassadenreinigung (4270)', 'Betriebs-/Nebenkosten', '4270'),
('Frischwasser (4240)', 'Betriebs-/Nebenkosten', '4240'),
('Fußwegreinigung (4809)', 'Betriebs-/Nebenkosten', '4809'),
('Gartenpflege (4801)', 'Betriebs-/Nebenkosten', '4801'),
('Gebäudereinigung (4260)', 'Betriebs-/Nebenkosten', '4260'),
('Grundsteuer (2375)', 'Betriebs-/Nebenkosten', '2375'),
('Gutschrift (4228)', 'Betriebs-/Nebenkosten', '4228'),
('Hausverwalter (4900)', 'Betriebs-/Nebenkosten', '4900'),
('Hausmeister (4909)', 'Betriebs-/Nebenkosten', '4909'),
('Heizwasserkosten (4240)', 'Betriebs-/Nebenkosten', '4240'),
('Heizkosten (4240)', 'Betriebs-/Nebenkosten', '4240'),
('Kosten Brennstoff (4240)', 'Betriebs-/Nebenkosten', '4240'),
('Kosten Leerstand (4228)', 'Betriebs-/Nebenkosten', '4228'),
('Legionellenunt. (4280)', 'Betriebs-/Nebenkosten', '4280'),
('Müllbeseitigung (4270)', 'Betriebs-/Nebenkosten', '4270'),
('Nachzahlung (4228)', 'Betriebs-/Nebenkosten', '4228'),
('Gebühren (4800)', 'Betriebs-/Nebenkosten', '4800'),
('Rechtschutzvers. (4360)', 'Betriebs-/Nebenkosten', '4360'),
('Reg. Dachrinnenr. (4801)', 'Betriebs-/Nebenkosten', '4801'),
('Reg. Ungezieferbek. (4801)', 'Betriebs-/Nebenkosten', '4801'),
('Reinigung Öltank (4800)', 'Betriebs-/Nebenkosten', '4800'),
('Versicherung (4366)', 'Betriebs-/Nebenkosten', '4366'),
('Schornsteinr. (4260)', 'Betriebs-/Nebenkosten', '4260'),
('Sonst. Betr.-kosten (4228)', 'Betriebs-/Nebenkosten', '4228'),
('Straßenreinigung (4270)', 'Betriebs-/Nebenkosten', '4270'),
('Therme (4800)', 'Betriebs-/Nebenkosten', '4800'),
('Verwaltungsk. Verm. (4900)', 'Betriebs-/Nebenkosten', '4900'),
('Verwaltungsk. Sozial (4900)', 'Betriebs-/Nebenkosten', '4900'),
('Warmwasserkosten (4240)', 'Betriebs-/Nebenkosten', '4240'),
('Wartung Feuer (4801)', 'Betriebs-/Nebenkosten', '4801'),
('Wartung Heizung (4800)', 'Betriebs-/Nebenkosten', '4800'),
('Winterdienst (4801)', 'Betriebs-/Nebenkosten', '4801'),

-- Finanzierung, Kredite & Versicherungen
('Geb.-versicherung (4366)', 'Finanzierung', '4366'),
('Geldbeschaffung (6855)', 'Finanzierung', '6855'),
('Konto (4970)', 'Finanzierung', '4970'),
('Kreditauszahlung (631)', 'Finanzierung', '631'),
('Kreditrate (631)', 'Finanzierung', '631'),
('Kredittilgung (631)', 'Finanzierung', '631'),
('Kreditzinsen (2120)', 'Finanzierung', '2120'),
('Sondertilgung (631)', 'Finanzierung', '631'),
('Sonst. Versicherung (4360)', 'Finanzierung', '4360'),
('Entschädigung (2126)', 'Finanzierung', '2126'),

-- Renovierungs-/Reparaturkosten & Investitionen
('Außenanlage (4801)', 'Renovierung/Reparatur', '4801'),
('Bad (4260)', 'Renovierung/Reparatur', '4260'),
('Balkon (4801)', 'Renovierung/Reparatur', '4801'),
('Dach, Fassade (4801)', 'Renovierung/Reparatur', '4801'),
('Elektro (4260)', 'Renovierung/Reparatur', '4260'),
('Fenster, Türen (4801)', 'Renovierung/Reparatur', '4801'),
('Stellplätze (4801)', 'Renovierung/Reparatur', '4801'),
('Heizung (4800)', 'Renovierung/Reparatur', '4800'),
('Innenbereich (4260)', 'Renovierung/Reparatur', '4260'),
('Sanitär (4260)', 'Renovierung/Reparatur', '4260'),
('Schadensbeseit. (4801)', 'Renovierung/Reparatur', '4801'),
('Sonstiges (4801)', 'Renovierung/Reparatur', '4801'),
('Müllentsorgung (4969)', 'Renovierung/Reparatur', '4969'),
('Streichen (4801)', 'Renovierung/Reparatur', '4801'),
('Dämmung (4801)', 'Renovierung/Reparatur', '4801'),

-- Sonstige Ausgaben
('ESt. (1810)', 'Sonstige Ausgaben', '1810'),
('Entsorgung (4969)', 'Sonstige Ausgaben', '4969'),
('Erbpacht (4220)', 'Sonstige Ausgaben', '4220'),
('Fahrtkosten (4673)', 'Sonstige Ausgaben', '4673'),
('Gebühren (4970)', 'Sonstige Ausgaben', '4970'),
('Gericht (4950)', 'Sonstige Ausgaben', '4950'),
('Hausgeld (4228)', 'Sonstige Ausgaben', '4228'),
('Inserat (4600)', 'Sonstige Ausgaben', '4600'),
('Rücklage (971)', 'Sonstige Ausgaben', '971'),
('Privatentnahme (1800)', 'Sonstige Ausgaben', '1800'),
('Rechtsberatung (4950)', 'Sonstige Ausgaben', '4950'),
('Reinigung (4260)', 'Sonstige Ausgaben', '4260'),
('Rückz. Kaution (1525)', 'Sonstige Ausgaben', '1525'),
('Sonst. Ausgaben (4900)', 'Sonstige Ausgaben', '4900'),
('Steuerberater (4955)', 'Sonstige Ausgaben', '4955'),
('USt.-Vorauszahlung (1780)', 'Sonstige Ausgaben', '1780'),
('Vermietung (2751)', 'Sonstige Ausgaben', '2751'),
('Wachdienst (4909)', 'Sonstige Ausgaben', '4909'),

-- Sonstige Einnahmen
('Einz. Kaution (1525)', 'Sonstige Einnahmen', '1525'),
('Guthabenzins (2700)', 'Sonstige Einnahmen', '2700'),
('Hausgeld (4228)', 'Sonstige Einnahmen', '4228'),
('Kapitalertragsst. (2705)', 'Sonstige Einnahmen', '2705'),
('Privateinlage (1890)', 'Sonstige Einnahmen', '1890'),
('Sonst. Einnahmen (2705)', 'Sonstige Einnahmen', '2705'),
('Vermietung (2751)', 'Sonstige Einnahmen', '2751')
ON CONFLICT DO NOTHING;