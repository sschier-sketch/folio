/*
  # Populate Help Center – Berichte & Auswertungen (additional articles)

  Adds new articles to the "Berichte & Auswertungen" category:
  - Einnahmenanalyse nutzen
  - Kostenanalyse und Ausgabenübersicht
  - Objektvergleich und Rendite

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Einnahmenanalyse nutzen',
 'einnahmenanalyse',
 'So analysieren Sie Ihre Mieteinnahmen im Detail.',
 '## Einnahmenanalyse nutzen

Die Einnahmenanalyse zeigt Ihnen detailliert, welche Einnahmen Sie aus Ihren Immobilien erzielen und wie sich diese im Zeitverlauf entwickeln.

### Funktionsbeschreibung

Die Einnahmenanalyse umfasst:

- **Mieteinnahmen pro Objekt** – Vergleich zwischen Ihren Immobilien
- **Entwicklung im Zeitverlauf** – Diagramme mit monatlicher und jährlicher Ansicht
- **Zahlungsquote** – Anteil der pünktlich eingegangenen Zahlungen
- **Prognosen** – Erwartete Einnahmen basierend auf aktiven Verträgen

### Schritt für Schritt

1. Navigieren Sie zu **Finanzen → Analyse**.
2. Wählen Sie den Tab **Einnahmen**.
3. Filtern Sie nach Zeitraum und Objekt.
4. Analysieren Sie die Diagramme und Kennzahlen.
5. Exportieren Sie den Bericht als PDF oder Excel.

### Tipps

- Vergleichen Sie Soll- und Ist-Einnahmen, um Zahlungsausfälle schnell zu erkennen.
- Nutzen Sie die Jahresansicht für Steuerzwecke.
- Die Prognose hilft bei der Planung Ihrer Liquidität.

### Häufige Fragen

**Warum weichen Soll- und Ist-Einnahmen ab?**
Abweichungen entstehen durch ausstehende Zahlungen, Teilzahlungen oder Leerstand.',
 4),

((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Kostenanalyse und Ausgabenübersicht',
 'kostenanalyse',
 'So analysieren Sie Ihre Immobilienausgaben nach Kategorien.',
 '## Kostenanalyse und Ausgabenübersicht

Die Kostenanalyse gibt Ihnen einen detaillierten Überblick über alle Ausgaben rund um Ihre Immobilien.

### Funktionsbeschreibung

Die Analyse zeigt:

- **Ausgaben nach Kategorie** – Reparaturen, Versicherungen, Hausverwaltung etc.
- **Ausgaben pro Objekt** – Vergleich der Kosten zwischen Immobilien
- **Zeitverlauf** – Kostenentwicklung über Monate und Jahre
- **Top-Ausgaben** – Die größten Kostenpositionen im gewählten Zeitraum

### Schritt für Schritt

1. Navigieren Sie zu **Finanzen → Analyse**.
2. Wählen Sie den Tab **Ausgaben**.
3. Filtern Sie nach Zeitraum, Objekt und Kategorie.
4. Analysieren Sie die Aufschlüsselung nach Kostenarten.
5. Identifizieren Sie ungewöhnlich hohe Kostenpositionen.

### Tipps

- Kategorisieren Sie Ausgaben von Anfang an sorgfältig.
- Vergleichen Sie die Kosten pro Quadratmeter zwischen Ihren Objekten.
- Nutzen Sie die Auswertung als Grundlage für die Nebenkostenabrechnung.

### Häufige Fragen

**Werden Darlehenskosten in der Ausgabenanalyse berücksichtigt?**
Zinszahlungen erscheinen als Finanzierungskosten. Tilgungen sind keine Kosten und werden separat ausgewiesen.',
 5),

((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Objektvergleich und Rendite berechnen',
 'objektvergleich-rendite',
 'So vergleichen Sie die Rentabilität Ihrer Immobilien.',
 '## Objektvergleich und Rendite berechnen

Vergleichen Sie die Performance Ihrer Immobilien und berechnen Sie die Rendite pro Objekt.

### Funktionsbeschreibung

Rentably berechnet:

- **Brutto-Mietrendite** – Jährliche Mieteinnahmen / Kaufpreis × 100
- **Netto-Mietrendite** – (Einnahmen - nicht umlagefähige Kosten) / Kaufpreis × 100
- **Cashflow** – Einnahmen - Ausgaben - Darlehenszahlungen
- **Belegungsquote** – Vermietete Einheiten / Gesamteinheiten

### Schritt für Schritt

1. Navigieren Sie zu **Finanzen → Analyse**.
2. In der Übersicht sehen Sie die wichtigsten Kennzahlen aller Objekte.
3. Klicken Sie auf ein Objekt für die Detailansicht.
4. Vergleichen Sie die Rendite verschiedener Objekte nebeneinander.

### Voraussetzungen

Für eine korrekte Renditeberechnung benötigt Rentably:

- Kaufpreis oder Anschaffungskosten im Objekt
- Vollständige Mietverträge mit korrekten Beträgen
- Erfasste Ausgaben für den Auswertungszeitraum

### Tipps

- Aktualisieren Sie die Kaufpreise, damit die Renditeberechnung stimmt.
- Berücksichtigen Sie Sonderausgaben (z.B. Sanierungen) bei der Bewertung.
- Nutzen Sie den Cashflow-Überblick, um die monatliche Belastung pro Objekt zu sehen.

### Häufige Fragen

**Warum wird keine Rendite angezeigt?**
Stellen Sie sicher, dass ein Kaufpreis im Objekt hinterlegt ist und Mietverträge existieren.',
 6)
ON CONFLICT (slug) DO NOTHING;
