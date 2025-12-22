# E-Mail-Versand Konfiguration

Diese Anleitung erklärt, wie Sie den E-Mail-Versand für Folio einrichten.

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

## 2. Custom E-Mail-Templates (für eigene E-Mails)

Für eigene E-Mails (Einladungen, Benachrichtigungen, etc.) wurde eine Edge Function erstellt.

### Resend Integration (Empfohlen)

#### Schritt 1: Resend Account erstellen
1. Gehen Sie zu [resend.com](https://resend.com)
2. Erstellen Sie einen kostenlosen Account
3. Verifizieren Sie Ihre Domain (oder nutzen Sie die Test-Domain)
4. Erstellen Sie einen API-Key

#### Schritt 2: API-Key in Supabase hinterlegen
```bash
# Über Supabase CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxx

# Oder über das Supabase Dashboard:
# Settings > Edge Functions > Secrets
```

#### Schritt 3: Edge Function aktivieren
Öffnen Sie `/supabase/functions/send-email/index.ts` und entkommentieren Sie den Resend-Code:

```typescript
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Folio <noreply@ihre-domain.de>',
    to: [to],
    subject,
    html,
    text: text || '',
  }),
});
```

Ändern Sie die "from"-Adresse zu Ihrer eigenen Domain.

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
      subject: 'Willkommen bei Folio',
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
html = html.replace('{{invitation_link}}', 'https://folio.app/invite/...');

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
      name: 'Folio',
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
- ✅ Edge Function für E-Mail-Versand vorbereitet

### Was Sie konfigurieren müssen:
1. **Für Production Magic Links**: Custom SMTP in Supabase Dashboard
2. **Für eigene E-Mails**: Resend/SendGrid API-Key + Edge Function aktivieren

### Kosten (bei Resend):
- 100 E-Mails/Tag: **Kostenlos**
- 50.000 E-Mails/Monat: $20/Monat
- Unbegrenzte E-Mails: ab $80/Monat
