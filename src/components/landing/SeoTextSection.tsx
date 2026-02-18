import { RevealOnScroll } from "../common/RevealOnScroll";

export default function SeoTextSection() {
  return (
    <section className="py-[80px] px-6 bg-[#f8fafc]">
      <div className="max-w-[800px] mx-auto">
        <RevealOnScroll>
          <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-6">
            Immobilienverwaltung einfach gemacht — die Software für private Vermieter
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>
            Die Verwaltung von Mietimmobilien stellt private Vermieter und
            Eigentümer vor zahlreiche Herausforderungen: Mietverträge müssen
            gepflegt, Zahlungseingänge überwacht, Betriebskostenabrechnungen
            erstellt und Dokumente archiviert werden. Hinzu kommt die
            Kommunikation mit Mietern, die Erfassung von Zählerständen und die
            Einhaltung gesetzlicher Fristen bei Mieterhöhungen. Viele Vermieter
            nutzen dafür noch immer Excel-Tabellen, Ordner und
            handschriftliche Notizen — ein Ansatz, der mit wachsendem Portfolio
            schnell an seine Grenzen stösst.
          </p>
          <p>
            Rentably ist eine Hausverwaltungssoftware, die speziell für private
            Vermieter und Eigentümer entwickelt wurde. Die Software deckt alle
            wesentlichen Bereiche der Immobilienverwaltung ab:
            Mietverwaltung mit Verträgen und automatischer Zahlungsüberwachung,
            Immobilienmanagement mit Stammdaten, Einheiten und Zählern,
            Buchhaltung mit Einnahmen, Ausgaben und Betriebskostenabrechnungen
            sowie digitale Kommunikation mit Mietern über ein integriertes
            Mieterportal und Ticketsystem.
          </p>
          <p>
            Anders als viele Hausverwaltungsprogramme auf dem Markt berechnet
            rentably keinen Preis pro Einheit, pro Immobilie oder pro Mieter.
            Stattdessen gibt es einen kostenlosen Basic-Tarif, der dauerhaft
            nutzbar ist und keine Begrenzung bei der Anzahl verwalteter Objekte
            kennt. Der Pro-Tarif bietet zusätzliche Funktionen wie
            automatisierte Betriebskostenabrechnungen, Mahnwesen, erweiterte
            Dokumentenverwaltung und Indexmietberechnungen — zu einem festen
            monatlichen Preis, unabhängig von der Portfoliogrösse.
          </p>
          <p>
            Alle Daten werden DSGVO-konform auf europäischen Servern in
            Deutschland gespeichert. Die webbasierte Anwendung ist von jedem
            Gerät mit Internetzugang erreichbar — ohne Installation, ohne
            lokale Software. Neue Nutzer erhalten nach der Registrierung
            automatisch 30 Tage Zugang zu allen Pro-Funktionen, um die
            vollständige Software unverbindlich und ohne Zahlungsdaten zu
            testen.
          </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
