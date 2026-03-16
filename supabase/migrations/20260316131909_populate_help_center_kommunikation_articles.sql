/*
  # Populate Help Center – Kommunikation (additional articles)

  Adds new articles to the "Kommunikation" category:
  - E-Mail-Vorlagen erstellen
  - Mieterportal einrichten
  - Mieterportal-Funktionen für Mieter
  - Kommunikation dokumentieren

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'E-Mail-Vorlagen erstellen und nutzen',
 'email-vorlagen',
 'So erstellen Sie E-Mail-Vorlagen für wiederkehrende Nachrichten.',
 '## E-Mail-Vorlagen erstellen und nutzen

E-Mail-Vorlagen sparen Zeit bei wiederkehrenden Nachrichten. Rentably bietet vordefinierte Vorlagen und die Möglichkeit, eigene zu erstellen.

### Schritt für Schritt

1. Navigieren Sie zu **Nachrichten → Vorlagen**.
2. Klicken Sie auf **Neue Vorlage**.
3. Geben Sie einen Namen für die Vorlage ein.
4. Verfassen Sie den Text mit Platzhaltern:
   - `{mieter_name}` – Name des Mieters
   - `{objekt_adresse}` – Adresse des Objekts
   - `{einheit}` – Bezeichnung der Einheit
5. Speichern Sie die Vorlage.

Beim Verfassen einer Nachricht können Sie die Vorlage auswählen und die Platzhalter werden automatisch ersetzt.

### Tipps

- Erstellen Sie Vorlagen für häufige Anlässe: Willkommensnachricht, Terminankündigung, Wartungshinweis.
- Vorlagen können eine persönliche Signatur enthalten.
- Aktivieren Sie die automatische Signatur in den Nachrichteneinstellungen.

### Häufige Fragen

**Können andere Benutzer meine Vorlagen sehen?**
Ja, Vorlagen werden accountweit geteilt und stehen allen Benutzern zur Verfügung.',
 4),

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Mieterportal einrichten und verwalten',
 'mieterportal-einrichten',
 'So aktivieren Sie das Mieterportal für Ihre Mieter.',
 '## Mieterportal einrichten und verwalten

Das Mieterportal gibt Ihren Mietern einen eigenen Zugang, über den sie Dokumente einsehen, Nachrichten senden und Zählerstände melden können.

### Schritt für Schritt

1. Navigieren Sie zu **Mieterportal** in der Seitenleiste.
2. Wählen Sie den Mieter, für den Sie den Zugang aktivieren möchten.
3. Klicken Sie auf **Portal aktivieren**.
4. Rentably sendet dem Mieter eine E-Mail mit einem Link zur Einrichtung.
5. Der Mieter erstellt ein Passwort und kann sich ab sofort anmelden.

### Was kann der Mieter im Portal?

- **Dashboard** – Übersicht über Vertrag und Kontaktdaten
- **Dokumente** – Freigegebene Dokumente einsehen und herunterladen
- **Kommunikation** – Nachrichten an den Vermieter senden und Tickets erstellen
- **Zählerstände** – Zählerstände ablesen und melden (wenn aktiviert)
- **Profil** – Eigene Kontaktdaten aktualisieren

### Tipps

- Aktivieren Sie das Portal für alle Mieter, um den Verwaltungsaufwand zu reduzieren.
- Teilen Sie wichtige Dokumente wie Hausordnung und Betriebskostenabrechnung über das Portal.
- Zählerstandserfassung kann pro Vertrag aktiviert oder deaktiviert werden.
- Mieter erhalten eine eigene Anmeldeseite unter einer separaten URL.

### Häufige Fragen

**Kann der Mieter meine Daten sehen?**
Nein. Mieter sehen nur die für sie freigegebenen Dokumente und ihre eigenen Vertragsdaten. Sie haben keinen Zugriff auf Finanzdaten oder andere Mieter.',
 5),

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Mieterportal: Funktionen für Mieter',
 'mieterportal-funktionen',
 'Ein Überblick über alle Funktionen des Mieterportals aus Mietersicht.',
 '## Mieterportal: Funktionen für Mieter

Dieser Artikel beschreibt die Funktionen des Mieterportals aus Sicht des Mieters.

### Dashboard

Nach der Anmeldung sieht der Mieter sein Dashboard mit:

- Vertragsinformationen (Objekt, Einheit, Mietbeginn)
- Kontaktdaten des Vermieters
- Aktuelle Mitteilungen

### Dokumente

Im Dokumentenbereich findet der Mieter alle freigegebenen Unterlagen:

- Mietvertrag
- Betriebskostenabrechnungen
- Hausordnung
- Sonstige freigegebene Dokumente

Dokumente können heruntergeladen, aber nicht bearbeitet werden.

### Kommunikation

Der Mieter kann:

- Neue Nachrichten an den Vermieter senden
- Tickets für Reparaturanfragen erstellen
- Auf bestehende Nachrichten antworten

Alle Nachrichten werden dem Vermieter im Posteingang angezeigt.

### Zählerstände

Wenn aktiviert, kann der Mieter:

- Aktuelle Zählerstände eingeben
- Fotos der Zähler hochladen
- Die Historie der gemeldeten Stände einsehen

### Profil

Der Mieter kann seine eigenen Kontaktdaten aktualisieren:

- Telefonnummer
- E-Mail-Adresse

### Tipps

- Informieren Sie Ihre Mieter über die Vorteile des Portals.
- Teilen Sie die Anmelde-URL aktiv bei Vertragsabschluss mit.
- Prüfen Sie regelmäßig eingehende Tickets und Nachrichten.

### Häufige Fragen

**Mein Mieter kann sich nicht anmelden.**
Prüfen Sie, ob die Portal-Einladung versendet wurde. Der Mieter kann über die Anmeldeseite sein Passwort zurücksetzen.',
 6),

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Kommunikation dokumentieren',
 'kommunikation-dokumentieren',
 'So dokumentieren Sie die gesamte Kommunikation mit Ihren Mietern.',
 '## Kommunikation dokumentieren

Rentably archiviert automatisch alle Nachrichten, E-Mails und Briefe, die über die Plattform versendet werden.

### Funktionsbeschreibung

Jede Kommunikation wird gespeichert:

- **E-Mails** – Eingehende und ausgehende Nachrichten
- **Briefe** – Versendete Postsendungen mit Zustellstatus
- **Mieterportal-Nachrichten** – Tickets und Anfragen der Mieter
- **Systembenachrichtigungen** – Automatische Erinnerungen und Mahnungen

### Schritt für Schritt

1. Navigieren Sie zu **Nachrichten**.
2. Im Posteingang sehen Sie alle Konversationen.
3. Klicken Sie auf eine Konversation, um den gesamten Verlauf zu sehen.
4. Verwenden Sie die Ordnerstruktur (Posteingang, Gesendet, Archiv, Papierkorb).
5. Suchen Sie nach bestimmten Nachrichten über die Suchfunktion.

### Tipps

- Verschieben Sie abgeschlossene Konversationen ins Archiv, um den Posteingang übersichtlich zu halten.
- Wichtige Nachrichten können Sie mit einer Priorität markieren.
- Nutzen Sie Kategorien, um Nachrichten thematisch zu sortieren.
- Bei rechtlich relevanter Kommunikation empfehlen wir den Briefversand per Einschreiben.

### Häufige Fragen

**Werden gelöschte Nachrichten endgültig entfernt?**
Nachrichten im Papierkorb können wiederhergestellt werden. Endgültiges Löschen erfordert eine separate Aktion.',
 7)
ON CONFLICT (slug) DO NOTHING;
