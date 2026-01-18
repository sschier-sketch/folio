# SEO Management System - Dokumentation

## Übersicht

Das SEO-System ermöglicht eine vollständige Kontrolle über Meta-Tags, Indexierung und Suchmaschinenoptimierung aller öffentlichen Seiten.

## Architektur

### Datenbank

#### `seo_global_settings`
Globale SEO-Einstellungen, die als Fallback dienen:
- `title_template`: Template für Seitentitel (z.B. "%s – Rentably")
- `default_title`: Standard-Titel wenn keine spezifischen Daten vorhanden
- `default_description`: Standard-Beschreibung
- `default_robots_index`: Standard für öffentliche Seiten

#### `seo_page_settings`
Pro-Seite SEO-Konfiguration:
- `path`: URL-Pfad (eindeutig)
- `page_type`: "marketing", "feature", "blog", oder "app"
- `is_public`: Ob die Seite öffentlich ist
- `allow_indexing`: Ob Indexierung erlaubt ist
- `title`, `description`: Seiten-spezifische Meta-Tags
- `canonical_url`: Canonical URL
- `og_title`, `og_description`, `og_image_url`: Open Graph Tags

### Wichtige Regeln

1. **App-Seiten sind immer noindex**
   - Pfade: /dashboard, /app, /admin, /mieterportal, /login, /signup, etc.
   - Diese sind NICHT editierbar und erscheinen NICHT in der Sitemap

2. **Nur öffentliche, indexierte Seiten erscheinen in der Sitemap**
   - `is_public = true`
   - `allow_indexing = true`

3. **Meta-Tags werden zentral gerendert**
   - Die `SeoHead` Komponente aktualisiert Meta-Tags automatisch
   - Keine dezentrale SEO-Logik in einzelnen Komponenten

## Admin-Bereich

### Zugriff
Admin Panel → Tab "SEO"

### Funktionen

#### 1. Seiten-Übersicht
- Listet alle Seiten mit SEO-Status
- Filter nach Typ und Indexierung
- Suche nach Pfad
- Schneller Überblick über fehlende Meta-Daten

#### 2. Seite bearbeiten
- SEO Title (mit Zeichenzähler, ~60 Zeichen empfohlen)
- SEO Description (mit Zeichenzähler, ~155 Zeichen empfohlen)
- Canonical URL
- Open Graph Tags für Social Media
- Google Snippet Vorschau
- Indexierung aktivieren/deaktivieren (nur für öffentliche Seiten)

#### 3. Globale Einstellungen
- Title Template definieren
- Standard-Werte für Title/Description
- Standard-Indexierung für neue Seiten

## Technische Details

### SEO Resolver (`src/lib/seoResolver.ts`)
Zentrale Logik für Meta-Tag-Auflösung:
1. Prüft ob Pfad eine App-Seite ist → noindex
2. Lädt Seiten-spezifische Settings aus DB
3. Fällt auf globale Settings zurück
4. Gibt komplette Meta-Daten zurück

### SeoHead Komponente (`src/components/SeoHead.tsx`)
- Läuft bei jeder Route-Änderung
- Aktualisiert `document.title`
- Setzt/aktualisiert alle Meta-Tags
- Setzt/aktualisiert Canonical Link

### robots.txt
Statische Datei in `public/robots.txt`:
- Erlaubt alle öffentlichen Pfade
- Blockiert explizit App-Bereiche
- Verweist auf Sitemap

### Sitemap
Edge Function unter `/functions/v1/sitemap`:
- Generiert dynamisch XML-Sitemap
- Enthält nur `is_public=true` und `allow_indexing=true` Seiten
- Nutzt `updated_at` für lastmod
- Aufrufbar unter: `https://[your-project].supabase.co/functions/v1/sitemap`

## Verwendung

### Neue öffentliche Seite hinzufügen
1. Admin Panel → SEO → "Neue Seite"
2. Pfad eingeben (z.B. "/neue-funktion")
3. Typ wählen (marketing/feature/blog)
4. SEO-Daten eingeben
5. Indexierung aktivieren
6. Speichern

### Bestehende Seite optimieren
1. Admin Panel → SEO → Seite suchen
2. "Bearbeiten" klicken
3. Title/Description optimieren (Zeichenzähler beachten)
4. Google Snippet Vorschau prüfen
5. Speichern

### Seite von Indexierung ausschließen
1. Seite öffnen
2. "Indexieren erlauben" deaktivieren
3. Speichern
→ Seite erscheint mit noindex und wird aus Sitemap entfernt

## Akzeptanzkriterien ✅

1. ✅ Admin kann pro Seite Indexierung + Title + Description speichern
2. ✅ Öffentliche Seiten rendern Meta-Tags korrekt (view source zeigt sie)
3. ✅ App-Seiten sind immer noindex (nicht überschreibbar)
4. ✅ sitemap.xml enthält nur indexierte öffentliche Seiten
5. ✅ Dokumente/Finanzen/Mieterportal/Admin tauchen NICHT in Sitemap auf
6. ✅ Änderungen im Admin wirken sofort (Cache wird geleert)

## Sitemap-URLs

### Produktion
```
https://rentably.de/sitemap.xml
```

### Entwicklung
```
https://[your-project-id].supabase.co/functions/v1/sitemap
```

Die Sitemap kann in der robots.txt und in der Google Search Console hinterlegt werden.

## Hinweise

- Cache wird automatisch geleert nach Änderungen
- Meta-Tags werden client-seitig gesetzt (für SSR würde man dies server-seitig machen)
- App-Seiten können angezeigt, aber nicht editiert werden (Indexierung gesperrt)
- Leere Title/Description verwenden automatisch die globalen Defaults
