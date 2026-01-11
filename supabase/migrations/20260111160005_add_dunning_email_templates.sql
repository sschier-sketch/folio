/*
  # Email-Templates für Mahnwesen

  1. Neue Tabelle
    - `dunning_email_templates`
      - Benutzerdefinierte Email-Templates für die 3 Mahnstufen
      - Betreff und Nachricht anpassbar
      - User-spezifische Templates

  2. Sicherheit
    - RLS aktiviert
    - User kann nur eigene Templates sehen/bearbeiten
*/

-- Email-Templates Tabelle
CREATE TABLE IF NOT EXISTS dunning_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dunning_level integer NOT NULL CHECK (dunning_level BETWEEN 1 AND 3),
  subject text NOT NULL,
  message text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, dunning_level)
);

-- RLS aktivieren
ALTER TABLE dunning_email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own templates"
  ON dunning_email_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON dunning_email_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON dunning_email_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON dunning_email_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_dunning_email_templates_user_id 
  ON dunning_email_templates(user_id);

-- Standard-Templates für neue User
CREATE OR REPLACE FUNCTION create_default_dunning_templates()
RETURNS trigger AS $$
BEGIN
  INSERT INTO dunning_email_templates (user_id, dunning_level, subject, message)
  VALUES
    (
      NEW.id,
      1,
      'Freundliche Erinnerung: Mietzahlung',
      'Sehr geehrte/r [TENANT_NAME],

wir möchten Sie freundlich daran erinnern, dass die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] zum [DUE_DATE] fällig war.

Möglicherweise haben Sie die Überweisung vergessen. Bitte überweisen Sie den Betrag zeitnah.

Mit freundlichen Grüßen'
    ),
    (
      NEW.id,
      2,
      'Zahlungsaufforderung: Ausstehende Miete',
      'Sehr geehrte/r [TENANT_NAME],

trotz freundlicher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir fordern Sie hiermit formell auf, den Betrag innerhalb von 7 Tagen zu überweisen. Andernfalls müssen wir weitere Schritte einleiten.

Mit freundlichen Grüßen'
    ),
    (
      NEW.id,
      3,
      'MAHNUNG: Überfällige Mietzahlung',
      'Sehr geehrte/r [TENANT_NAME],

trotz mehrfacher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir mahnen Sie hiermit offiziell und fordern Sie auf, den ausstehenden Betrag zzgl. Mahngebühren in Höhe von 5,00 € (Gesamt: [TOTAL_AMOUNT]) innerhalb von 5 Tagen zu überweisen.

Bei weiterer Nichtzahlung behalten wir uns rechtliche Schritte vor.

Mit freundlichen Grüßen'
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für automatische Template-Erstellung nur wenn noch keine Templates existieren
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_create_default_dunning_templates ON auth.users;
  
  CREATE TRIGGER trg_create_default_dunning_templates
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_dunning_templates();
END $$;