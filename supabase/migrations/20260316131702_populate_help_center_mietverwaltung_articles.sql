/*
  # Populate Help Center – Mietverwaltung (additional articles)

  Adds new articles to the "Mietverwaltung" category:
  - Kündigungen verwalten
  - Staffelmieten anlegen
  - Indexmieten einrichten
  - Kaution und Kautionsverwaltung
  - Übergabeprotokolle erstellen
  - Mieterselbstauskunft anfordern
  - Vertragspartner verwalten

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Kündigungen verwalten',
 'kuendigungen-verwalten',
 'So verwalten Sie Mietvertragskündigungen in Rentably.',
 '## Kündigungen verwalten

Wenn ein Mietverhältnis endet, unterstützt Rentably Sie beim ordnungsgemäßen Abschluss des Vertrags.

### Schritt für Schritt

1. Öffnen Sie den Mieter und wechseln Sie zum Tab **Vertrag**.
2. Klicken Sie auf **Vertrag beenden**.
3. Geben Sie das Enddatum und den Kündigungsgrund ein.
4. Wählen Sie, ob die Kündigung vom Vermieter oder Mieter ausgeht.
5. Optional: Erstellen Sie ein Kündigungsschreiben über die Dokumentenvorlagen.
6. Bestätigen Sie die Vertragsbeendigung.

Nach der Beendigung wird die Einheit automatisch als **leer** markiert.

### Dokumentenvorlagen

Rentably bietet Vorlagen für verschiedene Kündigungsarten:

- Kündigung wegen Eigenbedarf
- Kündigung nach Abmahnung
- Kündigung wegen Zahlungsverzug
- Ordentliche Kündigung

### Tipps

- Beachten Sie die gesetzlichen Kündigungsfristen.
- Erstellen Sie vor dem Ende des Mietverhältnisses ein Übergabeprotokoll.
- Vertragsbeendigungen werden in der Historie dokumentiert.

### Häufige Fragen

**Kann ich eine Kündigung rückgängig machen?**
Solange kein neuer Vertrag für die Einheit existiert, können Sie das Enddatum entfernen.',
 4),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Staffelmieten anlegen',
 'staffelmieten-anlegen',
 'So richten Sie Staffelmietverträge mit automatischen Erhöhungen ein.',
 '## Staffelmieten anlegen

Bei einer Staffelmiete wird die Miete zu festgelegten Zeitpunkten automatisch erhöht. Rentably unterstützt diese Vertragsform vollständig.

### Funktionsbeschreibung

Bei einem Staffelmietvertrag legen Sie im Voraus fest, wann und um wie viel die Miete steigt. Rentably erstellt die entsprechenden Mietperioden automatisch.

### Schritt für Schritt

1. Erstellen Sie einen neuen Mietvertrag oder öffnen Sie einen bestehenden.
2. Wechseln Sie zum Tab **Miethistorie**.
3. Klicken Sie auf **Neue Mietperiode**.
4. Geben Sie den neuen Mietbetrag und das Gültigkeitsdatum ein.
5. Wiederholen Sie dies für jede Staffel.
6. Die Mietzahlungen werden automatisch ab dem jeweiligen Datum angepasst.

### Tipps

- Staffelmietvereinbarungen müssen schriftlich im Mietvertrag festgehalten sein.
- Bei Staffelmieten sind während der Laufzeit keine weiteren Mieterhöhungen zulässig.
- Legen Sie alle Staffeln direkt bei Vertragserstellung an, damit keine Stufe vergessen wird.

### Häufige Fragen

**Was passiert, wenn ich eine Staffel vergessen habe?**
Sie können jederzeit nachträglich eine Mietperiode mit dem korrekten Startdatum anlegen.',
 5),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Indexmieten einrichten',
 'indexmieten-einrichten',
 'So richten Sie Indexmietverträge ein und nutzen die automatische Berechnung.',
 '## Indexmieten einrichten

Bei Indexmietverträgen wird die Miete an den Verbraucherpreisindex (VPI) gekoppelt. Rentably berechnet Anpassungen automatisch.

### Funktionsbeschreibung

Die Indexmiete steigt oder fällt mit dem Verbraucherpreisindex des Statistischen Bundesamts. Rentably überwacht den Index monatlich und informiert Sie, wenn eine Anpassung möglich ist.

### Schritt für Schritt

1. Erstellen Sie einen neuen Mietvertrag.
2. Wählen Sie den Miettyp **Indexmiete**.
3. Geben Sie die Ausgangswerte ein:
   - Kaltmiete zu Vertragsbeginn
   - Basis-VPI-Wert (wird automatisch vorgeschlagen)
   - Datum des ersten möglichen Anpassungszeitpunkts
4. Speichern Sie den Vertrag.

Rentably prüft nun täglich, ob eine Indexanpassung fällig ist und erstellt bei Bedarf ein Ticket mit der Berechnung.

### So funktioniert die Berechnung

Die Formel lautet: Neue Miete = Alte Miete × (Neuer VPI / Basis-VPI)

Rentably berechnet die Differenz, erstellt ein Mieterhöhungsverlangen als PDF und legt dieses unter Dokumente ab.

### Tipps

- Die Anpassung muss dem Mieter schriftlich mitgeteilt werden.
- Zwischen zwei Anpassungen muss mindestens ein Jahr liegen.
- Nutzen Sie den Indexmiet-Assistenten unter Finanzen für eine detaillierte Vorschau.

### Häufige Fragen

**Wann wird die Anpassung aktiv?**
Frühestens ab dem übernächsten Monat nach Zugang des Erhöhungsverlangens beim Mieter.',
 6),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Kaution und Kautionsverwaltung',
 'kaution-verwalten',
 'So verwalten Sie Mietkautionen in Rentably.',
 '## Kaution und Kautionsverwaltung

Rentably dokumentiert den Kautionsstatus für jeden Mietvertrag – von der Forderung über den Eingang bis zur Rückzahlung.

### Schritt für Schritt

1. Öffnen Sie den Mietvertrag eines Mieters.
2. Im Tab **Kaution** sehen Sie den aktuellen Status.
3. Geben Sie den vereinbarten Kautionsbetrag ein.
4. Dokumentieren Sie Teilzahlungen, wenn die Kaution in Raten gezahlt wird.
5. Bei Vertragsende können Sie die Kautionsabrechnung erstellen.

### Funktionsbeschreibung

Rentably zeigt Ihnen:

- Vereinbarter Kautionsbetrag
- Bereits gezahlter Betrag
- Offener Restbetrag
- Kautionshistorie mit allen Ein- und Auszahlungen

### Tipps

- Die Kaution darf maximal drei Nettokaltmieten betragen.
- Mieter dürfen die Kaution in drei gleichen Monatsraten zahlen.
- Dokumentieren Sie die Kautionsanlage für die korrekte Abrechnung bei Vertragsende.

### Häufige Fragen

**Wird die Kaution automatisch verzinst?**
Rentably dokumentiert den Kautionsstatus, berechnet aber keine Zinsen. Hinterlegen Sie die Zinserträge manuell.',
 7),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Übergabeprotokolle erstellen',
 'uebergabeprotokolle',
 'So erstellen Sie Übergabeprotokolle bei Ein- und Auszug.',
 '## Übergabeprotokolle erstellen

Übergabeprotokolle dokumentieren den Zustand der Wohnung bei Ein- und Auszug. Rentably bietet ein strukturiertes Formular dafür.

### Schritt für Schritt

1. Öffnen Sie den Mieter und wechseln Sie zum Tab **Übergabe**.
2. Klicken Sie auf **Neues Protokoll**.
3. Wählen Sie den Typ: **Einzug** oder **Auszug**.
4. Gehen Sie die Räume durch und dokumentieren Sie:
   - Zustand von Wänden, Böden, Decken
   - Zustand von Fenstern und Türen
   - Sanitäreinrichtungen
   - Zählerstände (Strom, Gas, Wasser)
   - Schlüsselübergabe
5. Fügen Sie bei Bedarf Fotos hinzu.
6. Lassen Sie das Protokoll von beiden Parteien bestätigen.
7. Exportieren Sie das Protokoll als PDF.

### Tipps

- Erstellen Sie das Protokoll immer gemeinsam mit dem Mieter vor Ort.
- Fotografieren Sie alle Mängel und Schäden.
- Vergleichen Sie Ein- und Auszugsprotokoll, um Schäden zu identifizieren.
- Das PDF kann direkt als Dokument in Rentably gespeichert werden.

### Häufige Fragen

**Muss der Mieter das Protokoll unterschreiben?**
Eine Unterschrift ist empfehlenswert, aber nicht gesetzlich vorgeschrieben. Das Protokoll dient als Beweismittel.',
 8),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Mieterselbstauskunft anfordern',
 'mieterselbstauskunft',
 'So erstellen und versenden Sie eine Mieterselbstauskunft.',
 '## Mieterselbstauskunft anfordern

Die Mieterselbstauskunft ist ein wichtiges Dokument bei der Auswahl neuer Mieter. Rentably bietet eine Vorlage, die Sie direkt versenden können.

### Schritt für Schritt

1. Navigieren Sie zu **Vorlagen → Dokumentenvorlagen**.
2. Wählen Sie die Vorlage **Mieterselbstauskunft**.
3. Füllen Sie die Objektdaten aus.
4. Erstellen Sie das Dokument als PDF.
5. Versenden Sie es per E-Mail oder laden Sie es herunter.

### Was enthält die Selbstauskunft?

- Persönliche Daten des Mietinteressenten
- Angaben zum Beschäftigungsverhältnis und Einkommen
- Angaben zu Haustieren
- Anzahl der einziehenden Personen
- Fragen zu Mietschulden und Insolvenzverfahren

### Tipps

- Versenden Sie die Selbstauskunft frühzeitig im Bewerbungsprozess.
- Bewahren Sie ausgefüllte Selbstauskünfte nicht länger als nötig auf (Datenschutz).
- Fragen nach Religion, Parteizugehörigkeit oder Familienplanung sind nicht zulässig.

### Häufige Fragen

**Muss ein Mietinteressent die Auskunft ausfüllen?**
Nein, die Teilnahme ist freiwillig. Allerdings kann die Verweigerung Einfluss auf Ihre Auswahl haben.',
 9),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Vertragspartner verwalten',
 'vertragspartner-verwalten',
 'So fügen Sie Mitmieter und weitere Vertragspartner hinzu.',
 '## Vertragspartner verwalten

Wenn ein Mietvertrag von mehreren Personen unterzeichnet wird, können Sie alle Vertragspartner in Rentably hinterlegen.

### Schritt für Schritt

1. Öffnen Sie den Mietvertrag.
2. Im Tab **Vertrag** finden Sie den Bereich **Vertragspartner**.
3. Klicken Sie auf **Partner hinzufügen**.
4. Geben Sie die Daten des Mitvertragspartners ein:
   - Name
   - E-Mail
   - Telefonnummer
5. Speichern Sie die Angaben.

### Funktionsbeschreibung

Vertragspartner sind gleichberechtigte Mieter, die den Mietvertrag mitunterzeichnet haben. Sie haften gesamtschuldnerisch für die Miete.

### Tipps

- Hinterlegen Sie alle Vertragspartner, damit Schreiben an den richtigen Empfänger adressiert werden.
- Bei Auszug eines Vertragspartners sollte der Vertrag entsprechend geändert werden.
- Kommunikation kann an alle Vertragspartner gleichzeitig versendet werden.

### Häufige Fragen

**Kann ein Vertragspartner einen eigenen Mieterportal-Zugang erhalten?**
Aktuell wird ein Portal-Zugang pro Mietvertrag vergeben. Beide Partner können denselben Zugang nutzen.',
 10)
ON CONFLICT (slug) DO NOTHING;
