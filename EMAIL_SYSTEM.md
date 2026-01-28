# Rentably Email System Documentation

## Overview

Das Rentably E-Mail-System ist ein vollständiges, produktionsreifes System basierend auf **Resend** als E-Mail-Provider. Es bietet zentralisiertes Logging, Idempotenz, Fehlerbehandlung und vollständige Nachverfolgbarkeit aller versendeten E-Mails.

## Architektur

### Komponenten

1. **Zentraler Mailer** (`send-email` Edge Function)
   - Einzige Sendestelle für alle E-Mails
   - Template-Support über Datenbank
   - Automatisches Logging in `email_logs`
   - Idempotenz-Support
   - DEV/PROD Mode mit Preview-Logging

2. **Mail Type Registry** (`/src/lib/email/mailTypes.ts`)
   - Zentrale Definition aller Mail-Typen
   - Kategorie (transactional/informational)
   - Idempotenz-Strategien
   - Dokumentation von Triggers und Empfängern

3. **Email Logs** (`email_logs` Tabelle)
   - Nachverfolgung aller E-Mails
   - Status-Tracking (queued/sent/failed/skipped)
   - Fehlerdetails
   - Provider Message IDs
   - Admin UI für Debugging

4. **Cron Jobs**
   - `cron-trial-ending`: Sendet Erinnerung 7 Tage vor Trial-Ende
   - `cron-trial-ended`: Benachrichtigt bei abgelaufenem Trial
   - Secret-geschützt via `CRON_SECRET`
   - Logging in `cron_runs` Tabelle

5. **Welcome Email** (`send-welcome-email` Edge Function)
   - Wird automatisch beim Signup getriggert
   - Via Database Trigger `handle_new_user()`
   - Non-blocking (Signup erfolgt auch bei Mail-Fehler)

## Verwendung

### E-Mail senden (Template-basiert)

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`,
  },
  body: JSON.stringify({
    to: 'user@example.com',
    templateKey: 'welcome',  // Siehe email_templates Tabelle
    variables: {
      dashboard_link: 'https://rentab.ly/dashboard',
    },
    userId: 'user-uuid',  // Optional
    mailType: 'welcome',  // Für Logging
    category: 'transactional',
    idempotencyKey: 'welcome:user-uuid',  // Verhindert Duplikate
    metadata: {
      trigger: 'signup',
    },
  }),
});
```

### E-Mail senden (direkter HTML-Content)

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`,
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Betreff',
    html: '<h1>HTML Content</h1>',
    text: 'Text Content',  // Optional
    mailType: 'custom',
    category: 'transactional',
    idempotencyKey: 'custom:unique-id',  // Optional
  }),
});
```

### Idempotenz-Strategien

Das System unterstützt verschiedene Idempotenz-Strategien, um Duplikate zu verhindern:

1. **None**: Kein Schutz (z.B. Ticket-Antworten)
2. **userId**: Einmal pro User (z.B. Welcome Email)
3. **userId+date**: Einmal pro User pro Tag (z.B. Trial Ending)
4. **userId+type+date**: Einmal pro User, Typ und Datum
5. **custom**: Eigener Key (z.B. Token-IDs, Request-IDs)

Beispiele:
```typescript
// Welcome Email: Nur einmal pro User
idempotencyKey: `welcome:${userId}`

// Trial Ending: Einmal pro Tag
idempotencyKey: `trial_ending:${userId}:${targetDate}`

// Password Reset: Pro Token
idempotencyKey: `password_reset:${resetToken}`
```

## Mail-Typen

Alle definierten Mail-Typen (siehe `/src/lib/email/mailTypes.ts`):

### Authentication & Onboarding
- `WELCOME` - Willkommens-E-Mail nach Registrierung
- `VERIFY_EMAIL` - E-Mail-Verifikation (falls aktiviert)
- `MAGIC_LOGIN` - Magic-Link für Passwortlosen Login
- `PASSWORD_RESET_REQUEST` - Passwort-Reset-Link
- `PASSWORD_RESET_CONFIRMATION` - Bestätigung nach Reset

### Trial & Subscription
- `TRIAL_STARTING` - Trial-Start-Benachrichtigung
- `TRIAL_ENDING` - Erinnerung 7 Tage vor Ende
- `TRIAL_ENDED` - Trial abgelaufen
- `PRO_UPGRADE_CONFIRMATION` - Pro-Upgrade bestätigt
- `SUBSCRIPTION_PAYMENT_FAILED` - Zahlung fehlgeschlagen
- `SUBSCRIPTION_CANCELLED` - Abo gekündigt

### Referral Program
- `REFERRAL_INVITATION` - Referral-Einladung
- `REFERRAL_REWARD_EARNED` - Belohnung erhalten
- `REFERRAL_MONTHLY_SUMMARY` - Monatliche Zusammenfassung

### Tenant Portal
- `TENANT_PORTAL_ACTIVATION` - Mieterportal-Zugang
- `TENANT_PASSWORD_SET` - Passwort gesetzt

### Tickets & Communication
- `TICKET_CREATED` - Neues Ticket
- `TICKET_REPLY` - Ticket-Antwort
- `TICKET_STATUS_CHANGED` - Status geändert

### Financial Reminders
- `LOAN_REMINDER` - Kreditl-Erinnerung
- `RENT_OVERDUE` - Überfällige Miete
- `DUNNING_LEVEL_1/2/3` - Mahnungen

### Admin
- `ADMIN_ALERT` - Admin-Warnung
- `SYSTEM_ERROR` - Systemfehler

## Umgebungsvariablen

### Erforderlich

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Supabase (automatisch verfügbar in Edge Functions)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cron Secret für geschützte Endpoints
CRON_SECRET=your-secure-random-secret
```

### Optional

```bash
# E-Mail Absender (Default: "Rentably <hallo@rentab.ly>")
EMAIL_FROM="Rentably <no-reply@rentab.ly>"

# Reply-To Adresse
EMAIL_REPLY_TO="support@rentab.ly"

# App Base URL (für Links in E-Mails)
APP_BASE_URL="https://rentab.ly"

# Trial Ending Tage vorher (Default: 7)
TRIAL_ENDING_DAYS=7

# Environment für Preview-Logging
NODE_ENV=development  # oder production
```

## Cron Jobs einrichten

### 1. Trial Ending (täglich)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ending \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

**Empfohlene Schedule**: Täglich um 9:00 Uhr
```
0 9 * * *
```

### 2. Trial Ended (täglich)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ended \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

**Empfohlene Schedule**: Täglich um 9:30 Uhr
```
30 9 * * *
```

### Beispiel: Cron via External Service (z.B. cron-job.org)

1. Erstelle einen Account bei cron-job.org
2. Neue Cron Jobs anlegen:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ending`
   - Method: POST
   - Header: `x-cron-secret: YOUR_CRON_SECRET`
   - Schedule: Täglich 9:00 Uhr
3. Wiederhole für `cron-trial-ended`

## Admin UI: E-Mail Logs

Als Admin kannst du alle E-Mail Logs einsehen:

1. Gehe zu `/admin`
2. Klicke auf "E-Mail Logs" Tab
3. Filter nach:
   - Status (sent/failed/queued/skipped)
   - Kategorie (transactional/informational)
   - Mail-Typ
   - E-Mail-Adresse / Betreff

### Log-Details anzeigen

Klicke auf einen Log-Eintrag, um Details zu sehen:
- Status und Provider Message ID
- Idempotency Key
- Fehlerdetails (falls fehlgeschlagen)
- Metadata (zusätzliche Infos)
- Timestamps

## Testing

### Manueller Test: Welcome Email

1. Erstelle neuen Test-User über Signup
2. Prüfe `email_logs` Tabelle:
   ```sql
   SELECT * FROM email_logs
   WHERE mail_type = 'welcome'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. Status sollte `sent` sein
4. Check Resend Dashboard für erfolgreichen Versand

### Manueller Test: Cron Jobs

```bash
# Trial Ending Test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ending \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Response sollte sein:
{
  "success": true,
  "cronRunId": "uuid",
  "processed": 0,
  "sent": 0,
  "skipped": 0,
  "failed": 0
}
```

### Test: Idempotenz

Sende dieselbe E-Mail zweimal mit gleichem `idempotencyKey`:

```typescript
// Erster Request: wird gesendet
const response1 = await fetch(..., {
  body: JSON.stringify({
    idempotencyKey: 'test:123',
    // ...
  })
});

// Zweiter Request: wird übersprungen
const response2 = await fetch(..., {
  body: JSON.stringify({
    idempotencyKey: 'test:123',
    // ...
  })
});

// response2.skipped === true
```

### DEV Mode: Email Preview

Setze `NODE_ENV=development` in Edge Function Secrets:

```bash
supabase secrets set NODE_ENV=development
```

E-Mail-Details werden geloggt, aber trotzdem über Resend versendet.

## Troubleshooting

### Problem: Keine E-Mails kommen an

**Checkliste:**

1. **Resend API Key prüfen**
   ```sql
   SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;
   ```
   - Fehlercode `CONFIG_ERROR`? → RESEND_API_KEY fehlt

2. **Resend Domain verifizieren**
   - Gehe zu [Resend Dashboard](https://resend.com/domains)
   - Prüfe DNS-Records (SPF, DKIM, DMARC)
   - Status muss "Verified" sein

3. **EMAIL_FROM prüfen**
   - Muss mit verifizierter Domain übereinstimmen
   - Format: `"Name <email@domain.com>"`

4. **Spam-Ordner prüfen**
   - Erste E-Mails landen oft im Spam
   - Warm-up Period für neue Domains

### Problem: Welcome Email wird nicht gesendet

**Debug:**

1. **Trigger prüfen**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **Function-Logs prüfen**
   - Gehe zu Supabase Dashboard → Edge Functions → `send-welcome-email`
   - Prüfe Logs auf Fehler

3. **Manueller Test**
   ```typescript
   const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${serviceRoleKey}`,
     },
     body: JSON.stringify({
       userId: 'test-user-id',
       email: 'test@example.com',
     }),
   });
   ```

### Problem: Cron Jobs werden nicht ausgeführt

**Checkliste:**

1. **Secret prüfen**
   ```bash
   curl -X POST URL -H "x-cron-secret: WRONG_SECRET"
   # → 401 Unauthorized
   ```

2. **Cron Run Logs prüfen**
   ```sql
   SELECT * FROM cron_runs ORDER BY started_at DESC LIMIT 10;
   ```

3. **External Cron Service prüfen**
   - Sind die Jobs aktiv?
   - Werden sie ausgeführt?
   - Check Response Codes

### Problem: Duplikate werden trotz Idempotenz gesendet

**Debug:**

1. **Unique Constraint prüfen**
   ```sql
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'email_logs' AND constraint_type = 'UNIQUE';
   ```
   - Muss `unique_idempotency_key` enthalten

2. **Idempotency Keys prüfen**
   ```sql
   SELECT idempotency_key, COUNT(*)
   FROM email_logs
   GROUP BY idempotency_key
   HAVING COUNT(*) > 1;
   ```

3. **Race Conditions vermeiden**
   - Warte auf Response vor erneutem Senden
   - Nutze Transaktionen bei kritischen Flows

### Problem: Failed E-Mails

**Analyse:**

```sql
SELECT
  mail_type,
  error_code,
  error_message,
  COUNT(*) as count
FROM email_logs
WHERE status = 'failed'
GROUP BY mail_type, error_code, error_message
ORDER BY count DESC;
```

**Häufige Fehler:**

- `RESEND_422`: Invalide E-Mail-Adresse → Validierung verbessern
- `RESEND_429`: Rate Limit → Batching implementieren
- `RESEND_500`: Resend Down → Retry-Logik implementieren

## Best Practices

### 1. Immer Template verwenden

✅ **Gut:**
```typescript
templateKey: 'welcome',
variables: { dashboard_link: '...' }
```

❌ **Schlecht:**
```typescript
html: '<h1>Willkommen...</h1>',  // Hardcoded
```

### 2. Idempotency Keys nutzen

✅ **Gut:**
```typescript
idempotencyKey: `welcome:${userId}`
```

❌ **Schlecht:**
```typescript
// Kein idempotencyKey → Risiko von Duplikaten
```

### 3. Metadata für Debugging

✅ **Gut:**
```typescript
metadata: {
  trigger: 'signup',
  source: 'registration_form',
  referralCode: 'ABC123',
}
```

### 4. Nicht im Frontend senden

❌ **Niemals:**
```typescript
// Im React Component
await fetch('/functions/v1/send-email', ...)  // NEIN!
```

✅ **Richtig:**
```typescript
// Via Backend Edge Function oder Trigger
// Frontend ruft nur Business-Logic auf
```

### 5. Rate Limiting beachten

Resend Limits (Free Tier):
- 100 E-Mails/Tag
- 3000 E-Mails/Monat

Für Production: Upgrade zu Resend Pro

## Migration von Alt-System

Falls du noch alte E-Mail-Sendestellen hast:

1. **Finde alle Sendestellen:**
   ```bash
   grep -r "resend" --include="*.ts" --include="*.tsx"
   grep -r "sendEmail" --include="*.ts" --include="*.tsx"
   ```

2. **Ersetze mit zentralem Call:**
   ```typescript
   // Alt
   await fetch('https://api.resend.com/emails', { ... })

   // Neu
   await fetch(`${supabaseUrl}/functions/v1/send-email`, {
     body: JSON.stringify({
       templateKey: '...',
       mailType: '...',
       idempotencyKey: '...',
       // ...
     })
   })
   ```

3. **Teste gründlich**
   - Jeder Mail-Flow einzeln
   - Prüfe email_logs nach jedem Test

## Support

Bei Problemen:

1. Check Admin UI → E-Mail Logs für Details
2. Check Supabase Dashboard → Edge Functions → Logs
3. Check Resend Dashboard → Emails/Logs
4. Dokumentation: [Resend Docs](https://resend.com/docs)

## Sicherheit

- ✅ CRON_SECRET wird sicher in Supabase Secrets gespeichert
- ✅ Service Role Key nie im Frontend verwenden
- ✅ RLS schützt email_logs (nur Admins)
- ✅ Rate Limiting verhindert Missbrauch
- ✅ Keine sensiblen Daten in Logs (Passwörter werden nie geloggt)
- ✅ Idempotenz verhindert Spam/Duplikate

## Roadmap

Zukünftige Features:
- [ ] Retry-Mechanismus für failed E-Mails
- [ ] Batch-Sending für große Volumen
- [ ] A/B Testing für Templates
- [ ] Email Analytics (Open Rate, Click Rate)
- [ ] Unsubscribe Management
- [ ] Multi-Language Support (automatische Sprache)
- [ ] Email Scheduling (zeitverzögert senden)
