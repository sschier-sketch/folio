/*
  # Populate Help Center – Remaining Feature Articles

  Adds articles for features not yet covered:
  - Tickets und Aufgaben (Allgemein)
  - Vorlagen-Übersicht (Kommunikation)
  - Mieterportal verwalten (Vermieter-Sicht detail)
  - Hausgeld erfassen (Immobilienverwaltung)
  - Wertentwicklung der Immobilie (Berichte)

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Tickets und Aufgaben verwalten',
 'tickets-aufgaben',
 'So nutzen Sie das Ticket-System für Aufgaben und Mieteranfragen.',
 '## Tickets und Aufgaben verwalten

Tickets in Rentably sind Ihre zentrale Aufgabenliste. Sie entstehen automatisch aus Systemereignissen oder manuell durch Sie und Ihre Mieter.

### Woher kommen Tickets?

Tickets werden erstellt durch:

- **Mieteranfragen** – Wenn ein Mieter über das Portal eine Anfrage sendet
- **Indexmiet-Berechnungen** – Wenn eine Anpassung möglich ist
- **Darlehensfälligkeiten** – Vor Ablauf der Zinsbindung
- **Mieterhöhungs-Erinnerungen** – Wenn eine Erhöhung fällig sein könnte
- **Manuell** – Wenn Sie selbst eine Aufgabe erstellen

### Schritt für Schritt

1. Navigieren Sie zu **Tickets** (erreichbar über das Dashboard oder die Benachrichtigungen).
2. Sie sehen alle offenen Tickets nach Priorität sortiert.
3. Klicken Sie auf ein Ticket, um die Details zu sehen.
4. Bearbeiten Sie das Ticket:
   - Status ändern (Offen, In Bearbeitung, Erledigt)
   - Priorität festlegen
   - Notizen hinzufügen
   - Antworten (bei Mieteranfragen)
5. Schließen Sie das Ticket, wenn die Aufgabe erledigt ist.

### Tipps

- Prüfen Sie regelmäßig Ihre offenen Tickets.
- Tickets von Mietern erscheinen automatisch, wenn das Mieterportal aktiv ist.
- Erledigte Tickets werden archiviert und können jederzeit eingesehen werden.

### Häufige Fragen

**Erhalten Mieter eine Benachrichtigung, wenn ich auf ein Ticket antworte?**
Ja, der Mieter wird per E-Mail über Ihre Antwort informiert.',
 7),

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Vorlagen-Bibliothek nutzen',
 'vorlagen-bibliothek',
 'Ein Überblick über die verfügbaren Vorlagen und Downloads.',
 '## Vorlagen-Bibliothek nutzen

Rentably bietet eine umfangreiche Bibliothek mit Dokumentenvorlagen, die Sie herunterladen und nutzen können.

### Funktionsbeschreibung

Die Vorlagen-Bibliothek enthält zwei Arten von Vorlagen:

**Dokumentenvorlagen mit Assistent:**
Interaktive Vorlagen, die Sie Schritt für Schritt ausfüllen. Der Assistent erstellt ein fertiges, rechtssicheres Dokument.

**Download-Vorlagen:**
Fertige Vorlagen als PDF oder Word-Dokument zum Herunterladen und manuellen Ausfüllen.

### Schritt für Schritt

1. Navigieren Sie zu **Vorlagen** in der Seitenleiste.
2. Durchsuchen Sie die verfügbaren Kategorien:
   - Mietvertrag und Vertragsänderungen
   - Kündigungen
   - Abmahnungen
   - Bescheinigungen und Bestätigungen
   - Finanzen und Zahlungen
3. Wählen Sie eine Vorlage aus.
4. Nutzen Sie den Assistenten oder laden Sie die Vorlage herunter.
5. Fertige Dokumente werden automatisch gespeichert.

### Tipps

- Nutzen Sie bevorzugt die Assistenten-Vorlagen, da diese automatisch Ihre Daten einfügen.
- Die Vorlagen werden regelmäßig aktualisiert und an rechtliche Änderungen angepasst.
- Nutzen Sie die Suchfunktion, um schnell die passende Vorlage zu finden.

### Häufige Fragen

**Kann ich eigene Vorlagen erstellen?**
Derzeit bietet Rentably vordefinierte Vorlagen. E-Mail-Vorlagen können Sie unter Nachrichten → Vorlagen selbst erstellen.',
 9),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Hausgeld und WEG-Verwaltung',
 'hausgeld-weg-verwaltung',
 'So erfassen Sie Hausgeld für Eigentumswohnungen in einer WEG.',
 '## Hausgeld und WEG-Verwaltung

Wenn Sie Eigentumswohnungen in einer Wohnungseigentümergemeinschaft (WEG) besitzen, zahlen Sie monatlich Hausgeld an die Hausverwaltung. Rentably dokumentiert diese Kosten.

### Schritt für Schritt

1. Öffnen Sie ein Objekt und navigieren Sie zu den **Einheiten**.
2. Öffnen Sie die betreffende Einheit.
3. Im Bereich **Hausgeld** geben Sie den monatlichen Betrag ein.
4. Speichern Sie die Angaben.

Das Hausgeld wird in der Kostenübersicht und Cashflow-Berechnung berücksichtigt.

### Funktionsbeschreibung

Rentably berücksichtigt das Hausgeld bei:

- Cashflow-Berechnung (Einnahmen minus alle Kosten)
- Renditeberechnung
- Anlage V (als Werbungskosten, sofern korrekt kategorisiert)

### Tipps

- Das Hausgeld enthält in der Regel umlagefähige und nicht umlagefähige Kosten.
- Erfassen Sie die Hausgeldabrechnung der WEG als Ausgabe, um die genaue Kostenverteilung zu dokumentieren.
- Nicht umlagefähige Kosten (z.B. Instandhaltungsrücklage) mindern Ihre Rendite direkt.

### Häufige Fragen

**Ist das Hausgeld das gleiche wie die Nebenkosten?**
Nein. Das Hausgeld wird an die WEG-Verwaltung gezahlt und enthält neben den Betriebskosten auch die Instandhaltungsrücklage und Verwaltungskosten.',
 9),

((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Wertentwicklung der Immobilie dokumentieren',
 'wertentwicklung-immobilie',
 'So dokumentieren Sie die Wertentwicklung Ihrer Immobilien.',
 '## Wertentwicklung der Immobilie dokumentieren

Rentably ermöglicht es, die Wertentwicklung Ihrer Immobilien über die Zeit zu dokumentieren.

### Schritt für Schritt

1. Öffnen Sie ein Objekt.
2. Im Bereich **Übersicht** finden Sie den aktuellen geschätzten Wert.
3. Klicken Sie auf **Wert aktualisieren**.
4. Geben Sie den neuen geschätzten Wert und das Bewertungsdatum ein.
5. Optional: Hinterlegen Sie die Quelle der Bewertung (z.B. Gutachten, eigene Schätzung).
6. Speichern Sie den Eintrag.

### Funktionsbeschreibung

Rentably zeigt die Werthistorie als Zeitreihe. Sie können sehen:

- Ursprünglicher Kaufpreis
- Zwischenbewertungen
- Aktuelle Schätzung
- Wertsteigerung in Prozent

### Tipps

- Aktualisieren Sie den Wert mindestens einmal jährlich.
- Nutzen Sie Online-Bewertungsportale als Orientierung.
- Ein professionelles Gutachten ist empfehlenswert bei Verkaufsabsichten oder Finanzierungsgesprächen.

### Häufige Fragen

**Berechnet Rentably den Immobilienwert automatisch?**
Nein. Die Wertermittlung basiert auf Ihren Angaben. Rentably dokumentiert die Entwicklung und berechnet die Wertsteigerung.',
 8),

((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Sicherheit und Datenschutz',
 'sicherheit-datenschutz',
 'Informationen zu Sicherheitsmaßnahmen und Datenschutz bei Rentably.',
 '## Sicherheit und Datenschutz

Rentably nimmt den Schutz Ihrer Daten sehr ernst. Hier erfahren Sie, welche Maßnahmen zum Einsatz kommen.

### Technische Sicherheit

- **Verschlüsselung**: Alle Daten werden über SSL/TLS verschlüsselt übertragen.
- **Serverstandort**: Alle Server befinden sich in Deutschland.
- **Zugriffskontrolle**: Nur autorisierte Personen haben Zugriff auf Ihre Daten.
- **Regelmäßige Backups**: Ihre Daten werden automatisch gesichert.

### Datenschutz (DSGVO)

Rentably ist vollständig DSGVO-konform:

- Verarbeitung personenbezogener Daten nur auf Grundlage eines Auftragsverarbeitungsvertrags (AVV)
- Keine Weitergabe an Dritte ohne Ihre Zustimmung
- Auskunftsrecht und Löschrecht werden vollständig unterstützt
- Datenschutzerklärung und AGB sind transparent einsehbar

### Tipps

- Verwenden Sie ein sicheres Passwort.
- Teilen Sie Ihre Zugangsdaten nicht mit anderen.
- Nutzen Sie die Benutzerverwaltung, um Mitarbeitern eigene Zugänge zu geben, statt Ihren Account zu teilen.
- Melden Sie sich nach der Nutzung auf öffentlichen Geräten ab.

### Häufige Fragen

**Kann ich meine Daten löschen lassen?**
Ja. Kontaktieren Sie den Support, um eine vollständige Datenlöschung anzufordern. Dies ist unwiderruflich.',
 8)
ON CONFLICT (slug) DO NOTHING;
