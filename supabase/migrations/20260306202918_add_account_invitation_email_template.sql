/*
  # Add email template for account member invitations

  1. New Email Templates
    - `account_invitation` (DE) -- German invitation email
    - `account_invitation` (EN) -- English invitation email
  
  2. Template Variables
    - {{inviter_name}} -- Name of the person who sent the invitation
    - {{invitee_email}} -- Email of the invited person
    - {{invitation_link}} -- Direct link to accept the invitation
    - {{role}} -- Assigned role (Admin, Mitglied, Betrachter)
    - {{expires_in}} -- When the invitation expires
*/

INSERT INTO email_templates (template_key, template_name, subject, body_html, body_text, variables, language, category, description)
VALUES (
  'account_invitation',
  'Einladung zum Account',
  'Du wurdest zu einem Rentably-Account eingeladen',
  '<div style="font-family:''Manrope'',''Segoe UI'',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
  <div style="padding:32px 24px;text-align:center;background:#1a1a2e;border-radius:12px 12px 0 0">
    <img src="https://rentab.ly/rentably-logo-new.svg" alt="Rentably" style="height:32px" />
  </div>
  <div style="padding:32px 24px">
    <h2 style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0 0 16px">Einladung zur Zusammenarbeit</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px">
      <strong>{{inviter_name}}</strong> hat dich eingeladen, gemeinsam Immobilien auf Rentably zu verwalten.
    </p>
    <div style="background:#f0f4f8;border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 4px;color:#1a1a2e;font-size:14px"><strong>Rolle:</strong> {{role}}</p>
      <p style="margin:0;color:#1a1a2e;font-size:14px"><strong>Gültig bis:</strong> {{expires_in}}</p>
    </div>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 24px">
      Klicke auf den Button, um die Einladung anzunehmen und dein Konto einzurichten.
    </p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="{{invitation_link}}" style="display:inline-block;background:#0969da;color:#ffffff;font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none">
        Einladung annehmen
      </a>
    </div>
    <p style="color:#888;font-size:13px;line-height:1.5;margin:0">
      Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.
    </p>
  </div>
  <div style="padding:16px 24px;text-align:center;border-top:1px solid #eee">
    <p style="color:#999;font-size:12px;margin:0">&copy; Rentably – Immobilienverwaltung einfach gemacht</p>
  </div>
</div>',
  'Du wurdest zu einem Rentably-Account eingeladen.

{{inviter_name}} hat dich eingeladen, gemeinsam Immobilien auf Rentably zu verwalten.

Rolle: {{role}}
Gültig bis: {{expires_in}}

Klicke auf den folgenden Link, um die Einladung anzunehmen:
{{invitation_link}}

Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.',
  '["inviter_name", "invitee_email", "invitation_link", "role", "expires_in"]'::jsonb,
  'de',
  'transactional',
  'Einladung eines neuen Benutzers zu einem bestehenden Account'
)
ON CONFLICT (template_key, language) DO NOTHING;

INSERT INTO email_templates (template_key, template_name, subject, body_html, body_text, variables, language, category, description)
VALUES (
  'account_invitation',
  'Account Invitation',
  'You have been invited to a Rentably account',
  '<div style="font-family:''Manrope'',''Segoe UI'',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
  <div style="padding:32px 24px;text-align:center;background:#1a1a2e;border-radius:12px 12px 0 0">
    <img src="https://rentab.ly/rentably-logo-new.svg" alt="Rentably" style="height:32px" />
  </div>
  <div style="padding:32px 24px">
    <h2 style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0 0 16px">Invitation to collaborate</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 16px">
      <strong>{{inviter_name}}</strong> has invited you to manage properties together on Rentably.
    </p>
    <div style="background:#f0f4f8;border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 4px;color:#1a1a2e;font-size:14px"><strong>Role:</strong> {{role}}</p>
      <p style="margin:0;color:#1a1a2e;font-size:14px"><strong>Valid until:</strong> {{expires_in}}</p>
    </div>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 24px">
      Click the button below to accept the invitation and set up your account.
    </p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="{{invitation_link}}" style="display:inline-block;background:#0969da;color:#ffffff;font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none">
        Accept Invitation
      </a>
    </div>
    <p style="color:#888;font-size:13px;line-height:1.5;margin:0">
      If you did not expect this invitation, you can ignore this email.
    </p>
  </div>
  <div style="padding:16px 24px;text-align:center;border-top:1px solid #eee">
    <p style="color:#999;font-size:12px;margin:0">&copy; Rentably – Property management made easy</p>
  </div>
</div>',
  'You have been invited to a Rentably account.

{{inviter_name}} has invited you to manage properties together on Rentably.

Role: {{role}}
Valid until: {{expires_in}}

Click the following link to accept the invitation:
{{invitation_link}}

If you did not expect this invitation, you can ignore this email.',
  '["inviter_name", "invitee_email", "invitation_link", "role", "expires_in"]'::jsonb,
  'en',
  'transactional',
  'Invitation of a new user to an existing account'
)
ON CONFLICT (template_key, language) DO NOTHING;
