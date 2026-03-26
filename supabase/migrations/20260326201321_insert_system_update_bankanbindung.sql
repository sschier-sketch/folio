/*
  # Insert system update for the new bank connection feature

  1. New Data
    - New row in `system_updates` table for version 1.1.6
    - Title: "26. März"
    - Describes the new PSD2 bank connection (BanksAPI), transaction inbox,
      matching rules, CSV/CAMT053 import improvements and auto-apply features

  2. Important Notes
    - Published immediately (is_published = true)
    - update_type = 'premium' since the bank connection is a Pro feature
*/

INSERT INTO system_updates (id, title, version, update_type, is_published, published_at, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '26. März',
  '1.1.6',
  'premium',
  true,
  now(),
  'NEU: Bankanbindung – Konten verbinden, Transaktionen automatisch zuordnen

Mit der neuen Bankanbindung können Sie Ihre Bankkonten direkt mit rentably verknüpfen und eingehende Zahlungen automatisch Ihren Immobilien, Mietern und Buchungskategorien zuordnen. Manuelle Eingaben gehören damit der Vergangenheit an.

Automatischer Kontoabruf über PSD2 (BanksAPI)

Verbinden Sie Ihr Bankkonto sicher über die PSD2-Schnittstelle. Nach einmaliger Authentifizierung bei Ihrer Bank werden neue Transaktionen täglich automatisch abgerufen – ohne manuellen Export. Sie können mehrere Bankkonten gleichzeitig anbinden. Die Verbindung erfolgt über BanksAPI und ist DSGVO-konform.

CSV- und CAMT053-Import

Alternativ können Sie Kontoauszüge als CSV- oder CAMT053-Datei hochladen. Beim CSV-Import können die Spalten frei zugeordnet und die Zuordnung als Vorlage für spätere Importe gespeichert werden. CAMT053-Dateien (ISO 20022) werden automatisch erkannt und verarbeitet.

Transaktions-Inbox

Alle importierten Transaktionen landen in einer zentralen Inbox. Dort sehen Sie auf einen Blick, welche Buchungen bereits zugeordnet sind und welche noch offen stehen. Die Inbox kann nach Status, Zeitraum und Richtung (Eingang/Ausgang) gefiltert werden.

Intelligente Zuordnungsvorschläge

rentably analysiert jede eingehende Transaktion und schlägt automatisch passende Zuordnungen vor – basierend auf Betrag, Verwendungszweck, IBAN und früheren Zuordnungen. Vorschläge können mit einem Klick übernommen werden.

Zuordnungsregeln mit Auto-Anwendung

Erstellen Sie eigene Regeln, um wiederkehrende Transaktionen automatisch zuzuordnen. Regeln können auf Betragsbereich, Verwendungszweck (enthält/exakt), Auftraggeber-Name oder IBAN basieren. Aktivierte Regeln mit Auto-Anwendung greifen sofort beim nächsten Import – ohne manuelles Eingreifen.

Zuordnung zu Mietzahlungen, Einnahmen und Ausgaben

Jede Transaktion kann als Mietzahlung einem bestimmten Mieter und Monat zugeordnet werden. Alternativ kann sie als Einnahme oder Ausgabe einer Immobilie und Buchungskategorie zugewiesen werden. Die Zuordnung aktualisiert automatisch den Zahlungsstatus der betroffenen Mietzahlung bzw. erstellt den entsprechenden Buchungseintrag.

Import-Historie und Rollback

Jeder Import wird mit Dateiname, Zeitpunkt und Anzahl der Transaktionen protokolliert. Sollte ein Import fehlerhaft sein, können alle Transaktionen und daraus entstandenen Zuordnungen mit einem Klick rückgängig gemacht werden.

Wo finden Sie die Bankanbindung?
Der neue Bereich befindet sich unter Finanzen > Bankanbindung im Dashboard. Dort können Sie Konten verbinden, Dateien importieren, Transaktionen zuordnen und Ihre Regeln verwalten.',
  now(),
  now()
);
