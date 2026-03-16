/*
  # Populate Help Center – Finanzen (additional articles)

  Adds new articles to the "Finanzen" category:
  - Teilzahlungen verwalten
  - Nebenkostenabrechnung erstellen
  - CSV-Import für Banktransaktionen
  - Zahlungsausfälle erkennen
  - Mahnungen erstellen
  - Einnahmen erfassen
  - Darlehen und Finanzierungen verwalten
  - AfA-Einstellungen konfigurieren

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Teilzahlungen verwalten',
 'teilzahlungen-verwalten',
 'So erfassen Sie Teilzahlungen und behalten den Überblick über Restbeträge.',
 '## Teilzahlungen verwalten

Wenn ein Mieter nicht den vollen Betrag überweist, können Sie die Teilzahlung in Rentably erfassen. Der offene Restbetrag wird automatisch berechnet.

### Schritt für Schritt

1. Navigieren Sie zu **Mieten**.
2. Suchen Sie die betroffene Mietzahlung.
3. Klicken Sie auf die Zahlung.
4. Wählen Sie **Teilzahlung erfassen**.
5. Geben Sie den tatsächlich erhaltenen Betrag ein.
6. Der Status ändert sich auf **Teilweise bezahlt**.

Der offene Restbetrag wird rot markiert und bleibt als Forderung bestehen.

### Tipps

- Bei mehreren Teilzahlungen können Sie jede einzeln erfassen.
- Der Gesamtstatus einer Zahlung ändert sich erst auf **Bezahlt**, wenn der volle Betrag eingegangen ist.
- Teilzahlungen werden im Bankimport erkannt, wenn die Mieterdaten korrekt hinterlegt sind.

### Häufige Fragen

**Was passiert mit dem Restbetrag?**
Der offene Betrag bleibt als Forderung bestehen und kann im Mahnwesen berücksichtigt werden.',
 5),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Nebenkostenabrechnung erstellen',
 'nebenkostenabrechnung-erstellen',
 'Eine vollständige Anleitung zur Erstellung der Betriebskostenabrechnung.',
 '## Nebenkostenabrechnung erstellen

Die Betriebskostenabrechnung ist eine der wichtigsten Aufgaben für Vermieter. Rentably führt Sie Schritt für Schritt durch den Prozess.

### Voraussetzungen

Bevor Sie eine Abrechnung erstellen, benötigen Sie:

- Ein Objekt mit mindestens einer Einheit
- Einen aktiven oder abgelaufenen Mietvertrag im Abrechnungszeitraum
- Die Gesamtkosten für den Abrechnungszeitraum

### Schritt für Schritt

1. Navigieren Sie zu **Abrechnungen → Betriebskosten**.
2. Klicken Sie auf **Neue Abrechnung**.
3. **Schritt 1 – Grunddaten**: Wählen Sie Objekt, Einheit und Abrechnungszeitraum.
4. **Schritt 2 – Kostenpositionen**: Erfassen Sie die einzelnen Betriebskosten:
   - Grundsteuer
   - Wasserversorgung
   - Entwässerung
   - Heizung und Warmwasser
   - Müllabfuhr
   - Gebäudereinigung
   - Versicherungen
   - Hausstrom
   - Sonstige Kosten
5. **Schritt 3 – Verteilerschlüssel**: Wählen Sie für jede Position den Umlageschlüssel:
   - Nach Wohnfläche
   - Nach Personenzahl
   - Nach Verbrauch
   - Nach Einheiten
   - Direktumlage
6. Prüfen Sie die Vorschau mit der berechneten Nachzahlung oder Gutschrift.
7. Exportieren Sie die Abrechnung als PDF.
8. Versenden Sie die Abrechnung per E-Mail oder Brief.

### Tipps

- Die Abrechnung muss innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums beim Mieter eingehen.
- Nutzen Sie Vorlagen für wiederkehrende Kostenarten.
- Prüfen Sie die Angaben zu Flächen und Personenzahl in den Einheiten.
- Heizkosten müssen zu mindestens 50% verbrauchsabhängig abgerechnet werden.

### Häufige Fragen

**Meine Abrechnung zeigt falsche Beträge.**
Überprüfen Sie die Flächen in den Einheiten und die Verteilerschlüssel. Stellen Sie sicher, dass die Vorauszahlungen korrekt im Vertrag hinterlegt sind.',
 6),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'CSV-Import für Banktransaktionen',
 'csv-import',
 'So importieren Sie Kontoauszüge im CSV-Format.',
 '## CSV-Import für Banktransaktionen

Der CSV-Import ermöglicht es, Kontoauszüge von fast jeder Bank in Rentably zu importieren.

### Schritt für Schritt

1. Laden Sie den Kontoauszug als CSV-Datei von Ihrem Online-Banking herunter.
2. Navigieren Sie zu **Finanzen → Bankverbindung**.
3. Klicken Sie auf **CSV-Import**.
4. Laden Sie die Datei hoch.
5. **Spalten zuordnen**: Rentably erkennt automatisch die Spalten. Falls nicht, ordnen Sie manuell zu:
   - Datum
   - Betrag
   - Empfänger / Auftraggeber
   - Verwendungszweck
   - IBAN
6. Klicken Sie auf **Import starten**.
7. Rentably zeigt die importierten Transaktionen und schlägt Zuordnungen vor.
8. Bestätigen Sie die Zuordnungen oder ordnen Sie manuell zu.

### Unterstützte Formate

- Standard-CSV (Semikolon oder Komma getrennt)
- CAMT053 (XML-Format)

### Tipps

- Speichern Sie erfolgreiche Spaltenzuordnungen als Vorlage für zukünftige Importe.
- Hinterlegen Sie die IBAN Ihrer Mieter für automatische Erkennung.
- Bereits importierte Transaktionen werden anhand eines Fingerabdrucks erkannt und nicht doppelt importiert.

### Häufige Fragen

**Meine CSV-Datei hat ein anderes Format.**
Nutzen Sie die manuelle Spaltenzuordnung. Fast jedes CSV-Format kann importiert werden.',
 7),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Zahlungsausfälle erkennen',
 'zahlungsausfaelle-erkennen',
 'So erkennen Sie überfällige Mietzahlungen frühzeitig.',
 '## Zahlungsausfälle erkennen

Rentably markiert überfällige Mietzahlungen automatisch und benachrichtigt Sie über das Dashboard.

### Funktionsbeschreibung

Sobald eine Mietzahlung nach dem Fälligkeitsdatum nicht als bezahlt markiert ist, wird sie als **überfällig** gekennzeichnet. Das System zeigt:

- Überfällige Zahlungen auf dem Dashboard
- Anzahl und Summe der offenen Forderungen
- Zeitraum der Überfälligkeit

### Schritt für Schritt

1. Prüfen Sie regelmäßig das **Dashboard** – überfällige Zahlungen werden dort angezeigt.
2. Navigieren Sie zu **Mieten** für die vollständige Liste.
3. Filtern Sie nach **Überfällig**, um nur offene Zahlungen zu sehen.
4. Entscheiden Sie für jede Zahlung:
   - Zahlung als bezahlt markieren (falls Geld eingegangen)
   - Teilzahlung erfassen
   - Mahnung erstellen

### Tipps

- Nutzen Sie den Bankimport, um Zahlungseingänge automatisch abzugleichen.
- Reagieren Sie schnell auf Zahlungsausfälle – je früher Sie handeln, desto besser.
- Dokumentieren Sie jede Kommunikation zum Zahlungsverzug.

### Häufige Fragen

**Ab wann gilt eine Zahlung als überfällig?**
Eine Zahlung gilt als überfällig, wenn sie am Fälligkeitstag (üblicherweise der 3. Werktag des Monats) nicht eingegangen ist.',
 8),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Mahnungen erstellen und versenden',
 'mahnungen-erstellen',
 'So erstellen Sie Mahnungen für überfällige Mietzahlungen.',
 '## Mahnungen erstellen und versenden

Rentably bietet ein mehrstufiges Mahnwesen mit Vorlagen für jede Eskalationsstufe.

### Mahnstufen

1. **Zahlungserinnerung** – Freundliche Erinnerung an die ausstehende Zahlung
2. **1. Mahnung** – Formelle Mahnung mit Fristsetzung
3. **2. Mahnung** – Letzte Mahnung vor weiteren Schritten

### Schritt für Schritt

1. Navigieren Sie zu **Finanzen → Mahnwesen**.
2. Sie sehen alle überfälligen Zahlungen nach Mieter gruppiert.
3. Wählen Sie einen Mieter und die offenen Forderungen aus.
4. Klicken Sie auf **Mahnung erstellen**.
5. Wählen Sie die Mahnstufe.
6. Prüfen Sie den vorausgefüllten Text und passen Sie ihn bei Bedarf an.
7. Versenden Sie die Mahnung per:
   - E-Mail
   - Brief (über LetterXpress)
   - PDF-Download

### Tipps

- Senden Sie die erste Zahlungserinnerung zeitnah nach Fälligkeit.
- Dokumentieren Sie alle Mahnstufen sorgfältig.
- Bei der 2. Mahnung sollten Sie auf mögliche rechtliche Schritte hinweisen.
- Nutzen Sie den Briefversand für rechtssichere Zustellung.

### Häufige Fragen

**Kann Rentably automatisch Mahnungen versenden?**
Rentably erstellt automatisch Hinweise auf überfällige Zahlungen. Den Versand der Mahnung lösen Sie selbst aus, um die Kontrolle zu behalten.',
 9),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Einnahmen erfassen',
 'einnahmen-erfassen',
 'So erfassen Sie zusätzliche Einnahmen neben der Miete.',
 '## Einnahmen erfassen

Neben den automatisch generierten Mietzahlungen können Sie in Rentably auch weitere Einnahmen erfassen – z.B. Nebenkostennachzahlungen oder Sondereinnahmen.

### Schritt für Schritt

1. Navigieren Sie zu **Finanzen → Einnahmen**.
2. Klicken Sie auf **Neue Einnahme**.
3. Wählen Sie das Objekt und optional die Einheit.
4. Geben Sie Betrag, Datum und Beschreibung ein.
5. Wählen Sie die Kategorie (z.B. Nebenkostennachzahlung, Parkplatzmiete).
6. Speichern Sie die Einnahme.

### Tipps

- Einnahmen fließen in die Finanzanalyse und den Cashflow ein.
- Kategorisieren Sie Einnahmen korrekt für die Steuererklärung.
- Regelmäßige Einnahmen wie Stellplatzmieten können als separate Vertragsbestandteile angelegt werden.

### Häufige Fragen

**Werden Mieteinnahmen automatisch erfasst?**
Ja, monatliche Mietzahlungen werden automatisch aus den Mietverträgen generiert. Zusätzliche Einnahmen müssen manuell erfasst werden.',
 10),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Darlehen und Finanzierungen verwalten',
 'darlehen-verwalten',
 'So verwalten Sie Immobiliendarlehen und behalten die Restschuld im Blick.',
 '## Darlehen und Finanzierungen verwalten

Verwalten Sie Ihre Immobilienkredite in Rentably und behalten Sie Zinsbindung, Tilgung und Restschuld im Überblick.

### Schritt für Schritt

1. Öffnen Sie ein Objekt und wechseln Sie zum Tab **Übersicht** oder **Finanzen**.
2. Klicken Sie auf **Darlehen hinzufügen**.
3. Geben Sie die Darlehensdetails ein:
   - Kreditgeber (Bank)
   - Darlehensbetrag
   - Zinssatz
   - Tilgungsrate
   - Zinsbindungsdauer
   - Monatliche Rate
4. Speichern Sie das Darlehen.

Rentably berechnet die verbleibende Restschuld und warnt Sie vor Ablauf der Zinsbindung.

### Funktionsbeschreibung

Das Darlehens-Modul zeigt:

- Aktuelle Restschuld
- Monatliche Belastung
- Zins- und Tilgungsanteil
- Datum des Zinsbindungsendes
- Erinnerung vor Ablauf

### Tipps

- Hinterlegen Sie alle Darlehen für ein vollständiges Finanzbild.
- Rentably erinnert Sie rechtzeitig vor dem Ende der Zinsbindung.
- Die Darlehenskosten (Zinsen) fließen in die Anlage-V-Berechnung ein.

### Häufige Fragen

**Kann ich Sondertilgungen erfassen?**
Aktuell unterstützt Rentably die Standard-Tilgung. Passen Sie den Darlehensbetrag bei Sondertilgungen manuell an.',
 11),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'AfA-Einstellungen konfigurieren',
 'afa-einstellungen',
 'So richten Sie die Abschreibung für Abnutzung (AfA) für Ihre Immobilien ein.',
 '## AfA-Einstellungen konfigurieren

Die Abschreibung für Abnutzung (AfA) ist ein wichtiger Faktor bei der steuerlichen Bewertung Ihrer Immobilien. Rentably berechnet die AfA automatisch.

### Schritt für Schritt

1. Öffnen Sie ein Objekt.
2. Klicken Sie auf **AfA einrichten** (oder navigieren Sie über das Menü).
3. Geben Sie folgende Daten ein:
   - Anschaffungskosten des Gebäudes (ohne Grundstück)
   - Baujahr der Immobilie
   - Anschaffungsdatum
4. Rentably wählt automatisch den korrekten AfA-Satz:
   - 2% für Gebäude ab Baujahr 1925
   - 2,5% für Gebäude vor 1925
   - 3% für Gebäude ab 2023 (neue Regelung)
5. Speichern Sie die Einstellungen.

### Funktionsbeschreibung

Die AfA wird jährlich berechnet und erscheint in der Anlage-V-Auswertung als Werbungskosten. Sie mindert Ihr zu versteuerndes Einkommen aus Vermietung.

### Tipps

- Nur der Gebäudeanteil ist abschreibungsfähig, nicht der Grundstücksanteil.
- Bewahren Sie den Kaufvertrag auf, da dort die Aufteilung festgehalten wird.
- Modernisierungskosten können unter Umständen zusätzlich abgeschrieben werden.

### Häufige Fragen

**Wie hoch ist der Grundstücksanteil?**
Der Grundstücksanteil variiert je nach Lage. Im Kaufvertrag ist meist eine Aufteilung angegeben. Alternativ nutzen Sie die Arbeitshilfe des Bundesfinanzministeriums.',
 12)
ON CONFLICT (slug) DO NOTHING;
