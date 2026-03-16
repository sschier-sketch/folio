/*
  # Populate Help Center – FAQ Articles (Part 2)

  Adds 12 more individual FAQ articles to the "Häufige Fragen" category.
  
  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie erstelle ich eine Nebenkostenabrechnung?',
 'faq-nebenkostenabrechnung',
 'Kurzanleitung zur Erstellung einer Betriebskostenabrechnung.',
 '## Wie erstelle ich eine Nebenkostenabrechnung?

So erstellen Sie eine Nebenkostenabrechnung in Rentably:

1. Navigieren Sie zu **Abrechnungen → Betriebskosten**.
2. Klicken Sie auf **Neue Abrechnung**.
3. Wählen Sie Objekt, Einheit und Abrechnungszeitraum.
4. Erfassen Sie die einzelnen Kostenpositionen mit den jeweiligen Gesamtbeträgen.
5. Wählen Sie für jede Position den Umlageschlüssel (Fläche, Personen, Verbrauch etc.).
6. Prüfen Sie die Vorschau mit Nachzahlung oder Gutschrift.
7. Exportieren Sie die Abrechnung als PDF und versenden Sie sie.

Die Abrechnung muss dem Mieter innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums zugehen.',
 14),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie funktioniert der Bankimport?',
 'faq-bankimport',
 'Kurzanleitung zum Import von Kontoauszügen.',
 '## Wie funktioniert der Bankimport?

Der Bankimport spart Ihnen Zeit bei der Erfassung von Mietzahlungen:

1. Laden Sie Ihren Kontoauszug als CSV- oder CAMT053-Datei herunter.
2. Gehen Sie zu **Finanzen → Bankverbindung** und klicken Sie auf **Import starten**.
3. Laden Sie die Datei hoch und ordnen Sie die Spalten zu.
4. Rentably analysiert die Transaktionen und schlägt Zuordnungen zu Mietern vor.
5. Bestätigen Sie die Zuordnungen.

**Tipp:** Hinterlegen Sie die IBAN Ihrer Mieter, damit die automatische Zuordnung besser funktioniert. Bereits importierte Transaktionen werden nicht doppelt erfasst.',
 15),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie lade ich weitere Benutzer ein?',
 'faq-benutzer-einladen',
 'So laden Sie Mitarbeiter oder Partner zu Ihrem Account ein.',
 '## Wie lade ich weitere Benutzer ein?

So fügen Sie einen neuen Benutzer hinzu:

1. Navigieren Sie zu **Einstellungen → Benutzerverwaltung**.
2. Klicken Sie auf **Benutzer einladen**.
3. Geben Sie die E-Mail-Adresse ein.
4. Wählen Sie die Rolle (Admin, Mitarbeiter, Nur Lesen).
5. Senden Sie die Einladung.

Der eingeladene Benutzer erhält eine E-Mail mit einem Link zur Registrierung. Nach der Anmeldung hat er Zugriff gemäß der zugewiesenen Rolle. Die Mehrbenutzerverwaltung ist eine Pro-Funktion.',
 16),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie aktiviere ich das Mieterportal?',
 'faq-mieterportal-aktivieren',
 'Kurzanleitung zur Aktivierung des Mieterportals.',
 '## Wie aktiviere ich das Mieterportal?

So aktivieren Sie den Mieterportal-Zugang für einen Mieter:

1. Navigieren Sie zu **Mieterportal** in der Seitenleiste.
2. Wählen Sie den Mieter aus.
3. Klicken Sie auf **Portal aktivieren**.
4. Rentably sendet dem Mieter eine E-Mail mit einem Einrichtungslink.
5. Der Mieter erstellt ein Passwort und kann sich anmelden.

Im Portal können Mieter Dokumente einsehen, Nachrichten senden und Zählerstände melden. Das Mieterportal ist eine Pro-Funktion.',
 17),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Kann ich Briefe direkt aus Rentably per Post versenden?',
 'faq-briefversand',
 'Informationen zum Postversand über LetterXpress.',
 '## Kann ich Briefe direkt aus Rentably per Post versenden?

Ja, über die Integration mit LetterXpress können Sie Briefe direkt aus Rentably versenden. So funktioniert es:

1. Richten Sie die LetterXpress-Verbindung unter **Einstellungen → Briefversand** ein.
2. Erstellen Sie ein Dokument (z.B. über den Vorlagen-Assistenten).
3. Klicken Sie auf **Als Brief versenden**.
4. Wählen Sie die Versandart (Standard, Einschreiben, Farbdruck).
5. Bestätigen Sie den Versand.

LetterXpress druckt, kuvertiert und frankiert den Brief für Sie. Ein Standardbrief kostet in der Regel unter 2 Euro inklusive Porto.',
 18),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie erstelle ich eine Mieterhöhung?',
 'faq-mieterhoehung',
 'Kurzanleitung zur Erstellung einer Mieterhöhung.',
 '## Wie erstelle ich eine Mieterhöhung?

So führen Sie eine Mieterhöhung durch:

1. Öffnen Sie den Mietvertrag des Mieters.
2. Wechseln Sie zum Tab **Miethistorie**.
3. Klicken Sie auf **Neue Mietperiode**.
4. Geben Sie die neue Kaltmiete und das Datum ein, ab dem sie gelten soll.
5. Speichern Sie die Änderung.

Bei Indexmietverträgen berechnet Rentably die Erhöhung automatisch. Für das formelle Mieterhöhungsverlangen nutzen Sie den Vorlagen-Assistenten unter **Vorlagen**.',
 19),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie funktioniert die Indexmiete in Rentably?',
 'faq-indexmiete',
 'Erklärung der automatischen Indexmiet-Berechnung.',
 '## Wie funktioniert die Indexmiete in Rentably?

Bei Indexmietverträgen koppelt sich die Miete an den Verbraucherpreisindex (VPI). Rentably automatisiert den Prozess:

1. Erstellen Sie einen Mietvertrag mit Miettyp **Indexmiete**.
2. Rentably überwacht monatlich den VPI des Statistischen Bundesamts.
3. Wenn eine Anpassung möglich ist, erhalten Sie ein Ticket mit der Berechnung.
4. Prüfen Sie den berechneten Betrag und erstellen Sie das Mieterhöhungsverlangen.
5. Versenden Sie das Schreiben an den Mieter.
6. Aktivieren Sie die neue Mietperiode.

Zwischen zwei Anpassungen muss mindestens ein Jahr liegen. Die Erhöhung gilt frühestens ab dem übernächsten Monat nach Zugang beim Mieter.',
 20),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Kann ich Belege und Quittungen zu Ausgaben hinzufügen?',
 'faq-belege-ausgaben',
 'So verknüpfen Sie Belege mit Ausgaben.',
 '## Kann ich Belege und Quittungen zu Ausgaben hinzufügen?

Ja. Beim Erfassen einer Ausgabe können Sie einen Beleg als Dokument anhängen:

1. Navigieren Sie zu **Finanzen → Ausgaben**.
2. Erstellen Sie eine neue Ausgabe oder öffnen Sie eine bestehende.
3. Im Bereich **Dokument** können Sie eine Datei hochladen (PDF, JPG, PNG).
4. Der Beleg wird automatisch mit der Ausgabe verknüpft und im Dokumentenbereich gespeichert.

**Tipp:** Scannen Sie Belege zeitnah und laden Sie sie direkt hoch. So haben Sie alle Unterlagen für die Steuererklärung griffbereit.',
 21),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie teile ich Dokumente mit meinen Mietern?',
 'faq-dokumente-teilen',
 'So machen Sie Dokumente im Mieterportal sichtbar.',
 '## Wie teile ich Dokumente mit meinen Mietern?

Sie können Dokumente im Mieterportal für Ihre Mieter freigeben:

1. Navigieren Sie zu **Dokumente**.
2. Öffnen Sie das gewünschte Dokument.
3. Aktivieren Sie die Option **Im Mieterportal teilen**.
4. Das Dokument ist nun für den zugeordneten Mieter im Portal sichtbar.

Mieter können geteilte Dokumente herunterladen, aber nicht bearbeiten. Typische geteilte Dokumente sind Betriebskostenabrechnungen, Hausordnungen und Vertragsdokumente.',
 22),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Mein Mieter kann sich nicht im Portal anmelden – was tun?',
 'faq-mieter-portal-probleme',
 'Hilfe bei Problemen mit dem Mieterportal-Zugang.',
 '## Mein Mieter kann sich nicht im Portal anmelden – was tun?

Prüfen Sie folgende Punkte:

1. **Portal aktiviert?** – Stellen Sie sicher, dass Sie das Portal für den Mieter aktiviert haben.
2. **E-Mail erhalten?** – Der Mieter sollte eine Einladungs-E-Mail erhalten haben. Bitten Sie ihn, den Spam-Ordner zu prüfen.
3. **Passwort vergessen?** – Auf der Mieter-Anmeldeseite gibt es die Option **Passwort vergessen**. Der Mieter kann dort sein Passwort zurücksetzen.
4. **Richtige URL?** – Das Mieterportal hat eine eigene Anmeldeseite. Stellen Sie sicher, dass der Mieter die korrekte URL verwendet.

Falls das Problem weiterhin besteht, können Sie das Portal deaktivieren und erneut aktivieren. Der Mieter erhält dann eine neue Einladung.',
 23),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie exportiere ich meine Finanzdaten?',
 'faq-finanzdaten-exportieren',
 'Möglichkeiten zum Export von Finanzdaten.',
 '## Wie exportiere ich meine Finanzdaten?

Rentably bietet verschiedene Exportmöglichkeiten:

- **Mietzahlungen** – Export als Excel-Datei unter Mieten → Export-Symbol
- **Ausgaben** – Export als Excel unter Finanzen → Ausgaben → Export
- **Anlage V** – Export als PDF unter Finanzen → Anlage V → PDF erstellen
- **Betriebskostenabrechnung** – Export als PDF bei jeder Abrechnung
- **Finanzanalyse** – Diagramme und Kennzahlen als PDF

Wählen Sie jeweils den gewünschten Zeitraum und das Objekt, bevor Sie den Export starten.',
 24),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie kontaktiere ich den Support?',
 'faq-support-kontakt',
 'So erreichen Sie das Rentably-Support-Team.',
 '## Wie kontaktiere ich den Support?

Sie erreichen das Rentably-Support-Team auf folgenden Wegen:

- **E-Mail**: hallo@rentab.ly
- **WhatsApp**: Über den Chat-Button in der Service-Seite
- **Kontaktformular**: Unter **Einstellungen → Service** in Ihrem Dashboard

**Erreichbarkeit:** Montag bis Freitag, 9:00 bis 18:00 Uhr

Wir antworten in der Regel innerhalb von 24 Stunden. Für dringende Anliegen empfehlen wir WhatsApp.',
 25)
ON CONFLICT (slug) DO NOTHING;
