import { useNavigate } from "react-router-dom";
import { withRef } from "../lib/referralTracking";
import { RefLink } from "./common/RefLink";

const FEATURES = [
  {
    title: "Mietverwaltung",
    description:
      "Verträge, Mieterhöhungen und Zahlungseingänge an einem Ort. Behalten Sie jederzeit den Überblick über Ihre Mietverhältnisse.",
    path: "/funktionen/mietverwaltung",
  },
  {
    title: "Immobilienmanagement",
    description:
      "Stammdaten, Einheiten, Zähler und Kontakte zentral verwalten. Jede Immobilie vollständig dokumentiert.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    title: "Kommunikation",
    description:
      "Mieterportal und Ticketsystem für transparente, nachvollziehbare Kommunikation mit Ihren Mietern.",
    path: "/funktionen/kommunikation",
  },
  {
    title: "Buchhaltung",
    description:
      "Einnahmen, Ausgaben, Betriebskostenabrechnungen und Mahnwesen. Ihre Finanzen strukturiert und nachvollziehbar.",
    path: "/funktionen/buchhaltung",
  },
  {
    title: "Dokumente",
    description:
      "Mietverträge, Übergabeprotokolle und Belege digital archivieren und jederzeit abrufen.",
    path: "/funktionen/dokumente",
  },
];

const PAIN_POINTS = [
  {
    title: "Verstreute Daten",
    text: "Mietverträge in Ordnern, Zahlungen in Excel, Kommunikation per E-Mail. Informationen sind überall verteilt und schwer auffindbar.",
  },
  {
    title: "Manuelle Prozesse",
    text: "Betriebskostenabrechnungen per Hand, Zahlungseingänge manuell prüfen, Mieterhöhungen im Kalender notieren. Das kostet Zeit und ist fehleranfällig.",
  },
  {
    title: "Fehlende Übersicht",
    text: "Wie steht meine Rendite? Welche Mieter zahlen verspätet? Welche Verträge laufen aus? Ohne System bleiben wichtige Fragen unbeantwortet.",
  },
];

const TRUST_POINTS = [
  "Gehostet in Deutschland auf europäischen Servern",
  "Verschlüsselte Datenübertragung und sichere Speicherung",
  "Regelmäßige Backups Ihrer Daten",
  "DSGVO-konforme Verarbeitung",
  "Keine Weitergabe Ihrer Daten an Dritte",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-24 pb-24 sm:pt-32 sm:pb-28 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                Immobilienverwaltung,
                <br />
                <span className="text-[#3c8af7]">die mitdenkt.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg">
                Objekte, Mieter, Finanzen und Dokumente an einem Ort.
                Die Software für private Vermieter, die Ordnung schaffen
                und Zeit sparen wollen.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={goToSignup}
                  className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
                >
                  Kostenlos starten
                </button>
                <RefLink
                  to="/preise"
                  className="h-12 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Preise ansehen
                </RefLink>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-gray-50 rounded-2xl border border-gray-100 aspect-[4/3] flex items-center justify-center">
                <div className="text-center px-12">
                  <div className="text-6xl font-bold text-[#3c8af7] mb-3">
                    9&thinsp;EUR
                  </div>
                  <p className="text-sm text-gray-400">
                    pro Monat &middot; alle Funktionen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-16">
            Warum viele Vermieter an Grenzen stoßen
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {PAIN_POINTS.map((point) => (
              <div key={point.title}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {point.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Alles, was Sie brauchen
          </h2>
          <p className="text-gray-500 mb-16 max-w-2xl">
            Fünf Bereiche, die Ihre Immobilienverwaltung vollständig abdecken
            &ndash; von der Mietverwaltung bis zur Dokumentenablage.
          </p>
          <div className="grid md:grid-cols-3 gap-x-10 gap-y-12">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-3">
                  {feature.description}
                </p>
                <RefLink
                  to={feature.path}
                  className="text-sm font-medium text-[#3c8af7] hover:text-[#3579de] transition-colors"
                >
                  Mehr erfahren
                </RefLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">
              Ihre Daten in sicheren Händen
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Rentably wird in Deutschland betrieben und erfüllt die
              Anforderungen der DSGVO. Ihre Immobiliendaten gehören Ihnen
              &ndash; heute und in Zukunft.
            </p>
            <ul className="space-y-3">
              {TRUST_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-baseline gap-3 text-gray-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7] flex-shrink-0 translate-y-[1px]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Bereit, Ihre Verwaltung zu vereinfachen?
          </h2>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto">
            Erstellen Sie Ihren Account in unter einer Minute.
            Keine Kreditkarte erforderlich.
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
