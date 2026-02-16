/*
  # Create tenant password reset token system

  1. New Tables
    - `tenant_password_reset_tokens`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants)
      - `email` (text, not null)
      - `verification_token` (uuid, auto-generated, unique)
      - `used` (boolean, default false)
      - `expires_at` (timestamptz, default now + 1 hour)
      - `created_at` (timestamptz, default now)

  2. Security
    - RLS enabled on the table
    - No public access policies (only service role via edge functions)

  3. Email Templates
    - `tenant_password_reset` (de) - German tenant password reset email
    - `tenant_password_reset` (en) - English tenant password reset email

  4. Notes
    - Tokens expire after 1 hour for security
    - Tokens can only be used once
    - This fixes a critical vulnerability where passwords could be reset without email verification
*/

CREATE TABLE IF NOT EXISTS tenant_password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email text NOT NULL,
  verification_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenant_password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tenant_password_reset_tokens_verification_token
  ON tenant_password_reset_tokens(verification_token);

CREATE INDEX IF NOT EXISTS idx_tenant_password_reset_tokens_tenant_id
  ON tenant_password_reset_tokens(tenant_id);

INSERT INTO email_templates (template_key, language, subject, body_html, body_text)
VALUES (
  'tenant_password_reset',
  'de',
  'Passwort zurücksetzen - Mieterportal',
  '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}@media only screen and (max-width:600px){.container{width:100%!important}}</style></head><body><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff"><tr><td align="center" style="padding:20px 0"><table width="600" cellpadding="0" cellspacing="0" style="background:#faf8f8;border-radius:8px"><tr><td style="padding:30px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:30px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></td></tr></table><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Passwort zurücksetzen</h1><div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px"><p style="margin:0 0 16px 0">Sie haben eine Anfrage zum Zurücksetzen Ihres Mieterportal-Passworts gestellt.</p><p style="margin:0">Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen:</p></div><table width="100%" cellpadding="20" cellspacing="0"><tr><td><a href="{{reset_link}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Neues Passwort festlegen</a></td></tr></table><div style="color:#666;font-size:12px;line-height:1.5;margin-top:10px"><p style="margin:0 0 8px 0">Dieser Link ist aus Sicherheitsgründen nur 1 Stunde gültig.</p><p style="margin:0">Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt dann unverändert.</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p></td></tr></table></td></tr></table></body></html>',
  'Passwort zurücksetzen - Mieterportal

Sie haben eine Anfrage zum Zurücksetzen Ihres Mieterportal-Passworts gestellt.

Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:
{{reset_link}}

Dieser Link ist aus Sicherheitsgründen nur 1 Stunde gültig.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt dann unverändert.

---
© 2026 rentab.ly'
)
ON CONFLICT DO NOTHING;

INSERT INTO email_templates (template_key, language, subject, body_html, body_text)
VALUES (
  'tenant_password_reset',
  'en',
  'Reset your password - Tenant Portal',
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}@media only screen and (max-width:600px){.container{width:100%!important}}</style></head><body><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff"><tr><td align="center" style="padding:20px 0"><table width="600" cellpadding="0" cellspacing="0" style="background:#faf8f8;border-radius:8px"><tr><td style="padding:30px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:30px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></td></tr></table><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Reset your password</h1><div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px"><p style="margin:0 0 16px 0">You have requested to reset your tenant portal password.</p><p style="margin:0">Click the button below to set a new password:</p></div><table width="100%" cellpadding="20" cellspacing="0"><tr><td><a href="{{reset_link}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Set new password</a></td></tr></table><div style="color:#666;font-size:12px;line-height:1.5;margin-top:10px"><p style="margin:0 0 8px 0">This link is valid for 1 hour only.</p><p style="margin:0">If you did not request this, please ignore this email. Your password will remain unchanged.</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p></td></tr></table></td></tr></table></body></html>',
  'Reset your password - Tenant Portal

You have requested to reset your tenant portal password.

Click the following link to set a new password:
{{reset_link}}

This link is valid for 1 hour only.

If you did not request this, please ignore this email. Your password will remain unchanged.

---
© 2026 rentab.ly'
)
ON CONFLICT DO NOTHING;