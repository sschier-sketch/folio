/*
  # Populate Help Center – Allgemein (additional articles)

  Adds new articles to the "Allgemein" category:
  - Vorteile der Plattform
  - Wie funktioniert Rentably?

  Existing articles are NOT modified.
*/

INSERT INTO help_articles (category_id, title, slug, excerpt, content, sort_order) VALUES
((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Vorteile der Plattform',
 'vorteile-der-plattform',
 'Welche Vorteile bietet Rentably für private Vermieter?',
 '## Vorteile der Plattform

Rentably wurde speziell für private Vermieter in Deutschland entwickelt. Die Plattform vereint alle Aufgaben rund um Ihre Immobilien in einer einzigen Anwendung.

### Alles an einem Ort

Statt Excel-Tabellen, Ordner mit Papierdokumenten und verschiedene Programme zu nutzen, bündelt Rentably alle Bereiche der Vermietung:

- Immobilien und Einheiten verwalten
- Mietverträge und Mieterdaten pflegen
- Zahlungseingänge und Ausgaben erfassen
- Betriebskostenabrechnungen erstellen
- Dokumente speichern und teilen
- Mit Mietern kommunizieren

### Zeitersparnis durch Automatisierung

Viele Aufgaben erledigt Rentably automatisch:

- Monatliche Mietzahlungen werden generiert
- Bankumsätze werden Mietern zugeordnet
- Indexmieten werden berechnet
- Erinnerungen an Fristen werden erstellt
- Mahnungen können automatisch versendet werden

### Rechtssicherheit

Rentably orientiert sich am deutschen Mietrecht. Vorlagen für Kündigungen, Mieterhöhungen und Betriebskostenabrechnungen entsprechen den gesetzlichen Anforderungen.

### Datenschutz und Sicherheit

Ihre Daten werden auf Servern in Deutschland gespeichert. Die Plattform ist DSGVO-konform und verwendet verschlüsselte Verbindungen.

### Tipps

- Nutzen Sie die kostenlose Testphase, um alle Pro-Funktionen kennenzulernen.
- Beginnen Sie mit einer Immobilie und erweitern Sie schrittweise.

### Häufige Fragen

**Brauche ich technische Vorkenntnisse?**
Nein. Rentably ist so gestaltet, dass Sie ohne technisches Wissen sofort loslegen können.',
 4),

((SELECT id FROM help_categories WHERE slug = 'allgemein'),
 'Wie funktioniert Rentably?',
 'wie-funktioniert-rentably',
 'Ein Überblick über die Funktionsweise und den Aufbau von Rentably.',
 '## Wie funktioniert Rentably?

Rentably ist eine webbasierte Software, die Sie über Ihren Browser nutzen. Sie brauchen keine Installation – einfach anmelden und loslegen.

### Aufbau der Plattform

Nach der Anmeldung sehen Sie das Dashboard mit der Seitenleiste. Dort finden Sie alle Bereiche:

- **Übersicht** – Ihre zentrale Startseite mit allen wichtigen Kennzahlen
- **Immobilien** – Objekte und Einheiten anlegen und verwalten
- **Mieter** – Mieterdaten, Verträge und Kommunikation
- **Mieten** – Zahlungseingänge und offene Forderungen
- **Nachrichten** – E-Mails an Mieter senden und empfangen
- **Mieterportal** – Zugang für Ihre Mieter einrichten
- **Finanzen** – Ausgaben, Einnahmen, Bankimport und Analyse
- **Dokumente** – Alle Unterlagen zentral speichern
- **Vorlagen** – Dokumentenvorlagen nutzen und erstellen
- **Abrechnungen** – Betriebskostenabrechnungen erstellen

### So starten Sie

1. Registrieren Sie sich kostenlos.
2. Vervollständigen Sie Ihr Profil unter Einstellungen.
3. Legen Sie Ihr erstes Objekt an.
4. Erstellen Sie Einheiten innerhalb des Objekts.
5. Fügen Sie Mieter hinzu und erstellen Sie Mietverträge.
6. Ab sofort generiert Rentably monatliche Mietzahlungen.

### Schritt für Schritt

Folgen Sie der Profilabschluss-Karte auf dem Dashboard. Sie zeigt Ihnen die nächsten empfohlenen Schritte und Ihren Fortschritt.

### Tipps

- Rentably funktioniert auf Desktop, Tablet und Smartphone.
- Ihre Daten werden automatisch gespeichert – es gibt keinen Speichern-Button.
- Nutzen Sie die Tastenkombination Strg+K (Cmd+K auf Mac) für die Schnellsuche.

### Häufige Fragen

**Kann ich Rentably auch auf dem Handy nutzen?**
Ja. Die Weboberfläche passt sich automatisch an kleinere Bildschirme an.',
 5)
ON CONFLICT (slug) DO NOTHING;
