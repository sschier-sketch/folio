import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import FaqSection from "../../components/landing/FaqSection";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Shield,
  Clock,
  CheckCircle2,
  Users,
  Home,
  Calendar,
  Building2,
  MessagesSquare,
  FolderOpen,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  Zap,
  Laptop
} from "lucide-react";

const HERO_CHECKS = [
  "Mietverträge komplett digital verwalten",
  "Automatische Zahlungsüberwachung",
  "Indexmieterhöhungen automatisch berechnen"
];

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

const OTHER_FEATURES = [
  {
    icon: Home,
    title: "Immobilienmanagement",
    description: "Verwalten Sie alle Ihre Immobilien und Einheiten digital & sicher.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description: "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.",
    path: "/funktionen/dokumente",
  },
  {
    icon: BarChart3,
    title: "Finanzmanagement",
    description: "Finanzen und Mieteinnahmen jederzeit im Blick behalten.",
    path: "/funktionen/buchhaltung",
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
    icon: Building2,
    title: "Übergabeprotokolle",
    description: "Optimale Dokumentation für Ihre nächste Wohnungsübergabe.",
    path: "/funktionen/uebergabeprotokoll",
  },
];

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: "Alles auf einen Blick",
    description: "Behalte jederzeit den Überblick über alle deine Mietverhältnisse, Zahlungen und Verträge."
  },
  {
    icon: FolderOpen,
    title: "Besser organisiert",
    description: "Verwalte deine Verträge, Dokumente und Mieter effizient an einem zentralen Ort."
  },
  {
    icon: Shield,
    title: "Sicher verwalten",
    description: "Vertraue auf maximale Datensicherheit, DSGVO-Konformität und volle Kontrolle."
  },
  {
    icon: Sparkles,
    title: "Einfach bedienbar",
    description: "Intuitive Oberfläche, die Mietverwaltung einfacher und angenehmer macht."
  },
  {
    icon: Zap,
    title: "Weniger Aufwand",
    description: "Automatisiere wiederkehrende Aufgaben und gewinne Zeit für das Wesentliche."
  },
  {
    icon: Laptop,
    title: "Flexibel arbeiten",
    description: "Greife jederzeit und von überall auf deine Mietverwaltung zu."
  }
];

const MOCK_TENANTS = [
  { name: "Sarah Meyer", unit: "Musterstr. 10 · EG", rent: "950,00 €", status: "Aktiv", statusColor: "#22c55e", statusBg: "#f0fdf4" },
  { name: "Thomas Klein", unit: "Musterstr. 10 · 1.OG", rent: "1.120,00 €", status: "Aktiv", statusColor: "#22c55e", statusBg: "#f0fdf4" },
  { name: "Lisa Wagner", unit: "Musterstr. 10 · 2.OG", rent: "890,00 €", status: "Kündigt", statusColor: "#f59e0b", statusBg: "#fffbeb" },
  { name: "Michael Hoffmann", unit: "Musterstr. 10 · DG", rent: "780,00 €", status: "Aktiv", statusColor: "#22c55e", statusBg: "#f0fdf4" },
];

function TenantTableMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">Mieter</h3>
          <span className="text-sm text-gray-400">4 Einträge</span>
        </div>
        <div className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-1.5">
          <span className="text-base leading-none">+</span>
          Neuer Mieter
        </div>
      </div>

      <div className="px-6 pb-4 flex items-center gap-3">
        <div className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <span className="text-sm text-gray-400">Suchen...</span>
        </div>
        <div className="h-10 px-3.5 rounded-lg border border-gray-200 flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
          Alle
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="grid grid-cols-[1.4fr_1.2fr_1fr_0.7fr] px-6 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Name</span>
          <span>Einheit</span>
          <span>Miete</span>
          <span className="text-right">Status</span>
        </div>

        {MOCK_TENANTS.map((t, i) => (
          <div
            key={t.name}
            className={`grid grid-cols-[1.4fr_1.2fr_1fr_0.7fr] px-6 py-4 items-center ${
              i < MOCK_TENANTS.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <span className="text-sm font-semibold text-gray-900">{t.name}</span>
            <span className="text-sm text-gray-500">{t.unit}</span>
            <span className="text-sm font-semibold text-gray-900">{t.rent}</span>
            <div className="flex justify-end">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: t.statusColor, backgroundColor: t.statusBg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.statusColor }} />
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Summe Kaltmiete</span>
        <span className="text-sm font-bold text-gray-900">3.740,00 €/Monat</span>
      </div>
    </div>
  );
}

export default function Mietverwaltung() {
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

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
                <span className="text-sm font-medium text-[#3c8af7]">
                  Kerntechnologie
                </span>
              </div>
              <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Stressfreie Mietverwaltung dank{" "}
                <span className="text-[#3c8af7]">smarter Software</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Jede verspätete Miete, jeder Abrechnungsfehler bringt Unsicherheit.
                Mit rentably können Sie Ihre Mietverwaltung digitalisieren: Mietverhältnisse
                sauber dokumentieren, Zahlungen automatisch erfassen.
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
              <TenantTableMockup />
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
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Mietverwaltung im Griff
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Einfach, übersichtlich, professionell – mit rentably fühlt sich Ihre
                Mietverwaltung mühelos an.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Praxisbeispiel
              </p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                So einfach verwalten Sie Ihre Mietverträge
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Familie Müller</h3>
                    <p className="text-white/80 text-sm">Musterstraße 123, 10115 Berlin</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Vertragsdaten
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Mietbeginn</span>
                        <span className="font-semibold text-gray-900">01.03.2024</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Grundmiete</span>
                        <span className="font-semibold text-gray-900">1.200,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Nebenkosten</span>
                        <span className="font-semibold text-gray-900">250,00 €</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-semibold">Gesamtmiete</span>
                        <span className="font-bold text-gray-900">1.450,00 €</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Kaution & Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kaution</span>
                        <span className="font-semibold text-gray-900">3.600,00 €</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kautionsstatus</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-600" />
                          Vollständig
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Zahlungsstatus</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Pünktlich
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
                      Zahlungshistorie (12 Monate)
                    </h4>
                    <div className="flex items-end gap-1.5 h-32">
                      {[
                        { m: "Mär", v: 1450, paid: true },
                        { m: "Apr", v: 1450, paid: true },
                        { m: "Mai", v: 1450, paid: true },
                        { m: "Jun", v: 1450, paid: true },
                        { m: "Jul", v: 1450, paid: true },
                        { m: "Aug", v: 1200, paid: false },
                        { m: "Sep", v: 1450, paid: true },
                        { m: "Okt", v: 1450, paid: true },
                        { m: "Nov", v: 1450, paid: true },
                        { m: "Dez", v: 1450, paid: true },
                        { m: "Jan", v: 1450, paid: true },
                        { m: "Feb", v: 1450, paid: true },
                      ].map((bar) => (
                        <div key={bar.m} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-gray-500">
                            {(bar.v / 1000).toFixed(1).replace(".", ",")}k
                          </span>
                          <div
                            className={`w-full rounded-md transition-all ${
                              bar.paid ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                            style={{ height: `${(bar.v / 1450) * 100}%` }}
                          />
                          <span className="text-[10px] text-gray-400 font-medium">{bar.m}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-5 mt-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                        <span className="text-xs text-gray-500">Vollständig</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                        <span className="text-xs text-gray-500">Teilzahlung</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Indexmieterhöhung
                      </h4>
                      <span className="text-xs font-medium text-[#3c8af7] bg-[#3c8af7]/10 px-2 py-0.5 rounded-full">
                        Automatisch
                      </span>
                    </div>
                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Vertragsart</span>
                        <span className="font-semibold text-gray-900 text-sm">Indexmiete</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Basisindex</span>
                        <span className="font-semibold text-gray-900 text-sm">118,4 (Mär 2024)</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Aktueller Index</span>
                        <span className="font-semibold text-gray-900 text-sm">122,1 (Feb 2025)</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Veränderung</span>
                        <span className="font-semibold text-emerald-600 text-sm">+3,13 %</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#3c8af7]" />
                        <span className="text-xs font-semibold text-gray-900">Nächste Erhöhung möglich</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">Neue Kaltmiete</span>
                        <span className="text-lg font-bold text-gray-900">1.237,56 €</span>
                      </div>
                      <span className="text-xs text-gray-400">+37,56 € / Monat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-[80px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Daten in sicheren Händen
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">
                rentably wird in Deutschland betrieben und erfüllt die Anforderungen der DSGVO.
                Ihre Daten gehören Ihnen &ndash; heute und in Zukunft.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <img
                src="/dsvgo-de.png"
                alt="DSGVO-konform"
                className="h-32 w-auto object-contain"
              />
              <img
                src="/entwickelt-in-deutschland-de.png"
                alt="Entwickelt in Deutschland"
                className="h-32 w-auto object-contain"
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
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
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
                <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm h-full text-center">
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
                Teste rentably jetzt kostenlos und unverbindlich.
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
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
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

      <FaqSection pageSlug="mietverwaltung" />

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
              Bereit für stressfreie Mietverwaltung?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Registrieren Sie sich kostenlos und verwalten Sie Ihre Mietverhältnisse
              ab sofort digital – ohne Kreditkarte.
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
