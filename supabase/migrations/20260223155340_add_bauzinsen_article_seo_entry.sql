/*
  # Add SEO entry for Bauzinsen magazine article

  1. New Data
    - Inserts SEO settings for `/magazin/bauzinsen-entwicklung-aktuell-historie`
    - page_type: blog
    - Includes title, description, and OG metadata for mortgage interest rate article

  2. Important Notes
    - Uses ON CONFLICT on unique `path` column to avoid duplicates
    - German-language SEO metadata targeting Bauzinsen-related search queries
*/

INSERT INTO public.seo_page_settings (
  path,
  page_type,
  title,
  description,
  og_title,
  og_description,
  is_public,
  allow_indexing
) VALUES (
  '/magazin/bauzinsen-entwicklung-aktuell-historie',
  'blog',
  'Bauzinsen aktuell 2026: Entwicklung, Prognose & Historie | rentably Magazin',
  'Aktuelle Bauzinsen im interaktiven Chart: Alle Zinsbindungen im Vergleich, historische Entwicklung seit 2003 und Tipps fuer Vermieter zur optimalen Finanzierung.',
  'Bauzinsen aktuell 2026: Entwicklung, Prognose & Historie',
  'Aktuelle Bauzinsen im interaktiven Chart mit allen Zinsbindungen, historischer Entwicklung seit 2003 und Praxis-Tipps fuer Vermieter.',
  true,
  true
) ON CONFLICT (path) DO NOTHING;