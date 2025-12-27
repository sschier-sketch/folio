/*
  Admin Features & Email Templates

  1. New Tables
    - admin_users (created first, needed for RLS policies)
    - email_templates
    - admin_activity_log

  2. Security
    - Enable RLS on all new tables
    - Only admin users can access these tables
*/

-- Create admin_users table first
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_super_admin boolean DEFAULT false,
  can_manage_templates boolean DEFAULT true,
  can_view_all_users boolean DEFAULT true,
  can_impersonate boolean DEFAULT true,
  can_manage_subscriptions boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all admins"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.can_manage_templates = true
    )
  );

CREATE POLICY "Only admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.can_manage_templates = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.can_manage_templates = true
    )
  );

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view activity log"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can insert activity log"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Insert default email templates
INSERT INTO email_templates (template_key, subject, body_html, body_text, variables) VALUES
('user_invitation', 'Sie wurden zu Rentab.ly eingeladen',
'<h1>Willkommen bei Rentab.ly!</h1><p>{{inviter_name}} hat Sie eingeladen, Rentab.ly zu nutzen.</p><p><a href="{{invitation_link}}">Jetzt registrieren</a></p>',
'Willkommen bei Rentab.ly! {{inviter_name}} hat Sie eingeladen, Rentab.ly zu nutzen. Registrieren Sie sich hier: {{invitation_link}}',
'["inviter_name", "invitation_link", "invitee_email"]'::jsonb),

('registration', 'Willkommen bei Rentab.ly',
'<h1>Herzlich willkommen!</h1><p>Vielen Dank für Ihre Registrierung bei Rentab.ly, {{user_name}}.</p><p>Sie können jetzt mit der Verwaltung Ihrer Immobilien beginnen.</p>',
'Herzlich willkommen! Vielen Dank für Ihre Registrierung bei Rentab.ly, {{user_name}}. Sie können jetzt mit der Verwaltung Ihrer Immobilien beginnen.',
'["user_name", "user_email"]'::jsonb),

('password_reset', 'Passwort zurücksetzen', 
'<h1>Passwort zurücksetzen</h1><p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p><p><a href="{{reset_link}}">Passwort zurücksetzen</a></p><p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>',
'Passwort zurücksetzen: Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Link: {{reset_link}}. Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.',
'["user_name", "reset_link"]'::jsonb),

('login_link', 'Ihr Anmelde-Link', 
'<h1>Anmelde-Link</h1><p>Klicken Sie auf den folgenden Link, um sich anzumelden:</p><p><a href="{{login_link}}">Jetzt anmelden</a></p>',
'Ihr Anmelde-Link: {{login_link}}',
'["user_name", "login_link"]'::jsonb),

('subscription_started', 'Ihr Premium-Abonnement wurde aktiviert', 
'<h1>Premium-Abonnement aktiviert</h1><p>Herzlichen Glückwunsch, {{user_name}}! Ihr Premium-Abonnement wurde erfolgreich aktiviert.</p><p>Sie haben jetzt Zugriff auf alle Premium-Features.</p>',
'Herzlichen Glückwunsch, {{user_name}}! Ihr Premium-Abonnement wurde erfolgreich aktiviert. Sie haben jetzt Zugriff auf alle Premium-Features.',
'["user_name", "subscription_plan"]'::jsonb),

('subscription_cancelled', 'Ihr Abonnement wurde gekündigt', 
'<h1>Abonnement gekündigt</h1><p>Ihr Premium-Abonnement wurde gekündigt und endet am {{end_date}}.</p><p>Bis dahin haben Sie weiterhin Zugriff auf alle Premium-Features.</p>',
'Ihr Premium-Abonnement wurde gekündigt und endet am {{end_date}}. Bis dahin haben Sie weiterhin Zugriff auf alle Premium-Features.',
'["user_name", "end_date"]'::jsonb)

ON CONFLICT (template_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at DESC);
