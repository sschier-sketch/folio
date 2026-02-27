import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import FaqSection from "../../components/landing/FaqSection";
import {
  ArrowLeft,
  Euro,
  TrendingUp,
  PieChart,
  FileText,
  Wallet,
  Receipt,
  CheckCircle2,
  Calculator,
  Scale,
  ChevronDown,
  Home,
  FolderOpen,
  CreditCard,
  Calendar,
  ClipboardCheck,
  MessagesSquare,
  BarChart3,
  LayoutDashboard,
  Shield,
  Sparkles,
  Zap,
  Laptop
} from "lucide-react";

const HERO_CHECKS = [
  "Einnahmen & Ausgaben automatisch erfassen",
  "Anlage V direkt aus Ihren Daten erstellen",
  "Restschuld & Darlehen tagesgenau berechnen"
];

const FEATURES = [
  {
    icon: Euro,
    title: "Einnahmen & Ausgaben",
    description: "Erfassen Sie alle Mieteinnahmen und Ausgaben. Automatische Kategorisierung nach steuerrelevanten Konten."
  },
  {
    icon: TrendingUp,
    title: "Cashflow-Analyse",
    description: "Visualisieren Sie den Cashflow je Immobilie oder über Ihr gesamtes Portfolio. Erkennen Sie Trends sofort."
  },
  {
    icon: PieChart,
    title: "Kostenverteilung",
    description: "Sehen Sie auf einen Blick, wie sich Ihre Kosten auf Kategorien wie Instandhaltung, Verwaltung und Steuern verteilen."
  },
  {
    icon: FileText,
    title: "Steuerauswertungen",
    description: "Exportieren Sie steuerrelevante Daten für Ihren Steuerberater. Alle Belege und Buchungen sauber dokumentiert."
  },
  {
    icon: Wallet,
    title: "Darlehensübersicht",
    description: "Behalten Sie Zinsen, Tilgung und Restschuld Ihrer Immobiliendarlehen im Blick."
  },
  {
    icon: Receipt,
    title: "Belegverwaltung",
    description: "Laden Sie Belege und Rechnungen hoch und ordnen Sie diese direkt den passenden Ausgaben zu."
  },
  {
    icon: Calculator,
    title: "Anlage V",
    description: "Erstellen Sie die steuerliche Anlage V direkt aus Ihren erfassten Daten. Einnahmen und Werbungskosten werden automatisch zugeordnet.",
    isNew: true,
  },
  {
    icon: Scale,
    title: "Restschuldberechnung",
    description: "Berechnen Sie die aktuelle Restschuld Ihrer Darlehen tagesgenau. Zinsbindungsende, Sondertilgungen und Anschlussfinanzierung im Blick.",
    isNew: true,
  },
];

const OTHER_FEATURES = [
  {
    icon: Home,
    title: "Immobilienmanagement",
    description: "Verwalten Sie alle Ihre Immobilien und Einheiten digital & sicher.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    icon: CreditCard,
    title: "Mietverwaltung",
    description: "Mietverträge, Zahlungen und Mahnwesen digital verwalten.",
    path: "/funktionen/mietverwaltung",
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description: "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.",
    path: "/funktionen/dokumente",
  },
  {
    icon: MessagesSquare,
    title: "Mieterkommunikation",
    description: "Ihre gesamte Kommunikation zentral gebündelt.",
    path: "/funktionen/kommunikation",
  },
  {
    icon: Calendar,
    title: "Nebenkostenabrechnung",
    description: "Versandfertige Nebenkostenabrechnung in wenigen Minuten.",
    path: "/funktionen/nebenkostenabrechnung",
  },
  {
    icon: ClipboardCheck,
    title: "Übergabeprotokolle",
    description: "Optimale Dokumentation für Ihre nächste Wohnungsübergabe.",
    path: "/funktionen/uebergabeprotokoll",
  },
];

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: "Alles auf einen Blick",
    description: "Einnahmen, Ausgaben und Cashflow Ihres gesamten Portfolios in einem Dashboard."
  },
  {
    icon: TrendingUp,
    title: "Rendite im Blick",
    description: "Verfolgen Sie die finanzielle Performance jeder einzelnen Immobilie über die Zeit."
  },
  {
    icon: Shield,
    title: "Steuerlich vorbereitet",
    description: "Alle Buchungen kategorisiert nach Anlage V. Export für den Steuerberater inklusive."
  },
  {
    icon: Sparkles,
    title: "Einfach bedienbar",
    description: "Intuitive Erfassung von Einnahmen und Ausgaben — keine Buchhaltungskenntnisse nötig."
  },
  {
    icon: Zap,
    title: "Automatisch kategorisiert",
    description: "Mieteinnahmen werden automatisch erfasst. Ausgaben intelligent vorgeschlagen."
  },
  {
    icon: Laptop,
    title: "Flexibel arbeiten",
    description: "Greifen Sie jederzeit und von überall auf Ihre Finanzdaten zu."
  }
];

const MOCK_MONTHS = [
  { m: "Jul", income: 7480, expenses: 2800 },
  { m: "Aug", income: 7480, expenses: 3400 },
  { m: "Sep", income: 7480, expenses: 2100 },
  { m: "Okt", income: 7480, expenses: 4200 },
  { m: "Nov", income: 7480, expenses: 2600 },
  { m: "Dez", income: 7480, expenses: 3140 },
];

function FinanceDashboardMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">Finanzübersicht</h3>
        </div>
        <div className="h-9 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold flex items-center gap-1.5">
          2024
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs font-medium text-emerald-600 mb-1">Mieteinnahmen</p>
          <p className="text-xl font-bold text-gray-900">44.880 €</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs font-medium text-red-500 mb-1">Ausgaben</p>
          <p className="text-xl font-bold text-gray-900">18.240 €</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-medium text-[#3c8af7] mb-1">Cashflow</p>
          <p className="text-xl font-bold text-gray-900">26.640 €</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Einnahmen vs. Ausgaben</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="text-[11px] text-gray-500">Einnahmen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                <span className="text-[11px] text-gray-500">Ausgaben</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 h-20 sm:h-28">
            {MOCK_MONTHS.map((bar) => (
              <div key={bar.m} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: "100%" }}>
                  <div
                    className="flex-1 rounded-t-md bg-emerald-400"
                    style={{ height: `${(bar.income / 7480) * 100}%` }}
                  />
                  <div
                    className="flex-1 rounded-t-md bg-red-400"
                    style={{ height: `${(bar.expenses / 7480) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{bar.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Buchhaltung() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-16 sm:pt-24 pb-[100px] sm:pb-[120px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RefLink
            to="/funktionen"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle Funktionen
          </RefLink>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
                <span className="text-sm font-medium text-[#3c8af7]">
                  Kerntechnologie
                </span>
              </div>
              <h1 className="text-3xl sm:text-[40px] md:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Finanzen im Griff dank{" "}
                <span className="text-[#3c8af7]">smartem Finanzmanagement</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Mieteinnahmen, Ausgaben und Cashflows — alles übersichtlich an einem Ort.
                Mit rentably behalten Sie Ihre Immobilienfinanzen jederzeit im Blick und
                sparen sich den Papierkram.
              </p>
              <ul className="mt-6 space-y-2.5">
                {HERO_CHECKS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3c8af7] flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={goToSignup}
                  className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
                >
                  Jetzt kostenlos starten
                </button>
                <RefLink
                  to="/preise"
                  className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  Preise ansehen
                </RefLink>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100} className="hidden lg:block">
              <FinanceDashboardMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Weniger Stress, mehr Überblick
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Finanzen im Griff
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Einfach, übersichtlich, professionell – mit rentably fühlt sich Ihre
                Immobilienbuchhaltung mühelos an.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className={`bg-white border rounded-xl p-6 hover:shadow-md transition-shadow h-full relative ${feature.isNew ? 'border-[#3c8af7]/30 ring-1 ring-[#3c8af7]/10' : 'border-gray-200'}`}>
                  {feature.isNew && (
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3c8af7]/10 text-[#3c8af7] border border-[#3c8af7]/20">
                      Neue Funktion
                    </span>
                  )}
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

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Praxisbeispiel
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                So behalten Sie Ihre Finanzen im Blick
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-6 sm:p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Portfolio Finanzbericht 2024</h3>
                    <p className="text-white/80 text-sm">Gesamtübersicht aller Immobilien</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Einnahmen
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kaltmiete</span>
                        <span className="font-semibold text-gray-900">36.000,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Nebenkosten</span>
                        <span className="font-semibold text-gray-900">7.200,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Stellplätze</span>
                        <span className="font-semibold text-gray-900">1.680,00 €</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-semibold">Gesamt Einnahmen</span>
                        <span className="font-bold text-emerald-600">44.880,00 €</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Ausgaben
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Instandhaltung</span>
                        <span className="font-semibold text-gray-900">7.840,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Verwaltung</span>
                        <span className="font-semibold text-gray-900">4.200,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Versicherung</span>
                        <span className="font-semibold text-gray-900">3.600,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Grundsteuer</span>
                        <span className="font-semibold text-gray-900">2.600,00 €</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-semibold">Gesamt Ausgaben</span>
                        <span className="font-bold text-red-500">18.240,00 €</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Cashflow Zusammenfassung
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Jahres-Cashflow</p>
                      <p className="text-2xl font-bold text-gray-900">26.640,00 €</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Monatlicher Durchschnitt</p>
                      <p className="text-2xl font-bold text-gray-900">2.220,00 €</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cashflow-Marge</p>
                      <p className="text-2xl font-bold text-emerald-600">59,4 %</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-12 sm:py-[80px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Daten in sicheren Händen
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">
                rentably wird in Deutschland betrieben und erfüllt die Anforderungen der DSGVO.
                Ihre Daten gehören Ihnen &ndash; heute und in Zukunft.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
              <img
                src="/dsvgo-de.png"
                alt="DSGVO-konform"
                className="h-24 sm:h-32 w-auto object-contain"
              />
              <img
                src="/entwickelt-in-deutschland-de.png"
                alt="Entwickelt in Deutschland"
                className="h-24 sm:h-32 w-auto object-contain"
              />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#EEF4FF]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Vorteile
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Darum setzen Vermieter auf rentably
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">
                Wir haben Vermieter und Hausverwalter gefragt, wie rentably ihre Arbeit
                verändert. Die Top-Antworten zeigen klar, welchen Mehrwert unsere Software bietet.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((benefit, i) => (
              <RevealOnScroll key={benefit.title} delay={i * 80} className="h-full">
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm h-full text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: "#E0EDFF", border: "1px solid #C7DCFF" }}
                  >
                    <benefit.icon className="w-6 h-6 text-[#3c8af7]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Testen Sie rentably jetzt kostenlos und unverbindlich.
              </p>
              <button
                onClick={goToSignup}
                className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
              >
                Jetzt kostenlos testen
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Innovativ
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Weitere Funktionen für Vermieter
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                rentably bietet Ihnen umfangreiche Funktionen, die Ihre Immobilienverwaltung
                auf das nächste Level bringen.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((feature, i) => {
              const content = (
                <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
              return (
                <RevealOnScroll key={feature.title} delay={i * 80} className="h-full">
                  {feature.path ? (
                    <RefLink to={feature.path} className="block h-full">
                      {content}
                    </RefLink>
                  ) : (
                    content
                  )}
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      <FaqSection pageSlug="buchhaltung" />

      <section className="py-12 sm:py-[80px] px-6 bg-[#f8fafc]">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Immobilien-Buchhaltung f&uuml;r Vermieter &ndash; Einnahmen, Ausgaben und Cashflow auf einen Blick
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Die finanzielle Seite der Vermietung ist oft die zeitaufw&auml;ndigste: Mieteinnahmen
                verbuchen, Ausgaben kategorisieren, Darlehen im Blick behalten und am Jahresende
                steuerrelevante Auswertungen f&uuml;r den Steuerberater erstellen. Ohne eine zentrale
                L&ouml;sung bedeutet das manuelle Arbeit in Tabellen, verstreute Belege und das Risiko,
                Buchungen zu vergessen oder falsch zuzuordnen.
              </p>
              <p>
                rentably erfasst alle finanziellen Vorg&auml;nge rund um Ihre Immobilien strukturiert
                an einem Ort: Mieteinnahmen werden automatisch aus Ihren Mietvertr&auml;gen generiert,
                Ausgaben lassen sich mit wenigen Klicks erfassen und nach steuerrelevanten Kategorien
                wie Anlage V sortieren. Die Cashflow-Analyse zeigt Ihnen in Echtzeit, wie sich
                jede Immobilie finanziell entwickelt &ndash; &uuml;ber Monate und Jahre hinweg.
              </p>
              <p>
                Dar&uuml;ber hinaus behalten Sie Ihre Immobiliendarlehen mit Zinsen, Tilgung und
                Restschuld im Blick &ndash; inklusive tagesgenauer Restschuldberechnung, die
                Sondertilgungen und Zinsbindungsende ber&uuml;cksichtigt. Die integrierte Anlage V
                erstellt Ihre steuerliche Einnahmen-&Uuml;berschuss-Rechnung direkt aus den erfassten
                Daten: Mieteinnahmen, Werbungskosten und AfA werden automatisch zugeordnet.
                Belege und Rechnungen laden Sie direkt hoch und ordnen diese den passenden Ausgaben
                zu. Am Ende des Jahres exportieren Sie alle steuerrelevanten Daten f&uuml;r Ihren
                Steuerberater &ndash; sauber kategorisiert und l&uuml;ckenlos dokumentiert.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
              Bereit, Ihre Finanzen in den Griff zu bekommen?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Registrieren Sie sich kostenlos und behalten Sie Ihre Immobilienfinanzen
              ab sofort im Blick — ohne Kreditkarte.
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
