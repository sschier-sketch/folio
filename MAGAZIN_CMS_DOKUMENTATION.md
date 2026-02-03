# Magazin CMS - Vollständige Dokumentation

## Überblick

Das Magazin-Modul ist ein vollständiges mehrsprachiges Content-Management-System (CMS) für Blog-Artikel mit:
- **Multi-Language Support** (DE/EN, erweiterbar)
- **SEO-Optimierung** (Meta Tags, OpenGraph, JSON-LD, hreflang)
- **Taxonomien** (Topics & Tags)
- **Slug-Management** mit automatischen 301 Redirects
- **Status-Workflow** (Draft → Review → Published → Archived)
- **XSS-sicheres Markdown-Rendering**

---

## Admin-Oberfläche

### Zugriff

**Admin-URL:** `/admin`

Im Admin-Dashboard gibt es einen Tab **"Magazin"** mit drei Unterbereichen:
1. **Artikel** - Alle Blog-Posts verwalten
2. **Themen** - Topics erstellen und bearbeiten
3. **Tags** - Tags erstellen und bearbeiten

### Berechtigungen

- Nur Benutzer mit Admin-Rolle haben Zugriff
- Überprüfung erfolgt über RLS (Row Level Security) in Supabase
- Public Endpoints sind read-only für veröffentlichte Artikel

---

## 1. Artikel-Verwaltung (Posts)

### Artikel-Liste

**Pfad:** `/admin` → Tab "Magazin" → "Artikel"

**Features:**
- **Tabelle** mit Status, Titel (DE), Titel (EN), Topic, Tags, Veröffentlichungsdatum
- **Filter:**
  - Suchfeld (durchsucht Titel DE/EN)
  - Status-Filter (Alle, Entwurf, Review, Veröffentlicht, Archiviert)
  - Topic-Filter (nach Thema filtern)
- **Aktionen pro Artikel:**
  - **Bearbeiten** - Öffnet den Editor
  - **Vorschau DE** - Öffnet `/magazin/{slug}` in neuem Tab (nur bei PUBLISHED)
  - **Vorschau EN** - Öffnet `/magazine/{slug}` in neuem Tab (nur bei PUBLISHED)
  - **Veröffentlichen** - Setzt Status auf PUBLISHED und `published_at` (nur bei nicht-PUBLISHED)
  - **Zurückziehen** - Setzt Status auf REVIEW zurück (nur bei PUBLISHED)
  - **Löschen** - Entfernt Artikel permanent

### Artikel erstellen/bearbeiten

**Pfad:** `/admin/magazine/posts/new` (neu) oder `/admin/magazine/posts/{postId}/edit` (bearbeiten)

#### Sprach-Tabs (DE / EN)

Der Editor zeigt zwei Tabs für Deutsch und Englisch. Pro Sprache gibt es:

**Pflichtfelder:**
- **Titel** - Überschrift des Artikels
- **Slug** - URL-Segment (z.B. `immobilienverwaltung-tipps`)
- **Inhalt** - Markdown-formatierter Content

**Optionale Felder:**
- **Excerpt** - Kurze Zusammenfassung (wird in Listen angezeigt)
- **SEO Title** - Custom Meta Title (Standard: Titel)
- **SEO Description** - Custom Meta Description (Standard: Excerpt)
- **OG Image URL** - Custom OpenGraph Bild (Standard: Hero Image)

#### Allgemeine Felder (sprachunabhängig)

- **Status** - Dropdown: DRAFT, REVIEW, PUBLISHED, ARCHIVED
- **Hero Image URL** - Bild-URL für Artikel-Header
- **Autor** - Name des Autors (Standard: "Rentably Team")
- **Primary Topic** - Dropdown mit verfügbaren Themen
- **Tags** - Multi-Select Checkboxen

#### Slug-Autogeneration

- Beim Tippen des Titels wird automatisch ein Slug generiert
- Button **"Regeneriere Slug"** erstellt Slug aus aktuellem Titel
- Format: Kleinbuchstaben, Bindestriche, keine Sonderzeichen
- Umlaute werden konvertiert: ä→ae, ö→oe, ü→ue, ß→ss

#### Slug-Änderungen & 301 Redirects

**Wichtig:** Wenn ein Slug geändert wird:
1. Der alte Slug wird in `mag_slug_history` gespeichert
2. Beim Aufruf des alten Slugs wird automatisch ein 301 Redirect auf den neuen Slug ausgeführt
3. Dies gilt pro Locale (DE und EN separat)

**Beispiel:**
- Alter Slug: `immobilien-tipps`
- Neuer Slug: `vermieter-ratgeber`
- Aufruf von `/magazin/immobilien-tipps` → 301 Redirect → `/magazin/vermieter-ratgeber`

#### Validierung

- **Pflichtfelder:** Titel, Slug, Inhalt für DE und EN müssen ausgefüllt sein
- **Slug Uniqueness:** Pro Locale muss der Slug einzigartig sein (DB Constraint)
- **SEO Warnings:** Max. Längen werden NICHT erzwungen, aber empfohlen:
  - SEO Title: 60-70 Zeichen
  - SEO Description: 150-160 Zeichen

#### Speichern & Veröffentlichen

**Buttons:**
- **"Speichern"** - Speichert Änderungen, behält aktuellen Status
- **"Veröffentlichen"** - Setzt Status auf PUBLISHED und `published_at` auf aktuelle Zeit

**Nach dem Speichern:**
- Weiterleitung zurück zur Artikel-Liste
- Erfolgsmeldung wird angezeigt

---

## 2. Themen-Verwaltung (Topics)

**Pfad:** `/admin` → Tab "Magazin" → "Themen"

**Features:**
- **Tabelle** mit Name (DE), Name (EN), Slug (DE), Slug (EN), Erstelldatum
- **Button "Neues Thema"** - Öffnet Modal
- **Aktionen:**
  - **Bearbeiten** - Öffnet Modal zum Bearbeiten
  - **Vorschau** - Öffnet `/magazin?topic={slug}` mit gefilterten Artikeln
  - **Löschen** - Entfernt Thema (nur wenn keine Artikel zugeordnet)

### Thema erstellen/bearbeiten

**Modal-Felder:**
- **Name (DE)** * - Pflicht
- **Slug (DE)** - Auto-generiert oder manuell
- **Name (EN)** - Optional (Standard: Name DE)
- **Slug (EN)** - Auto-generiert oder manuell

**Slug-Generierung:**
- Button "Generieren" erstellt Slug aus Name
- Gleiche Konvertierungsregeln wie bei Posts

---

## 3. Tag-Verwaltung (Tags)

**Pfad:** `/admin` → Tab "Magazin" → "Tags"

**Features:**
- **Tabelle** mit Name (DE), Name (EN), Slug (DE), Slug (EN), Erstelldatum
- **Button "Neuer Tag"** - Öffnet Modal
- **Aktionen:**
  - **Bearbeiten** - Öffnet Modal zum Bearbeiten
  - **Vorschau** - Öffnet `/magazin?tags={slug}` mit gefilterten Artikeln
  - **Löschen** - Entfernt Tag (sicher, keine Cascade Issues)

### Tag erstellen/bearbeiten

**Modal-Felder:**
- **Name (DE)** * - Pflicht
- **Slug (DE)** - Auto-generiert oder manuell
- **Name (EN)** - Optional (Standard: Name DE)
- **Slug (EN)** - Auto-generiert oder manuell

---

## Public UI

### Magazin-Übersicht

**Pfade:**
- Deutsch: `/magazin`
- English: `/magazine`

**Features:**
- **Header** mit Titel, Intro-Text
- **Suchfeld** - Durchsucht Titel, Excerpt, Content
- **Topic-Dropdown** - Filter nach Thema
- **Tag-Chips** - Multi-Select (mehrere Tags gleichzeitig)
- **Aktive Filter** - Anzeige mit X zum Entfernen
- **Artikel-Liste:**
  - Cards mit Hero Image (optional), Titel, Excerpt, Datum, Topic, Tags
  - Hover-Effekte und Transitions
  - Lazy Loading für Bilder
- **Pagination:**
  - Prev/Next Buttons
  - Page Numbers (max 7 sichtbar)
  - Smooth Scroll to Top
- **Leere Zustände:**
  - Wenn keine Artikel gefunden
  - Button "Alle Filter entfernen"

### Artikel-Detail

**Pfade:**
- Deutsch: `/magazin/{slug}`
- English: `/magazine/{slug}`

**Features:**
- **Hero Image** (falls vorhanden)
- **Breadcrumb** - Zurück zum Magazin
- **Meta-Infos:**
  - Topic mit Link zur gefilterten Übersicht
  - Autor, Datum
  - Share-Button mit Dropdown (Facebook, Twitter, LinkedIn, Email)
- **Content:**
  - XSS-sicheres Markdown-Rendering
  - Styled Headlines, Lists, Links
  - Responsive Typography
- **Tags** am Ende mit Links zur gefilterten Übersicht
- **Ähnliche Artikel:**
  - 3 Related Posts (same topic oder shared tags)
  - Cards mit Image, Titel, Excerpt, Datum

### 404 Handling

Wenn ein Artikel nicht gefunden wird:
- **301 Redirect** falls Slug-History Eintrag existiert
- **404-Seite** mit "Zurück zum Magazin" Link

---

## SEO-Features

### Meta Tags (automatisch)

Pro Artikel wird generiert:
- **Title:** `{seo_title}` oder `{title} - Rentably`
- **Description:** `{seo_description}` oder `{excerpt}`
- **Canonical:** `https://rentably.de/{locale}/{slug}`
- **hreflang:** Links zwischen DE/EN Versionen

### OpenGraph Tags

- `og:title` - SEO Title oder Titel
- `og:description` - SEO Description oder Excerpt
- `og:image` - OG Image URL oder Hero Image
- `og:url` - Canonical URL
- `og:type` - "article"

### JSON-LD Structured Data

Pro Artikel wird ein Article Schema ausgegeben:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{title}",
  "description": "{excerpt}",
  "image": "{hero_image_url}",
  "author": {
    "@type": "Person",
    "name": "{author_name}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Rentably",
    "logo": {
      "@type": "ImageObject",
      "url": "https://rentably.de/rentably-logo.svg"
    }
  },
  "datePublished": "{published_at}",
  "dateModified": "{updated_at}",
  "mainEntityOfPage": "{canonical_url}",
  "inLanguage": "{locale}"
}
```

---

## Suche & Filter

### Suchfeld

- **Sucht in:** Titel, Excerpt, Content (case-insensitive)
- **URL-Parameter:** `?search={term}`
- **Persistent:** Bleibt beim Navigieren erhalten

### Topic-Filter

- **Dropdown** mit allen verfügbaren Topics
- **URL-Parameter:** `?topic={slug}`
- **Kombinierbar** mit Suche und Tags

### Tag-Filter

- **Multi-Select:** Mehrere Tags gleichzeitig
- **URL-Parameter:** `?tags=tag1,tag2,tag3`
- **Kombinierbar** mit Suche und Topic

### Pagination

- **URL-Parameter:** `?page=2`
- **10 Artikel pro Seite** (konstant)
- **Page Numbers:** Max 7 sichtbar mit intelligenter Range

---

## Performance

### Optimierungen

- **Lazy Loading** für alle Images (`loading="lazy"`)
- **Limit/Offset** Pagination (kein unbegrenztes Laden)
- **Total Count** via Supabase `count: "exact"`
- **Indexierte Queries** auf allen Foreign Keys
- **Smooth Transitions** mit CSS

### Caching

- Browser-Caching via Standard HTTP Headers
- Keine Server-Side Caching (da Supabase verwendet wird)

---

## Sicherheit

### XSS-Schutz

**Markdown-Rendering:**
1. **HTML Entities escaped:** `<`, `>`, `&`, `"`, `'`
2. **Nur sichere Tags erlaubt:** h1-h3, p, strong, em, ul, ol, li, a
3. **Links:** `target="_blank" rel="noopener noreferrer"`
4. **Kein JavaScript** in Content möglich

### RLS (Row Level Security)

**Public Zugriff:**
- Nur PUBLISHED Posts lesbar
- Nur veröffentlichte Übersetzungen sichtbar

**Admin Zugriff:**
- Vollzugriff auf alle Posts, Topics, Tags
- Nur Admins können erstellen/ändern/löschen

### Input-Sanitization

- Alle URL-Parameter werden escaped
- Keine SQL-Injection möglich (Supabase Client)
- Slug-Validation auf DB-Ebene (UNIQUE Constraint)

---

## Datenbank-Schema

### Tabellen

**`mag_posts`:**
- `id` (uuid, PK)
- `status` (ENUM: DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- `hero_image_url` (text, nullable)
- `author_name` (text, default 'Rentably Team')
- `primary_topic_id` (uuid FK → mag_topics)
- `published_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

**`mag_post_translations`:**
- `id` (uuid, PK)
- `post_id` (uuid FK → mag_posts)
- `locale` (text: 'de', 'en')
- `title`, `slug` (text, NOT NULL)
- `excerpt`, `content` (text)
- `seo_title`, `seo_description`, `og_image_url` (text, nullable)
- UNIQUE `(post_id, locale)`
- UNIQUE `(locale, slug)`

**`mag_topics`:**
- `id` (uuid, PK)
- `created_at`, `updated_at` (timestamptz)

**`mag_topic_translations`:**
- `id` (uuid, PK)
- `topic_id` (uuid FK → mag_topics)
- `locale` (text)
- `name`, `slug` (text, NOT NULL)
- UNIQUE `(topic_id, locale)`
- UNIQUE `(locale, slug)`

**`mag_tags`:**
- `id` (uuid, PK)
- `created_at`, `updated_at` (timestamptz)

**`mag_tag_translations`:**
- `id` (uuid, PK)
- `tag_id` (uuid FK → mag_tags)
- `locale` (text)
- `name`, `slug` (text, NOT NULL)
- UNIQUE `(tag_id, locale)`
- UNIQUE `(locale, slug)`

**`mag_post_tags`:**
- `id` (uuid, PK)
- `post_id` (uuid FK → mag_posts)
- `tag_id` (uuid FK → mag_tags)
- UNIQUE `(post_id, tag_id)`

**`mag_slug_history`:**
- `id` (uuid, PK)
- `entity_type` (text: 'post', 'topic', 'tag')
- `entity_id` (uuid)
- `locale` (text)
- `old_slug`, `new_slug` (text)
- `changed_at` (timestamptz)

---

## Workflow: Artikel veröffentlichen

### Schritt-für-Schritt

1. **Admin öffnen:** `/admin` → Tab "Magazin"
2. **"Neuer Artikel" klicken**
3. **DE-Tab:**
   - Titel eingeben (Slug wird auto-generiert)
   - Excerpt schreiben
   - Content in Markdown verfassen
   - Optional: SEO Title, SEO Description, OG Image
4. **EN-Tab:**
   - Titel eingeben (Slug wird auto-generiert)
   - Excerpt übersetzen
   - Content übersetzen
   - Optional: SEO Fields
5. **Allgemein:**
   - Status: DRAFT (Standard)
   - Hero Image URL eingeben (optional)
   - Autor: "Rentably Team" (Standard)
   - Topic auswählen
   - Tags auswählen (Multi-Select)
6. **"Speichern"** - Artikel wird als Draft gespeichert
7. **Preview:**
   - Artikel in Liste suchen
   - "Bearbeiten" klicken
   - Status auf PUBLISHED ändern
   - "Veröffentlichen" klicken
8. **Fertig!** Artikel ist jetzt auf `/magazin/{slug}` und `/magazine/{slug}` live

### Alternative: Direkt veröffentlichen

- Statt "Speichern" direkt **"Veröffentlichen"** klicken
- Status wird automatisch auf PUBLISHED gesetzt
- `published_at` wird auf aktuelle Zeit gesetzt

---

## Tipps & Best Practices

### Content-Erstellung

1. **Titel:** Kurz, prägnant, keyword-reich (max. 60 Zeichen für SEO)
2. **Excerpt:** 150-160 Zeichen, Call-to-Action einbauen
3. **Content:**
   - Markdown verwenden (# für H1, ## für H2, etc.)
   - Absätze mit Leerzeile trennen
   - Listen mit `-` oder `1.` erstellen
   - Links: `[Text](https://url.de)`
4. **Hero Image:** 1200x630px empfohlen (OpenGraph Standard)
5. **Topics:** Maximal 1 Primary Topic pro Artikel
6. **Tags:** 3-5 relevante Tags pro Artikel

### SEO-Optimierung

1. **Custom SEO Title:** Nur wenn vom Titel abweichend notwendig
2. **SEO Description:** Immer ausfüllen! Meta Description ist wichtig
3. **OG Image:** Für Social Media Shares optimieren
4. **Slug:** Kurz, keyword-reich, lesbar
5. **Interne Links:** Andere Artikel verlinken (via Tags/Topics)

### Mehrsprachigkeit

1. **Beide Sprachen pflegen:** DE und EN sollten immer vollständig sein
2. **Slugs anpassen:** Nicht einfach übersetzen, sondern lokalisieren
3. **SEO Fields:** Pro Sprache unterschiedlich optimieren

---

## Troubleshooting

### "Artikel nicht gefunden" (404)

**Ursachen:**
- Artikel ist nicht PUBLISHED
- Slug stimmt nicht überein (Tippfehler)
- Übersetzung fehlt für gewählte Locale

**Lösung:**
- Status auf PUBLISHED setzen
- Slug in Admin überprüfen
- Beide Übersetzungen (DE + EN) anlegen

### Slug-Konflikt

**Fehler:** "Slug bereits vorhanden"

**Lösung:**
- Anderen Slug verwenden
- Oder: Existierenden Artikel mit gleichem Slug löschen/archivieren

### Suche findet nichts

**Ursachen:**
- Nur PUBLISHED Artikel werden durchsucht
- Suchterm zu spezifisch
- Artikel in anderer Sprache veröffentlicht

**Lösung:**
- Artikel veröffentlichen
- Breitere Suchbegriffe verwenden
- Sprache wechseln (DE ↔ EN)

### Related Articles fehlen

**Ursachen:**
- Keine anderen Artikel mit gleichem Topic
- Keine Artikel mit übereinstimmenden Tags

**Lösung:**
- Topic zuweisen
- Mehr Tags hinzufügen
- Weitere Artikel im gleichen Thema erstellen

---

## Erweiterungen

### Weitere Sprachen hinzufügen

1. **DB:** Neue Locale in `_translations` Tabellen eintragen
2. **Frontend:** Language Context erweitern
3. **Admin:** Weitere Tabs im Editor hinzufügen
4. **Public:** Routing für neue Locale (`/magazine-fr`, `/revista`, etc.)

### Custom Fields

1. **Migration:** Neue Spalten in `mag_posts` oder `mag_post_translations`
2. **Admin:** Felder im Editor hinzufügen
3. **Public:** Felder in Detail-View rendern

### Kategorien statt Topics

- Topics sind bereits implementiert
- Für hierarchische Kategorien: `parent_topic_id` FK hinzufügen

---

## Support

Bei Fragen oder Problemen:
1. **Dokumentation** prüfen (diese Datei)
2. **Logs** checken (Browser Console + Supabase Logs)
3. **RLS Policies** verifizieren (Admin-Zugriff?)
4. **DB Constraints** prüfen (Unique Slugs, FKs)

---

**Stand:** 2026-02-03
**Version:** 1.0
**Autor:** Rentably Team
