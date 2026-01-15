/*
  # System-Einstellungen für GTM und globale Konfiguration

  1. Neue Tabellen
    - `system_settings`
      - Singleton-Tabelle für globale System-Einstellungen
      - GTM Configuration (aktiv, Container ID, Custom HTML)
      - Weitere System-Einstellungen können hier hinzugefügt werden
      
  2. Sicherheit
    - RLS aktiviert
    - Nur Admins können lesen und schreiben
    - Automatische Timestamps
    
  3. Validierung
    - GTM Container ID muss Format GTM-XXXXXXX haben
    - Check Constraint für ID = 1 (Singleton)
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  gtm_enabled boolean DEFAULT false NOT NULL,
  gtm_container_id text,
  gtm_custom_head_html text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_gtm_container_id CHECK (
    gtm_container_id IS NULL OR 
    gtm_container_id ~* '^GTM-[A-Z0-9]+$'
  )
);

CREATE INDEX IF NOT EXISTS idx_system_settings_id ON system_settings(id);

INSERT INTO system_settings (id, gtm_enabled, gtm_container_id, gtm_custom_head_html)
VALUES (1, false, null, null)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update system settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS TABLE (
  id integer,
  gtm_enabled boolean,
  gtm_container_id text,
  gtm_custom_head_html text,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, gtm_enabled, gtm_container_id, gtm_custom_head_html, updated_at
  FROM system_settings
  WHERE id = 1
  LIMIT 1;
$$;
