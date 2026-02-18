import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import {
  ArrowLeft,
  Building2,
  Layers,
  MapPin,
  Camera,
  Wrench,
  Users as UsersIcon,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  MessagesSquare,
  CreditCard,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  Shield,
  Sparkles,
  Zap,
  Laptop,
  BarChart3,
  Home,
  TrendingUp,
  Gauge,
} from "lucide-react";

const HERO_CHECKS = [
  "Unbegrenzt Immobilien & Einheiten verwalten",
  "Alle Objektdaten zentral an einem Ort",
  "Wertentwicklung & Kennzahlen im Blick",
];

const FEATURES = [
  {
    icon: Building2,
    title: "Multi-Objekt-Verwaltung",
    description:
      "Verwalten Sie beliebig viele Immobilien in einem Portfolio. Einzelwohnungen, Mehrfamilienhäuser oder gemischte Bestände.",
  },
  {
    icon: Layers,
    title: "Einheiten & Stellplätze",
    description:
      "Jede Immobilie mit individuellen Einheiten, Stellplätzen und Sondernutzungsrechten. Flächen und Ausstattung detailliert erfasst.",
  },
  {
    icon: Gauge,
    title: "Kennzahlen & Rendite",
    description:
      "Mieteinnahmen, Leerstand, Rendite und Cashflow je Objekt. Alle wichtigen Kennzahlen auf einen Blick.",
  },
  {
    icon: Camera,
    title: "Fotodokumentation",
    description:
      "Laden Sie Fotos zu jeder Immobilie und Einheit hoch. Dokumentieren Sie Zustand und Ausstattung visuell.",
  },
  {
    icon: Wrench,
    title: "Ausstattungsmerkmale",
    description:
      "Erfassen Sie Baujahr, Heizungsart, Energieausweis, Bodenbeläge und weitere Details systematisch.",
  },
  {
    icon: UsersIcon,
    title: "Kontakte & Dienstleister",
    description:
      "Verknüpfen Sie Hausverwaltungen, Handwerker und andere Ansprechpartner direkt mit Ihren Immobilien.",
  },
];

const OTHER_FEATURES = [
  { icon: CreditCard, title: "Mietverwaltung", description: "Mietverträge, Zahlungen und Erhöhungen effizient verwalten.", path: "/funktionen/mietverwaltung" },
  { icon: FolderOpen, title: "Dokumentenmanagement", description: "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.", path: "/funktionen/dokumente" },
  { icon: BarChart3, title: "Finanzmanagement", description: "Finanzen und Mieteinnahmen jederzeit im Blick behalten.", path: "/funktionen/buchhaltung" },
  { icon: MessagesSquare, title: "Mieterkommunikation", description: "Ihre gesamte Kommunikation zentral gebündelt.", path: "/funktionen/kommunikation" },
  { icon: Calendar, title: "Nebenkostenabrechnung", description: "Versandfertige Nebenkostenabrechnung in wenigen Minuten.", path: "/funktionen/nebenkostenabrechnung" },
  { icon: ClipboardCheck, title: "Übergabeprotokolle", description: "Optimale Dokumentation für Ihre nächste Wohnungsübergabe.", path: "/funktionen/uebergabeprotokoll" },
];

const FAQS = [
  { question: "Wie viele Immobilien kann ich verwalten?", answer: "Unbegrenzt viele. Es gibt keine Beschränkung bei der Anzahl der Immobilien, Einheiten oder Stellplätze — weder im Basic- noch im Pro-Tarif." },
  { question: "Kann ich verschiedene Immobilientypen verwalten?", answer: "Ja. Sie können Mietobjekte, Eigentumswohnungen (WEG) und gemischt genutzte Immobilien verwalten. Für jede Einheit legen Sie individuell fest, ob es sich um eine Miet- oder Eigentumseinheit handelt." },
  { question: "Werden Wertentwicklungen automatisch erfasst?", answer: "Sie können Marktwerte manuell hinterlegen und über die Zeit dokumentieren. Die Werthistorie wird automatisch aufgezeichnet und lässt sich als Diagramm anzeigen." },
  { question: "Kann ich Fotos zu meinen Immobilien hochladen?", answer: "Ja. Zu jeder Immobilie und Einheit können Sie beliebig viele Fotos hochladen. So dokumentieren Sie den Zustand Ihrer Objekte visuell und übersichtlich." },
];

const BENEFITS = [
  { icon: LayoutDashboard, title: "Alles auf einen Blick", description: "Behalten Sie Ihr gesamtes Portfolio mit allen Einheiten, Mietern und Kennzahlen im Überblick." },
  { icon: TrendingUp, title: "Wertentwicklung verfolgen", description: "Dokumentieren Sie Marktwerte und verfolgen Sie die Entwicklung Ihres Portfolios über die Zeit." },
  { icon: Shield, title: "Sicher verwalten", description: "Vertrauen Sie auf maximale Datensicherheit, DSGVO-Konformität und volle Kontrolle." },
  { icon: Sparkles, title: "Einfach bedienbar", description: "Intuitive Oberfläche, die Immobilienverwaltung einfacher und angenehmer macht." },
  { icon: Zap, title: "Weniger Aufwand", description: "Alle Objektdaten zentral gepflegt. Keine doppelte Dateneingabe mehr." },
  { icon: Laptop, title: "Flexibel arbeiten", description: "Greifen Sie jederzeit und von überall auf Ihre Immobiliendaten zu." },
];

const MOCK_PROPERTIES = [
  { name: "Musterstraße 10", city: "10115 Berlin", units: 4, occupancy: "100%", income: "3.740,00 €", type: "Mehrfamilienhaus", occColor: "#22c55e", occBg: "#f0fdf4" },
  { name: "Hauptstraße 25", city: "80331 München", units: 6, occupancy: "83%", income: "5.890,00 €", type: "Mehrfamilienhaus", occColor: "#f59e0b", occBg: "#fffbeb" },
  { name: "Lindenallee 3", city: "20095 Hamburg", units: 1, occupancy: "100%", income: "1.350,00 €", type: "Eigentumswohnung", occColor: "#22c55e", occBg: "#f0fdf4" },
];

function PropertyTableMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">Immobilien</h3>
          <span className="text-sm text-gray-400">3 Objekte</span>
        </div>
        <div className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-1.5">
          <span className="text-base leading-none">+</span>
          Neue Immobilie
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="grid grid-cols-[1.5fr_0.6fr_0.7fr_1fr_0.8fr] px-6 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Objekt</span>
          <span className="text-center">Einheiten</span>
          <span className="text-center">Auslastung</span>
          <span className="text-right">Mieteinnahmen</span>
          <span className="text-right">Typ</span>
        </div>
        {MOCK_PROPERTIES.map((p, i) => (
          <div key={p.name} className={`grid grid-cols-[1.5fr_0.6fr_0.7fr_1fr_0.8fr] px-6 py-4 items-center ${i < MOCK_PROPERTIES.length - 1 ? "border-b border-gray-100" : ""}`}>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">{p.name}</span>
              <span className="text-xs text-gray-400">{p.city}</span>
            </div>
            <span className="text-sm text-gray-600 text-center">{p.units}</span>
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: p.occColor, backgroundColor: p.occBg }}>{p.occupancy}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 text-right">{p.income}</span>
            <span className="text-xs text-gray-400 text-right">{p.type}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Gesamt-Mieteinnahmen</span>
        <span className="text-sm font-bold text-gray-900">10.980,00 €/Monat</span>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="text-base font-medium text-gray-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[400px] pb-5" : "max-h-0"}`}>
        <p className="text-gray-500 leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
}

export default function Immobilienmanagement() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-16 sm:pt-24 pb-[100px] sm:pb-[120px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <RefLink to="/funktionen" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Alle Funktionen
          </RefLink>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
                <span className="text-sm font-medium text-[#3c8af7]">Kerntechnologie</span>
              </div>
              <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Ihr gesamtes Portfolio{" "}
                <span className="text-[#3c8af7]">digital verwaltet</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Behalten Sie den Überblick über alle Ihre Immobilien, Einheiten und Stellplätze.
                Kennzahlen, Ausstattung und Kontakte &ndash; alles zentral an einem Ort.
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
                <button onClick={goToSignup} className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors">
                  Jetzt kostenlos starten
                </button>
                <RefLink to="/preise" className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors">
                  Preise ansehen
                </RefLink>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100} className="hidden lg:block">
              <PropertyTableMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Leistungsumfang</p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Professionelle Immobilienverwaltung
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Vom Einzelobjekt bis zum großen Portfolio &ndash; rentably passt sich Ihren Anforderungen an.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 80}>
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow h-full">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}>
                    <feature.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
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
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Praxisbeispiel</p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                So verwalten Sie Ihre Immobilien mit rentably
              </h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Musterstraße 10</h3>
                    <p className="text-white/80 text-sm">10115 Berlin &middot; Mehrfamilienhaus</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Objektdaten</h4>
                    <div className="space-y-3">
                      {[
                        ["Baujahr", "1998"],
                        ["Gesamtfläche", "320 m²"],
                        ["Einheiten", "4 Wohnungen + 2 Stellplätze"],
                        ["Heizungsart", "Gaszentralheizung"],
                      ].map(([label, value], idx) => (
                        <div key={label} className={`flex justify-between py-2 ${idx < 3 ? "border-b border-gray-100" : ""}`}>
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Kennzahlen</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Mieteinnahmen</span>
                        <span className="font-semibold text-gray-900">3.740 € / Monat</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Auslastung</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-600" />100%
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kaufpreis</span>
                        <span className="font-semibold text-gray-900">520.000 €</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Bruttorendite</span>
                        <span className="font-semibold text-emerald-600">8,63 %</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Einheiten im Überblick</h4>
                  <div className="space-y-3">
                    {[
                      { unit: "EG links", tenant: "Sarah Meyer", size: "68 m²", rent: "950 €" },
                      { unit: "EG rechts", tenant: "Thomas Klein", size: "72 m²", rent: "1.020 €" },
                      { unit: "1. OG links", tenant: "Lisa Wagner", size: "65 m²", rent: "890 €" },
                      { unit: "1. OG rechts", tenant: "Michael Hoffmann", size: "62 m²", rent: "880 €" },
                    ].map((u) => (
                      <div key={u.unit} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center">
                            <MapPin className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{u.unit}</span>
                            <span className="text-xs text-gray-400 ml-2">{u.size}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">{u.tenant}</span>
                          <span className="text-sm font-semibold text-gray-900 ml-4">{u.rent}</span>
                        </div>
                      </div>
                    ))}
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
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">Ihre Daten in sicheren Händen</h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">rentably wird in Deutschland betrieben und erfüllt die Anforderungen der DSGVO. Ihre Daten gehören Ihnen &ndash; heute und in Zukunft.</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <img src="/dsvgo.png" alt="DSGVO-konform" className="h-32 w-auto object-contain" />
              <img src="/entwickelt-in-deutschland.png" alt="Entwickelt in Deutschland" className="h-32 w-auto object-contain" />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#EEF4FF]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Vorteile</p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">Darum verwalten Eigentümer mit rentably</h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">Ob ein Objekt oder hundert Einheiten &ndash; rentably gibt Ihnen den Überblick und die Werkzeuge für professionelle Immobilienverwaltung.</p>
            </div>
          </RevealOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((b, i) => (
              <RevealOnScroll key={b.title} delay={i * 80} className="h-full">
                <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm h-full text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#E0EDFF", border: "1px solid #C7DCFF" }}>
                    <b.icon className="w-6 h-6 text-[#3c8af7]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <RevealOnScroll>
            <div className="text-center">
              <p className="text-gray-600 mb-6">Teste rentably jetzt kostenlos und unverbindlich.</p>
              <button onClick={goToSignup} className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors">Jetzt kostenlos testen</button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Innovativ</p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">Weitere Funktionen für Vermieter</h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">rentably bietet Ihnen umfangreiche Funktionen, die Ihre Immobilienverwaltung auf das nächste Level bringen.</p>
            </div>
          </RevealOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OTHER_FEATURES.map((f, i) => (
              <RevealOnScroll key={f.title} delay={i * 80} className="h-full">
                <RefLink to={f.path} className="block h-full">
                  <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}>
                      <f.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </RefLink>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[100px] px-6">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 text-center">Häufig gestellte Fragen</h2>
            <p className="text-gray-500 leading-relaxed mb-12 text-center max-w-[560px] mx-auto">Alles Wichtige über das Immobilienmanagement mit rentably auf einen Blick.</p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="bg-white border border-gray-200 rounded-2xl px-8">
              {FAQS.map((faq) => <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />)}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight mb-4">Bereit, Ihre Immobilien digital zu verwalten?</h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">Registrieren Sie sich kostenlos und verwalten Sie Ihr gesamtes Portfolio ab sofort digital &ndash; ohne Kreditkarte.</p>
            <button onClick={goToSignup} className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors">Jetzt kostenlos starten</button>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
