/*
  # Populate German Email Templates with Complete Content

  1. Updates
    - Update all existing German templates with professional, complete content
    - Ensure all variables are properly used
    - Consistent branding (rentab.ly)
    - Professional HTML formatting

  2. Templates Updated
    - registration (Willkommens E-Mail)
    - user_invitation (Benutzereinladung)
    - password_reset (Passwort zurücksetzen)
    - tenant_portal_activation (Mieterportal-Aktivierung)
    - ticket_reply (Ticket-Antwort)
    - contract_signed (Vertrag unterzeichnet)
    - rent_payment_reminder (Mietzahlungserinnerung)
    - rent_increase_notification (Mieterhöhungsankündigung)
    - subscription_started (Abo Aktivierung)
    - subscription_cancelled (Abo Kündigungsbestätigung)
    - login_link (Anmelde Link)
*/

-- 1. Registration (Welcome Email)
UPDATE email_templates 
SET 
  template_name = 'Willkommens E-Mail',
  subject = 'Willkommen bei rentab.ly',
  description = 'Begrüßungs-E-Mail für neue Benutzer nach erfolgreicher Registrierung',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin-bottom: 10px;">Willkommen bei rentab.ly!</h1>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    vielen Dank für Ihre Registrierung bei rentab.ly, Ihrer modernen Lösung für professionelle Immobilienverwaltung!
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Sie können sich jetzt mit Ihrer E-Mail-Adresse <strong>{{user_email}}</strong> anmelden und Ihre Immobilien verwalten.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">Was Sie mit rentab.ly können:</h3>
    <ul style="color: #475569; line-height: 1.8;">
      <li>Immobilien und Einheiten digital verwalten</li>
      <li>Mietverträge erstellen und organisieren</li>
      <li>Mietzahlungen verfolgen und dokumentieren</li>
      <li>Tickets und Anfragen bearbeiten</li>
      <li>Mieterportal für direkte Kommunikation</li>
      <li>Dokumente zentral speichern</li>
    </ul>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Viel Erfolg mit rentab.ly!<br>
    Ihr rentab.ly Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly - Moderne Immobilienverwaltung
  </p>
</div>',
  body_text = 'Willkommen bei rentab.ly!

Hallo {{user_name}},

vielen Dank für Ihre Registrierung bei rentab.ly, Ihrer modernen Lösung für professionelle Immobilienverwaltung!

Sie können sich jetzt mit Ihrer E-Mail-Adresse {{user_email}} anmelden und Ihre Immobilien verwalten.

Was Sie mit rentab.ly können:
- Immobilien und Einheiten digital verwalten
- Mietverträge erstellen und organisieren
- Mietzahlungen verfolgen und dokumentieren
- Tickets und Anfragen bearbeiten
- Mieterportal für direkte Kommunikation
- Dokumente zentral speichern

Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.

Viel Erfolg mit rentab.ly!
Ihr rentab.ly Team

---
© 2026 rentab.ly - Moderne Immobilienverwaltung',
  updated_at = now()
WHERE template_key = 'registration' AND language = 'de';

-- 2. User Invitation
UPDATE email_templates 
SET 
  template_name = 'Benutzereinladung',
  subject = 'Sie wurden zu rentab.ly eingeladen',
  description = 'Einladungs-E-Mail für neue Benutzer zum Beitritt',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Einladung zu rentab.ly</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo,</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    <strong>{{inviter_name}}</strong> hat Sie eingeladen, rentab.ly zu nutzen.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Für die E-Mail-Adresse <strong>{{invitee_email}}</strong> wurde ein Konto erstellt.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invitation_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Einladung annehmen
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    rentab.ly ist Ihre moderne Lösung für professionelle Immobilienverwaltung.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Einladung zu rentab.ly

Hallo,

{{inviter_name}} hat Sie eingeladen, rentab.ly zu nutzen.

Für die E-Mail-Adresse {{invitee_email}} wurde ein Konto erstellt.

Klicken Sie auf den folgenden Link, um die Einladung anzunehmen:
{{invitation_link}}

rentab.ly ist Ihre moderne Lösung für professionelle Immobilienverwaltung.

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'user_invitation' AND language = 'de';

-- 3. Password Reset
UPDATE email_templates 
SET 
  template_name = 'Passwort zurücksetzen',
  subject = 'Passwort zurücksetzen - rentab.ly',
  description = 'E-Mail zum Zurücksetzen des Passworts',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Passwort zurücksetzen</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Klicken Sie auf den folgenden Button, um ein neues Passwort festzulegen:
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{reset_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Passwort zurücksetzen
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Dieser Link ist aus Sicherheitsgründen nur 24 Stunden gültig.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt dann unverändert.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Passwort zurücksetzen

Hallo {{user_name}},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:
{{reset_link}}

Dieser Link ist aus Sicherheitsgründen nur 24 Stunden gültig.

Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte. Ihr Passwort bleibt dann unverändert.

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'password_reset' AND language = 'de';

-- 4. Tenant Portal Activation
UPDATE email_templates 
SET 
  template_name = 'Mieterportal-Aktivierung',
  subject = 'Ihr Zugang zum Mieterportal - rentab.ly',
  description = 'E-Mail zur Aktivierung des Mieterportal-Zugangs',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Willkommen im Mieterportal</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{tenant_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Ihr Vermieter <strong>{{landlord_name}}</strong> ({{landlord_email}}) hat für Sie einen Zugang zum Mieterportal eingerichtet.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">Im Mieterportal können Sie:</h3>
    <ul style="color: #475569; line-height: 1.8;">
      <li>Ihre Vertragsdaten einsehen</li>
      <li>Dokumente herunterladen</li>
      <li>Zählerstände erfassen</li>
      <li>Tickets erstellen und Nachrichten senden</li>
      <li>Ihre Kontaktdaten verwalten</li>
    </ul>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{portal_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Zum Mieterportal
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Ihre Zugangsdaten:<br>
    E-Mail: <strong>{{tenant_email}}</strong>
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Bei Fragen wenden Sie sich bitte direkt an Ihren Vermieter.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Willkommen im Mieterportal

Hallo {{tenant_name}},

Ihr Vermieter {{landlord_name}} ({{landlord_email}}) hat für Sie einen Zugang zum Mieterportal eingerichtet.

Im Mieterportal können Sie:
- Ihre Vertragsdaten einsehen
- Dokumente herunterladen
- Zählerstände erfassen
- Tickets erstellen und Nachrichten senden
- Ihre Kontaktdaten verwalten

Zugang zum Portal:
{{portal_link}}

Ihre Zugangsdaten:
E-Mail: {{tenant_email}}

Bei Fragen wenden Sie sich bitte direkt an Ihren Vermieter.

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'tenant_portal_activation' AND language = 'de';

-- 5. Ticket Reply
UPDATE email_templates 
SET 
  template_name = 'Ticket-Antwort',
  subject = 'Re: {{ticketSubject}} [Ticket #{{ticketNumber}}]',
  description = 'E-Mail-Benachrichtigung bei neuer Ticket-Antwort',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Neue Antwort auf Ihr Ticket</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{recipientName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    <strong>{{senderName}}</strong> hat auf Ihr Ticket geantwortet.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">{{replyMessage}}</p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Ticket-Nr.: <strong>#{{ticketNumber}}</strong><br>
    Betreff: {{ticketSubject}}
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    {{additionalInfo}}
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Neue Antwort auf Ihr Ticket

Hallo {{recipientName}},

{{senderName}} hat auf Ihr Ticket geantwortet.

---
{{replyMessage}}
---

Ticket-Nr.: #{{ticketNumber}}
Betreff: {{ticketSubject}}

{{additionalInfo}}

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'ticket_reply' AND language = 'de';

-- 6. Contract Signed
UPDATE email_templates 
SET 
  template_name = 'Vertrag unterzeichnet',
  subject = 'Mietvertrag unterzeichnet - {{propertyAddress}}',
  description = 'Bestätigung nach Vertragsunterzeichnung',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Mietvertrag unterzeichnet</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{recipientName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    der Mietvertrag für die Immobilie <strong>{{propertyAddress}}</strong> wurde erfolgreich unterzeichnet.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">Vertragsdetails</h3>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Mieter:</strong> {{tenantName}}
    </p>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Objekt:</strong> {{propertyAddress}}
    </p>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Mietbeginn:</strong> {{startDate}}
    </p>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Monatliche Miete:</strong> {{monthlyRent}} €
    </p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Eine Kopie des Vertrags steht in Ihrem Konto zur Verfügung.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Mietvertrag unterzeichnet

Hallo {{recipientName}},

der Mietvertrag für die Immobilie {{propertyAddress}} wurde erfolgreich unterzeichnet.

Vertragsdetails:
- Mieter: {{tenantName}}
- Objekt: {{propertyAddress}}
- Mietbeginn: {{startDate}}
- Monatliche Miete: {{monthlyRent}} €

Eine Kopie des Vertrags steht in Ihrem Konto zur Verfügung.

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'contract_signed' AND language = 'de';

-- 7. Rent Payment Reminder
UPDATE email_templates 
SET 
  template_name = 'Mietzahlungserinnerung',
  subject = 'Erinnerung: Mietzahlung für {{propertyAddress}}',
  description = 'Erinnerung an fällige Mietzahlung',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Erinnerung: Mietzahlung</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{tenantName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    dies ist eine freundliche Erinnerung, dass die Mietzahlung für <strong>{{propertyAddress}}</strong> fällig ist.
  </p>
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
    <p style="color: #92400e; margin: 8px 0;">
      <strong>Betrag:</strong> {{amount}} €
    </p>
    <p style="color: #92400e; margin: 8px 0;">
      <strong>Fällig am:</strong> {{dueDate}}
    </p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Bitte überweisen Sie den Betrag zeitnah auf das hinterlegte Konto.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Falls Sie bereits gezahlt haben, betrachten Sie diese E-Mail bitte als gegenstandslos.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Mit freundlichen Grüßen,<br>
    {{landlordName}}
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Erinnerung: Mietzahlung

Hallo {{tenantName}},

dies ist eine freundliche Erinnerung, dass die Mietzahlung für {{propertyAddress}} fällig ist.

Betrag: {{amount}} €
Fällig am: {{dueDate}}

Bitte überweisen Sie den Betrag zeitnah auf das hinterlegte Konto.

Falls Sie bereits gezahlt haben, betrachten Sie diese E-Mail bitte als gegenstandslos.

Mit freundlichen Grüßen,
{{landlordName}}

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'rent_payment_reminder' AND language = 'de';

-- 8. Rent Increase Notification
UPDATE email_templates 
SET 
  template_name = 'Mieterhöhungsankündigung',
  subject = 'Ankündigung Mieterhöhung - {{propertyAddress}}',
  description = 'Benachrichtigung über bevorstehende Mieterhöhung',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Ankündigung Mieterhöhung</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Sehr geehrte/r {{tenantName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    hiermit informieren wir Sie über eine Anpassung der Miete für die Immobilie <strong>{{propertyAddress}}</strong>.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Aktuelle Miete:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">{{currentRent}} €</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Neue Miete:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2563eb;">{{newRent}} €</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Erhöhung:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b; border-top: 1px solid #e2e8f0;">+{{increaseAmount}} € ({{increasePercentage}}%)</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Wirksamkeit ab:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">{{effectiveDate}}</td>
      </tr>
    </table>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    {{additionalInfo}}
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Mit freundlichen Grüßen,<br>
    {{landlordName}}
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Ankündigung Mieterhöhung

Sehr geehrte/r {{tenantName}},

hiermit informieren wir Sie über eine Anpassung der Miete für die Immobilie {{propertyAddress}}.

Aktuelle Miete: {{currentRent}} €
Neue Miete: {{newRent}} €
Erhöhung: +{{increaseAmount}} € ({{increasePercentage}}%)
Wirksamkeit ab: {{effectiveDate}}

{{additionalInfo}}

Mit freundlichen Grüßen,
{{landlordName}}

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'rent_increase_notification' AND language = 'de';

-- 9. Subscription Started
UPDATE email_templates 
SET 
  template_name = 'Abo Aktivierung',
  subject = 'Ihr Premium-Abonnement wurde aktiviert - rentab.ly',
  description = 'Bestätigung der Abo-Aktivierung',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Willkommen bei Premium!</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Ihr <strong>{{subscription_plan}}</strong>-Abonnement wurde erfolgreich aktiviert!
  </p>
  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 30px 0;">
    <p style="color: #166534; font-weight: 600; margin: 0;">
      Sie haben jetzt Zugriff auf alle Premium-Funktionen!
    </p>
  </div>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">Ihre Premium-Vorteile:</h3>
    <ul style="color: #475569; line-height: 1.8;">
      <li>Unbegrenzte Immobilien und Einheiten</li>
      <li>Mieterportal für direkte Kommunikation</li>
      <li>Erweiterte Finanzanalysen</li>
      <li>Automatische Nebenkostenabrechnung</li>
      <li>Dokumentenverwaltung ohne Limits</li>
      <li>Prioritäts-Support</li>
    </ul>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Viel Erfolg mit rentab.ly Premium!<br>
    Ihr rentab.ly Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Willkommen bei Premium!

Hallo {{user_name}},

Ihr {{subscription_plan}}-Abonnement wurde erfolgreich aktiviert!

Sie haben jetzt Zugriff auf alle Premium-Funktionen!

Ihre Premium-Vorteile:
- Unbegrenzte Immobilien und Einheiten
- Mieterportal für direkte Kommunikation
- Erweiterte Finanzanalysen
- Automatische Nebenkostenabrechnung
- Dokumentenverwaltung ohne Limits
- Prioritäts-Support

Viel Erfolg mit rentab.ly Premium!
Ihr rentab.ly Team

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'subscription_started' AND language = 'de';

-- 10. Subscription Cancelled
UPDATE email_templates 
SET 
  template_name = 'Abo Kündigungsbestätigung',
  subject = 'Ihr Abonnement wurde gekündigt - rentab.ly',
  description = 'Bestätigung der Abo-Kündigung',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Abonnement gekündigt</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Ihre Kündigung wurde erfolgreich bearbeitet.
  </p>
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
    <p style="color: #92400e; margin: 0;">
      Ihr Abonnement läuft noch bis zum <strong>{{end_date}}</strong>.<br>
      Bis dahin können Sie weiterhin alle Premium-Funktionen nutzen.
    </p>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Schade, dass Sie uns verlassen! Wir würden uns freuen, Sie in Zukunft wieder bei rentab.ly begrüßen zu dürfen.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Falls Sie Feedback für uns haben, antworten Sie gerne auf diese E-Mail.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Vielen Dank für Ihr Vertrauen!<br>
    Ihr rentab.ly Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Abonnement gekündigt

Hallo {{user_name}},

Ihre Kündigung wurde erfolgreich bearbeitet.

Ihr Abonnement läuft noch bis zum {{end_date}}.
Bis dahin können Sie weiterhin alle Premium-Funktionen nutzen.

Schade, dass Sie uns verlassen! Wir würden uns freuen, Sie in Zukunft wieder bei rentab.ly begrüßen zu dürfen.

Falls Sie Feedback für uns haben, antworten Sie gerne auf diese E-Mail.

Vielen Dank für Ihr Vertrauen!
Ihr rentab.ly Team

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'subscription_cancelled' AND language = 'de';

-- 11. Login Link
UPDATE email_templates 
SET 
  template_name = 'Anmelde Link',
  subject = 'Ihr Anmelde-Link - rentab.ly',
  description = 'E-Mail mit temporärem Anmelde-Link',
  body_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Ihr Anmelde-Link</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hallo {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Sie haben einen Anmelde-Link angefordert. Klicken Sie auf den Button unten, um sich anzumelden:
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{login_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Jetzt anmelden
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Dieser Link ist aus Sicherheitsgründen nur kurze Zeit gültig.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Falls Sie diesen Link nicht angefordert haben, ignorieren Sie diese E-Mail bitte.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  body_text = 'Ihr Anmelde-Link

Hallo {{user_name}},

Sie haben einen Anmelde-Link angefordert. Klicken Sie auf den folgenden Link, um sich anzumelden:

{{login_link}}

Dieser Link ist aus Sicherheitsgründen nur kurze Zeit gültig.

Falls Sie diesen Link nicht angefordert haben, ignorieren Sie diese E-Mail bitte.

---
© 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'login_link' AND language = 'de';