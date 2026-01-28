# Passwort-Verwaltung Dokumentation

## Übersicht

Das Passwort-System in Rentably basiert vollständig auf **Supabase Auth** und verwendet dessen native Funktionen. Es gibt zwei Haupt-Flows:

1. **Passwort-Reset** - "Passwort vergessen" von der Login-Seite
2. **Passwort-Änderung** - Im eingeloggten Zustand über das Profil

Beide Flows verwenden die gleiche sichere Methode (`supabase.auth.updateUser()`) zum Setzen des Passworts.

## Architektur-Entscheidungen

### ✅ Supabase Auth statt Custom System

**Vorteile:**
- Sicherheitsgeprüft und battle-tested
- Automatisches Hashing mit bcrypt
- Built-in Token-Management
- Session-Verwaltung
- Rate Limiting
- Email-Versand über Supabase

**Was wurde entfernt:**
- Custom `password_reset_requests` Tabelle
- Custom Edge Functions (`request-password-reset`, `confirm-password-reset`)
- Verschlüsselter Passwort-Speicher in der DB
- Komplizierter Token-Management Flow

## Flow 1: Passwort-Reset ("Passwort vergessen")

### User Journey

```
1. User klickt "Passwort vergessen?" auf Login-Seite
   ↓
2. User gibt E-Mail-Adresse ein
   ↓
3. Supabase sendet Reset-Email mit magischem Link
   ↓
4. User klickt Link in E-Mail
   ↓
5. User landet auf /reset-password mit Session-Token
   ↓
6. User gibt neues Passwort ein (2x)
   ↓
7. Passwort wird gesetzt via supabase.auth.updateUser()
   ↓
8. Success! → Redirect zu /login
```

### Implementierung

#### 1. Request Reset (auf /reset-password)

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Sicherheits-Features:**
- Gibt IMMER "Success" zurück (auch wenn E-Mail nicht existiert)
- Verhindert Account Enumeration
- Rate Limiting durch Supabase
- Token läuft nach 1 Stunde ab

#### 2. Session-Check (wenn User auf /reset-password landet)

```typescript
const { data: { session } } = await supabase.auth.getSession();

if (session && window.location.hash.includes('type=recovery')) {
  // User hat gültigen Reset-Token, zeige Passwort-Formular
  setViewMode("reset");
}
```

#### 3. Neues Passwort setzen

```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

### Komponente

**Datei:** `/src/pages/ResetPassword.tsx`

**Drei View-Modi:**
1. `request` - E-Mail eingeben
2. `reset` - Neues Passwort eingeben (wenn Session vorhanden)
3. `success` - Erfolgs-Meldung

## Flow 2: Passwort-Änderung im Profil

### User Journey

```
1. User ist eingeloggt
   ↓
2. User geht zu Profil → Passwort ändern
   ↓
3. User gibt neues Passwort ein (2x)
   ↓
4. Passwort wird gesetzt via supabase.auth.updateUser()
   ↓
5. Success! Session bleibt aktiv
```

### Implementierung

#### Komponente

**Datei:** `/src/components/ProfileSettingsView.tsx`

**Methode:**
```typescript
const handlePasswordChange = async () => {
  // Validierung
  if (newPassword.length < 10) {
    setPasswordError("Das Passwort muss mindestens 10 Zeichen lang sein");
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("Die Passwörter stimmen nicht überein");
    return;
  }

  // Passwort setzen
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  setPasswordSuccess("Passwort erfolgreich geändert");
};
```

**Unterschied zu Reset-Flow:**
- User ist bereits authentifiziert
- Kein aktuelles Passwort erforderlich (Supabase validiert Session)
- Einfacher, da keine E-Mail benötigt wird

## Passwort-Anforderungen

### Konsistente Regeln

**Minimum:** 10 Zeichen

**Empfohlen:**
- Mix aus Buchstaben, Zahlen und Symbolen
- Keine gängigen Passwörter
- Keine persönlichen Daten

### Validierung

**Frontend:**
```typescript
if (newPassword.length < 10) {
  setMessage({
    type: "error",
    text: "Das Passwort muss mindestens 10 Zeichen lang sein",
  });
  return;
}

if (newPassword !== confirmPassword) {
  setMessage({
    type: "error",
    text: "Die Passwörter stimmen nicht überein",
  });
  return;
}
```

**Backend:**
- Supabase Auth hat eigene Validierung
- Hash-Algorithmus: bcrypt
- Automatisches Salting

## Sicherheits-Features

### 1. Keine Account Enumeration

```typescript
// Gibt IMMER "Success" zurück
try {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;

  setMessage({
    type: "success",
    text: "Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link gesendet.",
  });
} catch (error) {
  // Auch bei Fehler: success message
  setMessage({
    type: "success",
    text: "Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link gesendet.",
  });
}
```

### 2. Token-Sicherheit

- **One-time use:** Token wird nach Verwendung ungültig
- **Zeitlimit:** 1 Stunde Gültigkeit
- **Cryptographically secure:** Von Supabase generiert
- **Session-basiert:** Token erstellt neue Session

### 3. Rate Limiting

- Supabase Auth hat eingebautes Rate Limiting
- Schützt vor Brute Force
- Schützt vor E-Mail-Spam

### 4. Password Hashing

- **Algorithmus:** bcrypt
- **Automatic salting:** Jedes Passwort hat unique salt
- **Cost factor:** Von Supabase optimiert
- **Nie im Klartext:** Weder in DB noch in Logs

## Email-Konfiguration

### Supabase Email Settings

Supabase sendet automatisch E-Mails über ihr eigenes System oder einen konfigurierten SMTP-Server.

**Konfiguration in Supabase Dashboard:**
1. Navigate zu Authentication → Email Templates
2. Wähle "Reset Password" Template
3. Customize Subject und Body (optional)

**Standard-Template:**
```
Subject: Reset Password for Rentably

You have requested to reset your password. Click the link below to set a new password:

{{ .ConfirmationURL }}

This link expires in 1 hour.

If you didn't request this, ignore this email.
```

### Custom Email Template (Optional)

Falls gewünscht, kann das Template angepasst werden mit:
- Firmen-Logo
- Custom Styling
- Mehrsprachigkeit
- Additional Information

## Testing

### Manueller Test-Flow

#### Passwort-Reset testen

1. **Request:**
   - Gehe zu `/login`
   - Klicke "Passwort vergessen?"
   - Gebe existierende E-Mail ein
   - Prüfe "Success" Message
   - **Expected:** Neutral message, keine Information ob Account existiert

2. **E-Mail:**
   - Checke Postfach
   - Öffne Reset-E-Mail von Supabase
   - Klicke auf Reset-Link
   - **Expected:** Redirect zu `/reset-password` mit Session

3. **Neues Passwort:**
   - Gebe neues Passwort ein (mindestens 10 Zeichen)
   - Bestätige Passwort
   - Klicke "Passwort speichern"
   - **Expected:** Success message → Redirect zu `/login`

4. **Login:**
   - Logge ein mit neuer E-Mail + neuem Passwort
   - **Expected:** Erfolgreicher Login

#### Passwort-Änderung testen

1. **Navigate:**
   - Logge ein
   - Gehe zu Dashboard → Profil
   - Klicke "Passwort ändern"

2. **Ändern:**
   - Gebe neues Passwort ein (2x)
   - Klicke "Speichern"
   - **Expected:** Success message

3. **Verify:**
   - Logge aus
   - Logge ein mit neuem Passwort
   - **Expected:** Erfolgreicher Login

### Edge Cases

#### 1. Abgelaufener Token

**Test:**
- Request Reset
- Warte > 1 Stunde
- Klicke Link

**Expected:**
- Fehler "Token expired" oder Redirect zu Request-Seite

#### 2. Token bereits verwendet

**Test:**
- Request Reset
- Setze Passwort erfolgreich
- Versuche denselben Link nochmal

**Expected:**
- Fehler oder Redirect zu Login

#### 3. Zu kurzes Passwort

**Test:**
- Gebe Passwort mit 8 Zeichen ein

**Expected:**
- Fehler "Das Passwort muss mindestens 10 Zeichen lang sein"

#### 4. Passwörter stimmen nicht überein

**Test:**
- Gebe unterschiedliche Passwörter ein

**Expected:**
- Fehler "Die Passwörter stimmen nicht überein"

#### 5. Nicht existierende E-Mail

**Test:**
- Request Reset mit fake@example.com

**Expected:**
- Success message (keine Info dass Account nicht existiert)
- Keine E-Mail versendet

## Troubleshooting

### Problem: Keine Reset-E-Mail erhalten

**Ursachen:**
1. E-Mail im Spam-Ordner
2. Supabase Email-Service nicht konfiguriert
3. Rate Limiting aktiv (zu viele Requests)
4. Falsche E-Mail-Adresse

**Lösung:**
1. Spam-Ordner prüfen
2. Supabase Dashboard → Authentication → Email Settings prüfen
3. Warten (Rate Limit wird nach Zeit zurückgesetzt)
4. Korrekte E-Mail verwenden

### Problem: "Invalid credentials" nach Passwort-Reset

**Ursache:**
- Session noch nicht aktualisiert
- Browser-Cache

**Lösung:**
1. Hard-Refresh (Ctrl+Shift+R)
2. Browser-Cache leeren
3. Inkognito-Fenster testen

### Problem: Passwort-Änderung im Profil funktioniert nicht

**Ursache:**
- Session abgelaufen
- Netzwerk-Fehler

**Lösung:**
1. Re-Login
2. Browser Console prüfen
3. Network Tab prüfen

## Migration von altem System

### Was wurde entfernt

1. **Tabelle:** `password_reset_requests`
   - Wurde gedroppt in Migration `cleanup_old_password_reset_system`

2. **Edge Functions:**
   - `request-password-reset` (obsolet)
   - `confirm-password-reset` (obsolet)
   - Können gelöscht werden aus `supabase/functions/`

3. **Custom Encryption:**
   - AES-GCM Verschlüsselung für Passwörter in DB
   - Nicht mehr nötig, da Supabase Auth das handled

### Bestehende User

**Keine Auswirkungen auf bestehende Logins:**
- Alle Passwörter bleiben gültig
- Kein Re-Reset nötig
- Hashes werden nicht verändert

**Bei nächstem Passwort-Wechsel:**
- Nutzt automatisch neues System
- Transparenter Übergang

## Dateien-Übersicht

### Frontend

```
/src/pages/ResetPassword.tsx
  - Haupt-Komponente für Password Reset
  - View-Modi: request | reset | success
  - Verwendet Supabase Auth API

/src/components/ProfileSettingsView.tsx
  - Passwort-Änderung im Profil
  - Sektion "Passwort ändern"
  - Verwendet Supabase Auth API

/src/components/auth/LoginForm.tsx
  - Link "Passwort vergessen?" → /reset-password
```

### Backend

```
/supabase/migrations/cleanup_old_password_reset_system.sql
  - Bereinigt alte Infrastruktur
  - Droppt password_reset_requests Tabelle
```

### Libraries

- `@supabase/supabase-js` - Supabase Client
- Keine zusätzlichen Dependencies nötig

## Best Practices

### DO ✅

1. **Immer gleiche Message bei Reset-Request**
   - Verhindert Account Enumeration

2. **Mindestens 10 Zeichen**
   - Sichere Passwörter erzwingen

3. **Passwort zweimal eingeben**
   - Verhindert Tippfehler

4. **Supabase Auth nutzen**
   - Sicher, geprüft, maintained

5. **Clear Error Messages**
   - User weiß, was falsch ist

### DON'T ❌

1. **Eigenes Hashing implementieren**
   - Supabase Auth macht das besser

2. **Passwörter in DB speichern**
   - Auch nicht verschlüsselt

3. **Unterschiedliche Validierung in Reset vs. Change**
   - Konsistenz ist wichtig

4. **Account Enumeration erlauben**
   - Security-Risiko

5. **Aktuelles Passwort bei Change verlangen**
   - Nicht nötig wenn User authentifiziert ist

## Zusammenfassung

Das neue Passwort-System ist:

✅ **Sicher:** Supabase Auth mit bcrypt
✅ **Einfach:** Zwei klare Flows
✅ **Konsistent:** Gleiche Validierung überall
✅ **Wartbar:** Standard-Lösung statt Custom Code
✅ **Getestet:** Battle-tested von Supabase

**Hauptvorteil:** Komplexität reduziert bei erhöhter Sicherheit.
