import { useState } from "react";
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
  Users,
  ChevronDown,
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
    description: "Verwalten Sie alle Ihre Immobilien und Einheiten digital & sicher."
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description: "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud."
  },
  {
    icon: BarChart3,
    title: "Finanzmanagement",
    description: "Finanzen und Mieteinnahmen jederzeit im Blick behalten."
  },
  {
    icon: MessagesSquare,
    title: "Zentrale Kommunikation",
    description: "Ihre gesamte Kommunikation zentral gebündelt."
  },
  {
    icon: Calendar,
    title: "Nebenkostenabrechnung",
    description: "Versandfertige Nebenkostenabrechnung in wenigen Minuten."
  },
  {
    icon: Building2,
    title: "Übergabeprotokolle",
    description: "Optimale Dokumentation für Ihre nächste Wohnungsübergabe."
  }
];

const FAQS = [
  {
    question: "Wie lege ich einen neuen Mietvertrag an?",
    answer: "Sie wählen die gewünschte Immobilie und Einheit aus, geben die Mieterdaten ein und erfassen alle Vertragsdaten wie Mietbeginn, Kaltmiete, Nebenkosten und Kaution. Der Vertrag wird automatisch gespeichert und alle Zahlungen werden ab dem Mietbeginn überwacht."
  },
  {
    question: "Werden Mietzahlungen automatisch erfasst?",
    answer: "Ja, Sie können Ihr Bankkonto verbinden oder Zahlungen manuell erfassen. Das System ordnet Zahlungen automatisch den jeweiligen Mietverhältnissen zu und zeigt Ihnen offene Posten übersichtlich an."
  },
  {
    question: "Wie funktioniert die automatische Indexmieterhöhung?",
    answer: "Bei Indexmietverträgen überwacht das System den Verbraucherpreisindex automatisch. Sobald die vereinbarte Schwelle erreicht ist, wird die neue Miethöhe berechnet und Sie erhalten eine Benachrichtigung. Die Berechnung erfolgt transparent und wird vollständig dokumentiert."
  },
  {
    question: "Kann ich Mahnungen automatisch versenden?",
    answer: "Ja, bei Zahlungsverzug können Sie mehrstufige Mahnungen erstellen und versenden. Jede Mahnstufe wird automatisch protokolliert und dem Mietverhältnis zugeordnet, sodass Sie eine lückenlose Dokumentation haben."
  }
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

function ContractMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
        <div className="ml-4 h-5 w-48 bg-gray-100 rounded-md" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
          >
            <Users className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-[#3c8af7] transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-8">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-5 text-gray-600 leading-relaxed">
          {answer}
        </div>
      )}
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
                Mit Rentably können Sie Ihre Mietverwaltung digitalisieren: Mietverhältnisse
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
              <ContractMockup />
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
                Einfach, übersichtlich, professionell – mit Rentably fühlt sich Ihre
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

                <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Zahlungshistorie (letzte 12 Monate)
                  </h4>
                  <div className="flex items-end gap-2 h-24">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-green-500 rounded-t" style={{ height: `${85 + Math.random() * 15}%` }} />
                        <span className="text-xs text-gray-400">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Alle Zahlungen wurden pünktlich und vollständig geleistet
                  </p>
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
                Rentably wird in Deutschland betrieben und erfüllt die Anforderungen der DSGVO.
                Ihre Daten gehören Ihnen &ndash; heute und in Zukunft.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <img
                src="/dsgvo.png"
                alt="DSGVO-konform"
                className="h-32 w-auto object-contain"
              />
              <img
                src="/madeingermany.png"
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
                Darum setzen Vermieter auf Rentably
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">
                Wir haben Vermieter und Hausverwalter gefragt, wie Rentably ihre Arbeit
                veraendert. Die Top-Antworten zeigen klar, welchen Mehrwert unsere Software bietet.
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
                Teste Rentably jetzt kostenlos und unverbindlich.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={goToSignup}
                  className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
                >
                  Jetzt kostenlos testen
                </button>
                <RefLink
                  to="/preise"
                  className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  Tarif finden
                </RefLink>
              </div>
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
                Rentably bietet Ihnen umfangreiche Funktionen, die Ihre Immobilienverwaltung
                auf das nächste Level bringen.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80} className="h-full">
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
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#f8fafc]">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                FAQ
              </p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Häufig gestellte Fragen
              </h2>
              <p className="text-gray-500">
                Alles, was du über die Mietverwaltung wissen musst
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {FAQS.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

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
