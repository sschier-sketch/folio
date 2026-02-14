/*
  # Create FAQ Management System

  1. New Tables
    - `faqs`
      - `id` (uuid, primary key)
      - `page_slug` (text) - identifies which page the FAQ belongs to (e.g. 'landing', 'pricing', 'features')
      - `question` (text, not null) - the FAQ question
      - `answer` (text, not null) - the FAQ answer
      - `sort_order` (integer, default 0) - controls display order
      - `is_active` (boolean, default true) - whether the FAQ is visible
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `faqs` table
    - Public read access for active FAQs (they are displayed on public pages)
    - Admin-only write access via admin_users table check

  3. Indexes
    - Composite index on (page_slug, sort_order) for efficient ordered queries per page
    - Index on is_active for filtering

  4. Initial Data
    - Seed the existing hardcoded landing page FAQs into the table
*/

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL DEFAULT 'landing',
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active FAQs"
  ON faqs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert FAQs"
  ON faqs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update FAQs"
  ON faqs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete FAQs"
  ON faqs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_faqs_page_slug_sort ON faqs (page_slug, sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs (is_active);

INSERT INTO faqs (page_slug, question, answer, sort_order) VALUES
  ('landing', 'Ist rentably wirklich kostenlos?', 'Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie koennen unbegrenzt viele Immobilien, Einheiten und Mieter verwalten. Fuer erweiterte Funktionen wie Betriebskostenabrechnungen, Mahnwesen oder das Mieterportal steht der Pro-Tarif zur Verfuegung.', 1),
  ('landing', 'Was passiert nach den 30 Tagen Pro-Testphase?', 'Nach Ablauf der 30 Tage wird Ihr Account automatisch auf den kostenlosen Basic-Tarif umgestellt. Sie verlieren keine Daten. Alle Basic-Funktionen bleiben weiterhin verfuegbar. Wenn Sie Pro-Funktionen weiter nutzen moechten, koennen Sie jederzeit ein Upgrade durchfuehren.', 2),
  ('landing', 'Gibt es Limits bei der Anzahl an Immobilien oder Mietern?', 'Nein. Sowohl im Basic- als auch im Pro-Tarif koennen Sie unbegrenzt viele Immobilien, Einheiten und Mieter anlegen. Wir berechnen keine Gebuehren pro Objekt oder pro Mieter — anders als viele andere Anbieter.', 3),
  ('landing', 'Brauche ich eine Kreditkarte fuer die Registrierung?', 'Nein. Fuer die Registrierung und die 30-taegige Pro-Testphase benoetigen Sie keine Zahlungsdaten. Erst wenn Sie sich nach der Testphase fuer den Pro-Tarif entscheiden, werden Zahlungsinformationen benoetigt.', 4),
  ('landing', 'Wo werden meine Daten gespeichert?', 'Alle Daten werden auf europaeischen Servern in Deutschland gehostet. rentably ist vollstaendig DSGVO-konform. Ihre Daten werden nicht an Dritte weitergegeben.', 5),
  ('landing', 'Kann ich rentably auch fuer WEG-Verwaltung nutzen?', 'rentably ist primaer fuer private Vermieter und Eigentuemer konzipiert. Sie koennen sowohl Miet- als auch Eigentumsobjekte verwalten und Hausgeld-Zahlungen fuer WEG-Einheiten erfassen.', 6),
  ('landing', 'Kann ich jederzeit kuendigen?', 'Ja. Der Pro-Tarif ist monatlich oder jaehrlich kuendbar. Es gibt keine Mindestlaufzeit. Nach der Kuendigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.', 7);
