/*
  # Sync SEO pages: remove /support, add all missing marketing pages

  1. Changes
    - Removes the /support SEO page entry (page no longer exists)
    - Adds all missing marketing pages to seo_page_settings:
      - /ueber-uns (About us)
      - /funktionen/mietverwaltung (Tenant management feature)
      - /funktionen/immobilienmanagement (Property management feature)
      - /funktionen/kommunikation (Communication feature)
      - /funktionen/buchhaltung (Accounting feature)
      - /funktionen/dokumente (Documents feature)
      - /funktionen/nebenkostenabrechnung (Operating costs feature)
      - /funktionen/mieterportal (Tenant portal feature)
      - /funktionen/uebergabeprotokoll (Handover protocol feature)
      - /magazin (Magazine listing page)

  2. Important
    - Uses INSERT ... ON CONFLICT to avoid duplicates
    - All new pages default to allow_indexing = true, is_public = true
    - Feature pages are typed as 'feature'
    - /magazin is typed as 'blog' (magazine section)
*/

DELETE FROM seo_page_settings WHERE path = '/support';

INSERT INTO seo_page_settings (path, page_type, is_public, allow_indexing, title)
VALUES
  ('/ueber-uns', 'marketing', true, true, 'Über uns – rentably'),
  ('/funktionen/mietverwaltung', 'feature', true, true, 'Mietverwaltung – rentably'),
  ('/funktionen/immobilienmanagement', 'feature', true, true, 'Immobilienmanagement – rentably'),
  ('/funktionen/kommunikation', 'feature', true, true, 'Kommunikation – rentably'),
  ('/funktionen/buchhaltung', 'feature', true, true, 'Buchhaltung – rentably'),
  ('/funktionen/dokumente', 'feature', true, true, 'Dokumente – rentably'),
  ('/funktionen/nebenkostenabrechnung', 'feature', true, true, 'Nebenkostenabrechnung – rentably'),
  ('/funktionen/mieterportal', 'feature', true, true, 'Mieterportal – rentably'),
  ('/funktionen/uebergabeprotokoll', 'feature', true, true, 'Übergabeprotokoll – rentably'),
  ('/magazin', 'blog', true, true, 'Magazin – rentably')
ON CONFLICT (path) DO NOTHING;
