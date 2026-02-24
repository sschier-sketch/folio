/*
  # Add admin notification email template for new tickets

  1. New Email Templates
    - `admin_notify_new_ticket` (de) - German template for notifying admins about new support tickets
    - `admin_notify_new_ticket` (en) - English template for notifying admins about new support tickets

  2. Template Variables
    - `ticketNumber` - The ticket reference number
    - `contactName` - Name of the person who submitted the ticket
    - `contactEmail` - Email of the person who submitted the ticket
    - `subject` - Subject of the ticket
    - `message` - The ticket message content
*/

INSERT INTO email_templates (template_key, language, subject, body_html, body_text, variables)
VALUES (
  'admin_notify_new_ticket',
  'de',
  'Neues Support-Ticket #{{ticketNumber}}',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1E1E24;">Neues Support-Ticket</h2>
    <p style="color: #666;">Es wurde ein neues Support-Ticket eingereicht.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Ticket-Nr.:</td><td style="padding: 8px 0; font-weight: 600; color: #1E1E24;">#{{ticketNumber}}</td></tr>
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Name:</td><td style="padding: 8px 0; color: #1E1E24;">{{contactName}}</td></tr>
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">E-Mail:</td><td style="padding: 8px 0; color: #1E1E24;">{{contactEmail}}</td></tr>
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Betreff:</td><td style="padding: 8px 0; color: #1E1E24;">{{subject}}</td></tr>
    </table>
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #999; font-size: 12px; margin: 0 0 8px;">Nachricht:</p>
      <p style="color: #1E1E24; white-space: pre-wrap; margin: 0;">{{message}}</p>
    </div>
  </div>',
  'Neues Support-Ticket #{{ticketNumber}}

Name: {{contactName}}
E-Mail: {{contactEmail}}
Betreff: {{subject}}

Nachricht:
{{message}}',
  '["ticketNumber", "contactName", "contactEmail", "subject", "message"]'::jsonb
)
ON CONFLICT (template_key, language) DO NOTHING;

INSERT INTO email_templates (template_key, language, subject, body_html, body_text, variables)
VALUES (
  'admin_notify_new_ticket',
  'en',
  'New Support Ticket #{{ticketNumber}}',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1E1E24;">New Support Ticket</h2>
    <p style="color: #666;">A new support ticket has been submitted.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Ticket No.:</td><td style="padding: 8px 0; font-weight: 600; color: #1E1E24;">#{{ticketNumber}}</td></tr>
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Name:</td><td style="padding: 8px 0; color: #1E1E24;">{{contactName}}</td></tr>
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Email:</td><td style="padding: 8px 0; color: #1E1E24;">{{contactEmail}}</td></tr>
      <tr><td style="padding: 8px 0; color: #999; font-size: 14px;">Subject:</td><td style="padding: 8px 0; color: #1E1E24;">{{subject}}</td></tr>
    </table>
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #999; font-size: 12px; margin: 0 0 8px;">Message:</p>
      <p style="color: #1E1E24; white-space: pre-wrap; margin: 0;">{{message}}</p>
    </div>
  </div>',
  'New Support Ticket #{{ticketNumber}}

Name: {{contactName}}
Email: {{contactEmail}}
Subject: {{subject}}

Message:
{{message}}',
  '["ticketNumber", "contactName", "contactEmail", "subject", "message"]'::jsonb
)
ON CONFLICT (template_key, language) DO NOTHING;
