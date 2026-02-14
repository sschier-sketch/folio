/*
  # Add pricing page FAQs

  1. Changes
    - Inserts 7 FAQ entries for the pricing page (`page_slug = 'pricing'`)
    - Covers common questions about pricing, billing, trial, and cancellation
  
  2. Notes
    - Uses `ON CONFLICT` to avoid duplicate inserts if run multiple times
    - All entries are active by default
*/

INSERT INTO faqs (page_slug, question, answer, sort_order, is_active)
VALUES
  ('pricing', 'Ist rentably wirklich kostenlos?', 'Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie können unbegrenzt viele Immobilien, Einheiten und Mieter verwalten.', 1, true),
  ('pricing', 'Was passiert nach den 30 Tagen Pro-Testphase?', 'Nach Ablauf der 30 Tage wird Ihr Account automatisch auf den kostenlosen Basic-Tarif umgestellt. Sie verlieren keine Daten. Alle Basic-Funktionen bleiben weiterhin verfügbar. Wenn Sie Pro-Funktionen weiter nutzen möchten, können Sie jederzeit ein Upgrade durchführen.', 2, true),
  ('pricing', 'Brauche ich eine Kreditkarte für die Registrierung?', 'Nein. Für die Registrierung und die 30-tägige Pro-Testphase benötigen Sie keine Zahlungsdaten. Erst wenn Sie sich nach der Testphase für den Pro-Tarif entscheiden, werden Zahlungsinformationen benötigt.', 3, true),
  ('pricing', 'Kann ich jederzeit kündigen?', 'Ja. Der Pro-Tarif ist monatlich oder jährlich kündbar. Es gibt keine Mindestlaufzeit. Nach der Kündigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.', 4, true),
  ('pricing', 'Gibt es Limits bei der Anzahl an Immobilien oder Mietern?', 'Nein. Sowohl im Basic- als auch im Pro-Tarif können Sie unbegrenzt viele Immobilien, Einheiten und Mieter anlegen. Wir berechnen keine Gebühren pro Objekt oder pro Mieter.', 5, true),
  ('pricing', 'Kann ich zwischen monatlicher und jährlicher Abrechnung wechseln?', 'Ja. Sie können jederzeit von monatlicher auf jährliche Abrechnung umstellen und dabei von der Ersparnis profitieren. Ein Wechsel ist direkt in Ihren Kontoeinstellungen möglich.', 6, true),
  ('pricing', 'Kann ich die Kosten steuerlich absetzen?', 'In der Regel ja. Die Kosten für eine Immobilienverwaltungssoftware können als Werbungskosten bei Einkünften aus Vermietung und Verpachtung steuerlich geltend gemacht werden. Bitte wenden Sie sich für eine verbindliche Auskunft an Ihren Steuerberater.', 7, true)
ON CONFLICT DO NOTHING;
