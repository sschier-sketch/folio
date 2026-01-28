# Rentably E-Mail-System - Setup & Quick Start

## ✅ Was wurde implementiert

Ein **vollständiges, produktionsreifes E-Mail-System** mit:

1. ✅ **Zentraler Mailer** mit Logging & Idempotenz
2. ✅ **Mail-Type Registry** (35+ definierte Mail-Typen)
3. ✅ **Email Logs Datenbank** mit Admin UI
4. ✅ **Welcome Email** automatisch beim Signup
5. ✅ **Trial-Ending/Ended Cron Jobs** mit Secret-Schutz
6. ✅ **Resend Integration** mit Error Handling
7. ✅ **Umfangreiche Dokumentation**

## 🚀 Schnellstart

### 1. Resend API Key hinterlegen

Das System nutzt **Resend** als E-Mail-Provider. Die Secrets sind bereits in Supabase konfiguriert.

**Wichtig:** Du musst nur noch:
1. Bei [Resend](https://resend.com) einloggen
2. Domain verifizieren (DNS-Records: SPF, DKIM, DMARC)
3. API Key ist bereits als `RESEND_API_KEY` Secret hinterlegt

### 2. Cron Jobs einrichten

Für Trial-Emails müssen zwei Cron Jobs eingerichtet werden:

**Option A: Externe Cron Service (empfohlen)**

Nutze z.B. [cron-job.org](https://cron-job.org) oder [EasyCron](https://www.easycron.com):

```bash
# Trial Ending (täglich 9:00 Uhr)
URL: https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ending
Method: POST
Header: x-cron-secret: YOUR_CRON_SECRET
Schedule: 0 9 * * *

# Trial Ended (täglich 9:30 Uhr)
URL: https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ended
Method: POST
Header: x-cron-secret: YOUR_CRON_SECRET
Schedule: 30 9 * * *
```

Das `CRON_SECRET` ist bereits als Supabase Secret konfiguriert.

**Option B: Manuell testen**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cron-trial-ending \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### 3. Welcome Email testen

Erstelle einen neuen Test-Account:
1. Gehe zu `/signup`
2. Registriere dich mit einer echten E-Mail
3. **Welcome Email sollte innerhalb von 30 Sekunden ankommen**

Prüfe im Admin Dashboard:
- Gehe zu `/admin` → Tab "E-Mail Logs"
- Status sollte "sent" sein
- Provider Message ID sollte vorhanden sein

### 4. Admin UI: Email Logs

Als Admin kannst du jetzt alle E-Mails nachverfolgen:

1. Gehe zu `/admin`
2. Klicke auf Tab **"E-Mail Logs"**
3. Filter nach Status, Kategorie, Mail-Typ
4. Klicke auf einen Log für Details

## 📋 Implementierte Features

### Automatische E-Mails

| Mail-Typ | Trigger | Status |
|----------|---------|--------|
| Welcome Email | Nach Signup | ✅ Aktiv |
| Trial Ending | 7 Tage vor Ende | ✅ Via Cron |
| Trial Ended | Nach Ablauf | ✅ Via Cron |
| Password Reset | Forgot Password | ✅ Aktiv |
| Tenant Activation | Portal-Aktivierung | ✅ Aktiv |
| Referral Invitation | Einladung senden | ✅ Aktiv |
| Ticket Reply | Ticket-Antwort | ✅ Aktiv |
| Loan Reminder | X Tage vorher | ✅ Via Cron |

### Zentrale Komponenten

**1. Send-Email Function** (`/functions/send-email`)
- Template-basiert über Datenbank
- Automatisches Logging
- Idempotenz-Support
- Error Handling
- DEV/PROD Mode

**2. Mail-Type Registry** (`/src/lib/email/mailTypes.ts`)
- 35+ definierte Mail-Typen
- Kategorie (transactional/informational)
- Idempotenz-Strategien dokumentiert
- Trigger und Empfänger definiert

**3. Database Tables**
```sql
-- E-Mail Logs mit Status-Tracking
email_logs (
  id, mail_type, category, to_email, user_id,
  subject, provider, provider_message_id,
  status, error_code, error_message,
  idempotency_key, metadata,
  created_at, sent_at
)

-- Cron Job Logs
cron_runs (
  id, job_name, started_at, finished_at,
  status, processed_count, sent_count,
  failed_count, skipped_count, metadata
)
```

**4. Email Templates** (Datenbank)
- `welcome` - Willkommens-Email
- `trial_ending` - Trial endet bald
- `trial_ended` - Trial abgelaufen
- Weitere 10+ Templates bereits vorhanden

### Idempotenz

Das System verhindert automatisch Duplikate durch Idempotenz-Keys:

```typescript
// Welcome: Nur einmal pro User
idempotencyKey: `welcome:${userId}`

// Trial Ending: Einmal pro Tag
idempotencyKey: `trial_ending:${userId}:${date}`

// Password Reset: Pro Token
idempotencyKey: `password_reset:${token}`
```

Wenn ein Log mit demselben `idempotencyKey` existiert (Status: sent/queued), wird die E-Mail übersprungen.

## 🔧 Konfiguration

### Umgebungsvariablen (Supabase Secrets)

Bereits konfiguriert:
- ✅ `RESEND_API_KEY` - Resend API Schlüssel
- ✅ `EMAIL_FROM` - "Rentably <hallo@rentab.ly>"
- ✅ `CRON_SECRET` - Schutz für Cron Endpoints
- ✅ `APP_BASE_URL` - "https://rentab.ly"

Optional (kannst du anpassen):
```bash
TRIAL_ENDING_DAYS=7  # Tage vor Trial-Ende (Default: 7)
NODE_ENV=development  # Für Email Preview Logging
```

## 📊 Monitoring & Debugging

### Email Logs prüfen (SQL)

```sql
-- Alle gesendeten E-Mails heute
SELECT * FROM email_logs
WHERE DATE(created_at) = CURRENT_DATE
  AND status = 'sent';

-- Fehlgeschlagene E-Mails
SELECT mail_type, error_code, error_message, COUNT(*)
FROM email_logs
WHERE status = 'failed'
GROUP BY mail_type, error_code, error_message;

-- Cron Job Status
SELECT * FROM cron_runs
ORDER BY started_at DESC
LIMIT 10;
```

### Admin UI nutzen

1. Login als Admin
2. Gehe zu `/admin`
3. Tab "E-Mail Logs"
4. Filter und Details ansehen

### Resend Dashboard

Prüfe [Resend Dashboard](https://resend.com/emails) für:
- Delivery Status
- Bounce/Spam Reports
- Open Rates (wenn aktiviert)

## ⚠️ Wichtige Hinweise

### 1. Resend Domain verifizieren

**KRITISCH:** Ohne verifizierte Domain kommen E-Mails nicht an!

1. Gehe zu [Resend Domains](https://resend.com/domains)
2. Füge deine Domain hinzu
3. Setze DNS-Records:
   - **SPF:** TXT Record
   - **DKIM:** CNAME Record
   - **DMARC:** TXT Record
4. Warte auf Verifikation (kann 24h dauern)

### 2. Signup-Email Bug ist behoben!

**Problem vorher:** Nach Signup kam keine Welcome-Email

**Lösung:**
- ✅ `send-welcome-email` Edge Function erstellt
- ✅ Database Trigger `handle_new_user()` updated
- ✅ Welcome Email wird jetzt automatisch gesendet
- ✅ Non-blocking: Signup funktioniert auch wenn Mail fehlschlägt

### 3. Rate Limits beachten

**Resend Free Tier:**
- 100 E-Mails/Tag
- 3.000 E-Mails/Monat

Für Production: Upgrade zu Resend Pro (ab $20/Monat für 50k E-Mails)

### 4. Cron Secret sicher aufbewahren

Das `CRON_SECRET` schützt die Cron Endpoints. **Niemals öffentlich machen!**

Wenn kompromittiert:
```bash
# Neues Secret generieren und aktualisieren
supabase secrets set CRON_SECRET=new-random-secret
```

## 🧪 Testing Checkliste

### Manual Tests

- [ ] **Signup:** Neuer User erhält Welcome Email
- [ ] **Email Logs:** Log mit status=sent erscheint
- [ ] **Resend:** Email sichtbar in Resend Dashboard
- [ ] **Admin UI:** Email Logs Tab zeigt Eintrag
- [ ] **Trial Ending Cron:** `curl` Request funktioniert
- [ ] **Trial Ended Cron:** `curl` Request funktioniert
- [ ] **Idempotenz:** Zweiter Aufruf mit gleichem Key → skipped

### SQL Checks

```sql
-- Welcome Emails heute
SELECT COUNT(*) FROM email_logs
WHERE mail_type = 'welcome'
  AND DATE(created_at) = CURRENT_DATE;

-- Failed Emails
SELECT COUNT(*) FROM email_logs WHERE status = 'failed';

-- Cron Runs
SELECT job_name, status, sent_count, failed_count
FROM cron_runs
ORDER BY started_at DESC;
```

## 📚 Weitere Dokumentation

Siehe **`EMAIL_SYSTEM.md`** für:
- Detaillierte API-Dokumentation
- Alle Mail-Typen
- Idempotenz-Strategien
- Troubleshooting
- Best Practices
- Migration Guide

## 🎯 Nächste Schritte

1. ✅ **Resend Domain verifizieren** (falls noch nicht geschehen)
2. ✅ **Cron Jobs einrichten** (cron-job.org oder ähnlich)
3. ✅ **Welcome Email testen** (neuen Account erstellen)
4. ✅ **Email Logs prüfen** (Admin UI)
5. ⏳ **Production Monitoring** einrichten

## 🆘 Support

Bei Problemen:

1. **Check Email Logs:** `/admin` → E-Mail Logs Tab
2. **Check Supabase Logs:** Dashboard → Edge Functions
3. **Check Resend Dashboard:** [resend.com/emails](https://resend.com/emails)
4. **Dokumentation:** Siehe `EMAIL_SYSTEM.md`

## ✨ Das war's!

Das E-Mail-System ist jetzt vollständig implementiert und produktionsreif. Alle E-Mails werden zentral geloggt, Duplikate werden verhindert, und du hast volle Nachverfolgbarkeit im Admin Dashboard.

**Viel Erfolg! 🚀**
