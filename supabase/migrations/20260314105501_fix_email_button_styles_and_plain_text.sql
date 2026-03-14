/*
  # Fix Email Button Styles and Plain Text Versions

  1. Changes
    - Replace pill-style buttons (border-radius: 50px) with app-consistent style (border-radius: 8px) in all HTML templates
    - Also normalize the 8px buttons in feedback_status_changed and ticket_reply to ensure consistency
    - Update ALL body_text (plain text) versions to accurately reflect the HTML content

  2. Templates updated
    - All 40 templates get corrected button radius (50px → 8px)
    - All 40 templates get updated plain text matching HTML content
*/

-- Fix button border-radius: 50px → 8px across ALL templates
UPDATE email_templates
SET body_html = REPLACE(body_html, 'border-radius: 50px; font-size: 14px; font-weight: 700', 'border-radius: 8px; font-size: 14px; font-weight: 700')
WHERE body_html LIKE '%border-radius: 50px%';

-- Now update each template's body_text to match HTML content

-- admin_notify_new_feedback DE
UPDATE email_templates SET body_text = 'Neuer Featurewunsch

Ein neuer Featurewunsch wurde eingereicht:

Benutzer: {{user_email}}
Zahlungsbereitschaft: {{willing_to_pay}}

Featurewunsch:
{{feedback_text}}

Im Admin ansehen: https://rentab.ly/admin?view=feedback

© 2026 rentably - Die moderne Lösung für professionelle Immobilienverwaltung'
WHERE template_key = 'admin_notify_new_feedback' AND language = 'de';

-- admin_notify_new_feedback EN
UPDATE email_templates SET body_text = 'New Feature Request

A new feature request has been submitted:

User: {{user_email}}
Willing to pay: {{willing_to_pay}}

Feature request:
{{feedback_text}}

View in Admin: https://rentab.ly/admin?view=feedback

© 2026 rentably - The modern solution for professional property management'
WHERE template_key = 'admin_notify_new_feedback' AND language = 'en';

-- admin_notify_new_ticket DE
UPDATE email_templates SET body_text = 'Neues Support-Ticket

Es wurde ein neues Support-Ticket eingereicht.

Ticket-Details:
Ticket-Nr.: #{{ticketNumber}}
Name: {{contactName}}
E-Mail: {{contactEmail}}
Betreff: {{subject}}

Nachricht:
{{message}}

© 2026 rentably - Die moderne Lösung für professionelle Immobilienverwaltung'
WHERE template_key = 'admin_notify_new_ticket' AND language = 'de';

-- admin_notify_new_ticket EN
UPDATE email_templates SET body_text = 'New Support Ticket

A new support ticket has been submitted.

Ticket Details:
Ticket No.: #{{ticketNumber}}
Name: {{contactName}}
Email: {{contactEmail}}
Subject: {{subject}}

Message:
{{message}}

© 2026 rentably - The modern solution for professional property management'
WHERE template_key = 'admin_notify_new_ticket' AND language = 'en';

-- contact_ticket_confirmation DE
UPDATE email_templates SET body_text = 'Hallo {{contact_name}},

vielen Dank für Ihre Nachricht. Ihr Ticket wurde erfolgreich erstellt und unser Team wird sich so schnell wie möglich bei Ihnen melden.

Ticket-Details:
Ticket-Nr.: #{{ticket_number}}
Betreff: {{subject}}

Sollten Sie weitere Informationen ergänzen wollen, antworten Sie einfach auf diese E-Mail oder beziehen Sie sich auf die Ticket-Nummer.

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'contact_ticket_confirmation' AND language = 'de';

-- contact_ticket_confirmation EN
UPDATE email_templates SET body_text = 'Hello {{contact_name}},

Thank you for your message. Your ticket has been successfully created and our team will get back to you as soon as possible.

Ticket Details:
Ticket No.: #{{ticket_number}}
Subject: {{subject}}

If you would like to add further information, simply reply to this email or reference the ticket number.

© 2026 rentably'
WHERE template_key = 'contact_ticket_confirmation' AND language = 'en';

-- contract_signed DE
UPDATE email_templates SET body_text = 'Mietvertrag unterzeichnet

Hallo {{recipientName}},

der Mietvertrag für die Immobilie {{propertyAddress}} wurde erfolgreich unterzeichnet.

Vertragsdetails:
Mieter: {{tenantName}}
Objekt: {{propertyAddress}}
Mietbeginn: {{startDate}}
Monatliche Miete: {{monthlyRent}} €

Eine Kopie des Vertrags steht in Ihrem Konto zur Verfügung.

Zum Dashboard: https://rentab.ly/dashboard

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'contract_signed' AND language = 'de';

-- contract_signed EN
UPDATE email_templates SET body_text = 'Rental Contract Signed

Hello {{recipientName}},

The rental contract for the property {{propertyAddress}} has been successfully signed.

Contract Details:
Tenant: {{tenantName}}
Property: {{propertyAddress}}
Lease Start: {{startDate}}
Monthly Rent: €{{monthlyRent}}

A copy of the contract is available in your account.

Go to Dashboard: https://rentab.ly/dashboard

© 2026 rentably'
WHERE template_key = 'contract_signed' AND language = 'en';

-- feedback_new_comment DE
UPDATE email_templates SET body_text = 'Neuer Kommentar zu Ihrem Feature-Wunsch

Hallo {{user_name}},

{{commenter_name}} hat einen neuen Kommentar zu Ihrem Feature-Wunsch hinterlassen.

Ihr Feature-Wunsch:
"{{feedback_text}}"

Neuer Kommentar:
{{comment_text}}

Zum Feature-Board: https://rentab.ly/dashboard?view=feedback

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'feedback_new_comment' AND language = 'de';

-- feedback_new_comment EN
UPDATE email_templates SET body_text = 'New Comment on Your Feature Request

Hello {{user_name}},

{{commenter_name}} has left a new comment on your feature request.

Your feature request:
"{{feedback_text}}"

New comment:
{{comment_text}}

Go to Feature Board: https://rentab.ly/dashboard?view=feedback

© 2026 rentably'
WHERE template_key = 'feedback_new_comment' AND language = 'en';

-- feedback_status_changed DE
UPDATE email_templates SET body_text = 'Statusupdate zu Ihrem Featurewunsch

Hallo {{user_name}},

der Status Ihres Featurewunsches wurde aktualisiert.

Ihr Vorschlag:
{{feedback_text}}

Vorheriger Status: {{old_status}}
Neuer Status: {{new_status}}

Vielen Dank für Ihren Beitrag – wir arbeiten daran, rentably noch besser zu machen!

Zum Feature-Board: https://rentab.ly/dashboard?view=feedback

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'feedback_status_changed' AND language = 'de';

-- feedback_status_changed EN
UPDATE email_templates SET body_text = 'Feature Request Status Update

Hello {{user_name}},

The status of your feature request has been updated.

Your suggestion:
{{feedback_text}}

Previous Status: {{old_status}}
New Status: {{new_status}}

Thank you for your contribution – we are working to make rentably even better!

Go to Feature Board: https://rentab.ly/dashboard?view=feedback

© 2026 rentably'
WHERE template_key = 'feedback_status_changed' AND language = 'en';

-- login_link DE
UPDATE email_templates SET body_text = 'Ihr Anmelde-Link

Hallo {{user_name}},

Sie haben einen Anmelde-Link angefordert. Klicken Sie auf den folgenden Link, um sich anzumelden:

{{login_link}}

Dieser Link ist aus Sicherheitsgründen nur kurze Zeit gültig.

Falls Sie diesen Link nicht angefordert haben, ignorieren Sie diese E-Mail bitte.

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'login_link' AND language = 'de';

-- login_link EN
UPDATE email_templates SET body_text = 'Your Login Link

Hello {{user_name}},

You have requested a login link. Click the following link to log in:

{{login_link}}

For security reasons, this link is only valid for a short time.

If you did not request this link, please ignore this email.

© 2026 rentably'
WHERE template_key = 'login_link' AND language = 'en';

-- magic_link DE
UPDATE email_templates SET body_text = 'Ihr Anmelde-Link

Hallo,

Sie haben einen Magic Link zur Anmeldung bei rentab.ly angefordert.

Klicken Sie auf den folgenden Link, um sich anzumelden:
{{magic_link}}

Dieser Link ist aus Sicherheitsgründen nur 15 Minuten gültig.

Falls Sie diesen Link nicht angefordert haben, ignorieren Sie diese E-Mail bitte.

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'magic_link' AND language = 'de';

-- magic_link EN
UPDATE email_templates SET body_text = 'Your Login Link

Hello,

You have requested a magic link to log in to rentab.ly.

Click the following link to log in:
{{magic_link}}

For security reasons, this link is only valid for 15 minutes.

If you did not request this link, please ignore this email.

© 2026 rentably'
WHERE template_key = 'magic_link' AND language = 'en';

-- password_reset DE
UPDATE email_templates SET body_text = 'Passwort zurücksetzen

Hallo {{user_name}},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:
{{reset_link}}

Dieser Link ist aus Sicherheitsgründen nur 24 Stunden gültig.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt dann unverändert.

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'password_reset' AND language = 'de';

-- password_reset EN
UPDATE email_templates SET body_text = 'Reset Your Password

Hello {{user_name}},

You have requested to reset your password.

Click the following link to set a new password:
{{reset_link}}

For security reasons, this link is only valid for 24 hours.

If you did not request this change, please ignore this email. Your password will remain unchanged.

© 2026 rentably'
WHERE template_key = 'password_reset' AND language = 'en';

-- referral_invitation DE
UPDATE email_templates SET body_text = 'Einladung zu rentab.ly

Hallo!

{{inviter_name}} hat dich zu rentab.ly eingeladen – der professionellen Lösung für deine Immobilienverwaltung.

Deine Vorteile:
- 2 Monate rentab.ly PRO gratis
- Vollständige Übersicht über alle Immobilien
- Automatische Mietzahlungsverfolgung
- Mieterportal für direkte Kommunikation

Jetzt registrieren: {{registration_link}}
Dein Empfehlungscode: {{referral_code}}

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'referral_invitation' AND language = 'de';

-- referral_invitation EN
UPDATE email_templates SET body_text = 'Invitation to rentab.ly

Hello!

{{inviter_name}} has invited you to rentab.ly – the professional solution for your property management.

Your benefits:
- 2 months rentab.ly PRO free
- Complete overview of all properties
- Automatic rent payment tracking
- Tenant portal for direct communication

Register now: {{registration_link}}
Your referral code: {{referral_code}}

© 2026 rentably'
WHERE template_key = 'referral_invitation' AND language = 'en';

-- registration DE
UPDATE email_templates SET body_text = 'Willkommen bei rentab.ly!

Hallo {{user_name}},

vielen Dank für Ihre Registrierung bei rentab.ly – Ihrer modernen Lösung für professionelle Immobilienverwaltung!

Sie können sich jetzt mit Ihrer E-Mail-Adresse {{user_email}} anmelden und Ihre Immobilien verwalten.

Was Sie mit rentab.ly können:
- Immobilien und Einheiten digital verwalten
- Mietverträge erstellen und organisieren
- Mietzahlungen verfolgen und dokumentieren
- Tickets und Anfragen bearbeiten
- Mieterportal für direkte Kommunikation
- Dokumente zentral speichern

Jetzt loslegen: https://rentab.ly/dashboard

Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.

Viel Erfolg mit rentab.ly!

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'registration' AND language = 'de';

-- registration EN
UPDATE email_templates SET body_text = 'Welcome to rentab.ly!

Hello {{user_name}},

Thank you for registering with rentab.ly – your modern solution for professional property management!

You can now log in with your email address {{user_email}} and manage your properties.

What you can do with rentab.ly:
- Manage properties and units digitally
- Create and organize rental contracts
- Track and document rent payments
- Handle tickets and requests
- Tenant portal for direct communication
- Store documents centrally

Get started: https://rentab.ly/dashboard

If you have any questions, we are always here to help.

Best of luck with rentab.ly!

© 2026 rentably'
WHERE template_key = 'registration' AND language = 'en';

-- rent_increase_notification DE
UPDATE email_templates SET body_text = 'Ankündigung Mieterhöhung

Sehr geehrte/r {{tenantName}},

hiermit informieren wir Sie über eine Anpassung der Miete für die Immobilie {{propertyAddress}}.

Aktuelle Miete: {{currentRent}} €
Neue Miete: {{newRent}} €
Erhöhung: +{{increaseAmount}} € ({{increasePercentage}}%)
Wirksamkeit ab: {{effectiveDate}}

{{additionalInfo}}

Mit freundlichen Grüßen,
{{landlordName}}

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'rent_increase_notification' AND language = 'de';

-- rent_increase_notification EN
UPDATE email_templates SET body_text = 'Rent Increase Notification

Dear {{tenantName}},

We are writing to inform you of a rent adjustment for the property {{propertyAddress}}.

Current Rent: €{{currentRent}}
New Rent: €{{newRent}}
Increase: +€{{increaseAmount}} ({{increasePercentage}}%)
Effective From: {{effectiveDate}}

{{additionalInfo}}

Best regards,
{{landlordName}}

© 2026 rentably'
WHERE template_key = 'rent_increase_notification' AND language = 'en';

-- rent_payment_reminder DE
UPDATE email_templates SET body_text = 'Erinnerung: Mietzahlung

Hallo {{tenantName}},

dies ist eine freundliche Erinnerung, dass die Mietzahlung für {{propertyAddress}} fällig ist.

Betrag: {{amount}} €
Fällig am: {{dueDate}}

Bitte überweisen Sie den Betrag zeitnah auf das hinterlegte Konto.

Falls Sie bereits gezahlt haben, betrachten Sie diese E-Mail bitte als gegenstandslos.

Mit freundlichen Grüßen,
{{landlordName}}

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'rent_payment_reminder' AND language = 'de';

-- rent_payment_reminder EN
UPDATE email_templates SET body_text = 'Reminder: Rent Payment

Hello {{tenantName}},

This is a friendly reminder that the rent payment for {{propertyAddress}} is due.

Amount: €{{amount}}
Due Date: {{dueDate}}

Please transfer the amount to the registered account promptly.

If you have already paid, please disregard this email.

Best regards,
{{landlordName}}

© 2026 rentably'
WHERE template_key = 'rent_payment_reminder' AND language = 'en';

-- subscription_cancelled DE
UPDATE email_templates SET body_text = 'Abonnement gekündigt

Hallo {{user_name}},

Ihre Kündigung wurde erfolgreich bearbeitet.

Ihr Abonnement läuft noch bis zum {{end_date}}.
Bis dahin können Sie weiterhin alle Premium-Funktionen nutzen.

Schade, dass Sie uns verlassen! Wir würden uns freuen, Sie in Zukunft wieder bei rentab.ly begrüßen zu dürfen.

Falls Sie Feedback für uns haben, antworten Sie gerne auf diese E-Mail.

Vielen Dank für Ihr Vertrauen!

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'subscription_cancelled' AND language = 'de';

-- subscription_cancelled EN
UPDATE email_templates SET body_text = 'Subscription Cancelled

Hello {{user_name}},

Your cancellation has been successfully processed.

Your subscription will remain active until {{end_date}}.
Until then, you can continue to use all premium features.

We are sorry to see you go! We would be happy to welcome you back to rentab.ly in the future.

If you have any feedback for us, feel free to reply to this email.

Thank you for your trust!

© 2026 rentably'
WHERE template_key = 'subscription_cancelled' AND language = 'en';

-- subscription_started DE
UPDATE email_templates SET body_text = 'Willkommen bei Pro!

Hallo {{user_name}},

Ihr {{subscription_plan}}-Abonnement wurde erfolgreich aktiviert!

Sie haben jetzt Zugriff auf alle Pro-Funktionen:
- Unbegrenzte Immobilien und Einheiten
- Mieterportal für direkte Kommunikation
- Erweiterte Finanzanalysen
- Automatische Nebenkostenabrechnung
- Dokumentenverwaltung ohne Limits
- Prioritäts-Support

Zum Dashboard: https://rentab.ly/dashboard

Viel Erfolg mit rentab.ly Pro!

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'subscription_started' AND language = 'de';

-- subscription_started EN
UPDATE email_templates SET body_text = 'Welcome to Pro!

Hello {{user_name}},

Your {{subscription_plan}} subscription has been successfully activated!

You now have access to all Pro features:
- Unlimited properties and units
- Tenant portal for direct communication
- Advanced financial analytics
- Automatic utility billing
- Unlimited document management
- Priority support

Go to Dashboard: https://rentab.ly/dashboard

Enjoy rentab.ly Pro!

© 2026 rentably'
WHERE template_key = 'subscription_started' AND language = 'en';

-- tenant_password_reset DE
UPDATE email_templates SET body_text = 'Passwort zurücksetzen – Mieterportal

Sie haben eine Anfrage zum Zurücksetzen Ihres Mieterportal-Passworts gestellt.

Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:
{{reset_link}}

Dieser Link ist aus Sicherheitsgründen nur 1 Stunde gültig.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt dann unverändert.

© 2026 rentably'
WHERE template_key = 'tenant_password_reset' AND language = 'de';

-- tenant_password_reset EN
UPDATE email_templates SET body_text = 'Reset Your Password – Tenant Portal

You have requested to reset your tenant portal password.

Click the following link to set a new password:
{{reset_link}}

This link is valid for 1 hour only.

If you did not request this, please ignore this email. Your password will remain unchanged.

© 2026 rentably'
WHERE template_key = 'tenant_password_reset' AND language = 'en';

-- tenant_portal_activation DE
UPDATE email_templates SET body_text = 'Ihr Zugang zum Mieterportal

Hallo {{tenant_name}},

Ihr Vermieter {{landlord_name}} hat für Sie einen Zugang zum Mieterportal eingerichtet.

Immobilie: {{property_address}}

So aktivieren Sie Ihren Zugang:
1. Öffnen Sie den folgenden Link: {{portal_link}}
2. Geben Sie Ihre E-Mail-Adresse ein: {{tenant_email}}
3. Legen Sie ein persönliches Passwort fest
4. Nach der Aktivierung können Sie sich jederzeit im Mieterportal anmelden

Im Mieterportal können Sie:
- Ihre Vertragsdaten und Mietinformationen einsehen
- Dokumente herunterladen
- Zählerstände erfassen und melden
- Anfragen und Tickets an Ihren Vermieter senden
- Ihre Kontaktdaten verwalten

Konto jetzt aktivieren: {{portal_link}}

Bei Fragen wenden Sie sich bitte direkt an Ihren Vermieter:
{{landlord_name}} – {{landlord_email}}

© 2026 rentably'
WHERE template_key = 'tenant_portal_activation' AND language = 'de';

-- tenant_portal_activation EN
UPDATE email_templates SET body_text = 'Your Access to the Tenant Portal

Hello {{tenant_name}},

Your landlord {{landlord_name}} has set up tenant portal access for you.

Property: {{property_address}}

How to activate your account:
1. Open the following link: {{portal_link}}
2. Enter your email address: {{tenant_email}}
3. Set a personal password
4. After activation, you can log in to the tenant portal anytime

In the tenant portal you can:
- View your contract details and rent information
- Download documents
- Submit meter readings
- Create tickets and send messages to your landlord
- Manage your contact information

Activate account now: {{portal_link}}

If you have any questions, please contact your landlord directly:
{{landlord_name}} – {{landlord_email}}

© 2026 rentably'
WHERE template_key = 'tenant_portal_activation' AND language = 'en';

-- ticket_reply DE
UPDATE email_templates SET body_text = 'Antwort auf Ihre Anfrage

Hallo {{recipientName}},

wir haben auf Ihr Ticket #{{ticketNumber}} geantwortet.

Betreff: {{ticketSubject}}

{{replyMessage}}

{{additionalInfo}}

Für Rückfragen antworten Sie einfach auf diese E-Mail.

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'ticket_reply' AND language = 'de';

-- ticket_reply EN
UPDATE email_templates SET body_text = 'Reply to Your Request

Hello {{recipientName}},

We have responded to your ticket #{{ticketNumber}}.

Subject: {{ticketSubject}}

{{replyMessage}}

{{additionalInfo}}

To reply, simply respond to this email.

© 2026 rentably'
WHERE template_key = 'ticket_reply' AND language = 'en';

-- trial_ended DE
UPDATE email_templates SET body_text = 'Ihre Testphase ist abgelaufen

Hallo,

Ihre 30-tägige Testphase ist am {{trial_end_date}} abgelaufen.

Ihre Daten bleiben erhalten. Upgraden Sie auf Pro, um wieder vollen Zugriff auf alle Features zu erhalten.

Pro-Features freischalten:
- Unbegrenzte Immobilien und Mieter
- Erweiterte Finanzanalysen
- Mieterportal
- Dokument-Management
- Und vieles mehr

Jetzt upgraden: {{upgrade_link}}

Viele Grüße,
Ihr rentably Team

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'trial_ended' AND language = 'de';

-- trial_ending DE
UPDATE email_templates SET body_text = 'Ihre Testphase endet bald

Hallo,

Ihre 30-tägige Testphase endet in {{days_remaining}} Tagen am {{trial_end_date}}.

Upgraden Sie jetzt auf Pro, um alle Features weiterhin ohne Unterbrechung nutzen zu können.

Nur 9 EUR/Monat für unbegrenzte Immobilien, Mieter und alle Pro-Features!

Jetzt upgraden: {{upgrade_link}}

Viele Grüße,
Ihr rentably Team

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'trial_ending' AND language = 'de';

-- user_invitation DE
UPDATE email_templates SET body_text = 'Sie wurden zu rentab.ly eingeladen

Hallo,

{{inviter_name}} hat Sie eingeladen, rentab.ly zu nutzen.

Für die E-Mail-Adresse {{invitee_email}} wurde ein Konto erstellt.

Klicken Sie auf den folgenden Link, um die Einladung anzunehmen und Ihr Passwort festzulegen:
{{invitation_link}}

rentab.ly ist Ihre moderne Lösung für professionelle Immobilienverwaltung.

© 2026 rentably | Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum'
WHERE template_key = 'user_invitation' AND language = 'de';

-- user_invitation EN
UPDATE email_templates SET body_text = 'You Have Been Invited to rentab.ly

Hello,

{{inviter_name}} has invited you to use rentab.ly.

An account has been created for the email address {{invitee_email}}.

Click the following link to accept the invitation and set your password:
{{invitation_link}}

rentab.ly is your modern solution for professional property management.

© 2026 rentably'
WHERE template_key = 'user_invitation' AND language = 'en';
