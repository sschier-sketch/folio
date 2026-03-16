/*
  # Populate Help Center – Automatisierungen (additional articles)

  Adds new articles to the "Automatisierungen" category:
  - Automatische Mietzahlungsgenerierung
  - Darlehensfälligkeiten und Zinsbindung
  - Cronjobs und Systemfunktionen

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'automatisierungen'),
 'Automatische Mietzahlungsgenerierung',
 'automatische-mietzahlungen',
 'Erfahren Sie, wie Rentably automatisch monatliche Mietzahlungen erstellt.',
 '## Automatische Mietzahlungsgenerierung

Rentably erstellt jeden Monat automatisch die fälligen Mietzahlungen basierend auf Ihren aktiven Mietverträgen. Sie müssen keine Zahlungen manuell anlegen.

### Funktionsbeschreibung

Das System prüft regelmäßig:

- Welche Mietverträge aktiv sind
- Welche Kaltmiete und Nebenkosten vereinbart sind
- Ob bereits eine Zahlung für den aktuellen Monat existiert

Falls eine Zahlung fehlt, wird sie automatisch mit dem Status **Offen** erstellt.

### Wie werden die Beträge berechnet?

Die monatliche Zahlung setzt sich zusammen aus:

- **Kaltmiete** – gemäß der aktuellen Mietperiode
- **Nebenkosten-Vorauszahlung** – gemäß Mietvertrag
- **Eventuelle Zusatzkosten** – z.B. Stellplatzmiete

Bei Mieterhöhungen werden die Beträge automatisch ab dem neuen Gültigkeitsdatum angepasst.

### Schritt für Schritt

1. Legen Sie einen Mietvertrag mit Kaltmiete und Nebenkosten an.
2. Ab dem Vertragsbeginn generiert Rentably monatlich Zahlungen.
3. Markieren Sie eingegangene Zahlungen als **Bezahlt**.
4. Überfällige Zahlungen bleiben als **Offen** markiert.

### Tipps

- Prüfen Sie zu Monatsbeginn Ihre offenen Zahlungen.
- Bei rückwirkendem Vertragsstart werden die fehlenden Monate nachgeneriert.
- Endet ein Vertrag, werden ab dem Folgemonat keine neuen Zahlungen mehr erstellt.

### Häufige Fragen

**Die Zahlungen werden nicht erstellt.**
Prüfen Sie, ob der Mietvertrag aktiv ist und ein Startdatum in der Vergangenheit oder Gegenwart hat. Stellen Sie sicher, dass eine Kaltmiete eingetragen ist.',
 4),

((SELECT id FROM help_categories WHERE slug = 'automatisierungen'),
 'Darlehensfälligkeiten und Zinsbindung',
 'darlehensfaelligkeiten',
 'So werden Sie rechtzeitig an ablaufende Zinsbindungen erinnert.',
 '## Darlehensfälligkeiten und Zinsbindung

Rentably überwacht die Zinsbindungslaufzeiten Ihrer Immobiliendarlehen und erinnert Sie rechtzeitig vor dem Ablauf.

### Funktionsbeschreibung

Wenn Sie ein Darlehen mit Zinsbindungsdauer hinterlegen, prüft Rentably täglich, ob das Ende der Zinsbindung naht. Sie erhalten:

- Eine Benachrichtigung 6 Monate vor Ablauf
- Eine Erinnerung als Ticket im Dashboard
- Optional eine E-Mail-Benachrichtigung

### Schritt für Schritt

1. Hinterlegen Sie ein Darlehen mit allen Details (siehe Artikel "Darlehen verwalten").
2. Geben Sie das Datum des Zinsbindungsendes ein.
3. Rentably erstellt automatisch eine Erinnerung, wenn der Termin naht.
4. Nutzen Sie die Erinnerung, um rechtzeitig eine Anschlussfinanzierung zu verhandeln.

### Tipps

- Beginnen Sie mindestens 6 Monate vor Ablauf mit der Suche nach einer Anschlussfinanzierung.
- Vergleichen Sie aktuelle Bauzinsen im Rentably-Magazin.
- Aktualisieren Sie die Darlehensdaten nach einer Umschuldung.

### Häufige Fragen

**Kann Rentably die Anschlussfinanzierung vermitteln?**
Nein. Rentably erinnert Sie an den Termin. Die Finanzierung verhandeln Sie direkt mit Ihrer Bank oder einem Vermittler.',
 5),

((SELECT id FROM help_categories WHERE slug = 'automatisierungen'),
 'Systemfunktionen und Hintergrundprozesse',
 'systemfunktionen',
 'Ein Überblick über die automatischen Hintergrundprozesse in Rentably.',
 '## Systemfunktionen und Hintergrundprozesse

Rentably führt im Hintergrund verschiedene automatische Prozesse aus, die Ihren Verwaltungsalltag erleichtern.

### Automatische Prozesse

| Funktion | Beschreibung | Häufigkeit |
|----------|--------------|------------|
| Mietzahlungsgenerierung | Erstellt monatliche Zahlungen | Täglich |
| Indexmiet-Prüfung | Prüft VPI-Daten und berechnet Anpassungen | Täglich |
| Darlehensfälligkeiten | Warnt vor ablaufender Zinsbindung | Täglich |
| Mietanpassungs-Erinnerungen | Erinnert an mögliche Mieterhöhungen | Täglich |
| E-Mail-Warteschlange | Versendet anstehende E-Mails | Alle 5 Minuten |
| Bankimport-Sync | Synchronisiert verbundene Bankkonten | Täglich |

### Funktionsbeschreibung

Diese Prozesse laufen vollautomatisch. Sie erhalten Benachrichtigungen, wenn eine Aktion erforderlich ist – z.B. wenn eine Indexmiete angepasst werden kann oder eine Zinsbindung ausläuft.

### Tipps

- Sie müssen keine dieser Funktionen manuell starten.
- Stellen Sie sicher, dass Ihre Daten vollständig sind, damit die Automatisierungen korrekt arbeiten.
- Offene Aufgaben aus automatischen Prozessen erscheinen als Tickets.

### Häufige Fragen

**Kann ich die automatischen Funktionen deaktivieren?**
Die Kernfunktionen wie Zahlungsgenerierung sind immer aktiv. Einzelne Erinnerungen können in den Einstellungen angepasst werden.',
 6)
ON CONFLICT (slug) DO NOTHING;
