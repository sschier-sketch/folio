/*
  # Populate Help Center – Immobilienverwaltung (additional articles)

  Adds new articles to the "Immobilienverwaltung" category:
  - Mehrere Immobilien verwalten
  - Objektfotos und Bilder verwalten
  - Kontakte und Ansprechpartner
  - Objektstatistiken und Kennzahlen

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Mehrere Immobilien verwalten',
 'mehrere-immobilien-verwalten',
 'So behalten Sie den Überblick, wenn Sie mehrere Objekte besitzen.',
 '## Mehrere Immobilien verwalten

Rentably ist darauf ausgelegt, beliebig viele Objekte parallel zu verwalten. Egal ob zwei Wohnungen oder zwanzig Häuser – die Struktur bleibt übersichtlich.

### Funktionsbeschreibung

Jedes Objekt hat seinen eigenen Bereich mit Einheiten, Mietern, Dokumenten und Finanzdaten. Über das Dashboard sehen Sie alle Objekte auf einen Blick.

### Schritt für Schritt

1. Navigieren Sie zu **Immobilien**.
2. Klicken Sie auf **Neues Objekt** für jede weitere Immobilie.
3. Legen Sie die Einheiten pro Objekt an.
4. Weisen Sie Mieter und Verträge den jeweiligen Einheiten zu.

In der Immobilienübersicht sehen Sie alle Objekte mit Status, Belegung und offenen Aufgaben.

### Tipps

- Nutzen Sie Labels und Etiketten, um Objekte zu kategorisieren (z.B. nach Stadt oder Verwaltungsart).
- Die Finanzanalyse erlaubt einen direkten Vergleich zwischen Ihren Objekten.
- Filtern Sie auf dem Dashboard nach einzelnen Objekten, um gezielt Informationen abzurufen.

### Häufige Fragen

**Gibt es ein Limit für die Anzahl meiner Objekte?**
Nein. Sie können unbegrenzt viele Objekte und Einheiten anlegen, auch im kostenlosen Tarif.',
 4),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Objektfotos und Bilder verwalten',
 'objektfotos-verwalten',
 'So laden Sie Fotos für Ihre Immobilien hoch und verwalten diese.',
 '## Objektfotos und Bilder verwalten

Dokumentieren Sie den Zustand Ihrer Immobilien mit Fotos. Bilder können pro Objekt und Einheit hinterlegt werden.

### Schritt für Schritt

1. Öffnen Sie ein Objekt und wechseln Sie zum Tab **Fotos**.
2. Klicken Sie auf **Foto hochladen**.
3. Wählen Sie ein oder mehrere Bilder von Ihrem Gerät.
4. Die Bilder werden automatisch gespeichert.
5. Sie können ein Titelbild festlegen, das in der Objektübersicht angezeigt wird.

### Tipps

- Fotografieren Sie den Zustand vor und nach jedem Mieterwechsel.
- Fotos dienen als Nachweis bei Übergabeprotokollen.
- Unterstützte Formate sind JPG, PNG und WebP.

### Häufige Fragen

**Gibt es ein Limit für die Dateigröße?**
Einzelne Bilder dürfen bis zu 10 MB groß sein. Wir empfehlen eine Auflösung von 1920x1080 Pixeln.',
 5),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Kontakte und Ansprechpartner pflegen',
 'kontakte-ansprechpartner',
 'Verwalten Sie Kontaktpersonen wie Hausmeister, Handwerker und Hausverwaltungen.',
 '## Kontakte und Ansprechpartner pflegen

Zu jedem Objekt können Sie Kontakte hinterlegen – z.B. den Hausmeister, Handwerker oder die Hausverwaltung.

### Schritt für Schritt

1. Öffnen Sie ein Objekt und wechseln Sie zum Tab **Kontakte**.
2. Klicken Sie auf **Kontakt hinzufügen**.
3. Geben Sie Name, Rolle, Telefon und E-Mail ein.
4. Optional können Sie Erreichbarkeitszeiten angeben.
5. Speichern Sie den Kontakt.

### Tipps

- Hinterlegen Sie für jedes Objekt mindestens einen Notfallkontakt.
- Kontakte können mehreren Objekten zugeordnet werden.
- Die Kontaktdaten sind auch im Mieterportal sichtbar, wenn Sie dies aktivieren.

### Häufige Fragen

**Können Mieter die Kontakte sehen?**
Nur wenn Sie das Mieterportal aktiviert haben und die Kontakte dort sichtbar geschaltet sind.',
 6),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Objektstatistiken und Kennzahlen',
 'objektstatistiken',
 'Verstehen Sie die Kennzahlen und Statistiken Ihrer Immobilien.',
 '## Objektstatistiken und Kennzahlen

Rentably zeigt Ihnen für jedes Objekt wichtige Kennzahlen wie Belegungsquote, Mieteinnahmen und Rendite.

### Funktionsbeschreibung

Im Überblick-Tab eines Objekts finden Sie:

- **Belegungsquote** – Anteil der vermieteten Einheiten
- **Mieteinnahmen** – Summe der monatlichen Kaltmieten und Gesamtmieten
- **Leerstand** – Anzahl der unvermieteten Einheiten
- **Fläche** – Gesamtfläche und vermietete Fläche
- **Darlehen** – Verknüpfte Finanzierungen und Restschuld

### Schritt für Schritt

1. Öffnen Sie ein Objekt.
2. Im Tab **Übersicht** sehen Sie die wichtigsten Kennzahlen.
3. Wechseln Sie zu **Einheiten** für Details zu jeder Mieteinheit.
4. Unter **Finanzen → Analyse** finden Sie objektübergreifende Vergleiche.

### Tipps

- Überprüfen Sie regelmäßig die Belegungsquote, um Leerstand frühzeitig zu erkennen.
- Nutzen Sie die Finanzanalyse, um die Rendite Ihrer Objekte zu vergleichen.

### Häufige Fragen

**Warum werden keine Statistiken angezeigt?**
Statistiken werden erst berechnet, wenn mindestens eine Einheit und ein Mietvertrag vorhanden sind.',
 7),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Ausstattung und Merkmale erfassen',
 'ausstattung-merkmale',
 'So dokumentieren Sie die Ausstattung Ihrer Immobilien und Einheiten.',
 '## Ausstattung und Merkmale erfassen

Dokumentieren Sie die Ausstattung Ihrer Objekte und Einheiten – von der Heizungsart bis zur Einbauküche.

### Schritt für Schritt

1. Öffnen Sie ein Objekt und wechseln Sie zum Tab **Ausstattung**.
2. Wählen Sie die vorhandenen Ausstattungsmerkmale aus den Kategorien:
   - Heizung (z.B. Zentralheizung, Fußbodenheizung)
   - Böden (z.B. Parkett, Fliesen, Laminat)
   - Bad (z.B. Badewanne, Dusche, Gäste-WC)
   - Küche (z.B. Einbauküche, Küchenzeile)
   - Extras (z.B. Balkon, Terrasse, Aufzug, Keller)
3. Speichern Sie die Auswahl.

### Tipps

- Eine vollständige Ausstattungsliste hilft bei der Neuvermietung.
- Die Angaben werden auch in Exposés und Übergabeprotokollen verwendet.
- Aktualisieren Sie die Ausstattung nach Modernisierungen.

### Häufige Fragen

**Wird die Ausstattung in Inseraten verwendet?**
Die Ausstattungsdaten stehen für zukünftige Exposé-Funktionen bereit. Aktuell dienen sie der internen Dokumentation.',
 8)
ON CONFLICT (slug) DO NOTHING;
