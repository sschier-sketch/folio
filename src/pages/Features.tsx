import { useNavigate } from "react-router-dom";
import { withRef } from "../lib/referralTracking";
import { RefLink } from "../components/common/RefLink";

interface FeatureBlock {
  title: string;
  description: string;
  bullets: string[];
  path: string;
}

const FEATURES: FeatureBlock[] = [
  {
    title: "Mietverwaltung",
    description:
      "Mietverträge, Zahlungen und Mieterhöhungen zentral verwalten. Behalten Sie den Überblick über jedes Mietverhältnis.",
    bullets: [
      "Mietverträge digital anlegen und verwalten",
      "Automatische Zahlungsverfolgung mit Teilzahlungen",
      "Index-basierte Mieterhöhungen berechnen lassen",
      "Mahnwesen bei verspäteten Zahlungen",
    ],
    path: "/funktionen/mietverwaltung",
  },
  {
    title: "Immobilienmanagement",
    description:
      "Stammdaten, Einheiten, Zähler und Kontakte an einem Ort. Jede Immobilie vollständig dokumentiert.",
    bullets: [
      "Stammdaten und Einheiten pro Objekt erfassen",
      "Zählerstände für Strom, Gas, Wasser und Fernwärme",
      "Kontaktpersonen wie Hausmeister oder Hausverwaltung",
      "Fotos, Grundrisse und Lagepläne hinterlegen",
    ],
    path: "/funktionen/immobilienmanagement",
  },
  {
    title: "Kommunikation",
    description:
      "Mieterportal und Ticketsystem für transparente, nachvollziehbare Kommunikation.",
    bullets: [
      "Mieterportal mit eigenem Login für Ihre Mieter",
      "Ticketsystem für Reparaturen und Anfragen",
      "Integriertes Nachrichtensystem mit Anhängen",
      "Automatische Benachrichtigungen bei neuen Nachrichten",
    ],
    path: "/funktionen/kommunikation",
  },
  {
    title: "Buchhaltung",
    description:
      "Einnahmen, Ausgaben, Betriebskostenabrechnungen und Finanzanalysen strukturiert aufbereitet.",
    bullets: [
      "Einnahmen und Ausgaben nach Kategorien erfassen",
      "Betriebskostenabrechnungen erstellen und versenden",
      "Cashflow-Übersicht pro Objekt und Portfolio",
      "Export für Steuerberater in gängigen Formaten",
    ],
    path: "/funktionen/buchhaltung",
  },
  {
    title: "Dokumente",
    description:
      "Mietverträge, Übergabeprotokolle, Belege und Schriftverkehr digital archivieren.",
    bullets: [
      "Dokumente nach Typ und Objekt organisieren",
      "Übergabeprotokolle digital erstellen und unterschreiben",
      "Dokumente direkt mit Mietern teilen",
      "Volltextsuche über alle archivierten Dateien",
    ],
    path: "/funktionen/dokumente",
  },
];

export default function Features() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-24 pb-20 sm:pt-32 sm:pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Funktionen
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl leading-relaxed">
            Fünf Bereiche, die Ihre Immobilienverwaltung vollständig abdecken.
            Jeder einzelne darauf ausgelegt, Ihnen Zeit zu sparen und Ordnung
            zu schaffen.
          </p>
        </div>
      </section>

      {FEATURES.map((feature, index) => {
        const isOdd = index % 2 !== 0;
        return (
          <section
            key={feature.title}
            className={`py-20 px-6 ${isOdd ? "bg-gray-50" : "bg-white"}`}
          >
            <div className="max-w-[1200px] mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div className={isOdd ? "lg:order-2" : ""}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <RefLink
                    to={feature.path}
                    className="text-sm font-medium text-[#3c8af7] hover:text-[#3579de] transition-colors"
                  >
                    Mehr erfahren
                  </RefLink>
                </div>
                <div className={isOdd ? "lg:order-1" : ""}>
                  <ul className="space-y-4">
                    {feature.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-baseline gap-3 text-gray-600"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7] flex-shrink-0 translate-y-[1px]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Alle Funktionen. Ein Preis.
          </h2>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto">
            Starten Sie jetzt und nutzen Sie alle Bereiche von Anfang an.
            Keine versteckten Kosten, keine Einschränkungen.
          </p>
          <button
            onClick={goToSignup}
            className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
          >
            Jetzt kostenlos starten
          </button>
        </div>
      </section>
    </div>
  );
}
