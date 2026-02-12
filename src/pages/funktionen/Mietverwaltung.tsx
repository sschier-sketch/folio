import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { ArrowLeft } from "lucide-react";

const BULLETS = [
  "Mietverträge digital anlegen, bearbeiten und archivieren",
  "Automatische Zahlungsverfolgung mit Soll-Ist-Abgleich",
  "Indexbasierte Mieterhöhungen berechnen und dokumentieren",
  "Mehrstufiges Mahnwesen bei Zahlungsverzug",
  "Kautionsverwaltung mit vollständiger Historie",
  "Teilzahlungen erfassen und offene Beträge nachverfolgen",
];

const DETAILS = [
  {
    title: "Mietverträge und Laufzeiten im Griff",
    paragraphs: [
      "Erfassen Sie alle relevanten Vertragsdaten an einem Ort: Laufzeit, Kündigungsfristen, Mietbeginn, Staffelvereinbarungen und Sonderklauseln. Das System erinnert Sie rechtzeitig an anstehende Fristen, bevor sie verstreichen.",
      "Ob befristeter oder unbefristeter Vertrag, Gewerbe- oder Wohnmietvertrag -- jedes Mietverhältnis wird vollständig abgebildet. Vertragsdokumente lassen sich direkt hinterlegen und sind jederzeit abrufbar.",
    ],
  },
  {
    title: "Zahlungen automatisch verfolgen",
    paragraphs: [
      "Jeden Monat wird automatisch geprüft, ob die Miete eingegangen ist. Fehlende Zahlungen, Teilzahlungen und Überzahlungen werden sofort sichtbar. Sie behalten den Überblick, ohne manuell Kontoauszüge abgleichen zu müssen.",
      "Über die integrierte Mahnfunktion versenden Sie bei Verzug mehrstufige Zahlungserinnerungen. Jede Mahnstufe wird dokumentiert, sodass Sie im Ernstfall eine lückenlose Chronologie vorweisen können.",
      "Offene Salden werden pro Mieter und pro Objekt zusammengefasst. So erkennen Sie auf einen Blick, wo Handlungsbedarf besteht.",
    ],
  },
  {
    title: "Mieterhöhungen rechtssicher umsetzen",
    paragraphs: [
      "Indexmietverträge werden automatisch überwacht. Sobald der Verbraucherpreisindex die vereinbarte Schwelle überschreitet, berechnet das System die neue Miethöhe und erstellt eine Vorlage für das Erhöhungsschreiben.",
      "Die vollständige Berechnung -- inklusive Referenzindex, prozentualem Anstieg und neuem Mietbetrag -- wird protokolliert und dem Mietverhältnis zugeordnet. So dokumentieren Sie jede Anpassung nachvollziehbar und revisionssicher.",
    ],
  },
];

const CASE_STUDY = {
  title: "Anwendungsbeispiel",
  lead: "Eine Vermieterin mit 14 Wohneinheiten an drei Standorten.",
  body: "Vor der Umstellung auf digitale Mietverwaltung wurden Zahlungseingänge manuell in einer Tabelle erfasst. Mahnungen gingen verspätet raus, weil offene Beträge erst beim Monatsabschluss auffielen. Indexmieterhöhungen wurden teilweise vergessen, weil die Schwellenwerte nicht regelmäßig geprüft wurden. Nach der Einführung von Rentably generiert das System monatliche Zahlungsübersichten automatisch. Offene Posten werden am Tag nach Fälligkeit markiert. Mahnungen lassen sich mit zwei Klicks versenden. Die Indexprüfung läuft im Hintergrund und meldet sich, sobald eine Anpassung möglich ist. Der monatliche Zeitaufwand für die Mietverwaltung sank von rund fünf Stunden auf unter eine Stunde.",
};

export default function Mietverwaltung() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-24 pb-20 sm:pt-32 sm:pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RefLink
            to="/funktionen"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle Funktionen
          </RefLink>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Mietverwaltung
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl leading-relaxed">
            Verträge, Zahlungen und Mietanpassungen in einem System.
            Automatisiert, übersichtlich und immer aktuell.
          </p>
          <button
            onClick={goToSignup}
            className="mt-8 h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
          >
            Jetzt kostenlos starten
          </button>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">
            Was die Mietverwaltung kann
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-5">
            {BULLETS.map((bullet) => (
              <div
                key={bullet}
                className="flex items-baseline gap-3 text-gray-600"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7] flex-shrink-0 translate-y-[1px]" />
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </section>

      {DETAILS.map((block, index) => {
        const isOdd = index % 2 !== 0;
        return (
          <section
            key={block.title}
            className={`py-20 px-6 ${isOdd ? "bg-gray-50" : "bg-white"}`}
          >
            <div className="max-w-[1200px] mx-auto">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-5">
                  {block.title}
                </h3>
                <div className="space-y-4">
                  {block.paragraphs.map((p, i) => (
                    <p key={i} className="text-gray-600 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
              {CASE_STUDY.title}
            </p>
            <p className="text-xl font-bold text-gray-900 mb-5">
              {CASE_STUDY.lead}
            </p>
            <p className="text-gray-600 leading-relaxed">{CASE_STUDY.body}</p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Mietverwaltung ohne Aufwand
          </h2>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto">
            Registrieren Sie sich kostenlos und verwalten Sie Ihre
            Mietverhältnisse ab sofort digital.
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
