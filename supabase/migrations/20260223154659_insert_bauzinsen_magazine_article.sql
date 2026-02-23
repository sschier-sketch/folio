/*
  # Insert Bauzinsen Magazine Article

  Creates a new magazine article about mortgage interest rates (Bauzinsen) with:

  1. New Records
    - `mag_posts` entry with category "finanzen", status "PUBLISHED"
    - `mag_post_translations` with German locale (de), slug "bauzinsen-entwicklung-aktuell-historie"
    - 6 FAQ entries covering common questions about mortgage rates

  2. Important Notes
    - The article page is rendered by a custom React component (not markdown)
    - Content field contains a marker "[INTERACTIVE_COMPONENT:bauzinsen]" to signal the custom renderer
    - Summary points highlight key takeaways about Bundesbank data
    - SEO metadata targets keywords: Bauzinsen aktuell, Zinsentwicklung, Zinsbindung
*/

DO $$
DECLARE
  v_post_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM mag_post_translations WHERE slug = 'bauzinsen-entwicklung-aktuell-historie' AND locale = 'de'
  ) THEN
    INSERT INTO mag_posts (
      status, author_name, category, is_featured, published_at, hero_image_url, hero_image_alt
    ) VALUES (
      'PUBLISHED',
      'Rentably Redaktion',
      'finanzen',
      false,
      now(),
      'https://images.pexels.com/photos/7821487/pexels-photo-7821487.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'Bauzinsen Entwicklung in Deutschland - Grafik und Analyse'
    ) RETURNING id INTO v_post_id;

    INSERT INTO mag_post_translations (
      post_id, locale, title, slug, excerpt, content, summary_points, reading_time_minutes,
      seo_title, seo_description
    ) VALUES (
      v_post_id,
      'de',
      'Bauzinsen aktuell: Entwicklung, Zinsbindung und Historie',
      'bauzinsen-entwicklung-aktuell-historie',
      'Wie haben sich die Bauzinsen in Deutschland entwickelt? Interaktiver Chart mit monatlichen Bundesbank-Daten fuer alle Zinsbindungen seit 2003 - inklusive aktueller Werte und Prognose-Einschaetzung fuer Vermieter und Investoren.',
      '[INTERACTIVE_COMPONENT:bauzinsen]',
      '["Monatliche Effektivzinsen der Deutschen Bundesbank seit 2003 im interaktiven Chart", "Vier Zinsbindungsfristen im Vergleich: variabel, 1-5 Jahre, 5-10 Jahre und ueber 10 Jahre", "Historisches Zinstief 2020/2021 bei ca. 1,1 % fuer lange Zinsbindungen", "Aktueller Anstieg seit 2022 auf etwa 3,5 - 3,7 % p.a. fuer 10-jaehrige Zinsbindung", "Datenquelle: Deutsche Bundesbank (BBIM1), woechentlich automatisch aktualisiert"]'::jsonb,
      8,
      'Bauzinsen aktuell 2025: Zinsentwicklung & Historie | rentably',
      'Aktuelle Bauzinsen in Deutschland mit interaktivem Chart. Monatliche Bundesbank-Daten seit 2003 fuer alle Zinsbindungen. Effektivzins-Entwicklung fuer Vermieter und Investoren.'
    );

    INSERT INTO mag_post_faqs (post_id, question, answer, sort_order) VALUES
    (v_post_id, 'Was sind Bauzinsen und wie werden sie ermittelt?', 'Bauzinsen (auch Hypothekenzinsen oder Immobilienzinsen) sind die Zinsen, die Banken fuer Wohnungsbaukredite berechnen. Die hier dargestellten Werte sind volumengewichtete Durchschnittssaetze fuer Neugeschaeft, die von der Deutschen Bundesbank monatlich erhoben und veroeffentlicht werden.', 1),
    (v_post_id, 'Was bedeutet anfaengliche Zinsbindung?', 'Die anfaengliche Zinsbindung ist der Zeitraum, fuer den der vereinbarte Zinssatz festgeschrieben wird. Bei einer 10-jaehrigen Zinsbindung bleibt Ihr Zinssatz 10 Jahre lang gleich - unabhaengig von der allgemeinen Zinsentwicklung. Laengere Zinsbindungen bieten mehr Planungssicherheit, sind aber in der Regel etwas teurer.', 2),
    (v_post_id, 'Woher stammen die Daten im Chart?', 'Die Daten stammen aus der MFI-Zinsstatistik der Deutschen Bundesbank (Flow BBIM1). Es handelt sich um Effektivzinssaetze fuer Wohnungsbaukredite an private Haushalte im Neugeschaeft. Die Werte werden monatlich erhoben und automatisch woechentlich in unser System importiert.', 3),
    (v_post_id, 'Wie oft werden die Zinsdaten aktualisiert?', 'Die Daten werden automatisch einmal pro Woche von der Bundesbank-API abgerufen. Die Bundesbank veroeffentlicht neue Monatswerte in der Regel mit 4-6 Wochen Verzoegerung. Der letzte Aktualisierungszeitpunkt wird direkt ueber dem Chart angezeigt.', 4),
    (v_post_id, 'Sollte ich als Vermieter jetzt finanzieren oder warten?', 'Das haengt von Ihrer individuellen Situation ab. Generell gilt: Versuchen Sie nicht, den Markt zu timen. Wenn die Konditionen zu Ihrem Investitionsplan passen und die Immobilie sich rechnet, kann ein Abschluss sinnvoll sein. Eine laengere Zinsbindung (10+ Jahre) gibt Ihnen als Vermieter Kalkulationssicherheit fuer Ihre Mietrendite.', 5),
    (v_post_id, 'Was ist der Unterschied zwischen Effektivzins und Sollzins?', 'Der Sollzins (auch Nominalzins) ist der reine Zins fuer das geliehene Kapital. Der Effektivzins (hier dargestellt) beinhaltet zusaetzlich weitere Kosten wie ein Disagio und die Zinsverrechnung. Er ist daher der bessere Vergleichswert. Er enthaelt jedoch keine Kosten fuer Kontogebuehren, Schaetzungen oder Versicherungen.', 6);
  END IF;
END $$;
