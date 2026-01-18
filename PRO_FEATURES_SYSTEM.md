# Pro-Features Verwaltungssystem

## Übersicht

Das Pro-Features System ermöglicht die zentrale Verwaltung aller Upgrade-Prompts für Premium-Features über eine Admin-Oberfläche. Texte, Beschreibungen und Feature-Listen können ohne Code-Änderungen angepasst werden.

## Komponenten

### 1. Datenbank-Tabelle: `pro_feature_texts`

Speichert alle Pro-Feature Texte mit folgenden Feldern:
- `feature_key` - Eindeutiger Schlüssel im Format `page_tab` (z.B. `rent_payments_dunning`)
- `page` - Seiten-Identifier (z.B. `rent_payments`, `tenant_details`, `finances`)
- `tab` - Tab-Identifier (z.B. `dunning`, `contract`, `cashflow`)
- `title` - Titel des Features
- `description` - Beschreibung des Features
- `features` - JSON-Array mit Feature-Bulletpoints
- `is_active` - Status (aktiv/inaktiv)

### 2. Admin-Bereich

**Zugriff:** Admin-Panel → Tab "Pro-Features" (Sparkles-Icon)

**Funktionen:**
- Alle Pro-Feature Texte anzeigen
- Texte inline bearbeiten
- Feature-Bulletpoints hinzufügen/entfernen/ändern
- Features aktivieren/deaktivieren
- Neue Features erstellen
- Features löschen

### 3. PremiumUpgradePrompt Komponente

**Verwendung in Components:**

```tsx
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";

// Einfach den Feature-Key übergeben
<PremiumUpgradePrompt featureKey="rent_payments_dunning" />
```

Die Komponente lädt automatisch die aktuellen Texte aus der Datenbank.

## Neue Pro-Features hinzufügen

### Schritt 1: Feature-Text in Datenbank einfügen

Über den Admin-Bereich oder via SQL:

```sql
INSERT INTO pro_feature_texts (feature_key, page, tab, title, description, features)
VALUES (
  'neue_seite_neues_feature',
  'neue_seite',
  'neues_feature',
  'Titel des Features',
  'Beschreibung des Features',
  '["Feature 1", "Feature 2", "Feature 3"]'::jsonb
);
```

### Schritt 2: Feature-Key in Component verwenden

```tsx
// In Ihrer Component
{isPremium ? (
  <IhrProFeatureComponent />
) : (
  <PremiumUpgradePrompt featureKey="neue_seite_neues_feature" />
)}
```

### Schritt 3: Tab mit PRO-Badge versehen

```tsx
const tabs = [
  { id: "standard", label: "Standard Feature", icon: Icon },
  { id: "pro_feature", label: "Pro Feature", icon: Icon, premium: true }
];
```

## Bestehende Pro-Features

| Feature Key | Seite | Tab | Beschreibung |
|------------|-------|-----|--------------|
| `rent_payments_dunning` | Mieteingänge | Mahnwesen | Automatisches Mahnwesen |
| `tenant_details_contract` | Mietverhältnis | Vertrag & Dokumente | Vertragsverwaltung |
| `tenant_details_communication` | Mietverhältnis | Kommunikation | Mieter-Kommunikation |
| `tenant_details_handover` | Mietverhältnis | Übergabe & Wechsel | Übergabeprotokolle |
| `finances_cashflow` | Finanzen | Cashflow | Cashflow-Analysen |
| `finances_indexrent` | Finanzen | Indexmiete | Indexmiet-Berechnung |
| `property_history` | Immobilien | Historie | Änderungshistorie |
| `property_documents` | Immobilien | Dokumente | Dokumentenverwaltung |
| `property_contacts` | Immobilien | Kontakte | Kontaktverwaltung |
| `property_maintenance` | Immobilien | Instandhaltung | Instandhaltungsverwaltung |
| `property_metrics` | Immobilien | Kennzahlen | Kennzahlen & Analysen |

## Naming Convention

**Feature Keys sollten folgendem Schema folgen:**

```
{page}_{tab}
```

Beispiele:
- `rent_payments_dunning`
- `properties_analytics`
- `documents_ocr`

**Page-Identifier:**
- `rent_payments` - Mieteingänge
- `tenant_details` - Mietverhältnis-Details
- `finances` - Finanzen
- `property` - Immobilien
- `documents` - Dokumente
- etc.

**Tab-Identifier:**
- Kleinbuchstaben
- Unterstriche statt Leerzeichen
- Aussagekräftige Namen

## Best Practices

### 1. Feature-Beschreibungen

- **Titel:** Kurz und prägnant (2-5 Wörter)
- **Beschreibung:** 1-2 Sätze, die den Nutzen klar kommunizieren
- **Features:** 4-6 konkrete Vorteile als Bulletpoints

### 2. Bulletpoints formulieren

✅ Gut:
- "Automatische Mahnstufen mit individuellen Fristen"
- "Export für Steuerberater und Buchhaltung"

❌ Schlecht:
- "Mahnungen" (zu kurz, kein Nutzen)
- "Mit diesem Feature können Sie..." (zu lang)

### 3. Konsistente Sprache

- Nutzen-orientiert (nicht Feature-orientiert)
- Aktive Sprache ("Verwalten Sie" statt "Verwaltung von")
- Konkrete Beispiele wo möglich

## Technische Details

### Sicherheit

- RLS aktiviert
- Öffentlicher Lesezugriff (für alle User, inkl. Free)
- Schreibzugriff nur für Admins

### Performance

- Daten werden client-seitig gecached
- Lazy Loading der Texte beim Component Mount
- Fallback auf hardcoded Werte wenn DB nicht erreichbar

### Migration

Alle Migrationen befinden sich in:
- `supabase/migrations/20260118193000_create_pro_feature_texts.sql`
- `supabase/migrations/20260118193001_insert_initial_pro_feature_texts.sql`

## Troubleshooting

### Feature-Text wird nicht angezeigt

1. Prüfen Sie, ob `is_active = true`
2. Prüfen Sie den Feature-Key auf Tippfehler
3. Prüfen Sie die Browser-Konsole auf Fehler

### Texte aktualisieren sich nicht

1. Browser-Cache leeren
2. Hard Reload (Cmd/Ctrl + Shift + R)
3. Datenbank-Eintrag prüfen

### Neue Features werden nicht geladen

1. Prüfen Sie RLS-Policies
2. Prüfen Sie, ob der Feature-Key eindeutig ist
3. Prüfen Sie die JSON-Syntax der Features-Array
