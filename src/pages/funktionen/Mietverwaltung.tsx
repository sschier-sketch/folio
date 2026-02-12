import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Shield,
  Clock,
  CheckCircle2,
  Users
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Digitale Mietverträge",
    description: "Alle Vertragsdaten zentral erfasst. Laufzeiten, Fristen und Sonderklauseln automatisch überwacht."
  },
  {
    icon: CreditCard,
    title: "Automatische Zahlungsverfolgung",
    description: "Soll-Ist-Abgleich erfolgt automatisch. Offene Posten und Zahlungsverzug sofort erkennbar."
  },
  {
    icon: TrendingUp,
    title: "Indexbasierte Mieterhöhungen",
    description: "Verbraucherpreisindex wird überwacht. Erhöhungen werden automatisch berechnet und dokumentiert."
  },
  {
    icon: AlertCircle,
    title: "Mehrstufiges Mahnwesen",
    description: "Bei Zahlungsverzug automatische Erinnerungen. Jede Mahnstufe wird lückenlos protokolliert."
  },
  {
    icon: Shield,
    title: "Kautionsverwaltung",
    description: "Vollständige Historie aller Kautionszahlungen. Rückzahlungen und Verrechnungen dokumentiert."
  },
  {
    icon: Clock,
    title: "Teilzahlungen erfassen",
    description: "Teilbeträge werden erfasst und offene Salden nachverfolgt. Übersicht über alle Zahlungsvorgänge."
  }
];

const BENEFITS = [
  {
    number: "01",
    title: "Verträge im Griff",
    text: "Alle relevanten Vertragsdaten an einem Ort. Das System erinnert rechtzeitig an Fristen und Kündigungsfristen."
  },
  {
    number: "02",
    title: "Zahlungen überwachen",
    text: "Monatlich automatische Prüfung der Mieteingänge. Offene Posten werden sofort sichtbar markiert."
  },
  {
    number: "03",
    title: "Rechtssicher erhöhen",
    text: "Indexmietverträge automatisch überwacht. Erhöhungen werden berechnet und revisionssicher dokumentiert."
  }
];

const STATS = [
  { value: "5 → 1h", label: "Zeitaufwand pro Monat" },
  { value: "100%", label: "Automatische Überwachung" },
  { value: "0", label: "Vergessene Fristen" }
];

function ContractMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/[0.06] overflow-hidden">
      <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
          >
            <Users className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
          </div>
          <div>
            <div className="h-4 w-40 bg-gray-900 rounded mb-1.5 font-semibold text-xs flex items-center px-2">
              Max Mustermann
            </div>
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="space-y-3 mb-5">
          {[
            { label: "Mietbeginn", value: "01.01.2024" },
            { label: "Grundmiete", value: "1.200,00 €" },
            { label: "Kaution", value: "3.600,00 €" }
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs text-gray-400 mb-2">Zahlungsstatus</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-full bg-[#22c55e] rounded-full" />
            </div>
            <span className="text-xs font-medium text-[#22c55e]">12/12</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="text-sm font-medium text-[#3c8af7]">
                  Kerntechnologie
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                Mietverwaltung, die mitdenkt
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed">
                Verträge, Zahlungen und Mietanpassungen in einem System.
                Automatisiert, übersichtlich und immer aktuell.
              </p>
              <button
                onClick={goToSignup}
                className="mt-8 h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
              >
                Jetzt kostenlos starten
              </button>
            </RevealOnScroll>

            <RevealOnScroll delay={100} className="hidden lg:block">
              <ContractMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#f8fafc]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 text-center">
              Alles für die professionelle Mietverwaltung
            </h2>
            <p className="text-gray-500 text-center max-w-[600px] mx-auto mb-16">
              Von der Vertragsverwaltung bis zur automatischen Zahlungsüberwachung —
              alle Werkzeuge in einer Plattform.
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-16 text-center">
              So funktioniert's
            </h2>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, i) => (
              <RevealOnScroll key={benefit.number} delay={i * 80}>
                <div className="relative">
                  <div className="text-5xl font-bold text-[#3c8af7]/10 mb-4">
                    {benefit.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {benefit.text}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#f0f5ff]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Praxisbeispiel
              </p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Von 5 Stunden auf unter 1 Stunde
              </h2>
              <p className="text-lg text-gray-600 max-w-[700px] mx-auto">
                Eine Vermieterin mit 14 Wohneinheiten an drei Standorten reduzierte
                ihren monatlichen Verwaltungsaufwand um 80%.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {STATS.map((stat, i) => (
              <RevealOnScroll key={stat.label} delay={i * 80}>
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-[#3c8af7] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll delay={240}>
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Vorher: Manuelle Verwaltung
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Zahlungseingänge wurden manuell in Tabellen erfasst. Mahnungen gingen
                    verspätet raus, weil offene Beträge erst beim Monatsabschluss auffielen.
                    Indexmieterhöhungen wurden teilweise vergessen.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#3c8af7]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#3c8af7]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Nachher: Automatisierte Abläufe
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Monatliche Zahlungsübersichten werden automatisch generiert. Offene Posten
                    am Tag nach Fälligkeit markiert. Mahnungen mit zwei Klicks versendet.
                    Indexprüfung läuft im Hintergrund.
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
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
        </RevealOnScroll>
      </section>
    </div>
  );
}
