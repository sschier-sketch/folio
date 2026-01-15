# Google Tag Manager Integration

## Übersicht

Die GTM-Integration ist vollständig implementiert und ermöglicht Admins, Google Tag Manager über das Admin-Dashboard zu konfigurieren und auf allen Seiten der Anwendung zu aktivieren.

## Features

### 1. Admin-Bereich: System-Einstellungen
- **Navigation**: Admin Dashboard → System Tab
- **GTM aktiv/inaktiv Toggle**: Ein/Aus-Schalter für GTM
- **GTM Container ID**: Eingabefeld für Container-ID (Format: GTM-XXXXXXX)
- **Erweiterter Modus**: Custom Head HTML für manuelle GTM-Snippets
- **Validierung**:
  - Container-ID muss `^GTM-[A-Z0-9]+$` entsprechen
  - Custom HTML wird auf googletagmanager.com URLs geprüft
- **Speichern**: Änderungen werden in Supabase gespeichert

### 2. Globale GTM-Ausspielung
- GTM wird auf **allen Seiten** geladen
- Implementiert über `GTMProvider` in `App.tsx`
- Unterstützt drei Modi:
  1. **Container ID**: Standard GTM mit Container-ID
  2. **Custom HTML**: Überschreibt Container-ID mit benutzerdefiniertem Code
  3. **Deaktiviert**: Kein GTM-Code wird geladen

### 3. Caching & Performance
- **60-Sekunden Cache**: Einstellungen werden 60 Sekunden gecached
- **Automatische Invalidierung**: Cache wird nach Speichern aktualisiert
- **Minimaler DB-Load**: Reduziert Datenbankabfragen

### 4. ENV Fallback
Falls keine Datenbank-Einstellung vorhanden, werden diese ENV-Variablen verwendet:
- `VITE_GTM_ENABLED=true` - GTM aktivieren
- `VITE_GTM_ID=GTM-XXXXXXX` - GTM Container ID

**Hinweis**: Datenbank-Einstellungen haben Priorität über ENV-Variablen.

## Wichtige Dateien

### Datenbank
```
supabase/migrations/[timestamp]_create_system_settings_table.sql
```
- Tabelle: `system_settings` (Singleton mit id=1)
- Spalten: `gtm_enabled`, `gtm_container_id`, `gtm_custom_head_html`
- RLS: Nur Admins haben Lese-/Schreibzugriff
- Function: `get_system_settings()` für öffentlichen Lesezugriff

### Frontend-Komponenten
```
src/lib/systemSettings.ts
```
- `getSystemSettings()`: Lädt Einstellungen mit Caching
- `updateSystemSettings()`: Speichert Einstellungen mit Validierung
- `shouldRenderGTM()`: Entscheidet, ob/wie GTM geladen wird
- `invalidateSettingsCache()`: Löscht Cache manuell

```
src/components/GTMProvider.tsx
```
- React-Provider für GTM
- Lädt GTM-Script dynamisch basierend auf Einstellungen
- Fügt <noscript> iframe für No-JS-Nutzer hinzu
- `useGTM()` Hook für GTM Events (dataLayer.push)

```
src/components/AdminSystemSettingsView.tsx
```
- Admin UI für GTM-Konfiguration
- Validierung der Container-ID
- Toggle für Aktivierung/Deaktivierung
- Erweiterter Modus für Custom HTML

```
src/App.tsx
```
- GTMProvider umschließt gesamte App
- GTM ist auf allen Routes aktiv

```
src/pages/Admin.tsx
```
- Neuer Tab "System" für System-Einstellungen
- Integration von AdminSystemSettingsView

## Nutzung

### Für Admins

1. **Aktivierung**:
   - Gehe zu Admin Dashboard → System Tab
   - Toggle "GTM aktiv" auf AN
   - Gib deine GTM Container-ID ein (z.B. GTM-ABC123)
   - Klicke "Speichern"
   - Seite neu laden für Aktivierung

2. **Custom HTML** (Optional):
   - Klicke auf "Erweiterter Modus"
   - Füge offiziellen GTM-Code ein
   - Speichere und lade neu

3. **Deaktivierung**:
   - Toggle "GTM aktiv" auf AUS
   - Speichern und neu laden

### Für Entwickler

**GTM Events tracken:**
```typescript
import { useGTM } from '../components/GTMProvider';

function MyComponent() {
  const { pushEvent } = useGTM();

  const handleClick = () => {
    pushEvent('button_click', {
      button_name: 'subscribe',
      user_id: userId
    });
  };

  return <button onClick={handleClick}>Subscribe</button>;
}
```

**ENV-Variablen setzen (Optional):**
```bash
# .env
VITE_GTM_ENABLED=true
VITE_GTM_ID=GTM-ABC123
```

## Validierung

### Container-ID
- **Format**: `GTM-XXXXXXX` (case-insensitive)
- **Beispiele**:
  - ✅ `GTM-ABC123`
  - ✅ `GTM-XYZ789`
  - ❌ `GA-123456` (falsches Prefix)
  - ❌ `GTM123` (fehlendes Bindestrich)

### Custom HTML
- **Whitelist**: Nur Scripts von `googletagmanager.com`
- **Validierung**: Prüft, ob Scripts andere Domains laden
- **Warnung**: Bei fehlgeschlagener Validierung wird nicht gespeichert

## Development Logging

In Development-Mode (`import.meta.env.DEV`) loggt das System:

```javascript
[SystemSettings] Using cached settings
[SystemSettings] Loaded from database: { gtm_enabled: true, ... }
[GTM] Loading with Container ID: GTM-ABC123 (source: database)
[GTM] Successfully loaded GTM with ID: GTM-ABC123
[GTM] Event pushed: { event: 'button_click', ... }
```

## Offizielles GTM-Snippet

Das System generiert automatisch das offizielle GTM-Snippet:

**Head Script:**
```html
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');
</script>
```

**Body NoScript:**
```html
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>
</noscript>
```

## Sicherheit

- **RLS Policies**: Nur Admins können Einstellungen lesen/schreiben
- **Input Validation**: Container-ID und Custom HTML werden validiert
- **XSS Prevention**: Custom HTML wird gefiltert und sanitized
- **No Injection**: Kein beliebiger HTML-Code kann eingefügt werden

## Troubleshooting

**GTM wird nicht geladen:**
1. Prüfe, ob "GTM aktiv" in Admin → System aktiviert ist
2. Überprüfe Container-ID Format (GTM-XXXXXXX)
3. Seite neu laden nach Änderungen
4. Entwickler-Konsole für Logs prüfen

**Änderungen werden nicht übernommen:**
1. Nach dem Speichern Seite neu laden (erforderlich!)
2. Cache wird automatisch invalidiert
3. Browser-Cache ggf. leeren

**Custom HTML funktioniert nicht:**
1. Prüfe, ob nur googletagmanager.com URLs enthalten sind
2. Validierungsfehler in Admin UI beachten
3. Offiziellen GTM-Code von Google Tag Manager kopieren

## Migration von bestehenden Systemen

Falls Sie bereits GTM in Ihrer App haben:

1. Entfernen Sie manuellen GTM-Code aus HTML-Templates
2. Fügen Sie Container-ID im Admin-Dashboard hinzu
3. Aktivieren Sie GTM im Admin-Dashboard
4. Testen Sie, ob GTM korrekt lädt

## Performance

- **Initial Load**: ~22KB zusätzlich für GTM-Script
- **Caching**: 60s Cache reduziert DB-Abfragen drastisch
- **Async Loading**: GTM lädt asynchron, blockiert nicht
- **No Layout Shift**: Kein visueller Impact auf User Experience
