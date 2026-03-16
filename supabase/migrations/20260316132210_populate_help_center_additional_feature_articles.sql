/*
  # Populate Help Center – Additional Feature Articles

  Adds articles covering features not yet documented:
  - Vorlagen/Templates section
  - Tickets/Aufgaben
  - Zähler und Zählerstände
  - Empfehlungsprogramm
  - Dokumentenvorlagen-Assistent

  These go into existing categories.
*/

-- Dokumente: detailed article about document management
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Dokumentenvorlagen und Assistenten nutzen',
 'dokumentenvorlagen-assistenten',
 'So nutzen Sie die Dokumentenvorlagen mit dem integrierten Assistenten.',
 '## Dokumentenvorlagen und Assistenten nutzen

Rentably bietet einen Vorlagen-Assistenten, der Sie Schritt für Schritt durch die Erstellung rechtssicherer Dokumente führt.

### Verfügbare Vorlagen

Der Vorlagen-Assistent enthält Vorlagen für:

- **Kündigung** – Ordentliche Kündigung des Mietverhältnisses
- **Kündigung wegen Eigenbedarf** – Mit Begründung und Sozialklausel
- **Kündigung wegen Zahlungsverzug** – Fristlose Kündigung
- **Kündigung nach Abmahnung** – Kündigung nach vorheriger Abmahnung
- **Abmahnung Ruhestörung** – Abmahnung wegen Lärmbelästigung
- **Abmahnung bauliche Veränderungen** – Abmahnung bei unerlaubten Umbauten
- **Mieterhöhungsverlangen** – Formelles Erhöhungsschreiben
- **Zahlungserinnerung** – Freundliche Erinnerung an offene Zahlung
- **Mieterselbstauskunft** – Fragebogen für Mietinteressenten
- **Mietkautionsrückgriff** – Inanspruchnahme der Kaution
- **Mietschuldenfreiheitsbescheinigung** – Bestätigung über gezahlte Mieten
- **Meldebestätigung** – Wohnungsgeberbestätigung für die Meldebehörde
- **Wohnungsgeberbestätigung** – Offizielles Formular nach §19 BMG
- **Schönheitsreparaturen** – Aufforderung zu Renovierungsarbeiten
- **Räumungsaufforderung** – Aufforderung zur Räumung der Wohnung
- **Betriebskostenvorauszahlungen** – Anpassung der Vorauszahlungen

### Schritt für Schritt

1. Navigieren Sie zu **Vorlagen**.
2. Wählen Sie die gewünschte Dokumentenvorlage.
3. Klicken Sie auf **Dokument erstellen**.
4. Der Assistent führt Sie durch folgende Schritte:
   - **Vermieter-Daten** – Werden aus Ihrem Profil übernommen
   - **Mieter-Daten** – Wählen Sie den betreffenden Mieter
   - **Sachverhalt** – Geben Sie die spezifischen Details ein
   - **Vorschau** – Prüfen Sie das fertige Dokument
   - **Versand** – Versenden Sie per E-Mail, Brief oder speichern als PDF
5. Das Dokument wird automatisch in den Dokumenten des Mieters abgelegt.

### Tipps

- Prüfen Sie alle Daten sorgfältig vor dem Versand, insbesondere bei rechtlich relevanten Dokumenten.
- Nutzen Sie den Briefversand per Einschreiben für Kündigungen und Abmahnungen.
- Die Vorlagen entsprechen den aktuellen gesetzlichen Anforderungen.

### Häufige Fragen

**Kann ich die Vorlagen anpassen?**
Die Texte werden automatisch anhand Ihrer Eingaben generiert. Individuelle Anpassungen können Sie im Freitextfeld vornehmen.',
 8),

-- Finanzen: Zähler und Zählerstände
((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Zähler und Zählerstände verwalten',
 'zaehler-zaehlerstaende',
 'So erfassen und verwalten Sie Zähler für Strom, Gas, Wasser und Heizung.',
 '## Zähler und Zählerstände verwalten

Rentably ermöglicht die Verwaltung aller Zähler in Ihren Immobilien – von Strom über Gas bis Wasser und Fernwärme.

### Schritt für Schritt – Zähler anlegen

1. Navigieren Sie zu **Abrechnungen → Zähler**.
2. Klicken Sie auf **Neuer Zähler**.
3. Geben Sie die Details ein:
   - Zählertyp (Strom, Gas, Wasser, Heizung, Fernwärme)
   - Zählernummer
   - Objekt und Einheit
   - Ableseintervall
4. Speichern Sie den Zähler.

### Schritt für Schritt – Zählerstand erfassen

1. Öffnen Sie einen bestehenden Zähler.
2. Klicken Sie auf **Neuer Ablesestand**.
3. Geben Sie den aktuellen Stand und das Ablesedatum ein.
4. Optional: Laden Sie ein Foto des Zählers hoch.
5. Speichern Sie den Stand.

### Funktionsbeschreibung

Rentably zeigt für jeden Zähler:

- Aktuelle und historische Ablesestände
- Verbrauchsberechnung zwischen den Ablesungen
- Fotos als Nachweis
- Zuordnung zu Einheiten für die Nebenkostenabrechnung

### Tipps

- Erfassen Sie Zählerstände regelmäßig, mindestens einmal jährlich für die Betriebskostenabrechnung.
- Bei Mieterwechsel immer die Zählerstände beim Ein- und Auszug dokumentieren.
- Aktivieren Sie die Zählerstandserfassung im Mieterportal, damit Mieter selbst ablesen können.
- Fotos dienen als Nachweis bei Unstimmigkeiten.

### Häufige Fragen

**Können Mieter Zählerstände selbst melden?**
Ja, wenn das Mieterportal aktiviert und die Zählerstandserfassung im Mietvertrag freigeschaltet ist.',
 13),

-- Allgemein: Empfehlungsprogramm
((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Empfehlungsprogramm nutzen',
 'empfehlungsprogramm',
 'So funktioniert das Empfehlungsprogramm von Rentably.',
 '## Empfehlungsprogramm nutzen

Mit dem Empfehlungsprogramm können Sie Rentably weiterempfehlen und dafür eine Gutschrift erhalten.

### Funktionsbeschreibung

Jeder Rentably-Account erhält einen persönlichen Empfehlungslink. Wenn sich jemand über Ihren Link registriert und ein Pro-Abonnement abschließt, erhalten Sie eine Gutschrift.

### Schritt für Schritt

1. Klicken Sie in der Seitenleiste auf **Empfehlungsprogramm** (sichtbar für Account-Eigentümer).
2. Sie sehen Ihren persönlichen Empfehlungslink.
3. Teilen Sie den Link per E-Mail, WhatsApp oder über soziale Medien.
4. Alternativ können Sie eine Einladungs-E-Mail direkt aus Rentably versenden.
5. Verfolgen Sie Ihre Empfehlungen und Gutschriften im Empfehlungs-Dashboard.

### Was sehen Sie im Empfehlungs-Dashboard?

- Anzahl der Klicks auf Ihren Empfehlungslink
- Registrierungen über Ihren Link
- Konvertierte Empfehlungen (Pro-Abonnenten)
- Gutschriften und Auszahlungsstatus
- Conversion-Funnel mit Visualisierung

### Tipps

- Teilen Sie den Link in Vermieter-Communities und Foren.
- Je mehr Empfehlungen ein Pro-Abo abschließen, desto höher Ihre Gutschrift.
- Sie können den Status jeder Empfehlung in Echtzeit verfolgen.

### Häufige Fragen

**Wann erhalte ich meine Gutschrift?**
Die Gutschrift wird aktiv, sobald die empfohlene Person ein Pro-Abonnement abschließt und die erste Zahlung erfolgreich war.',
 6),

-- Finanzen: Bankverbindung (Open Banking)
((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Bankverbindung (Open Banking) einrichten',
 'open-banking-einrichten',
 'So verbinden Sie Ihr Bankkonto für den automatischen Transaktionsabruf.',
 '## Bankverbindung (Open Banking) einrichten

Mit der Open-Banking-Integration können Sie Ihr Bankkonto direkt mit Rentably verbinden. Transaktionen werden dann automatisch abgerufen.

### Funktionsbeschreibung

Statt manuell CSV-Dateien zu importieren, ruft Rentably Ihre Kontobewegungen automatisch ab. Sie erhalten:

- Tägliche Synchronisation neuer Transaktionen
- Automatische Zuordnungsvorschläge für Mietzahlungen
- Übersicht aller Kontobewegungen in Rentably

### Schritt für Schritt

1. Navigieren Sie zu **Finanzen → Bankverbindung**.
2. Klicken Sie auf **Bankkonto verbinden**.
3. Wählen Sie Ihre Bank aus der Liste.
4. Authentifizieren Sie sich über Ihr Online-Banking (sichere Weiterleitung).
5. Wählen Sie das Konto, das Sie verbinden möchten.
6. Bestätigen Sie die Verbindung.

Ab sofort werden Transaktionen täglich automatisch abgerufen.

### Tipps

- Die Verbindung ist schreibgeschützt – Rentably kann keine Überweisungen tätigen.
- Prüfen Sie regelmäßig die automatischen Zuordnungsvorschläge.
- Die Verbindung muss alle 90 Tage erneuert werden (PSD2-Richtlinie).

### Häufige Fragen

**Ist die Verbindung sicher?**
Ja. Die Verbindung erfolgt über einen zertifizierten PSD2-Dienstleister. Rentably hat zu keinem Zeitpunkt Zugriff auf Ihre Banking-Zugangsdaten.',
 14),

-- Berichte: Restschuld-Rechner
((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Restschuld-Rechner verwenden',
 'restschuld-rechner',
 'So berechnen Sie die Restschuld Ihrer Immobiliendarlehen.',
 '## Restschuld-Rechner verwenden

Der Restschuld-Rechner in Rentably hilft Ihnen, die aktuelle und zukünftige Restschuld Ihrer Immobilienfinanzierungen zu berechnen.

### Schritt für Schritt

1. Öffnen Sie ein Objekt mit hinterlegtem Darlehen.
2. Im Bereich **Darlehen** finden Sie den Restschuld-Rechner.
3. Die Berechnung basiert auf:
   - Ursprünglicher Darlehensbetrag
   - Zinssatz
   - Tilgungsrate
   - Bereits geleistete Zahlungen
4. Sie sehen die aktuelle Restschuld und den voraussichtlichen Tilgungsverlauf.

### Funktionsbeschreibung

Der Rechner zeigt:

- Aktuelle Restschuld
- Restschuld zum Ende der Zinsbindung
- Monatliche Aufteilung in Zins- und Tilgungsanteil
- Gesamte Zinslast über die Laufzeit

### Tipps

- Nutzen Sie den Rechner, um die Auswirkungen einer höheren Tilgung zu simulieren.
- Vergleichen Sie die Restschuld bei verschiedenen Zinssätzen für die Anschlussfinanzierung.

### Häufige Fragen

**Kann ich Sondertilgungen berücksichtigen?**
Aktualisieren Sie den Darlehensbetrag nach einer Sondertilgung, um die Berechnung anzupassen.',
 7)
ON CONFLICT (slug) DO NOTHING;
