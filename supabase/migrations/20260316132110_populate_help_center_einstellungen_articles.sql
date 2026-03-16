/*
  # Populate Help Center – Einstellungen (additional articles)

  Adds new articles to the "Einstellungen" category:
  - Briefversand einrichten (LetterXpress)
  - Abonnement und Tarife
  - Profil vervollständigen
  - Bankverbindung hinterlegen
  - Passwort ändern

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Briefversand einrichten (LetterXpress)',
 'briefversand-einrichten',
 'So verbinden Sie Ihren LetterXpress-Account für den Postversand aus Rentably.',
 '## Briefversand einrichten (LetterXpress)

Mit der LetterXpress-Integration können Sie Briefe direkt aus Rentably per Post versenden – ohne selbst drucken, kuvertieren und frankieren zu müssen.

### Voraussetzungen

Sie benötigen einen Account bei LetterXpress (www.letterxpress.de). Die Registrierung ist kostenlos, Sie zahlen nur für versendete Briefe.

### Schritt für Schritt

1. Navigieren Sie zu **Einstellungen → Briefversand**.
2. Geben Sie Ihren LetterXpress-Benutzernamen und API-Schlüssel ein.
3. Klicken Sie auf **Verbindung testen**.
4. Bei erfolgreicher Verbindung ist die Integration aktiv.

Ab sofort können Sie bei Dokumenten die Option **Als Brief versenden** nutzen.

### Versandoptionen

- **Standardbrief** – Normaler Briefversand
- **Einschreiben** – Mit Zustellnachweis
- **Farbdruck** – Farbige Ausdrucke statt Schwarz-Weiß

### Tipps

- Testen Sie die Verbindung mit einem Testbrief.
- Prüfen Sie die Empfängeradresse vor dem Versand.
- Versendete Briefe werden mit Status (in Bearbeitung, versendet, zugestellt) in Rentably dokumentiert.

### Häufige Fragen

**Was kostet der Briefversand?**
Die Kosten richten sich nach dem LetterXpress-Tarif. Ein Standardbrief kostet in der Regel unter 2 Euro inklusive Porto.',
 5),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Abonnement und Tarife verwalten',
 'abonnement-tarife',
 'Ein Überblick über die Tarife und die Verwaltung Ihres Abonnements.',
 '## Abonnement und Tarife verwalten

Rentably bietet verschiedene Tarife, die sich an Ihren Bedarf anpassen. Hier erfahren Sie, wie Sie Ihr Abonnement verwalten.

### Verfügbare Tarife

- **Free** – Grundfunktionen für Einsteiger, kostenlos
- **Pro** – Alle Funktionen für professionelle Vermieter

Der Pro-Tarif umfasst unter anderem:

- Bankimport und automatische Zuordnung
- Nachrichtensystem und E-Mail-Versand
- Mieterportal
- Briefversand per Post
- Dokumentenvorlagen mit Assistenten
- Mehrbenutzerverwaltung
- Erweiterte Finanzanalyse

### Schritt für Schritt

1. Navigieren Sie zu **Einstellungen → Rechnungen**.
2. Sie sehen Ihren aktuellen Tarif und den Zahlungsstatus.
3. Zum Upgraden klicken Sie auf **Zum Pro-Tarif wechseln**.
4. Wählen Sie die Laufzeit (monatlich oder jährlich).
5. Geben Sie Ihre Zahlungsdaten ein.
6. Bestätigen Sie den Kauf.

### Kündigung

1. Navigieren Sie zu **Einstellungen → Rechnungen**.
2. Klicken Sie auf **Abonnement verwalten**.
3. Wählen Sie **Kündigen**.
4. Das Abonnement läuft bis zum Ende der bezahlten Laufzeit weiter.

### Tipps

- Neue Accounts erhalten eine kostenlose Testphase für den Pro-Tarif.
- Beim Jahresabo sparen Sie gegenüber der monatlichen Zahlung.
- Nach der Kündigung wechselt der Account zurück auf den Free-Tarif.

### Häufige Fragen

**Verliere ich meine Daten bei einer Kündigung?**
Nein. Ihre Daten bleiben erhalten. Einige Pro-Funktionen sind dann nicht mehr verfügbar, aber alle Daten bleiben gespeichert.',
 6),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Profil vervollständigen',
 'profil-vervollstaendigen',
 'Warum ein vollständiges Profil wichtig ist und wie Sie es einrichten.',
 '## Profil vervollständigen

Ihr Profil enthält die Daten, die in Dokumenten, Abrechnungen und Briefen als Absender verwendet werden. Ein vollständiges Profil ist daher wichtig.

### Schritt für Schritt

1. Klicken Sie auf Ihr Profilbild oben rechts und wählen Sie **Profil**.
2. Ergänzen Sie folgende Daten:
   - Vor- und Nachname
   - Straße und Hausnummer
   - PLZ und Ort
   - Telefonnummer
   - E-Mail-Adresse
3. Optional: Laden Sie ein Profilbild hoch.
4. Speichern Sie die Änderungen.

### Warum ist das wichtig?

Ihre Profildaten werden verwendet in:

- Betriebskostenabrechnungen als Absenderadresse
- Mieterhöhungsverlangen und sonstigen Dokumenten
- Kündigungsschreiben und Mahnungen
- Briefversand per Post

### Tipps

- Der Fortschrittsbalken auf dem Dashboard zeigt, wie vollständig Ihr Profil ist.
- Halten Sie Ihre Daten aktuell, insbesondere nach einem Umzug.
- Als Profilbild empfehlen wir ein professionelles Foto oder Ihr Firmenlogo.

### Häufige Fragen

**Können andere mein Profil sehen?**
Ihre Profildaten werden nur in Dokumenten und Kommunikation verwendet, die Sie selbst versenden.',
 7),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Bankverbindung hinterlegen',
 'bankverbindung-hinterlegen',
 'So hinterlegen Sie Ihre Bankverbindung für Dokumente und Abrechnungen.',
 '## Bankverbindung hinterlegen

Ihre Bankverbindung wird in Dokumenten wie Betriebskostenabrechnungen, Mahnungen und Zahlungserinnerungen angezeigt.

### Schritt für Schritt

1. Navigieren Sie zu **Einstellungen → Profil**.
2. Scrollen Sie zum Bereich **Bankverbindung**.
3. Geben Sie ein:
   - Kontoinhaber
   - IBAN
   - BIC (optional)
   - Name der Bank
4. Speichern Sie die Angaben.

### Wo wird die Bankverbindung verwendet?

- Betriebskostenabrechnungen (für Nachzahlungen)
- Zahlungserinnerungen und Mahnungen
- Mieterhöhungsverlangen
- Sonstige Dokumente mit Zahlungsaufforderung

### Tipps

- Geben Sie die IBAN sorgfältig ein – sie wird auf allen Dokumenten mit Zahlungsaufforderung gedruckt.
- Sie können mehrere Bankverbindungen für verschiedene Objekte nutzen, indem Sie die Angaben bei Bedarf im Dokument anpassen.

### Häufige Fragen

**Wird meine IBAN für den Bankimport verwendet?**
Nein. Der Bankimport verwendet die Kontoauszugsdatei Ihrer Bank. Die hinterlegte IBAN dient nur der Anzeige in Dokumenten.',
 8),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Passwort ändern',
 'passwort-aendern',
 'So ändern Sie Ihr Passwort in Rentably.',
 '## Passwort ändern

Sie können Ihr Passwort jederzeit in den Profileinstellungen ändern.

### Schritt für Schritt

1. Navigieren Sie zu **Einstellungen → Profil**.
2. Scrollen Sie zum Bereich **Sicherheit** bzw. **Passwort**.
3. Geben Sie Ihr neues Passwort ein.
4. Bestätigen Sie das neue Passwort durch erneute Eingabe.
5. Klicken Sie auf **Passwort ändern**.

### Passwort vergessen?

Falls Sie Ihr Passwort vergessen haben:

1. Gehen Sie zur Anmeldeseite.
2. Klicken Sie auf **Passwort vergessen**.
3. Geben Sie Ihre E-Mail-Adresse ein.
4. Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen.
5. Klicken Sie auf den Link und vergeben Sie ein neues Passwort.

### Tipps

- Verwenden Sie ein sicheres Passwort mit mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie Zahlen.
- Verwenden Sie ein einzigartiges Passwort, das Sie nicht für andere Dienste nutzen.
- Nutzen Sie einen Passwort-Manager für sichere Passwortverwaltung.

### Häufige Fragen

**Der Link zum Zurücksetzen funktioniert nicht.**
Der Link ist 24 Stunden gültig. Fordern Sie bei Bedarf einen neuen Link an. Prüfen Sie auch den Spam-Ordner.',
 9)
ON CONFLICT (slug) DO NOTHING;
