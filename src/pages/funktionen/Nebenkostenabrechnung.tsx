import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import FaqSection from "../../components/landing/FaqSection";
import {
  ArrowLeft,
  FileText,
  Calculator,
  Send,
  Receipt,
  Gauge,
  Scale,
  CheckCircle2,
  Home,
  Users,
  FolderOpen,
  MessagesSquare,
  CreditCard,
  Building2,
  LayoutDashboard,
  Shield,
  Sparkles,
  Zap,
  Laptop,
  BarChart3,
  Clock,
  ListChecks,
  Euro,
  Percent,
  ArrowRight,
} from "lucide-react";

const HERO_CHECKS = [
  "Versandfertige Abrechnung in wenigen Minuten",
  "Automatische Verteilerschlüssel-Berechnung",
  "Rechtssicher nach BetrKV",
];

const FEATURES = [
  {
    icon: ListChecks,
    title: "Schritt-für-Schritt Assistent",
    description:
      "Ein geführter Wizard begleitet Sie durch die gesamte Abrechnung. Immobilie, Zeitraum und Mieter auswählen – fertig.",
  },
  {
    icon: Calculator,
    title: "Automatische Umlageschlüssel",
    description:
      "Kosten werden nach Fläche, Personenzahl oder Verbrauch automatisch auf Ihre Mieter umgelegt.",
  },
  {
    icon: Receipt,
    title: "Alle Kostenarten abgedeckt",
    description:
      "Von Heizung über Wasser bis Müllabfuhr. Alle gängigen Betriebskostenarten nach BetrKV sind integriert.",
  },
  {
    icon: FileText,
    title: "PDF-Abrechnung generieren",
    description:
      "Per Klick wird eine professionelle, druckfertige PDF erstellt – inklusive aller Positionen und Nachzahlung oder Guthaben.",
  },
  {
    icon: Send,
    title: "Direkt per E-Mail versenden",
    description:
      "Versenden Sie die fertige Abrechnung direkt aus rentably an Ihre Mieter. Kein Ausdrucken, kein Postweg.",
  },
  {
    icon: Percent,
    title: "§35a Steuerausweis",
    description:
      "Haushaltsnahe Dienstleistungen und Handwerkerleistungen nach §35a EStG werden automatisch auf der Abrechnung ausgewiesen.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Immobilie & Zeitraum wählen",
    description:
      "Wählen Sie die gewünschte Immobilie, Einheit und den Abrechnungszeitraum aus. Mieterdaten werden automatisch zugeordnet.",
  },
  {
    step: "02",
    title: "Kosten erfassen & verteilen",
    description:
      "Tragen Sie die Betriebskosten ein und wählen Sie den passenden Umlageschlüssel. Die Verteilung berechnet rentably automatisch.",
  },
  {
    step: "03",
    title: "Abrechnung versenden",
    description:
      "Prüfen Sie die Vorschau, generieren Sie die PDF und versenden Sie die Abrechnung direkt per E-Mail an Ihren Mieter.",
  },
];

const OTHER_FEATURES = [
  {
    icon: Home,
    title: "Immobilienmanagement",
    description:
      "Verwalten Sie alle Ihre Immobilien und Einheiten digital & sicher.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    icon: Users,
    title: "Mietverwaltung",
    description:
      "Mietverträge, Zahlungen und Erhöhungen effizient verwalten.",
    path: "/funktionen/mietverwaltung",
  },
  {
    icon: BarChart3,
    title: "Finanzmanagement",
    description:
      "Finanzen und Mieteinnahmen jederzeit im Blick behalten.",
    path: "/funktionen/buchhaltung",
  },
  {
    icon: MessagesSquare,
    title: "Mieterkommunikation",
    description: "Ihre gesamte Kommunikation zentral gebündelt.",
    path: "/funktionen/kommunikation",
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description:
      "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.",
    path: "/funktionen/dokumente",
  },
  {
    icon: Building2,
    title: "Übergabeprotokolle",
    description:
      "Optimale Dokumentation für Ihre nächste Wohnungsübergabe.",
    path: "/funktionen/uebergabeprotokoll",
  },
];

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: "Alles auf einen Blick",
    description:
      "Behalte jederzeit den Überblick über alle Abrechnungen, offene Positionen und Fristen.",
  },
  {
    icon: Clock,
    title: "In Minuten erledigt",
    description:
      "Statt stundenlanger Arbeit mit Excel erstellen Sie Ihre Abrechnung in wenigen Minuten.",
  },
  {
    icon: Shield,
    title: "Rechtssicher abrechnen",
    description:
      "Alle Positionen nach BetrKV. §35a-Ausweis und korrekte Umlageschlüssel inklusive.",
  },
  {
    icon: Sparkles,
    title: "Einfach bedienbar",
    description:
      "Ein geführter Assistent nimmt Sie an die Hand – keine Vorkenntnisse nötig.",
  },
  {
    icon: Zap,
    title: "Weniger Fehler",
    description:
      "Automatische Berechnungen eliminieren manuelle Rechenfehler zuverlässig.",
  },
  {
    icon: Laptop,
    title: "Flexibel arbeiten",
    description:
      "Erstellen Sie Ihre Abrechnung jederzeit und von überall – am PC, Tablet oder Smartphone.",
  },
];

const MOCK_COST_ITEMS = [
  {
    name: "Heizkosten",
    total: "4.280,00 €",
    key: "70% Verbrauch / 30% Fläche",
    share: "1.712,00 €",
  },
  {
    name: "Wasser / Abwasser",
    total: "1.560,00 €",
    key: "Personenzahl",
    share: "520,00 €",
  },
  {
    name: "Müllabfuhr",
    total: "840,00 €",
    key: "Wohnfläche",
    share: "280,00 €",
  },
  {
    name: "Grundsteuer",
    total: "1.200,00 €",
    key: "Wohnfläche",
    share: "400,00 €",
  },
  {
    name: "Gebäudeversicherung",
    total: "960,00 €",
    key: "Wohnfläche",
    share: "320,00 €",
  },
  {
    name: "Hausmeister",
    total: "1.800,00 €",
    key: "Wohnfläche",
    share: "600,00 €",
  },
];

function StatementMockup() {
  const totalShare = 3832;
  const prepaid = 3000;
  const nachzahlung = totalShare - prepaid;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center">
            <Receipt className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Nebenkostenabrechnung 2024
            </h3>
            <p className="text-xs text-gray-400">
              Musterstr. 10 &middot; EG links
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-amber-600 bg-amber-50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Entwurf
        </span>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Zeitraum
            </p>
            <p className="text-sm font-semibold text-gray-900">
              01.01. – 31.12.2024
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Mieter
            </p>
            <p className="text-sm font-semibold text-gray-900">Sarah Meyer</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Fläche
            </p>
            <p className="text-sm font-semibold text-gray-900">
              68 m&sup2; von 204 m&sup2;
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1.2fr_1fr] px-6 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span>Kostenart</span>
          <span className="text-right">Gesamt</span>
          <span className="text-right">Schlüssel</span>
          <span className="text-right">Anteil</span>
        </div>

        {MOCK_COST_ITEMS.map((item, i) => (
          <div
            key={item.name}
            className={`hidden sm:grid grid-cols-[1.4fr_1fr_1.2fr_1fr] px-6 py-3.5 items-center ${
              i < MOCK_COST_ITEMS.length - 1
                ? "border-b border-gray-100"
                : ""
            }`}
          >
            <span className="text-sm font-medium text-gray-900">
              {item.name}
            </span>
            <span className="text-sm text-gray-500 text-right">
              {item.total}
            </span>
            <span className="text-xs text-gray-400 text-right">
              {item.key}
            </span>
            <span className="text-sm font-semibold text-gray-900 text-right">
              {item.share}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Gesamtanteil Mieter</span>
          <span className="text-sm font-bold text-gray-900">
            {totalShare.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
            })}{" "}
            &euro;
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Vorauszahlungen</span>
          <span className="text-sm font-semibold text-gray-600">
            &minus;{" "}
            {prepaid.toLocaleString("de-DE", { minimumFractionDigits: 2 })} &euro;
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-900">Nachzahlung</span>
          <span className="text-base font-bold text-red-600">
            {nachzahlung.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
            })}{" "}
            &euro;
          </span>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  isLast,
}: {
  step: string;
  title: string;
  description: string;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[#3c8af7] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
          {step}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[#3c8af7]/20 mt-3" />
        )}
      </div>
      <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Nebenkostenabrechnung() {
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
              <h1 className="text-2xl sm:text-[32px] md:text-[40px] lg:text-[48px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Nebenkosten&shy;abrechnung{" "}
                <br className="hidden sm:block" />
                <span className="text-[#3c8af7]">in Minuten erstellt</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Schluss mit komplizierten Excel-Tabellen und teuren
                Steuerberatern. Mit rentably erstellen Sie rechtssichere
                Nebenkostenabrechnungen in wenigen Minuten &ndash; und
                versenden sie direkt an Ihre Mieter.
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
              <StatementMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Leistungsumfang
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Alles f&uuml;r Ihre Nebenkostenabrechnung
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Von der Kostenerfassung bis zum Versand &ndash; rentably
                begleitet Sie durch den gesamten Abrechnungsprozess.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: "#EEF4FF",
                      border: "1px solid #DDE7FF",
                    }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: "#1E1E24" }}
                      strokeWidth={1.5}
                    />
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
                So funktioniert&apos;s
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                In 3 Schritten zur fertigen Abrechnung
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-20 items-start">
            <RevealOnScroll>
              <div className="space-y-0">
                {STEPS.map((s, i) => (
                  <StepCard
                    key={s.step}
                    step={s.step}
                    title={s.title}
                    description={s.description}
                    isLast={i === STEPS.length - 1}
                  />
                ))}
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Euro className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Beispielabrechnung
                      </h3>
                      <p className="text-white/80 text-sm">
                        Musterstra&szlig;e 10, EG links &middot; 2024
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid sm:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Abrechnungsdaten
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Zeitraum</span>
                          <span className="font-semibold text-gray-900">
                            01.01.&ndash;31.12.2024
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Gesamtkosten
                          </span>
                          <span className="font-semibold text-gray-900">
                            10.640,00 &euro;
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Mieteranteil
                          </span>
                          <span className="font-semibold text-gray-900">
                            3.832,00 &euro;
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">
                            Vorauszahlungen
                          </span>
                          <span className="font-semibold text-gray-900">
                            3.000,00 &euro;
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Ergebnis
                      </h4>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                        <p className="text-sm text-red-600 font-medium mb-1">
                          Nachzahlung f&uuml;r Mieter
                        </p>
                        <p className="text-3xl font-bold text-red-700">
                          832,00 &euro;
                        </p>
                        <p className="text-xs text-red-500 mt-2">
                          F&auml;llig innerhalb von 30 Tagen
                        </p>
                      </div>

                      <div className="mt-4 bg-[#EEF4FF] border border-[#DDE7FF] rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale
                            className="w-4 h-4 text-[#3c8af7]"
                            strokeWidth={1.5}
                          />
                          <span className="text-xs font-semibold text-gray-900">
                            &sect;35a Steuerausweis
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Handwerkerleistungen
                            </span>
                            <span className="font-semibold text-gray-900">
                              420,00 &euro;
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Haushaltsnahe DL
                            </span>
                            <span className="font-semibold text-gray-900">
                              680,00 &euro;
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
                      Kostenverteilung
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          name: "Heizkosten",
                          pct: 45,
                          color: "#ef4444",
                        },
                        {
                          name: "Wasser / Abwasser",
                          pct: 14,
                          color: "#3b82f6",
                        },
                        {
                          name: "Grundsteuer",
                          pct: 10,
                          color: "#f59e0b",
                        },
                        {
                          name: "Hausmeister",
                          pct: 16,
                          color: "#22c55e",
                        },
                        {
                          name: "Sonstige",
                          pct: 15,
                          color: "#8b5cf6",
                        },
                      ].map((item) => (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-gray-600">
                              {item.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {item.pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${item.pct}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-[80px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ihre Daten in sicheren H&auml;nden
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">
                rentably wird in Deutschland betrieben und erf&uuml;llt die
                Anforderungen der DSGVO. Ihre Daten geh&ouml;ren Ihnen
                &ndash; heute und in Zukunft.
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
                Darum erstellen Vermieter ihre Abrechnung mit rentably
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">
                Keine Excel-Tabellen, keine Rechenfehler, kein Stress.
                rentably macht Ihre Nebenkostenabrechnung so einfach wie
                nie.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((benefit, i) => (
              <RevealOnScroll
                key={benefit.title}
                delay={i * 80}
                className="h-full"
              >
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm h-full text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{
                      backgroundColor: "#E0EDFF",
                      border: "1px solid #C7DCFF",
                    }}
                  >
                    <benefit.icon
                      className="w-6 h-6 text-[#3c8af7]"
                      strokeWidth={1.5}
                    />
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
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Weitere Funktionen f&uuml;r Vermieter
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                rentably bietet Ihnen umfangreiche Funktionen, die Ihre
                Immobilienverwaltung auf das n&auml;chste Level bringen.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((feature, i) => {
              const content = (
                <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: "#EEF4FF",
                      border: "1px solid #DDE7FF",
                    }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: "#1E1E24" }}
                      strokeWidth={1.5}
                    />
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
                <RevealOnScroll
                  key={feature.title}
                  delay={i * 80}
                  className="h-full"
                >
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

      <FaqSection pageSlug="nebenkostenabrechnung" />

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
              Bereit f&uuml;r stressfreie Nebenkostenabrechnungen?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Registrieren Sie sich kostenlos und erstellen Sie Ihre erste
              Nebenkostenabrechnung in wenigen Minuten &ndash; ohne
              Kreditkarte.
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
