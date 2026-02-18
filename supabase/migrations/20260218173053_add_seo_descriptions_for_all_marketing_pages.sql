/*
  # Add SEO descriptions for all marketing and feature pages

  1. Updates
    - `/ueber-uns` – marketing page, description was NULL
    - `/magazin` – blog page, description was NULL
    - `/funktionen/buchhaltung` – feature page, description was NULL
    - `/funktionen/dokumente` – feature page, description was NULL
    - `/funktionen/immobilienmanagement` – feature page, description was NULL
    - `/funktionen/kommunikation` – feature page, description was NULL
    - `/funktionen/mieterportal` – feature page, description was NULL
    - `/funktionen/mietverwaltung` – feature page, description was NULL
    - `/funktionen/nebenkostenabrechnung` – feature page, description was NULL
    - `/funktionen/uebergabeprotokoll` – feature page, description was NULL

  2. Notes
    - All descriptions are ~120-155 characters for optimal Google snippet display
    - Descriptions match the actual page content and value proposition
    - No existing data is overwritten (only NULL values are filled)
*/

UPDATE seo_page_settings
SET description = 'Erfahren Sie, wer hinter rentably steckt. Unsere Mission: Immobilienverwaltung für private Vermieter einfach, sicher und bezahlbar machen.',
    updated_at = now()
WHERE path = '/ueber-uns' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Praxisnahes Expertenwissen für Vermieter: Mietrecht, Nebenkosten, Steuern und Immobilienmanagement – im rentably Magazin.',
    updated_at = now()
WHERE path = '/magazin' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Mieteinnahmen, Ausgaben und Cashflows übersichtlich an einem Ort. Mit rentably behalten Sie Ihre Immobilienfinanzen jederzeit im Blick.',
    updated_at = now()
WHERE path = '/funktionen/buchhaltung' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Verträge, Abrechnungen und Protokolle sicher digital verwalten. Mit rentably archivieren Sie Dokumente und teilen sie direkt mit Mietern.',
    updated_at = now()
WHERE path = '/funktionen/dokumente' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Ihr gesamtes Immobilienportfolio digital verwaltet. Einheiten, Kennzahlen, Ausstattung und Kontakte – alles zentral an einem Ort.',
    updated_at = now()
WHERE path = '/funktionen/immobilienmanagement' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Mieterkommunikation zentral und effizient. E-Mails, Tickets und Dokumentenversand – strukturiert und nachvollziehbar an einem Ort.',
    updated_at = now()
WHERE path = '/funktionen/kommunikation' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Eigenes Mieterportal für Dokumente, Kommunikation und Zählerstände. Weniger Rückfragen, mehr Transparenz, zufriedenere Mieter.',
    updated_at = now()
WHERE path = '/funktionen/mieterportal' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Mietverwaltung digital: Verträge, Zahlungen, Indexmiete und Mahnwesen automatisiert. Stressfreie Vermietung mit rentably.',
    updated_at = now()
WHERE path = '/funktionen/mietverwaltung' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Nebenkostenabrechnung in Minuten erstellen. Rechtssichere Abrechnung mit automatischer Kostenverteilung, PDF-Export und Direktversand.',
    updated_at = now()
WHERE path = '/funktionen/nebenkostenabrechnung' AND description IS NULL;

UPDATE seo_page_settings
SET description = 'Wohnungsübergabe professionell dokumentieren. Raumweise Protokolle mit Zählerständen, Schlüsselübergabe und Mängeldokumentation.',
    updated_at = now()
WHERE path = '/funktionen/uebergabeprotokoll' AND description IS NULL;
