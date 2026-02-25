/*
  # Create Email Automations & Campaigns System

  1. New Tables
    - `email_automations`
      - `id` (uuid, primary key)
      - `name` (text) - human-readable name, e.g. "Testphase endet bald"
      - `description` (text) - explanation of what this automation does
      - `template_key` (text) - references email_templates.template_key
      - `trigger_type` (text) - one of: cron, event, manual
      - `trigger_event` (text) - event name like "trial_ending", "user_signup", etc.
      - `trigger_config` (jsonb) - configuration like days_before, cron schedule, etc.
      - `audience_filter` (jsonb) - filter criteria for target audience
      - `is_active` (boolean) - whether this automation is enabled
      - `edge_function` (text) - which edge function executes this
      - `last_run_at` (timestamptz) - when last executed
      - `total_sent` (integer) - lifetime emails sent
      - `created_at` / `updated_at` (timestamptz)

    - `email_campaigns`
      - `id` (uuid, primary key)
      - `name` (text) - campaign name
      - `subject` (text) - email subject
      - `body_html` (text) - email HTML body
      - `body_text` (text) - plain text version
      - `audience_filter` (jsonb) - target audience criteria
      - `status` (text) - draft, scheduled, sending, sent, cancelled
      - `scheduled_at` (timestamptz) - when to send (null = immediate)
      - `sent_at` (timestamptz) - when actually sent
      - `total_recipients` (integer) - number of recipients
      - `sent_count` (integer) - successfully sent
      - `failed_count` (integer) - failed sends
      - `created_by` (uuid) - admin who created it
      - `created_at` / `updated_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Only admin users can read/write

  3. Seed Data
    - Pre-populate email_automations with all existing automated emails
*/

-- Email Automations Table
CREATE TABLE IF NOT EXISTS public.email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  template_key text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('cron', 'event', 'manual')),
  trigger_event text,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  edge_function text,
  last_run_at timestamptz,
  total_sent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read automations"
  ON public.email_automations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert automations"
  ON public.email_automations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update automations"
  ON public.email_automations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete automations"
  ON public.email_automations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read campaigns"
  ON public.email_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert campaigns"
  ON public.email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update campaigns"
  ON public.email_campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete campaigns"
  ON public.email_campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_automations_template_key ON public.email_automations(template_key);
CREATE INDEX IF NOT EXISTS idx_email_automations_is_active ON public.email_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON public.email_campaigns(created_by);

-- Seed: Pre-populate automations for all existing automated emails
INSERT INTO public.email_automations (name, description, template_key, trigger_type, trigger_event, trigger_config, audience_filter, is_active, edge_function) VALUES
(
  'Willkommens-E-Mail',
  'Wird sofort nach der Registrierung eines neuen Nutzers verschickt. Begrüßt den Nutzer und erklärt die ersten Schritte.',
  'registration',
  'event',
  'user_signup',
  '{"timing": "sofort nach Registrierung"}'::jsonb,
  '{"segment": "alle_neuen_nutzer"}'::jsonb,
  true,
  'send-welcome-email'
),
(
  'Testphase endet bald',
  'Wird automatisch an Nutzer verschickt, deren kostenlose Testphase in X Tagen endet. Erinnert an das Upgrade auf Pro.',
  'trial_ending',
  'cron',
  'trial_ending',
  '{"days_before_expiry": 7, "cron_schedule": "täglich", "configurable_env": "TRIAL_ENDING_DAYS"}'::jsonb,
  '{"segment": "free_mit_trial", "conditions": ["subscription_plan = free", "trial_ends_at ist gesetzt", "trial_ends_at = heute + X Tage"]}'::jsonb,
  true,
  'cron-trial-ending'
),
(
  'Testphase abgelaufen',
  'Wird automatisch an Nutzer verschickt, deren Testphase abgelaufen ist. Informiert über die eingeschränkten Funktionen und den Upgrade-Pfad.',
  'trial_ended',
  'cron',
  'trial_ended',
  '{"timing": "nach Ablauf der Testphase", "cron_schedule": "täglich"}'::jsonb,
  '{"segment": "free_trial_abgelaufen", "conditions": ["subscription_plan = free", "trial_ends_at < jetzt"]}'::jsonb,
  true,
  'cron-trial-ended'
),
(
  'Passwort zurücksetzen',
  'Wird verschickt, wenn ein Nutzer das Zurücksetzen seines Passworts anfordert. Enthält einen zeitlich begrenzten Reset-Link.',
  'password_reset',
  'event',
  'password_reset_requested',
  '{"timing": "sofort bei Anforderung"}'::jsonb,
  '{"segment": "anfragender_nutzer"}'::jsonb,
  true,
  'request-password-reset'
),
(
  'Mieter-Passwort zurücksetzen',
  'Passwort-Reset-E-Mail speziell für Mieter im Mieterportal.',
  'tenant_password_reset',
  'event',
  'tenant_password_reset_requested',
  '{"timing": "sofort bei Anforderung"}'::jsonb,
  '{"segment": "mieter"}'::jsonb,
  true,
  'request-tenant-password-reset'
),
(
  'Empfehlungs-Einladung',
  'Wird verschickt, wenn ein Nutzer über das Empfehlungsprogramm jemanden einlädt.',
  'referral_invitation',
  'event',
  'referral_invitation_sent',
  '{"timing": "sofort bei Einladung"}'::jsonb,
  '{"segment": "eingeladene_person"}'::jsonb,
  true,
  'send-referral-invitation'
),
(
  'Ticket-Antwort',
  'Wird an den Ticket-Ersteller verschickt, wenn ein Admin auf ein Support-Ticket antwortet.',
  'ticket_reply',
  'event',
  'ticket_reply_sent',
  '{"timing": "sofort bei Admin-Antwort"}'::jsonb,
  '{"segment": "ticket_ersteller"}'::jsonb,
  true,
  'send-ticket-reply'
),
(
  'Admin: Neues Ticket',
  'Interne Benachrichtigung an das Admin-Team, wenn ein neues Support-Ticket über das Kontaktformular eingereicht wird.',
  'admin_notify_new_ticket',
  'event',
  'contact_ticket_created',
  '{"timing": "sofort bei Ticket-Erstellung"}'::jsonb,
  '{"segment": "admin_team"}'::jsonb,
  true,
  'submit-contact-form'
),
(
  'Ticket-Eingangsbestätigung',
  'Bestätigung an den Absender, wenn ein Support-Ticket über das Kontaktformular eingereicht wird.',
  'contact_ticket_confirmation',
  'event',
  'contact_ticket_created',
  '{"timing": "sofort bei Ticket-Erstellung"}'::jsonb,
  '{"segment": "ticket_absender"}'::jsonb,
  true,
  'submit-contact-form'
),
(
  'Mieterportal aktiviert',
  'Wird an den Mieter verschickt, wenn der Vermieter das Mieterportal für ihn aktiviert. Enthält den Einrichtungslink.',
  'tenant_portal_activation',
  'event',
  'tenant_portal_activated',
  '{"timing": "sofort bei Aktivierung"}'::jsonb,
  '{"segment": "aktivierter_mieter"}'::jsonb,
  true,
  'send-tenant-activation'
),
(
  'Abo gestartet',
  'Wird verschickt, wenn ein Nutzer erfolgreich ein Pro-Abonnement abgeschlossen hat.',
  'subscription_started',
  'event',
  'subscription_created',
  '{"timing": "sofort nach Zahlung"}'::jsonb,
  '{"segment": "neuer_pro_nutzer"}'::jsonb,
  true,
  'stripe-webhook'
),
(
  'Abo gekündigt',
  'Wird verschickt, wenn ein Nutzer sein Pro-Abonnement kündigt. Bestätigt die Kündigung und nennt das Enddatum.',
  'subscription_cancelled',
  'event',
  'subscription_cancelled',
  '{"timing": "sofort bei Kündigung"}'::jsonb,
  '{"segment": "kündigender_nutzer"}'::jsonb,
  true,
  'cancel-subscription'
),
(
  'Magic Link',
  'Passwortlose Anmeldung per E-Mail-Link.',
  'magic_link',
  'event',
  'magic_link_requested',
  '{"timing": "sofort bei Anforderung"}'::jsonb,
  '{"segment": "anfragender_nutzer"}'::jsonb,
  true,
  'send-magic-link'
)
ON CONFLICT DO NOTHING;
