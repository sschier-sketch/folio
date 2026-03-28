/*
  # Add FAQ entries for Buchhaltung marketing page

  1. New FAQs added (page_slug = 'buchhaltung')
    - Bankanbindung (PSD2) functionality
    - CSV and CAMT053 import
    - Intelligent transaction matching and rules
    - Index rent (Indexmiete) calculation
    - Anlage V and AfA (depreciation)
    - Dunning/Mahnwesen system
    - Cashflow analysis
    - Restschuld (remaining debt) calculation
    - Multi-user access for finance data

  2. Existing FAQs
    - sort_order updated to accommodate new entries at logical positions
*/

UPDATE faqs SET sort_order = 1 WHERE page_slug = 'buchhaltung' AND question = 'Wie erfasse ich Einnahmen und Ausgaben?';

INSERT INTO faqs (page_slug, question, answer, sort_order, is_active)
VALUES
  (
    'buchhaltung',
    'Wie funktioniert die Bankanbindung?',
    'Sie verbinden Ihr Bankkonto einmalig über die sichere PSD2-Schnittstelle direkt in rentably. Danach werden Ihre Transaktionen täglich automatisch abgerufen und landen in einer übersichtlichen Inbox. Dort können Sie Buchungen prüfen und mit einem Klick als Mieteinnahme, Ausgabe oder sonstige Zahlung zuordnen. Die Verbindung ist DSGVO-konform und entspricht den aktuellen Bankstandards.',
    2,
    true
  ),
  (
    'buchhaltung',
    'Was sind intelligente Zuordnungsvorschläge?',
    'rentably analysiert bei jeder neuen Transaktion automatisch Betrag, Verwendungszweck und IBAN. Anhand dieser Informationen erkennt das System, ob es sich z. B. um eine Mietzahlung, Betriebskosten oder eine wiederkehrende Ausgabe handelt, und schlägt die passende Zuordnung vor. Sie müssen den Vorschlag nur noch mit einem Klick bestätigen.',
    3,
    true
  ),
  (
    'buchhaltung',
    'Was sind Zuordnungsregeln und wie spare ich damit Zeit?',
    'Zuordnungsregeln sind selbst definierte Automatisierungen für wiederkehrende Buchungen. Sie legen einmalig fest, dass z. B. Überweisungen von einem bestimmten Absender oder mit einem bestimmten Verwendungszweck immer einer bestimmten Kategorie zugeordnet werden. Mit aktivierter Auto-Anwendung werden neue Transaktionen beim nächsten Import automatisch verarbeitet — ganz ohne manuellen Aufwand.',
    4,
    true
  ),
  (
    'buchhaltung',
    'Kann ich Kontoauszüge auch ohne Bankanbindung importieren?',
    'Ja. Neben der automatischen Bankanbindung unterstützt rentably den Import von Kontoauszügen per CSV-Datei und im CAMT053-Format (ISO 20022). Beim CSV-Import können Sie die Spalten frei zuordnen und das Mapping als Vorlage für spätere Importe speichern. Alle importierten Transaktionen landen in derselben Inbox und profitieren von den gleichen Zuordnungsvorschlägen.',
    5,
    true
  );

UPDATE faqs SET sort_order = 6 WHERE page_slug = 'buchhaltung' AND question = 'Kann ich Auswertungen exportieren?';
UPDATE faqs SET sort_order = 7 WHERE page_slug = 'buchhaltung' AND question = 'Werden Darlehen automatisch berechnet?';

INSERT INTO faqs (page_slug, question, answer, sort_order, is_active)
VALUES
  (
    'buchhaltung',
    'Wie funktioniert die Restschuldberechnung?',
    'rentably berechnet die aktuelle Restschuld Ihrer Immobiliendarlehen tagesgenau. Dabei werden Zinsbindungsende, bereits geleistete Sondertilgungen und die reguläre Tilgung berücksichtigt. So sehen Sie jederzeit, wie hoch Ihre verbleibende Schuld ist, und können Anschlussfinanzierungen frühzeitig planen.',
    8,
    true
  ),
  (
    'buchhaltung',
    'Was ist die Anlage V und wie hilft mir rentably dabei?',
    'Die Anlage V ist der Teil der Einkommensteuererklärung, in dem Einkünfte aus Vermietung und Verpachtung erklärt werden. rentably ordnet Ihre Mieteinnahmen und Werbungskosten automatisch den richtigen Positionen der Anlage V zu. Am Jahresende exportieren Sie die fertige Aufstellung für Ihren Steuerberater — sauber kategorisiert und lückenlos dokumentiert.',
    9,
    true
  ),
  (
    'buchhaltung',
    'Wird die Abschreibung (AfA) automatisch berechnet?',
    'Ja. Sie hinterlegen einmalig das Kaufdatum, den Gebäudeanteil und die Anschaffungskosten Ihrer Immobilie. rentably berechnet daraus die jährliche Abschreibung nach den geltenden Regelungen (z. B. 2 % linear für Gebäude ab 1925, 2,5 % für ältere Gebäude). Der AfA-Betrag wird automatisch in die Anlage V und Ihre Finanzübersicht übernommen.',
    10,
    true
  ),
  (
    'buchhaltung',
    'Wie funktioniert die automatische Indexmietberechnung?',
    'Bei Indexmietverträgen überwacht rentably den Verbraucherpreisindex (VPI) und berechnet automatisch, wann und in welcher Höhe eine Mietanpassung möglich ist. Sie werden rechtzeitig benachrichtigt und können das Mieterhöhungsverlangen direkt aus rentably heraus erstellen und versenden. Die gesamte Miethistorie wird dokumentiert.',
    11,
    true
  ),
  (
    'buchhaltung',
    'Gibt es ein Mahnwesen für ausstehende Mietzahlungen?',
    'Ja. rentably erkennt automatisch ausstehende oder verspätete Mietzahlungen. Sie können mehrstufige Mahnungen erstellen — von der freundlichen Zahlungserinnerung bis zur formellen Mahnung. Vorlagen lassen sich individuell anpassen. Die gesamte Mahnhistorie wird je Mieter dokumentiert, sodass Sie im Streitfall alles belegen können.',
    12,
    true
  ),
  (
    'buchhaltung',
    'Wie hilft mir die Cashflow-Analyse?',
    'Die Cashflow-Analyse visualisiert Einnahmen und Ausgaben je Immobilie oder über Ihr gesamtes Portfolio. Sie sehen auf einen Blick, wie sich Ihr Cashflow monatlich entwickelt, können Trends erkennen und fundierte Entscheidungen treffen — z. B. ob sich eine Investition lohnt oder wo Kosten optimiert werden können.',
    13,
    true
  );

UPDATE faqs SET sort_order = 14 WHERE page_slug = 'buchhaltung' AND question = 'Ist die Buchhaltung für die Steuererklärung geeignet?';
