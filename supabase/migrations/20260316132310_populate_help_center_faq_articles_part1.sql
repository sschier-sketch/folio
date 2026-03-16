/*
  # Populate Help Center – FAQ Articles (Part 1)

  Adds 12 individual FAQ articles to the "Häufige Fragen" category.
  Each FAQ is a short, focused answer to a common support question.
  
  Existing FAQ overview article is NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Ist Rentably kostenlos nutzbar?',
 'faq-kostenlos',
 'Informationen zu den kostenlosen Funktionen von Rentably.',
 '## Ist Rentably kostenlos nutzbar?

Ja, Rentably bietet einen dauerhaft kostenlosen Free-Tarif. Damit können Sie:

- Unbegrenzt viele Immobilien und Einheiten anlegen
- Mieter und Mietverträge verwalten
- Mietzahlungen nachverfolgen
- Dokumente hochladen und verwalten
- Grundlegende Finanzübersicht nutzen

Für erweiterte Funktionen wie Bankimport, Nachrichtensystem, Mieterportal, Briefversand und Mehrbenutzerverwaltung steht der Pro-Tarif zur Verfügung. Neue Accounts erhalten automatisch eine kostenlose Testphase für alle Pro-Funktionen.',
 2),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wo werden meine Daten gespeichert?',
 'faq-datenspeicherung',
 'Informationen zum Datenschutz und Speicherort Ihrer Daten.',
 '## Wo werden meine Daten gespeichert?

Alle Ihre Daten werden auf Servern in Deutschland gespeichert. Rentably ist DSGVO-konform und verwendet ausschließlich verschlüsselte Verbindungen (SSL/TLS).

Ihre Daten werden regelmäßig gesichert und sind vor unbefugtem Zugriff geschützt. Rentably gibt keine personenbezogenen Daten an Dritte weiter, es sei denn, dies ist für die Erbringung der Dienstleistung erforderlich (z.B. Briefversand über LetterXpress).',
 3),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Kann ich mein Abonnement jederzeit kündigen?',
 'faq-kuendigung-abo',
 'Informationen zur Kündigung Ihres Rentably-Abonnements.',
 '## Kann ich mein Abonnement jederzeit kündigen?

Ja, Sie können Ihr Pro-Abonnement jederzeit kündigen. Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam.

So kündigen Sie:

1. Navigieren Sie zu **Einstellungen → Rechnungen**.
2. Klicken Sie auf **Abonnement verwalten**.
3. Wählen Sie **Kündigen**.

Nach der Kündigung können Sie Rentably weiterhin im kostenlosen Free-Tarif nutzen. Alle Ihre Daten bleiben erhalten – Sie verlieren lediglich den Zugriff auf die Pro-Funktionen.',
 4),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie viele Immobilien kann ich verwalten?',
 'faq-anzahl-immobilien',
 'Gibt es ein Limit für die Anzahl der Immobilien?',
 '## Wie viele Immobilien kann ich verwalten?

Es gibt kein Limit. Sie können im Free- und im Pro-Tarif unbegrenzt viele Immobilien und Einheiten anlegen.

Rentably ist für Vermieter mit einer einzelnen Wohnung genauso geeignet wie für Vermieter mit einem großen Portfolio. Die Übersichtsfunktionen und Filter helfen Ihnen, auch bei vielen Objekten den Überblick zu behalten.',
 5),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Kann ich mehrere Mieter pro Einheit haben?',
 'faq-mehrere-mieter',
 'Wie verwalte ich Wohngemeinschaften und Mitmieter?',
 '## Kann ich mehrere Mieter pro Einheit haben?

Ja. Rentably unterstützt mehrere Vertragspartner pro Mietvertrag. So gehen Sie vor:

1. Erstellen Sie den Mietvertrag mit dem Hauptmieter.
2. Öffnen Sie den Vertrag und gehen Sie zum Bereich **Vertragspartner**.
3. Fügen Sie weitere Vertragspartner hinzu.

Alle Vertragspartner werden in Dokumenten und Abrechnungen berücksichtigt. Bei Wohngemeinschaften empfiehlt es sich, einen Hauptmieter als Ansprechpartner festzulegen.',
 6),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Unterstützt Rentably die Steuererklärung?',
 'faq-steuererklaerung',
 'Wie hilft Rentably bei der Anlage V?',
 '## Unterstützt Rentably die Steuererklärung?

Ja. Rentably berechnet automatisch die relevanten Werte für die Anlage V (Einkünfte aus Vermietung und Verpachtung). Dazu gehören:

- Mieteinnahmen
- Werbungskosten (AfA, Zinsen, Nebenkosten, Reparaturen)
- Umlagefähige und nicht umlagefähige Kosten
- Überschuss oder Verlust

Navigieren Sie zu **Finanzen → Anlage V**, um die Berechnung einzusehen und als PDF zu exportieren. Voraussetzung ist, dass Sie Ausgaben kategorisiert und die AfA-Einstellungen konfiguriert haben.',
 7),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Welche Browser werden unterstützt?',
 'faq-browser',
 'Systemanforderungen und unterstützte Browser.',
 '## Welche Browser werden unterstützt?

Rentably funktioniert in allen modernen Webbrowsern:

- Google Chrome (empfohlen)
- Mozilla Firefox
- Apple Safari
- Microsoft Edge

Wir empfehlen, immer die aktuelle Browserversion zu verwenden. Der Internet Explorer wird nicht unterstützt. Rentably ist als Webanwendung konzipiert und erfordert keine Installation.',
 8),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Gibt es eine mobile App?',
 'faq-mobile-app',
 'Kann ich Rentably auf dem Smartphone nutzen?',
 '## Gibt es eine mobile App?

Rentably ist als responsive Webanwendung entwickelt und passt sich automatisch an alle Bildschirmgrößen an – vom Smartphone über das Tablet bis zum Desktop.

Sie können Rentably auf Ihrem Smartphone über den Browser nutzen, ohne eine App zu installieren. Alle Funktionen stehen auch mobil zur Verfügung.

**Tipp:** Fügen Sie Rentably als Lesezeichen auf Ihrem Startbildschirm hinzu, um schnell darauf zugreifen zu können.',
 9),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie setze ich mein Passwort zurück?',
 'faq-passwort-zuruecksetzen',
 'Anleitung zum Zurücksetzen des Passworts.',
 '## Wie setze ich mein Passwort zurück?

Falls Sie Ihr Passwort vergessen haben:

1. Gehen Sie zur Anmeldeseite von Rentably.
2. Klicken Sie auf **Passwort vergessen?**.
3. Geben Sie die E-Mail-Adresse ein, mit der Sie sich registriert haben.
4. Prüfen Sie Ihr E-Mail-Postfach (auch den Spam-Ordner).
5. Klicken Sie auf den Link in der E-Mail.
6. Vergeben Sie ein neues Passwort.

Der Link ist 24 Stunden gültig. Falls er abgelaufen ist, fordern Sie einfach einen neuen an.',
 10),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Wie lade ich Dokumente hoch?',
 'faq-dokumente-hochladen',
 'Kurzanleitung zum Hochladen von Dokumenten.',
 '## Wie lade ich Dokumente hoch?

So laden Sie Dokumente in Rentably hoch:

1. Navigieren Sie zu **Dokumente**.
2. Klicken Sie auf **Hochladen**.
3. Wählen Sie die Datei von Ihrem Gerät.
4. Ordnen Sie das Dokument einem Objekt, einer Einheit oder einem Mieter zu.
5. Wählen Sie den Dokumententyp (z.B. Mietvertrag, Rechnung, Beleg).
6. Klicken Sie auf **Speichern**.

Unterstützte Formate: PDF, JPG, PNG, Word-Dokumente und Excel-Dateien. Die maximale Dateigröße beträgt 10 MB pro Dokument.',
 11),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Kann ich Daten aus einer anderen Software importieren?',
 'faq-datenimport',
 'Möglichkeiten zum Import bestehender Daten.',
 '## Kann ich Daten aus einer anderen Software importieren?

Rentably bietet einen Bankimport für Finanztransaktionen (CSV und CAMT053). Für Immobilien- und Mieterdaten empfehlen wir die manuelle Eingabe, da jede Software ein anderes Format verwendet.

So gehen Sie am besten vor:

1. Legen Sie Ihre Objekte und Einheiten manuell an.
2. Erstellen Sie die Mieter und Mietverträge.
3. Importieren Sie Banktransaktionen über den CSV-Import.
4. Laden Sie bestehende Dokumente in den Dokumentenbereich hoch.

**Tipp:** Beginnen Sie mit dem aktuellen Monat und tragen Sie historische Daten nach Bedarf nach.',
 12),

((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Was passiert mit meinen Daten bei einer Kündigung?',
 'faq-daten-kuendigung',
 'Datenzugriff nach Beendigung des Pro-Abonnements.',
 '## Was passiert mit meinen Daten bei einer Kündigung?

Ihre Daten gehen nicht verloren. Bei Kündigung des Pro-Abonnements:

- Ihr Account wechselt automatisch in den kostenlosen Free-Tarif.
- Alle Daten (Immobilien, Mieter, Verträge, Dokumente) bleiben vollständig erhalten.
- Pro-Funktionen (Bankimport, Nachrichten, Mieterportal) sind nicht mehr verfügbar.
- Sie können jederzeit wieder auf den Pro-Tarif upgraden und haben dann sofort wieder Zugriff auf alle Funktionen.

Rentably löscht keine Benutzerdaten bei einer Tarifänderung.',
 13)
ON CONFLICT (slug) DO NOTHING;
