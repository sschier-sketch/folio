/*
  # Create Help Center System

  1. New Tables
    - `help_categories`
      - `id` (uuid, primary key)
      - `name` (text) - category display name
      - `slug` (text, unique) - URL-safe identifier
      - `description` (text) - short description
      - `icon` (text) - Lucide icon name
      - `sort_order` (integer) - display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `help_articles`
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK -> help_categories)
      - `title` (text) - article title
      - `slug` (text, unique) - URL-safe identifier
      - `excerpt` (text) - short summary
      - `content` (text) - full article content (markdown/HTML)
      - `status` (text) - draft or published
      - `sort_order` (integer) - display order within category
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public SELECT for published articles
    - Admin-only INSERT/UPDATE/DELETE

  3. Indexes
    - Unique slug on both tables
    - Category FK index on articles
    - Full-text search index on articles

  4. Initial Data
    - 9 categories with German names
    - 27 starter articles across all categories
*/

-- help_categories
CREATE TABLE IF NOT EXISTS help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'folder',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read help categories"
  ON help_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert help categories"
  ON help_categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update help categories"
  ON help_categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete help categories"
  ON help_categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- help_articles
CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_articles_category_id ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_status ON help_articles(status);

ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published help articles"
  ON help_articles FOR SELECT
  USING (status = 'published' OR (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  ));

CREATE POLICY "Admins can insert help articles"
  ON help_articles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update help articles"
  ON help_articles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete help articles"
  ON help_articles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Insert categories
INSERT INTO help_categories (name, slug, description, icon, sort_order) VALUES
  ('Allgemein', 'allgemein', 'Einführung, erste Schritte und Dashboard-Überblick', 'info', 1),
  ('Immobilienverwaltung', 'immobilienverwaltung', 'Objekte anlegen, Einheiten verwalten und Immobilienstruktur', 'building-2', 2),
  ('Mietverwaltung', 'mietverwaltung', 'Mietverträge, Mieter und Vertragsänderungen', 'users', 3),
  ('Finanzen', 'finanzen', 'Mieteingänge, Nebenkosten, Bankimport und Ausgaben', 'wallet', 4),
  ('Kommunikation', 'kommunikation', 'Nachrichten, Dokumente, Briefe und E-Mails', 'mail', 5),
  ('Automatisierungen', 'automatisierungen', 'Erinnerungen, Mahnungen und automatische Funktionen', 'zap', 6),
  ('Berichte & Auswertungen', 'berichte-auswertungen', 'Finanzanalyse, Reports und Exportfunktionen', 'bar-chart-3', 7),
  ('Einstellungen', 'einstellungen', 'Benutzerverwaltung, Rechte, Account und Integrationen', 'settings', 8),
  ('Häufige Fragen', 'haeufige-fragen', 'Antworten auf die meistgestellten Fragen', 'help-circle', 9)
ON CONFLICT (slug) DO NOTHING;

-- Insert articles
-- Allgemein
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Was ist Rentably?',
 'was-ist-rentably',
 'Erfahren Sie, was Rentably ist und wie es Ihnen bei der Immobilienverwaltung hilft.',
 '## Was ist Rentably?

Rentably ist eine moderne Immobilienverwaltungssoftware, die speziell für private Vermieter entwickelt wurde. Mit Rentably verwalten Sie Ihre Immobilien, Mieter, Finanzen und Dokumente an einem zentralen Ort.

### Funktionsübersicht

Rentably bietet Ihnen folgende Kernfunktionen:

- **Immobilienverwaltung** – Objekte und Einheiten strukturiert verwalten
- **Mieterverwaltung** – Mietverträge, Mieterdaten und Kommunikation
- **Finanzverwaltung** – Mieteingänge, Ausgaben, Nebenkosten und Bankimport
- **Dokumentenmanagement** – Alle Dokumente zentral speichern und verwalten
- **Kommunikation** – Nachrichten und Briefe direkt aus der Plattform versenden
- **Automatisierungen** – Erinnerungen und Mahnungen automatisch erstellen

### Tipps

- Nutzen Sie das Dashboard als zentrale Übersicht über alle wichtigen Kennzahlen.
- Starten Sie mit dem Anlegen Ihrer Immobilien, bevor Sie Mieter zuweisen.

### Häufige Probleme

**Ich bin unsicher, wo ich anfangen soll.**
Beginnen Sie mit dem Artikel "Erste Schritte mit Rentably" – dort finden Sie eine Schritt-für-Schritt-Anleitung.',
 1),

((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Erste Schritte mit Rentably',
 'erste-schritte',
 'So starten Sie mit Rentably – eine Schritt-für-Schritt-Anleitung für Einsteiger.',
 '## Erste Schritte mit Rentably

Nach der Registrierung führen wir Sie Schritt für Schritt durch die wichtigsten Einrichtungsschritte.

### Schritt-für-Schritt-Anleitung

1. **Profil vervollständigen** – Gehen Sie zu Einstellungen und ergänzen Sie Ihre Adresse und Kontaktdaten.
2. **Erste Immobilie anlegen** – Klicken Sie auf "Immobilien" und dann auf "Neues Objekt".
3. **Einheiten erstellen** – Fügen Sie innerhalb des Objekts Ihre Wohneinheiten hinzu.
4. **Mieter anlegen** – Navigieren Sie zu "Mieter" und erstellen Sie einen neuen Mieter.
5. **Mietvertrag erstellen** – Verknüpfen Sie den Mieter über einen Mietvertrag mit einer Einheit.
6. **Mieten verwalten** – Unter "Zahlungen" sehen Sie die automatisch generierten Mietzahlungen.

### Tipps

- Vervollständigen Sie zuerst Ihr Profil – diese Daten werden in Dokumenten und Briefen verwendet.
- Nutzen Sie die Profilabschluss-Karte auf dem Dashboard als Leitfaden.

### Häufige Probleme

**Mein Dashboard zeigt keine Daten an.**
Das Dashboard füllt sich automatisch, sobald Sie Immobilien und Mieter angelegt haben.',
 2),

((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Das Dashboard verstehen',
 'dashboard-verstehen',
 'Lernen Sie die wichtigsten Elemente des Dashboards kennen.',
 '## Das Dashboard verstehen

Das Dashboard ist Ihre zentrale Anlaufstelle in Rentably. Hier sehen Sie alle wichtigen Kennzahlen auf einen Blick.

### Funktionsbeschreibung

Das Dashboard zeigt Ihnen:

- **Immobilienübersicht** – Anzahl Ihrer Objekte und Einheiten
- **Mieterstatus** – Aktive Mieter und offene Verträge
- **Finanzübersicht** – Aktuelle Einnahmen und Ausgaben
- **Offene Aufgaben** – Überfällige Zahlungen und anstehende Termine
- **Letzte Aktivitäten** – Ihre neuesten Aktionen in der Plattform

### Schritt-für-Schritt-Anleitung

1. Melden Sie sich an – Sie landen automatisch auf dem Dashboard.
2. Überprüfen Sie die Kennzahlen-Karten im oberen Bereich.
3. Scrollen Sie nach unten für detaillierte Statistiken und offene Aufgaben.

### Tipps

- Klicken Sie auf die Karten, um direkt zur jeweiligen Funktion zu gelangen.
- Das Dashboard aktualisiert sich automatisch bei neuen Daten.',
 3);

-- Immobilienverwaltung
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Objekt anlegen',
 'objekt-anlegen',
 'So legen Sie ein neues Immobilienobjekt in Rentably an.',
 '## Objekt anlegen

Ein Objekt in Rentably repräsentiert eine Immobilie – zum Beispiel ein Mehrfamilienhaus, eine Eigentumswohnung oder ein Gewerbeobjekt.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Immobilien** in der linken Seitenleiste.
2. Klicken Sie auf **Neues Objekt**.
3. Geben Sie die Adresse ein (Straße, Hausnummer, PLZ, Ort).
4. Wählen Sie den Objekttyp (z.B. Mehrfamilienhaus, Eigentumswohnung).
5. Optional: Ergänzen Sie das Baujahr und die Grundstücksgröße.
6. Klicken Sie auf **Speichern**.

### Tipps

- Sie können dem Objekt anschließend Fotos hinzufügen.
- Legen Sie nach dem Objekt direkt die Einheiten an.

### Häufige Probleme

**Ich kann kein Objekt anlegen.**
Stellen Sie sicher, dass alle Pflichtfelder (Adresse) ausgefüllt sind.',
 1),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Einheiten verwalten',
 'einheiten-verwalten',
 'Erfahren Sie, wie Sie Einheiten innerhalb eines Objekts erstellen und verwalten.',
 '## Einheiten verwalten

Einheiten sind die einzelnen Mieteinheiten innerhalb eines Objekts – z.B. Wohnungen, Gewerbeeinheiten oder Stellplätze.

### Schritt-für-Schritt-Anleitung

1. Öffnen Sie ein bestehendes Objekt.
2. Wechseln Sie zum Tab **Einheiten**.
3. Klicken Sie auf **Neue Einheit**.
4. Geben Sie die Bezeichnung ein (z.B. "Wohnung EG links").
5. Tragen Sie Fläche, Zimmeranzahl und Stockwerk ein.
6. Wählen Sie den Status (vermietet, leer, eigengenutzt).
7. Klicken Sie auf **Speichern**.

### Tipps

- Nutzen Sie aussagekräftige Bezeichnungen für Ihre Einheiten.
- Der Status wird automatisch aktualisiert, wenn ein Mietvertrag beginnt oder endet.

### Häufige Probleme

**Die Einheit zeigt den falschen Status.**
Überprüfen Sie, ob ein aktiver Mietvertrag für diese Einheit existiert.',
 2),

((SELECT id FROM help_categories WHERE slug = 'immobilienverwaltung'),
 'Immobilienstruktur verstehen',
 'immobilienstruktur',
 'Verstehen Sie die Hierarchie von Objekten, Einheiten und Mietverträgen.',
 '## Immobilienstruktur verstehen

Rentably organisiert Ihre Immobilien in einer klaren Hierarchie: Objekt → Einheit → Mietvertrag → Mieter.

### Funktionsbeschreibung

- **Objekt**: Die physische Immobilie (z.B. Mehrfamilienhaus in der Musterstraße 1)
- **Einheit**: Eine vermietbare Einheit innerhalb des Objekts (z.B. Wohnung 1. OG)
- **Mietvertrag**: Der Vertrag zwischen Ihnen und dem Mieter für eine bestimmte Einheit
- **Mieter**: Die Person, die den Mietvertrag unterzeichnet hat

### Tipps

- Ein Objekt kann beliebig viele Einheiten haben.
- Eine Einheit kann immer nur einen aktiven Mietvertrag haben.
- Ein Mieter kann mehrere Verträge haben (z.B. Wohnung + Stellplatz).',
 3);

-- Mietverwaltung
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Mietvertrag erstellen',
 'mietvertrag-erstellen',
 'So erstellen Sie einen neuen Mietvertrag in Rentably.',
 '## Mietvertrag erstellen

Ein Mietvertrag verbindet einen Mieter mit einer Einheit und definiert Mietkonditionen.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Mieter** in der Seitenleiste.
2. Wählen Sie einen bestehenden Mieter oder legen Sie einen neuen an.
3. Klicken Sie auf **Vertrag hinzufügen**.
4. Wählen Sie das Objekt und die Einheit.
5. Geben Sie die Vertragsdaten ein:
   - Vertragsbeginn
   - Kaltmiete
   - Nebenkosten-Vorauszahlung
   - Kaution
6. Klicken Sie auf **Speichern**.

### Tipps

- Mieterhöhungen können Sie direkt im Vertrag als neue Mietperiode anlegen.
- Bei Indexmieten wird die Berechnung automatisch durchgeführt.

### Häufige Probleme

**Es werden keine Mietzahlungen generiert.**
Stellen Sie sicher, dass das Mietbeginn-Datum in der Vergangenheit oder Gegenwart liegt.',
 1),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Mieter anlegen und verwalten',
 'mieter-verwalten',
 'So legen Sie neue Mieter an und verwalten bestehende Mieterdaten.',
 '## Mieter anlegen und verwalten

In Rentably verwalten Sie alle Mieterdaten zentral – von Kontaktdaten bis zum Mietvertrag.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Mieter**.
2. Klicken Sie auf **Neuer Mieter**.
3. Geben Sie die Daten ein:
   - Vor- und Nachname
   - E-Mail-Adresse
   - Telefonnummer
   - IBAN (optional, für Bankimport-Zuordnung)
4. Klicken Sie auf **Speichern**.
5. Anschließend können Sie einen Mietvertrag zuweisen.

### Tipps

- Hinterlegen Sie die IBAN des Mieters – so können Mietzahlungen beim Bankimport automatisch zugeordnet werden.
- Über das Mieterportal können Mieter ihre eigenen Daten einsehen.

### Häufige Probleme

**Ich kann den Mieter nicht löschen.**
Mieter mit aktiven Verträgen können nicht gelöscht werden. Beenden Sie zuerst den Vertrag.',
 2),

((SELECT id FROM help_categories WHERE slug = 'mietverwaltung'),
 'Vertragsänderungen und Mieterhöhungen',
 'vertragsaenderungen',
 'Erfahren Sie, wie Sie Mieterhöhungen und Vertragsänderungen durchführen.',
 '## Vertragsänderungen und Mieterhöhungen

Rentably unterstützt verschiedene Arten von Mietanpassungen, einschließlich Indexmiete.

### Schritt-für-Schritt-Anleitung

1. Öffnen Sie den Mietvertrag des Mieters.
2. Wechseln Sie zum Tab **Miethistorie**.
3. Klicken Sie auf **Neue Mietperiode**.
4. Geben Sie die neue Kaltmiete und das Gültigkeitsdatum ein.
5. Speichern Sie die Änderung.

Die Mietzahlungen werden automatisch ab dem neuen Datum angepasst.

### Tipps

- Bei Indexmietverträgen berechnet Rentably den Anpassungsbetrag automatisch.
- Alle Änderungen werden in der Miethistorie dokumentiert.

### Häufige Probleme

**Die neue Miete wird nicht angewendet.**
Prüfen Sie, ob das Gültigkeitsdatum korrekt gesetzt und die Periode aktiv ist.',
 3);

-- Finanzen
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Mieteingänge verwalten',
 'mieteingaenge-verwalten',
 'So behalten Sie den Überblick über Mieteingänge und offene Zahlungen.',
 '## Mieteingänge verwalten

Rentably generiert automatisch monatliche Mietzahlungen basierend auf Ihren Mietverträgen.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Zahlungen** in der Seitenleiste.
2. Sie sehen eine Übersicht aller Mietzahlungen nach Monat.
3. Markieren Sie eingegangene Zahlungen als **Bezahlt**.
4. Bei Teilzahlungen können Sie den tatsächlich erhaltenen Betrag eintragen.

### Tipps

- Nutzen Sie den Bankimport, um Zahlungen automatisch zuzuordnen.
- Überfällige Zahlungen werden rot markiert.

### Häufige Probleme

**Es fehlen Mietzahlungen.**
Prüfen Sie, ob der Mietvertrag ein gültiges Startdatum hat und aktiv ist.',
 1),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Bankimport nutzen',
 'bankimport-nutzen',
 'Importieren Sie Kontoauszüge, um Mietzahlungen automatisch zuzuordnen.',
 '## Bankimport nutzen

Mit dem Bankimport laden Sie Ihre Kontoauszüge hoch und ordnen Transaktionen automatisch Mietern zu.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Finanzen → Bankverbindung**.
2. Klicken Sie auf **Import starten**.
3. Wählen Sie das Dateiformat (CSV oder CAMT053).
4. Laden Sie Ihre Datei hoch.
5. Rentably analysiert die Transaktionen und schlägt Zuordnungen vor.
6. Prüfen und bestätigen Sie die Zuordnungen.

### Tipps

- Hinterlegen Sie die IBAN Ihrer Mieter für eine bessere automatische Erkennung.
- Bereits zugeordnete Transaktionen werden bei zukünftigen Imports erkannt.

### Häufige Probleme

**Meine CSV-Datei wird nicht erkannt.**
Stellen Sie sicher, dass die Datei das richtige Format hat. Nutzen Sie die Spalten-Zuordnung, um Ihr Format anzupassen.',
 2),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Nebenkosten erfassen',
 'nebenkosten-erfassen',
 'Erfahren Sie, wie Sie Nebenkosten erfassen und Abrechnungen erstellen.',
 '## Nebenkosten erfassen

Rentably unterstützt die vollständige Betriebskostenabrechnung nach deutschem Mietrecht.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Abrechnungen → Betriebskosten**.
2. Klicken Sie auf **Neue Abrechnung**.
3. Wählen Sie das Objekt und den Abrechnungszeitraum.
4. Erfassen Sie die einzelnen Kostenpositionen.
5. Wählen Sie den Verteilerschlüssel (z.B. nach Fläche, Personen).
6. Prüfen Sie die Vorschau und versenden Sie die Abrechnung.

### Tipps

- Nutzen Sie Vorlagen, um wiederkehrende Kostenarten schnell zu erfassen.
- Die Abrechnung kann als PDF exportiert und per Post versendet werden.

### Häufige Probleme

**Die Umlageschlüssel sind falsch.**
Überprüfen Sie die Flächen- und Personenangaben in den Einheiten und Mietverträgen.',
 3),

((SELECT id FROM help_categories WHERE slug = 'finanzen'),
 'Ausgaben verwalten',
 'ausgaben-verwalten',
 'So erfassen und kategorisieren Sie Ausgaben für Ihre Immobilien.',
 '## Ausgaben verwalten

Erfassen Sie alle Ausgaben rund um Ihre Immobilien – von Reparaturen bis zu Versicherungen.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Finanzen → Ausgaben**.
2. Klicken Sie auf **Neue Ausgabe**.
3. Wählen Sie das Objekt und optional die Einheit.
4. Wählen Sie die Kategorie und den Kontenrahmen.
5. Geben Sie Betrag, Datum und Beschreibung ein.
6. Optional: Laden Sie einen Beleg hoch.
7. Klicken Sie auf **Speichern**.

### Tipps

- Kategorisieren Sie Ausgaben sorgfältig – dies hilft bei der Steuererklärung (Anlage V).
- Verknüpfen Sie Ausgaben mit dem Bankimport, um doppelte Erfassung zu vermeiden.',
 4);

-- Kommunikation
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Nachrichten senden und empfangen',
 'nachrichten-senden',
 'So nutzen Sie das Nachrichtensystem in Rentably.',
 '## Nachrichten senden und empfangen

Mit dem integrierten E-Mail-System von Rentably kommunizieren Sie direkt mit Ihren Mietern.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Nachrichten** in der Seitenleiste.
2. Klicken Sie auf **Neue Nachricht**.
3. Wählen Sie den Empfänger (Mieter oder externe E-Mail).
4. Verfassen Sie Ihren Text.
5. Optional: Fügen Sie Anhänge hinzu.
6. Klicken Sie auf **Senden**.

### Tipps

- Nutzen Sie E-Mail-Vorlagen für wiederkehrende Nachrichten.
- Alle Nachrichten werden automatisch archiviert.

### Häufige Probleme

**Mein Mieter erhält keine E-Mails.**
Prüfen Sie, ob die E-Mail-Adresse des Mieters korrekt hinterlegt ist.',
 1),

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Dokumente hochladen und verwalten',
 'dokumente-hochladen',
 'Erfahren Sie, wie Sie Dokumente in Rentably hochladen und organisieren.',
 '## Dokumente hochladen und verwalten

Speichern Sie alle wichtigen Dokumente zentral in Rentably – von Mietverträgen bis zu Handwerkerrechnungen.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Dokumente**.
2. Klicken Sie auf **Hochladen**.
3. Wählen Sie die Datei von Ihrem Computer.
4. Ordnen Sie das Dokument einem Objekt, einer Einheit oder einem Mieter zu.
5. Wählen Sie den Dokumententyp (z.B. Mietvertrag, Rechnung).
6. Klicken Sie auf **Speichern**.

### Tipps

- Nutzen Sie die Teilen-Funktion, um Dokumente im Mieterportal sichtbar zu machen.
- Dokumente können nach Typ und Objekt gefiltert werden.',
 2),

((SELECT id FROM help_categories WHERE slug = 'kommunikation'),
 'Briefe und E-Mails versenden',
 'briefe-versenden',
 'So versenden Sie offizielle Briefe direkt aus Rentably per Post.',
 '## Briefe und E-Mails versenden

Rentably ermöglicht den Versand von Briefen direkt aus der Plattform – sowohl digital als auch per Post.

### Schritt-für-Schritt-Anleitung

**Brief per Post versenden:**
1. Erstellen Sie ein Dokument (z.B. Kündigung, Mahnung).
2. Klicken Sie auf **Als Brief versenden**.
3. Überprüfen Sie die Empfängeradresse.
4. Wählen Sie die Versandoptionen (z.B. Einschreiben).
5. Bestätigen Sie den Versand.

**E-Mail versenden:**
1. Navigieren Sie zu Nachrichten.
2. Verfassen Sie eine neue Nachricht.
3. Senden Sie diese per E-Mail an den Mieter.

### Tipps

- Für rechtlich relevante Schreiben empfehlen wir den Postversand per Einschreiben.
- Alle versendeten Briefe werden automatisch dokumentiert.',
 3);

-- Automatisierungen
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'automatisierungen'),
 'Automatische Erinnerungen einrichten',
 'erinnerungen-einrichten',
 'So richten Sie automatische Erinnerungen für Mieteingänge und Termine ein.',
 '## Automatische Erinnerungen einrichten

Rentably erinnert Sie automatisch an wichtige Termine und überfällige Zahlungen.

### Funktionsbeschreibung

Rentably erstellt automatisch:

- **Zahlungserinnerungen** für überfällige Mieten
- **Indexmiet-Erinnerungen** wenn eine Anpassung möglich ist
- **Darlehensfälligkeiten** für Zinsbindungsenden
- **Vertragstermine** für auslaufende Verträge

### Tipps

- Erinnerungen erscheinen als Tickets in Ihrem Dashboard.
- Überprüfen Sie regelmäßig Ihre offenen Tickets.

### Häufige Probleme

**Ich erhalte keine Erinnerungen.**
Erinnerungen werden nur erstellt, wenn die entsprechenden Daten (z.B. Mietvertrag, Darlehen) vollständig erfasst sind.',
 1),

((SELECT id FROM help_categories WHERE slug = 'automatisierungen'),
 'Mahnwesen und Zahlungserinnerungen',
 'mahnwesen',
 'Erfahren Sie, wie das automatische Mahnwesen in Rentably funktioniert.',
 '## Mahnwesen und Zahlungserinnerungen

Rentably unterstützt ein mehrstufiges Mahnwesen für überfällige Mietzahlungen.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Finanzen → Mahnwesen**.
2. Sie sehen alle überfälligen Zahlungen.
3. Wählen Sie eine Zahlung aus.
4. Wählen Sie die Mahnstufe (Zahlungserinnerung, 1. Mahnung, 2. Mahnung).
5. Passen Sie den Text bei Bedarf an.
6. Versenden Sie die Mahnung per E-Mail oder Brief.

### Tipps

- Nutzen Sie die automatischen Vorlagen für jede Mahnstufe.
- Dokumentieren Sie alle Mahnstufen sorgfältig für den Fall einer gerichtlichen Auseinandersetzung.

### Häufige Probleme

**Die Mahnung zeigt den falschen Betrag.**
Stellen Sie sicher, dass alle Teilzahlungen erfasst sind.',
 2),

((SELECT id FROM help_categories WHERE slug = 'automatisierungen'),
 'Automatische Indexmiet-Berechnung',
 'indexmiet-berechnung',
 'So funktioniert die automatische Indexmiet-Berechnung in Rentably.',
 '## Automatische Indexmiet-Berechnung

Bei Indexmietverträgen berechnet Rentably die Mietanpassung automatisch basierend auf dem Verbraucherpreisindex.

### Funktionsbeschreibung

Rentably:
1. Überwacht monatlich den Verbraucherpreisindex (VPI).
2. Prüft, ob bei Ihren Indexmietverträgen eine Anpassung möglich ist.
3. Berechnet den neuen Mietbetrag.
4. Erstellt ein Mieterhöhungsverlangen als Dokument.
5. Benachrichtigt Sie per Ticket.

### Schritt-für-Schritt-Anleitung

1. Erstellen Sie einen Mietvertrag mit der Option **Indexmiete**.
2. Hinterlegen Sie den Basis-VPI-Wert und das Referenzdatum.
3. Rentably prüft automatisch, ob eine Erhöhung möglich ist.
4. Bei Fälligkeit erhalten Sie ein Ticket mit dem berechneten Betrag.

### Tipps

- Die automatische Berechnung berücksichtigt die gesetzlichen Fristen.
- Sie können das Erhöhungsverlangen direkt aus dem Ticket erstellen und versenden.',
 3);

-- Berichte & Auswertungen
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Finanzanalyse und Cashflow',
 'finanzanalyse',
 'Nutzen Sie die Finanzanalyse für einen Überblick über Einnahmen und Ausgaben.',
 '## Finanzanalyse und Cashflow

Die Finanzanalyse in Rentably gibt Ihnen einen detaillierten Überblick über Ihre Mieteinnahmen und Ausgaben.

### Funktionsbeschreibung

Die Finanzanalyse zeigt:

- **Cashflow-Übersicht** – Einnahmen vs. Ausgaben im Zeitverlauf
- **Renditeberechnung** – Brutto- und Nettorendite pro Objekt
- **Objektvergleich** – Performance Ihrer Immobilien im Vergleich
- **Kostenstruktur** – Aufschlüsselung nach Kategorien

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Finanzen → Analyse**.
2. Wählen Sie den Zeitraum und das Objekt.
3. Analysieren Sie die Diagramme und Kennzahlen.

### Tipps

- Nutzen Sie den Objektvergleich, um die Rentabilität Ihrer Immobilien zu bewerten.
- Exportieren Sie Berichte als PDF für Ihre Unterlagen.',
 1),

((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Daten exportieren',
 'daten-exportieren',
 'So exportieren Sie Daten aus Rentably in verschiedene Formate.',
 '## Daten exportieren

Rentably bietet verschiedene Exportmöglichkeiten für Ihre Daten.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zum gewünschten Bereich (z.B. Finanzen, Mieter).
2. Klicken Sie auf das **Export-Symbol**.
3. Wählen Sie das Format:
   - **PDF** – für Berichte und Dokumente
   - **Excel** – für Finanzdaten und Tabellen
   - **CSV** – für den Import in andere Systeme
4. Die Datei wird automatisch heruntergeladen.

### Tipps

- Nutzen Sie die Anlage-V-Funktion für den Export steuerrelevanter Daten.
- Finanzdaten können nach Objekt und Zeitraum gefiltert exportiert werden.',
 2),

((SELECT id FROM help_categories WHERE slug = 'berichte-auswertungen'),
 'Anlage V für die Steuererklärung',
 'anlage-v',
 'Erfahren Sie, wie Rentably Sie bei der Erstellung der Anlage V unterstützt.',
 '## Anlage V für die Steuererklärung

Rentably berechnet die relevanten Werte für Ihre Anlage V (Einkünfte aus Vermietung und Verpachtung).

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Finanzen → Anlage V**.
2. Wählen Sie das Steuerjahr und das Objekt.
3. Rentably berechnet automatisch:
   - Mieteinnahmen
   - Werbungskosten (Abschreibung, Zinsen, Nebenkosten)
   - Überschuss/Verlust
4. Exportieren Sie die Daten als PDF.

### Tipps

- Kategorisieren Sie Ausgaben sorgfältig – die Zuordnung zu den Zeilen der Anlage V erfolgt automatisch.
- Die AfA-Berechnung basiert auf den Einstellungen in den Objektdaten.

### Häufige Probleme

**Die AfA wird nicht berechnet.**
Stellen Sie sicher, dass Sie die AfA-Einstellungen im Objekt konfiguriert haben.',
 3);

-- Einstellungen
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Benutzer hinzufügen und verwalten',
 'benutzer-verwalten',
 'So fügen Sie weitere Benutzer zu Ihrem Rentably-Account hinzu.',
 '## Benutzer hinzufügen und verwalten

Rentably unterstützt mehrere Benutzer pro Account – ideal, wenn Sie mit einem Verwalter oder Partner zusammenarbeiten.

### Schritt-für-Schritt-Anleitung

1. Navigieren Sie zu **Einstellungen → Benutzerverwaltung**.
2. Klicken Sie auf **Benutzer einladen**.
3. Geben Sie die E-Mail-Adresse des neuen Benutzers ein.
4. Wählen Sie die Rolle:
   - **Admin** – Vollzugriff auf alle Funktionen
   - **Mitarbeiter** – Eingeschränkter Zugriff
   - **Nur Lesen** – Kann Daten einsehen, aber nicht ändern
5. Klicken Sie auf **Einladung senden**.

### Tipps

- Der eingeladene Benutzer erhält eine E-Mail mit einem Registrierungslink.
- Sie können Berechtigungen jederzeit anpassen.

### Häufige Probleme

**Die Einladung kommt nicht an.**
Bitten Sie den Benutzer, den Spam-Ordner zu überprüfen.',
 1),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Benutzerrechte und Rollen',
 'benutzerrechte',
 'Erfahren Sie, wie das Rechtesystem in Rentably funktioniert.',
 '## Benutzerrechte und Rollen

Rentably bietet ein flexibles Rechtesystem, mit dem Sie steuern können, wer auf welche Daten zugreifen kann.

### Funktionsbeschreibung

Es gibt drei Rollen:

- **Eigentümer (Owner)** – Vollzugriff, kann Benutzer verwalten und den Account löschen
- **Admin** – Zugriff auf alle Funktionen, kann keine Benutzer verwalten
- **Mitglied** – Eingeschränkter Zugriff basierend auf zugewiesenen Berechtigungen

### Berechtigungen im Detail

- **Immobilien** – Objekte und Einheiten verwalten
- **Mieter** – Mieterdaten und Verträge bearbeiten
- **Finanzen** – Zahlungen und Ausgaben verwalten
- **Dokumente** – Dokumente hochladen und verwalten
- **Nachrichten** – E-Mails und Briefe versenden

### Tipps

- Vergeben Sie nur die Berechtigungen, die tatsächlich benötigt werden.
- Überprüfen Sie regelmäßig die Benutzerliste und entfernen Sie inaktive Benutzer.',
 2),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Account-Einstellungen verwalten',
 'account-einstellungen',
 'So verwalten Sie Ihre persönlichen Einstellungen und Kontodaten.',
 '## Account-Einstellungen verwalten

In den Einstellungen verwalten Sie Ihr Profil, Ihre Zahlungsdaten und Kontoeinstellungen.

### Schritt-für-Schritt-Anleitung

1. Klicken Sie auf Ihr **Profilbild** oben rechts.
2. Wählen Sie **Einstellungen**.
3. Hier können Sie:
   - Profildaten bearbeiten (Name, Adresse, Telefon)
   - Bankverbindung hinterlegen
   - Passwort ändern
   - Sprache wählen (Deutsch/Englisch)
   - Abonnement verwalten

### Tipps

- Vervollständigen Sie Ihr Profil – die Daten werden in Dokumenten und Briefen verwendet.
- Ihre Bankdaten werden nur für Dokumente und Abrechnungen verwendet.',
 3),

((SELECT id FROM help_categories WHERE slug = 'einstellungen'),
 'Integrationen und Schnittstellen',
 'integrationen',
 'Erfahren Sie, welche Integrationen Rentably bietet.',
 '## Integrationen und Schnittstellen

Rentably bietet verschiedene Integrationen, um Ihren Verwaltungsalltag zu vereinfachen.

### Verfügbare Integrationen

- **Bankimport (CSV/CAMT053)** – Kontoauszüge importieren und Zahlungen zuordnen
- **Bankverbindung (Open Banking)** – Direkter Zugriff auf Ihr Bankkonto
- **Briefversand (LetterXpress)** – Briefe direkt aus Rentably per Post versenden
- **Mieterportal** – Mieter erhalten einen eigenen Zugang für Dokumente und Kommunikation

### Schritt-für-Schritt-Anleitung

Jede Integration wird in den jeweiligen Bereichen eingerichtet:

1. **Bankimport**: Finanzen → Bankverbindung
2. **Briefversand**: Einstellungen → Briefversand
3. **Mieterportal**: Mieter → Portal aktivieren

### Tipps

- Richten Sie den Bankimport als erstes ein – er spart viel Zeit bei der Zahlungserfassung.',
 4);

-- Häufige Fragen
INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'haeufige-fragen'),
 'Häufige Fragen (FAQ)',
 'faq',
 'Antworten auf die am häufigsten gestellten Fragen zu Rentably.',
 '## Häufige Fragen (FAQ)

### Allgemein

**Ist Rentably kostenlos?**
Rentably bietet einen kostenlosen Tarif mit Grundfunktionen. Für erweiterte Funktionen wie Bankimport, Briefversand und Mehrbenutzer steht der Pro-Tarif zur Verfügung.

**Wo werden meine Daten gespeichert?**
Alle Daten werden auf Servern in Deutschland gespeichert und sind DSGVO-konform geschützt.

**Kann ich Rentably kündigen?**
Ja, Sie können Ihr Abonnement jederzeit zum Ende der Laufzeit kündigen. Ihre Daten bleiben nach der Kündigung noch 30 Tage verfügbar.

### Immobilien & Mieter

**Wie viele Immobilien kann ich verwalten?**
Im Free-Tarif können Sie unbegrenzt viele Immobilien und Einheiten verwalten.

**Kann ich mehrere Mieter pro Einheit haben?**
Ja, Sie können Mitmieter über die Vertragspartner-Funktion hinzufügen.

### Finanzen

**Unterstützt Rentably die Steuererklärung?**
Ja, Rentably berechnet automatisch die Werte für die Anlage V und bietet einen Export.

**Kann ich Belege hochladen?**
Ja, Sie können zu jeder Ausgabe einen Beleg als Dokument hinzufügen.

### Technisches

**Welche Browser werden unterstützt?**
Rentably funktioniert in allen modernen Browsern (Chrome, Firefox, Safari, Edge).

**Gibt es eine App?**
Rentably ist als Web-App optimiert für Desktop und Mobilgeräte. Eine native App ist in Planung.',
 1);
