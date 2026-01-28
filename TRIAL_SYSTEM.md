# 30-Tage-Trial-System Dokumentation

## Übersicht

Das Trial-System ermöglicht es neuen Nutzern, 30 Tage lang kostenlosen Zugriff auf alle Pro-Features zu erhalten. Nach Ablauf der Trial-Phase fällt der Nutzer automatisch auf den Basic/Free Plan zurück, sofern er nicht auf Pro upgradet.

## Datenmodell

### Billing Info Tabelle

Die `billing_info` Tabelle wurde um folgende Felder erweitert:

```sql
trial_started_at    timestamptz  -- Wann die Trial gestartet wurde
trial_ends_at       timestamptz  -- Wann die Trial endet (trial_started_at + 30 Tage)
pro_activated_at    timestamptz  -- Wann Pro erstmals aktiviert wurde (Audit-Zweck)
```

### Trial Business Logic

Ein Nutzer hat Pro-Zugriff wenn:
1. `subscription_plan = 'pro'` UND `subscription_status = 'active'` ODER
2. `trial_ends_at IS NOT NULL` UND `trial_ends_at > now()`

Diese Logik ist zentral implementiert in:
- **Backend**: PostgreSQL-Funktion `has_pro_access(user_id)`
- **Frontend**: Hook `useSubscription().hasProAccess()`

## Implementierung

### 1. Datenbank

#### Migrationen

- `add_trial_system_fields.sql`: Fügt trial_started_at, trial_ends_at, pro_activated_at hinzu
- `backfill_existing_users_no_trial.sql`: Setzt Trial-Felder für bestehende User auf NULL
- `update_signup_flow_with_trial.sql`: Aktualisiert handle_new_user() Trigger für automatische Trial-Initialisierung

#### PostgreSQL-Funktion

```sql
CREATE FUNCTION has_pro_access(p_user_id uuid)
RETURNS boolean
```

Prüft zentral, ob ein User Pro-Zugriff hat (Plan ODER aktive Trial).

### 2. Frontend

#### Hooks

**useTrialStatus(userId)**
```typescript
{
  hasActiveTrial: boolean,      // Trial läuft noch
  trialStartedAt: Date | null,
  trialEndsAt: Date | null,
  daysRemaining: number,        // Verbleibende Tage
  isTrialExpired: boolean,      // Trial abgelaufen
  isLoading: boolean
}
```

**useSubscription()**
```typescript
{
  subscription: Subscription | null,
  billingInfo: BillingInfo | null,
  loading: boolean,
  isPro: boolean,               // Pro-Zugriff (Plan ODER Trial)
  hasProAccess: boolean,        // Alias für isPro
  // ... weitere Felder
}
```

#### Komponenten

**TrialBanner**
- Zeigt Trial-Status im Dashboard
- 3 Zustände:
  1. Trial aktiv: Grün, zeigt verbleibende Tage
  2. Trial abgelaufen: Gelb, Upgrade-CTA
  3. Kein Trial: Kein Banner (oder Pro aktiv)

**SubscriptionPlans**
- Erweitert um Trial-Status-Anzeige auf der Tarife-Seite
- Zeigt Trial-Ende-Datum und verbleibende Tage
- Unterschiedliche Banner je nach Status

**PremiumFeatureGuard**
- Nutzt `useSubscription().isPro` für Feature-Gating
- Berücksichtigt automatisch Trial-Zugriff

### 3. Backend

#### Stripe Webhook

**stripe-webhook/index.ts**
- Bei Subscription-Aktivierung: Setzt `pro_activated_at` falls noch nicht gesetzt
- Plan wird auf 'pro' gesetzt (nicht mehr 'premium')
- Trial wird automatisch irrelevant wenn Pro aktiv ist

#### Signup Flow

**handle_new_user() Trigger**
```sql
-- Erstellt automatisch billing_info mit Trial
INSERT INTO billing_info (
  user_id,
  subscription_plan,      -- 'free'
  subscription_status,    -- 'active'
  trial_started_at,       -- now()
  trial_ends_at          -- now() + 30 days
)
```

## Trial-Logik im Detail

### Neue User (nach Deployment)

1. User registriert sich
2. `handle_new_user()` Trigger feuert
3. `billing_info` wird erstellt mit:
   - `trial_started_at = now()`
   - `trial_ends_at = now() + 30 days`
   - `subscription_plan = 'free'`
4. User hat 30 Tage Pro-Zugriff via Trial

### Bestehende User (vor Deployment)

1. Alle bestehenden User haben `trial_started_at = NULL` und `trial_ends_at = NULL`
2. Keine retroaktive Trial-Vergabe
3. Pro-User behalten ihren Pro-Status
4. Free-User bleiben im Free-Plan ohne Trial

### Trial-Ablauf

1. Tag 0-29: `hasActiveTrial = true`, voller Pro-Zugriff
2. Tag 30: `trial_ends_at` wird überschritten
3. Ab Tag 30: `hasActiveTrial = false`, `isTrialExpired = true`
4. Pro-Features sind gesperrt (außer User upgradet)

### Upgrade während Trial

1. User klickt "Auf Pro upgraden" während Trial läuft
2. Stripe Checkout Session wird erstellt
3. Nach erfolgreicher Zahlung: Webhook feuert
4. `subscription_plan` wird auf 'pro' gesetzt
5. `pro_activated_at` wird gesetzt (falls noch NULL)
6. Trial wird irrelevant, Pro-Plan ist nun maßgeblich

## UI/UX Flows

### Dashboard

```
[Neuer User - Tag 5]
┌─────────────────────────────────────────────┐
│ ✨ Gratis-Testphase aktiv | 25 Tage übrig   │
│ Voller Pro-Zugriff bis 28.02.2026          │
│ [Jetzt auf Pro upgraden →]                  │
└─────────────────────────────────────────────┘

[Neuer User - Tag 31]
┌─────────────────────────────────────────────┐
│ ⏰ Gratis-Testphase beendet                 │
│ Testphase am 28.01.2026 abgelaufen         │
│ [Jetzt auf Pro upgraden →]                  │
└─────────────────────────────────────────────┘
```

### Tarife & Einstellungen

**Trial aktiv:**
- Zeigt großes grünes Banner mit verbleibenden Tagen
- "Upgraden Sie jetzt, um alle Funktionen nach Ende der Testphase weiter zu nutzen"

**Trial abgelaufen:**
- Zeigt oranges Banner
- "Ihre Testphase ist abgelaufen. Upgrade auf Pro..."

**Kein Trial (bestehende User):**
- Standard Upgrade-CTA ohne Trial-Hinweis

## Sicherheit & Edge Cases

### Zugriffskontrolle

- Pro-Features sind sowohl Frontend (UX) als auch Backend (Security) gated
- Backend-Prüfung via PostgreSQL `has_pro_access()` Funktion
- Frontend-Prüfung via `useSubscription().hasProAccess()`

### Edge Cases

#### Zeitzonen
- Alle Timestamps in UTC gespeichert
- UI zeigt lokale Zeit

#### Trial-Ende exakt
- Trial endet genau zum `trial_ends_at` Timestamp
- Minute-genaue Prüfung (nicht nur Tage)

#### Upgrade dann Downgrade
- Pro aktiv → kein Trial relevant
- Downgrade auf Free → wenn Trial abgelaufen: kein Zugriff
- Downgrade auf Free → wenn Trial aktiv: Zugriff bis Trial-Ende

#### Einmaligkeit
- Trial kann pro User nur EINMAL vergeben werden
- `trial_started_at` wird nie zurückgesetzt
- Keine Re-Aktivierung möglich

### Real-time Updates

- `useSubscription` und `useTrialStatus` nutzen Supabase Realtime
- Änderungen an `billing_info` triggern automatisch UI-Updates
- Kein Page-Reload notwendig

## Konfiguration

### Umgebungsvariablen

Trial-Länge ist hardcoded auf 30 Tage im Trigger:
```sql
v_trial_end := now() + interval '30 days';
```

Optional: Trial-Länge via ENV konfigurierbar machen (nice-to-have):
```env
TRIAL_DAYS=30
```

## Testing

### Manuelles Testing

**Neue User Trial:**
1. Neuen User registrieren
2. Nach Login: Trial-Banner im Dashboard sichtbar?
3. Verbleibende Tage korrekt?
4. Pro-Features zugänglich?
5. Tarife-Seite zeigt Trial-Status?

**Trial-Ablauf simulieren:**
```sql
-- In Supabase SQL Editor
UPDATE billing_info
SET trial_ends_at = now() - interval '1 day'
WHERE user_id = 'YOUR_USER_ID';
```

**Trial-Upgrade:**
1. Während Trial auf "Auf Pro upgraden" klicken
2. Stripe Checkout durchführen
3. Nach Webhook: `pro_activated_at` gesetzt?
4. Trial-Banner verschwindet?
5. Pro-Plan aktiv?

**Bestehende User:**
1. Bestehenden User einloggen
2. Kein Trial-Banner sichtbar?
3. `trial_started_at` und `trial_ends_at` sind NULL?

## Troubleshooting

### User hat Trial aber sieht kein Banner

- Prüfen: `trial_ends_at > now()` in Datenbank?
- Hook lädt korrekt? `trialStatus.isLoading = false`?
- Browser-Cache leeren

### Pro-Features gesperrt trotz Trial

- `useSubscription().hasProAccess()` prüfen
- Datenbank: `trial_ends_at` korrekt gesetzt?
- PostgreSQL-Funktion `has_pro_access()` manuell testen:
  ```sql
  SELECT has_pro_access('USER_ID');
  ```

### Neue User bekommen keine Trial

- `handle_new_user()` Trigger aktiv?
- Trigger-Funktion aktuell deployed?
- Check `billing_info` nach Signup:
  ```sql
  SELECT trial_started_at, trial_ends_at
  FROM billing_info
  WHERE user_id = 'NEW_USER_ID';
  ```

## Zusammenfassung

✅ **Implementiert:**
- 30-Tage Trial für alle Neukunden
- Automatischer Trial-Start bei Signup
- Automatisches Trial-Ende nach 30 Tagen
- Trial-Banner im Dashboard
- Trial-Status auf Tarife-Seite
- Zentrale Pro-Access-Prüfung
- Stripe-Integration für Upgrades
- Keine retroaktive Trial für Bestandskunden
- Real-time UI-Updates

🔧 **Zentrale Funktionen:**
- `has_pro_access(user_id)` - PostgreSQL
- `useTrialStatus()` - React Hook
- `useSubscription().hasProAccess()` - React Hook
- `TrialBanner` - React Component

📍 **Wichtige Dateien:**
- `/supabase/migrations/add_trial_system_fields.sql`
- `/supabase/migrations/update_signup_flow_with_trial.sql`
- `/src/hooks/useTrialStatus.ts`
- `/src/hooks/useSubscription.ts`
- `/src/components/TrialBanner.tsx`
- `/src/components/subscription/SubscriptionPlans.tsx`
- `/supabase/functions/stripe-webhook/index.ts`
