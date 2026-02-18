/*
  # Insert missing marketing page FAQs

  1. New Data
    - FAQs for "ueber-uns" page (6 questions about the company, pricing, data, target audience, contact, cancellation)
    - FAQs for "immobilienmanagement" page (4 questions about property limits, types, value tracking, photos)
    - FAQs for "mietverwaltung" page (4 questions about contracts, payments, index rent, reminders)
    - FAQs for "nebenkostenabrechnung" page (6 questions about creation, cost types, distribution, PDF, deadlines, sending)
    - FAQs for "buchhaltung" page (4 questions about income/expenses, exports, loans, tax)
    - FAQs for "kommunikation" page (4 questions about email, templates, auto-assignment, attachments)
    - FAQs for "dokumente" page (4 questions about formats, security, sharing, search)
    - FAQs for "uebergabeprotokoll" page (4 questions about PDF, photos, meter readings, move-in/out)
    - FAQs for "mieterportal" page (6 questions about activation, info, security, repairs, meters, cost)

  2. Notes
    - All FAQs are set to is_active = true
    - sort_order starts at 1 for each page
    - Content matches the existing hardcoded fallback FAQs on each page
*/

INSERT INTO faqs (page_slug, question, answer, sort_order, is_active)
VALUES
-- Über uns page
('ueber-uns', 'Wer steckt hinter rentably?', 'Rentably wurde von Simon Schier und Philipp Roth gegründet — zwei Unternehmer, die selbst als Vermieter die Herausforderungen der Immobilienverwaltung kennen. Unser Ziel ist es, private Vermieter mit einer modernen, einfachen Software zu unterstützen.', 1, true),
('ueber-uns', 'Ist rentably wirklich kostenlos?', 'Ja. Der Basic-Tarif ist dauerhaft kostenlos — ohne zeitliche Begrenzung und ohne versteckte Kosten. Sie können unbegrenzt viele Immobilien, Einheiten und Mieter verwalten. Für erweiterte Funktionen steht der Pro-Tarif zur Verfügung.', 2, true),
('ueber-uns', 'Wo werden meine Daten gespeichert?', 'Alle Daten werden auf europäischen Servern gehostet. Rentably ist vollständig DSGVO-konform. Ihre Daten werden nicht an Dritte weitergegeben und gehören ausschließlich Ihnen.', 3, true),
('ueber-uns', 'Für wen ist rentably geeignet?', 'Rentably ist primär für private Vermieter und Eigentümer konzipiert, die eine bis mehrere Immobilien verwalten. Auch kleinere Hausverwaltungen und Immobilieninvestoren profitieren von der Software.', 4, true),
('ueber-uns', 'Wie kann ich rentably kontaktieren?', 'Sie erreichen uns per E-Mail an hallo@rentab.ly oder über WhatsApp. Unser Support-Team ist Montag bis Freitag von 9:00 bis 18:00 Uhr für Sie da.', 5, true),
('ueber-uns', 'Kann ich jederzeit kündigen?', 'Ja. Der Pro-Tarif ist monatlich oder jährlich kündbar. Es gibt keine Mindestlaufzeit. Nach der Kündigung behalten Sie Zugriff auf alle Basic-Funktionen und Ihre gespeicherten Daten.', 6, true),

-- Immobilienmanagement
('immobilienmanagement', 'Wie viele Immobilien kann ich verwalten?', 'Es gibt keine Begrenzung. Sowohl im Basic- als auch im Pro-Tarif können Sie unbegrenzt viele Immobilien und Einheiten anlegen und verwalten.', 1, true),
('immobilienmanagement', 'Kann ich verschiedene Immobilientypen verwalten?', 'Ja. Sie können Mietobjekte, Eigentumswohnungen (WEG) und gemischt genutzte Immobilien verwalten. Für jede Eigentumsform stehen passende Felder und Funktionen bereit.', 2, true),
('immobilienmanagement', 'Werden Wertentwicklungen automatisch erfasst?', 'Wertentwicklungen können manuell eingetragen werden. Die Historie wird automatisch aufgezeichnet und als Diagramm dargestellt, sodass Sie die Entwicklung Ihres Portfolios jederzeit im Blick haben.', 3, true),
('immobilienmanagement', 'Kann ich Fotos zu meinen Immobilien hochladen?', 'Ja. Sie können beliebig viele Fotos pro Immobilie und Einheit hochladen. Die Bilder werden sicher in der Cloud gespeichert und sind jederzeit abrufbar.', 4, true),

-- Mietverwaltung
('mietverwaltung', 'Wie lege ich einen neuen Mietvertrag an?', 'Wählen Sie die gewünschte Immobilie und Einheit aus, erfassen Sie die Mieterdaten und Vertragsdetails wie Mietbeginn, Kaltmiete und Nebenkosten. Der Vertrag wird automatisch mit allen relevanten Daten verknüpft.', 1, true),
('mietverwaltung', 'Werden Mietzahlungen automatisch erfasst?', 'Ja. Über die Bankanbindung oder manuelle Eingabe werden Zahlungen erfasst und automatisch dem richtigen Mietverhältnis zugeordnet. Ausstehende Zahlungen werden übersichtlich angezeigt.', 2, true),
('mietverwaltung', 'Wie funktioniert die automatische Indexmieterhöhung?', 'Das System überwacht den Verbraucherpreisindex (VPI) automatisch. Sobald die vereinbarte Schwelle erreicht ist, berechnet rentably die neue Miete und benachrichtigt Sie. Sie können das Erhöhungsschreiben direkt erstellen und versenden.', 3, true),
('mietverwaltung', 'Kann ich Mahnungen automatisch versenden?', 'Ja. Das mehrstufige Mahnwesen erkennt ausstehende Zahlungen automatisch und erstellt die passende Mahnstufe. Mahnungen werden automatisch dokumentiert und können per E-Mail versendet werden.', 4, true),

-- Nebenkostenabrechnung
('nebenkostenabrechnung', 'Wie erstelle ich eine Nebenkostenabrechnung?', 'Mit dem geführten 3-Schritte-Assistenten: Immobilie und Abrechnungszeitraum wählen, Kostenpositionen eingeben, Abrechnung prüfen und versenden. Der Assistent führt Sie durch jeden Schritt.', 1, true),
('nebenkostenabrechnung', 'Welche Kostenarten werden unterstützt?', 'Alle gängigen Betriebskostenarten nach der Betriebskostenverordnung (BetrKV): Heizung, Wasser, Müllabfuhr, Gebäudeversicherung, Grundsteuer, Hausmeister, Gartenpflege und viele mehr.', 2, true),
('nebenkostenabrechnung', 'Wie funktioniert die Verteilung der Kosten?', 'Rentably berechnet die Verteilung automatisch anhand des gewählten Umlageschlüssels — ob nach Wohnfläche, Personenzahl, Verbrauch oder Miteigentumsanteil (MEA). Sie können für jede Kostenposition einen eigenen Schlüssel wählen.', 3, true),
('nebenkostenabrechnung', 'Wird die Abrechnung als PDF erstellt?', 'Ja. Die fertige Abrechnung wird als professionelles PDF generiert — mit allen Einzelpositionen, Verteilungsschlüsseln, dem Ergebnis (Nachzahlung oder Guthaben) und der §35a-Steuerbescheinigung.', 4, true),
('nebenkostenabrechnung', 'Bis wann muss die Nebenkostenabrechnung erstellt werden?', 'Rentably hilft Ihnen, die gesetzliche Frist einzuhalten: Die Abrechnung muss dem Mieter innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums zugehen. Das System erinnert Sie rechtzeitig.', 5, true),
('nebenkostenabrechnung', 'Kann ich die Abrechnung direkt an den Mieter senden?', 'Ja. Sie können die fertige Abrechnung direkt per E-Mail an Ihren Mieter versenden — mit dem PDF als Anhang. Der Versand wird automatisch dokumentiert.', 6, true),

-- Buchhaltung
('buchhaltung', 'Wie erfasse ich Einnahmen und Ausgaben?', 'Mieteinnahmen werden automatisch aus den Mietverträgen generiert. Ausgaben können manuell erfasst oder per Beleg-Upload importiert werden. Jede Buchung wird dem richtigen Objekt zugeordnet.', 1, true),
('buchhaltung', 'Kann ich Auswertungen exportieren?', 'Ja. Alle Finanzdaten können als PDF oder Excel exportiert werden — perfekt für den Steuerberater oder die eigene Dokumentation. Die Auswertungen sind nach Anlage V der Einkommensteuererklärung strukturiert.', 2, true),
('buchhaltung', 'Werden Darlehen automatisch berechnet?', 'Ja. Erfassen Sie Ihre Immobiliendarlehen mit Zinssatz, Tilgung und Laufzeit. Rentably berechnet automatisch die monatlichen Raten und trennt Zins- und Tilgungsanteil für die steuerliche Zuordnung.', 3, true),
('buchhaltung', 'Ist die Buchhaltung für die Steuererklärung geeignet?', 'Rentably erstellt keine Steuererklärung, liefert aber alle notwendigen Daten strukturiert nach Anlage V der Einkommensteuererklärung. Der Export für den Steuerberater ist mit wenigen Klicks erledigt.', 4, true),

-- Kommunikation
('kommunikation', 'Kann ich E-Mails direkt aus rentably versenden?', 'Ja. Über das integrierte E-Mail-System können Sie Nachrichten direkt an Ihre Mieter senden. Jede Kommunikation wird automatisch dokumentiert und dem richtigen Mietverhältnis zugeordnet.', 1, true),
('kommunikation', 'Gibt es fertige Nachrichtenvorlagen?', 'Ja. Rentably bietet Ihnen professionelle Vorlagen für häufige Anlässe — von der Mieterhöhung bis zur Betriebskostenabrechnung. Alle Vorlagen sind individuell anpassbar und nutzen automatische Platzhalter.', 2, true),
('kommunikation', 'Werden eingehende E-Mails automatisch zugeordnet?', 'Ja. Eingehende E-Mails werden automatisch dem passenden Mieter und Mietverhältnis zugeordnet. So haben Sie die gesamte Kommunikationshistorie an einem Ort.', 3, true),
('kommunikation', 'Kann ich Dokumente per E-Mail versenden?', 'Ja. Dokumente wie Abrechnungen, Verträge oder Bescheinigungen können direkt als Anhang per E-Mail versendet werden. Der Versand wird sicher dokumentiert.', 4, true),

-- Dokumente
('dokumente', 'Welche Dateiformate werden unterstützt?', 'Sie können PDF, JPG, PNG, Word- und Excel-Dateien hochladen. Die maximale Dateigröße beträgt 10 MB pro Dokument.', 1, true),
('dokumente', 'Wie werden meine Dokumente geschützt?', 'Alle Dokumente werden verschlüsselt auf deutschen Servern gespeichert. Rentably ist vollständig DSGVO-konform. Nur Sie und von Ihnen autorisierte Personen haben Zugriff.', 2, true),
('dokumente', 'Kann ich Dokumente mit Mietern teilen?', 'Ja. Über das Mieterportal können Sie ausgewählte Dokumente gezielt mit einzelnen Mietern teilen — zum Beispiel Betriebskostenabrechnungen oder Vertragsunterlagen.', 3, true),
('dokumente', 'Gibt es eine Suchfunktion?', 'Ja. Sie können Dokumente nach Name, Kategorie, Immobilie oder Mieter durchsuchen. So finden Sie jedes Dokument in Sekunden wieder.', 4, true),

-- Übergabeprotokoll
('uebergabeprotokoll', 'Kann ich das Protokoll als PDF exportieren?', 'Ja. Das fertige Übergabeprotokoll kann als professionelles, druckfertiges PDF exportiert werden — mit allen dokumentierten Räumen, Mängeln, Zählerständen und Schlüsselübergaben.', 1, true),
('uebergabeprotokoll', 'Kann ich Fotos zum Protokoll hinzufügen?', 'Ja. Sie können Fotos zu einzelnen Räumen und Mängeln hinzufügen. Die Bilder werden automatisch in das PDF-Protokoll übernommen.', 2, true),
('uebergabeprotokoll', 'Werden Zählerstände gespeichert?', 'Ja. Alle erfassten Zählerstände werden dauerhaft gespeichert und können für die Nebenkostenabrechnung herangezogen werden.', 3, true),
('uebergabeprotokoll', 'Kann ich zwischen Einzug und Auszug unterscheiden?', 'Ja. Sie können sowohl Einzugs- als auch Auszugsprotokolle erstellen. Beide Protokolltypen werden getrennt gespeichert und können verglichen werden.', 4, true),

-- Mieterportal
('mieterportal', 'Wie aktiviere ich das Mieterportal für einen Mieter?', 'Mit einem Klick in der Mieterübersicht. Der Mieter erhält automatisch eine E-Mail mit den Zugangsdaten und kann sich sofort einloggen.', 1, true),
('mieterportal', 'Welche Informationen sieht mein Mieter im Portal?', 'Mieter sehen ihr persönliches Dashboard mit Vertragsinformationen, geteilte Dokumente, die Kommunikationshistorie und können Zählerstände melden sowie Reparaturen anfragen.', 2, true),
('mieterportal', 'Ist das Portal sicher?', 'Ja. Das Mieterportal ist passwortgeschützt und verschlüsselt. Rentably ist vollständig DSGVO-konform. Mieter sehen nur die für sie freigegebenen Informationen.', 3, true),
('mieterportal', 'Können Mieter auch Reparaturen melden?', 'Ja. Über das integrierte Ticketsystem können Mieter Reparaturen und Anliegen direkt melden. Sie werden automatisch benachrichtigt und können den Status verfolgen.', 4, true),
('mieterportal', 'Wie melden Mieter ihre Zählerstände?', 'Mieter können Zählerstände direkt im Portal eingeben. Die Werte werden automatisch dem richtigen Zähler zugeordnet und stehen für die Nebenkostenabrechnung bereit.', 5, true),
('mieterportal', 'Kostet das Mieterportal extra?', 'Nein. Das Mieterportal ist im Pro-Tarif enthalten — ohne zusätzliche Kosten, egal wie viele Mieter Sie einladen.', 6, true)

ON CONFLICT DO NOTHING;