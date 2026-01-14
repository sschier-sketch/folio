# E-Mail-Versand Konfiguration

Diese Anleitung erklärt, wie Sie den E-Mail-Versand für Rentably einrichten.

## Schnellstart

**Der E-Mail-Versand ist bereits vorkonfiguriert** und nutzt Resend's `onboarding@resend.dev` Domain für Testzwecke. Alle E-Mails sollten sofort funktionieren.

Für die Produktion sollten Sie eine eigene Domain verifizieren (siehe unten).

## 1. Magic Link Login (bereits funktionsfähig)

Der **Magic Link Login** funktioniert sofort out-of-the-box mit Supabase's integriertem E-Mail-Service.

### Für Entwicklung:
- Magic Links werden automatisch von Supabase versendet
- E-Mails landen im **Spam-Ordner** oder werden in der Supabase-Console angezeigt
- Überprüfen Sie die Supabase Dashboard Logs für Magic Link URLs

### Für Production:

1. Gehen Sie zum [Supabase Dashboard](https://app.supabase.com)
2. Wählen Sie Ihr Projekt
3. Navigieren Sie zu **Authentication** > **Email Templates**
4. Konfigurieren Sie einen **Custom SMTP Server**:
   - SMTP Host
   - SMTP Port
   - SMTP User
   - SMTP Password
   - Sender Email
   - Sender Name

#### Empfohlene SMTP-Services:
- **Resend** (modern, einfach, 100 E-Mails/Tag gratis)
- **SendGrid** (bis 100 E-Mails/Tag gratis)
- **Mailgun** (bis 5.000 E-Mails/Monat gratis)
- **Amazon SES** (günstig für große Mengen)

## 2. Custom E-Mail-Templates (Bereits konfiguriert)

Für eigene E-Mails (Einladungen, Benachrichtigungen, Tickets, etc.) sind Edge Functions bereits konfiguriert und verwenden Resend.

### Standard-Konfiguration (onboarding@resend.dev)

Die Edge Functions sind bereits so konfiguriert, dass sie die Resend Onboarding-Domain verwenden:
- Absenderadresse: `Rentably <onboarding@resend.dev>`
- Funktioniert sofort ohne weitere Konfiguration
- Geeignet für Entwicklung und Tests
- **Empfehlung:** Für Produktion eine eigene Domain verifizieren

### Resend Integration für Produktion

#### Schritt 1: Resend Account erstellen
1. Gehen Sie zu [resend.com](https://resend.com)
2. Erstellen Sie einen kostenlosen Account
3. Verifizieren Sie Ihre Domain (oder nutzen Sie die Test-Domain)
4. Erstellen Sie einen API-Key

#### Schritt 2: API-Key in Supabase hinterlegen

Der RESEND_API_KEY muss in den Supabase Secrets gespeichert werden:

1. Gehen Sie zum Supabase Dashboard
2. Wählen Sie Ihr Projekt
3. Navigieren Sie zu **Settings > Edge Functions > Secrets**
4. Fügen Sie hinzu: `RESEND_API_KEY` mit Ihrem API-Key

#### Schritt 3: Eigene E-Mail-Domain konfigurieren (Optional)

Um eine eigene Absenderadresse zu verwenden:

1. Verifizieren Sie Ihre Domain bei Resend
2. Fügen Sie in Supabase Secrets hinzu:
   - `EMAIL_FROM` mit Wert: `Ihr Name <noreply@ihre-domain.de>`

**Hinweis:** Ohne eigene Domain wird `onboarding@resend.dev` verwendet.

#### Schritt 4: E-Mail senden
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-email`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'Willkommen bei Rentably',
      html: '<h1>Willkommen!</h1><p>Vielen Dank für Ihre Registrierung.</p>',
      text: 'Willkommen! Vielen Dank für Ihre Registrierung.',
    }),
  }
);
```

## 3. E-Mail-Templates verwenden

Die Anwendung hat bereits E-Mail-Templates in der Datenbank (`email_templates` Tabelle):

- `user_invitation` - Benutzereinladung
- `registration` - Willkommens-E-Mail
- `password_reset` - Passwort zurücksetzen
- `login_link` - Login-Link
- `subscription_started` - Abo gestartet
- `subscription_cancelled` - Abo gekündigt

### Template-Variablen ersetzen:
```typescript
// Template aus DB laden
const { data: template } = await supabase
  .from('email_templates')
  .select('*')
  .eq('template_key', 'user_invitation')
  .single();

// Variablen ersetzen
let html = template.body_html;
html = html.replace('{{inviter_name}}', 'Max Mustermann');
html = html.replace('{{invitation_link}}', 'https://rentably.com/invite/...');

// E-Mail senden
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: template.subject,
    html,
    text: template.body_text,
  }),
});
```

## 4. Alternative: SendGrid

Falls Sie SendGrid bevorzugen:

```typescript
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject,
      },
    ],
    from: {
      email: 'noreply@ihre-domain.de',
      name: 'Rentably',
    },
    content: [
      {
        type: 'text/html',
        value: html,
      },
    ],
  }),
});
```

## 5. Testing

### Test Magic Link (funktioniert sofort):
1. Gehen Sie zur Login-Seite
2. Wählen Sie "Magic Link"
3. Geben Sie Ihre E-Mail ein
4. Prüfen Sie Ihren Posteingang (oder Spam)
5. Klicken Sie auf den Link

### Test Custom E-Mails:
```bash
curl -X POST ${SUPABASE_URL}/functions/v1/send-email \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test E-Mail",
    "html": "<h1>Test</h1><p>Dies ist eine Test-E-Mail.</p>",
    "text": "Test - Dies ist eine Test-E-Mail."
  }'
```

## Zusammenfassung

### Was funktioniert bereits:
- ✅ Magic Link Login (mit Supabase's E-Mail-Service)
- ✅ E-Mail-Template-System in der Datenbank
- ✅ Edge Functions für E-Mail-Versand (send-email, send-tenant-activation, send-ticket-reply, request-password-reset)
- ✅ Vorkonfiguriert mit Resend onboarding@resend.dev

### E-Mails die automatisch versendet werden:
- Mieterportal-Aktivierung
- Passwort-Reset-Bestätigung
- Ticket-Antworten an Kontakte
- Template-basierte E-Mails (Einladungen, Benachrichtigungen, etc.)

### Optionale Konfiguration für Produktion:
1. **RESEND_API_KEY**: Fügen Sie Ihren Resend API-Key hinzu
2. **EMAIL_FROM**: Setzen Sie Ihre eigene verifizierte E-Mail-Domain
3. **Custom SMTP für Magic Links**: Konfigurieren Sie in Supabase Dashboard > Authentication > Email Templates

### Kosten (bei Resend):
- 100 E-Mails/Tag: **Kostenlos**
- 50.000 E-Mails/Monat: $20/Monat
- Unbegrenzte E-Mails: ab $80/Monat
