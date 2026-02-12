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

const TRUST_BLOCKS = [
  {
    headline: "100 %",
    text: "DSGVO-konforme Verarbeitung aller Daten",
  },
  {
    headline: "Deutschland",
    text: "Hosting auf europäischen Servern mit Standort in Deutschland",
  },
  {
    headline: "Verschlüsselt",
    text: "Sichere Datenübertragung und regelmäßige Backups",
  },
  {
    headline: "Kein Verkauf",
    text: "Keine Weitergabe Ihrer Daten an Dritte — niemals",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-24 pb-32 sm:pt-32 sm:pb-40 px-6">
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

            <div className="hidden lg:block relative">
              <div className="translate-y-6 rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60 overflow-hidden">
                <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 bg-gray-100 rounded" />
                    <div className="h-7 w-24 bg-[#3c8af7]/10 rounded-md" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="h-2 w-12 bg-gray-200 rounded" />
                        <div className="h-5 w-16 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                          <div className="h-2 bg-gray-50 rounded w-1/3" />
                        </div>
                        <div className="h-5 w-14 bg-gray-50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-[100px] px-6 bg-[#f9fafb]">
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

      <section className="py-[110px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Alles, was Sie brauchen
          </h2>
          <p className="text-gray-500 mb-16 max-w-2xl">
            Fünf Bereiche, die Ihre Immobilienverwaltung vollständig abdecken
            &ndash; von der Mietverwaltung bis zur Dokumentenablage.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="border border-gray-200 rounded-xl p-7 pt-0 overflow-hidden hover:bg-[#fafbfc] transition-colors group"
              >
                <div className="h-[3px] bg-[#3c8af7] -mx-7 mb-7 rounded-b-none" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4 text-[15px]">
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

      <section className="py-[100px] px-6 bg-[#f9fafb]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Ihre Daten in sicheren Händen
          </h2>
          <p className="text-gray-500 leading-relaxed mb-14 max-w-2xl">
            Rentably wird in Deutschland betrieben und erfüllt die
            Anforderungen der DSGVO. Ihre Immobiliendaten gehören Ihnen
            &ndash; heute und in Zukunft.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_BLOCKS.map((block) => (
              <div
                key={block.headline}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {block.headline}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {block.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[120px] px-6 bg-gray-950">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
            Bereit, Ihre Verwaltung zu vereinfachen?
          </h2>
          <p className="text-gray-400 mb-10 max-w-lg mx-auto">
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
