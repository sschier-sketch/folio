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
  Play,
  Home,
  Calendar,
  Building2,
  MessagesSquare,
  FolderOpen,
  BarChart3
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

const DETAIL_SECTIONS = [
  {
    title: "Mietverträge anlegen – klar, schnell und fehlerfrei",
    text: "Mit Rentably legst du neue Mietverträge mühelos an und wählst direkt den passenden Mieter für die Einheit aus. Vertragsbeginn, Sollstellung der Miete und alle relevanten Daten erfasst du strukturiert in einem klaren Workflow. So behältst du jederzeit den Überblick und stellst sicher, dass alle Informationen vollständig und korrekt hinterlegt sind."
  },
  {
    title: "Vom Mietpreis bis zur Kaution – alles an einem Ort",
    text: "In Rentably hinterlegst du alle wichtigen Vertragsdaten übersichtlich an einem Ort. Von Kaltmiete über Betriebskosten und Heizkosten bis hin zur Kaution – alles ist klar strukturiert und jederzeit nachvollziehbar. Auch Sonderfälle wie indexbasierte Mietanpassungen lassen sich problemlos abbilden, sodass deine Verträge immer vollständig und rechtssicher sind."
  },
  {
    title: "Alle Mieten im Blick – übersichtlich und aktuell",
    text: "Mit der Mietübersicht in Rentably hast du jederzeit den vollen Überblick über alle Zahlungen. Eingänge werden automatisch verbucht und offene Posten klar hervorgehoben, sodass du keine Miete mehr übersiehst. Auch manuelle Buchungen oder kurzfristige Anpassungen lassen sich schnell erledigen – für maximale Flexibilität bei voller Kontrolle."
  }
];

const SECURITY_ITEMS = [
  {
    title: "Rechenzentrum",
    subtitle: "in Deutschland"
  },
  {
    title: "Datensicherheit",
    subtitle: "DSGVO-Konform"
  },
  {
    title: "AES256-GCM",
    subtitle: "verschlüsselt"
  },
  {
    title: "Regelmäßige",
    subtitle: "Sicherheitsupdates"
  }
];

const OTHER_FEATURES = [
  {
    icon: Home,
    title: "Immobilienmanagement",
    description: "Verwalte alle deine Immobilien und Einheiten digital & sicher."
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description: "Verwalte deine Dokumente einfach & sicher in der Cloud."
  },
  {
    icon: BarChart3,
    title: "Finanzmanagement",
    description: "Finanzen und Mieteinnahmen jederzeit im Blick behalten."
  },
  {
    icon: MessagesSquare,
    title: "Zentrale Kommunikation",
    description: "Deine gesamte Kommunikation zentral gebündelt."
  },
  {
    icon: Calendar,
    title: "Nebenkostenabrechnung",
    description: "Versandfertige Nebenkostenabrechnung in wenigen Minuten."
  },
  {
    icon: Building2,
    title: "Übergabeprotokolle",
    description: "Optimale Dokumentation für deine nächste Wohnungsübergabe."
  }
];

const FAQS = [
  {
    question: "Wie lege ich einen neuen Mietvertrag an?",
    answer: "Du wählst die gewünschte Immobilie und Einheit aus, gibst die Mieterdaten ein und erfasst alle Vertragsdaten wie Mietbeginn, Kaltmiete, Nebenkosten und Kaution. Der Vertrag wird automatisch gespeichert und alle Zahlungen werden ab dem Mietbeginn überwacht."
  },
  {
    question: "Werden Mietzahlungen automatisch erfasst?",
    answer: "Ja, du kannst dein Bankkonto verbinden oder Zahlungen manuell erfassen. Das System ordnet Zahlungen automatisch den jeweiligen Mietverhältnissen zu und zeigt dir offene Posten übersichtlich an."
  },
  {
    question: "Wie funktioniert die automatische Indexmieterhöhung?",
    answer: "Bei Indexmietverträgen überwacht das System den Verbraucherpreisindex automatisch. Sobald die vereinbarte Schwelle erreicht ist, wird die neue Miethöhe berechnet und du erhältst eine Benachrichtigung. Die Berechnung erfolgt transparent und wird vollständig dokumentiert."
  },
  {
    question: "Kann ich Mahnungen automatisch versenden?",
    answer: "Ja, bei Zahlungsverzug kannst du mehrstufige Mahnungen erstellen und versenden. Jede Mahnstufe wird automatisch protokolliert und dem Mietverhältnis zugeordnet, sodass du eine lückenlose Dokumentation hast."
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
                Mit Rentably kannst du deine Mietverwaltung digitalisieren: Mietverhältnisse
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

      <section className="py-20 px-6 bg-[#f8fafc]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Video
              </p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                In wenigen Klicks zum Mietverhältnis
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Vergiss komplizierte Formulare und verstreute Dokumente. Mit Rentably
                werden Kaltmiete, Betriebskosten und Nebenkosten sauber erfasst.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto">
              <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer">
                    <Play className="w-7 h-7 text-[#3c8af7] ml-1" fill="currentColor" />
                  </div>
                </div>
                <img
                  src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920"
                  alt="Mietverwaltung Demo"
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                Schau dir an, wie schnell du starten kannst – und erlebe Immobilienverwaltung ohne Chaos.
              </p>
            </div>
          </RevealOnScroll>
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
                Deine Mietverwaltung im Griff
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Einfach, übersichtlich, professionell – mit Rentably fühlt sich deine
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

          <div className="space-y-20">
            {DETAIL_SECTIONS.map((section, i) => (
              <RevealOnScroll key={section.title} delay={i * 100}>
                <div className="max-w-[800px] mx-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {section.text}
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
                Sicherheit
              </p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Ein sicheres Zuhause für deine Daten
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Alle deine Daten werden sicher in zertifizierten Rechenzentren in Deutschland
                verwaltet. Es findet kein Datentransfer ins Ausland statt.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_ITEMS.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 80}>
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-[#22c55e]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.subtitle}
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
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">
                Innovativ
              </p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Weitere Funktionen für Vermieter
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Rentably bietet dir umfangreiche Funktionen, die deine Immobilienverwaltung
                auf das nächste Level bringen.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
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
              Registriere dich kostenlos und verwalte deine Mietverhältnisse
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
