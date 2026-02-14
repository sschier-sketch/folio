import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import {
  ArrowLeft,
  Upload,
  FolderTree,
  Search,
  Share2,
  Building2,
  Lock,
  CheckCircle2,
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
  "Alle Dokumente sicher in der Cloud",
  "Automatische Zuordnung zu Immobilien & Mietern",
  "Dokumente direkt mit Mietern teilen"
];

const FEATURES = [
  {
    icon: Upload,
    title: "Cloud-Upload",
    description: "Laden Sie Dokumente per Drag & Drop hoch. PDF, Bilder und Office-Formate werden unterstützt."
  },
  {
    icon: FolderTree,
    title: "Intelligente Kategorien",
    description: "Dokumente werden automatisch kategorisiert: Verträge, Abrechnungen, Protokolle, Versicherungen und mehr."
  },
  {
    icon: Search,
    title: "Schnelles Finden",
    description: "Durchsuchen Sie alle Dokumente nach Name, Kategorie oder zugeordneter Immobilie. Finden Sie jedes Dokument in Sekunden."
  },
  {
    icon: Share2,
    title: "Mit Mietern teilen",
    description: "Teilen Sie Dokumente direkt über das Mieterportal. Ihre Mieter können freigegebene Dokumente jederzeit einsehen."
  },
  {
    icon: Building2,
    title: "Objektzuordnung",
    description: "Ordnen Sie Dokumente Immobilien, Einheiten oder Mietern zu. So finden Sie alles im richtigen Kontext."
  },
  {
    icon: Lock,
    title: "Sichere Speicherung",
    description: "Alle Dokumente werden verschlüsselt auf europäischen Servern gespeichert. DSGVO-konform und jederzeit verfügbar."
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
    icon: CreditCard,
    title: "Mietverwaltung",
    description: "Mietverträge, Zahlungen und Mahnwesen digital verwalten.",
    path: "/funktionen/mietverwaltung",
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
    icon: ClipboardCheck,
    title: "Übergabeprotokolle",
    description: "Optimale Dokumentation für Ihre nächste Wohnungsübergabe.",
    path: "/funktionen/uebergabeprotokoll",
  },
];

const FAQS = [
  {
    question: "Welche Dateiformate werden unterstützt?",
    answer: "Sie können PDF, JPG, PNG, Word und Excel-Dateien hochladen. Die maximale Dateigröße beträgt 10 MB pro Dokument."
  },
  {
    question: "Wie werden meine Dokumente geschützt?",
    answer: "Alle Dokumente werden verschlüsselt auf europäischen Servern in Deutschland gespeichert. Der Zugriff ist nur über Ihr persönliches Konto möglich. rentably ist vollständig DSGVO-konform."
  },
  {
    question: "Kann ich Dokumente mit Mietern teilen?",
    answer: "Ja. Sie können einzelne Dokumente oder ganze Kategorien über das Mieterportal freigeben. Ihre Mieter können freigegebene Dokumente einsehen und herunterladen."
  },
  {
    question: "Gibt es eine Suchfunktion?",
    answer: "Ja. Sie können Dokumente nach Name, Kategorie, Immobilie oder Mieter durchsuchen. Dank der automatischen Kategorisierung finden Sie jedes Dokument in Sekunden."
  }
];

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: "Alles auf einen Blick",
    description: "Alle Dokumente übersichtlich nach Immobilien und Kategorien sortiert."
  },
  {
    icon: Search,
    title: "Sofort finden",
    description: "Intelligente Suche und automatische Kategorisierung sparen Ihnen wertvolle Zeit."
  },
  {
    icon: Shield,
    title: "Sicher archiviert",
    description: "Verschlüsselte Speicherung auf deutschen Servern. DSGVO-konform."
  },
  {
    icon: Sparkles,
    title: "Einfach bedienbar",
    description: "Drag & Drop Upload und automatische Zuordnung — keine Vorkenntnisse nötig."
  },
  {
    icon: Zap,
    title: "Weniger Papierkram",
    description: "Digitalisieren Sie Ihre Unterlagen und verabschieden Sie sich von Aktenordnern."
  },
  {
    icon: Laptop,
    title: "Flexibel arbeiten",
    description: "Greifen Sie von überall auf Ihre Dokumente zu — am PC, Tablet oder Smartphone."
  }
];

const MOCK_DOCUMENTS = [
  { name: "Mietvertrag_Meyer.pdf", category: "Vertrag", categoryColor: "#3b82f6", categoryBg: "#eff6ff", property: "Musterstr. 10, EG", date: "15.01.2024" },
  { name: "NK_Abrechnung_2023.pdf", category: "Abrechnung", categoryColor: "#22c55e", categoryBg: "#f0fdf4", property: "Musterstr. 10, EG", date: "28.03.2024" },
  { name: "Uebergabeprotokoll.pdf", category: "Protokoll", categoryColor: "#f59e0b", categoryBg: "#fffbeb", property: "Hauptstr. 25, 1.OG", date: "01.06.2024" },
  { name: "Gebaeudeversicherung.pdf", category: "Versicherung", categoryColor: "#6b7280", categoryBg: "#f9fafb", property: "Musterstr. 10", date: "01.01.2024" },
  { name: "Grundriss_EG.png", category: "Grundriss", categoryColor: "#6b7280", categoryBg: "#f9fafb", property: "Musterstr. 10, EG", date: "10.05.2023" },
];

function DocumentTableMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">Dokumente</h3>
          <span className="text-sm text-gray-400">5 Einträge</span>
        </div>
        <div className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-1.5">
          <span className="text-base leading-none">+</span>
          Hochladen
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
        <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.7fr] px-6 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Name</span>
          <span>Kategorie</span>
          <span>Immobilie</span>
          <span className="text-right">Datum</span>
        </div>

        {MOCK_DOCUMENTS.map((d, i) => (
          <div
            key={d.name}
            className={`grid grid-cols-[1.4fr_0.8fr_1fr_0.7fr] px-6 py-4 items-center ${
              i < MOCK_DOCUMENTS.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <span className="text-sm font-semibold text-gray-900">{d.name}</span>
            <div>
              <span
                className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: d.categoryColor, backgroundColor: d.categoryBg }}
              >
                {d.category}
              </span>
            </div>
            <span className="text-sm text-gray-500">{d.property}</span>
            <span className="text-sm text-gray-500 text-right">{d.date}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Speicher belegt</span>
        <span className="text-sm font-bold text-gray-900">24,7 MB / 1 GB</span>
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
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[400px] pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-500 leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
}

export default function Dokumente() {
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
                Dokumente sicher{" "}
                <span className="text-[#3c8af7]">digital verwalten</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Verträge, Abrechnungen, Protokolle — als Vermieter häufen sich
                Dokumente schnell an. Mit rentably archivieren Sie alles digital,
                finden es sofort wieder und teilen es sicher mit Ihren Mietern.
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
              <DocumentTableMockup />
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
                Ihr Dokumentenmanagement im Griff
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Einfach, übersichtlich, professionell – mit rentably fühlt sich Ihr
                Dokumentenmanagement mühelos an.
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
                So einfach verwalten Sie Ihre Dokumente
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Dokumentenarchiv</h3>
                    <p className="text-white/80 text-sm">Musterstraße 10</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Kategorien
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Verträge</span>
                        <span className="font-semibold text-gray-900">8</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Abrechnungen</span>
                        <span className="font-semibold text-gray-900">12</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Protokolle</span>
                        <span className="font-semibold text-gray-900">4</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Versicherungen</span>
                        <span className="font-semibold text-gray-900">3</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-semibold">Sonstige</span>
                        <span className="font-bold text-gray-900">6</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Letzte Aktivitäten
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Upload className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">NK_Abrechnung_2023.pdf</p>
                          <p className="text-xs text-gray-400">Hochgeladen am 28.03.2024</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Share2 className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Mietvertrag_Meyer.pdf</p>
                          <p className="text-xs text-gray-400">Geteilt mit Sarah Meyer</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Upload className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Uebergabeprotokoll.pdf</p>
                          <p className="text-xs text-gray-400">Hochgeladen am 01.06.2024</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Share2 className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">NK_Abrechnung_2023.pdf</p>
                          <p className="text-xs text-gray-400">Geteilt mit Thomas Klein</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Speicherplatz
                    </h4>
                    <span className="text-xs font-medium text-[#3c8af7] bg-[#3c8af7]/10 px-2 py-0.5 rounded-full">
                      24,7 MB / 1 GB
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#3c8af7] to-[#3579de]"
                      style={{ width: "2.5%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">33 Dokumente gespeichert</span>
                    <span className="text-xs text-gray-400">975,3 MB verfügbar</span>
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
                src="/dsvgo.png"
                alt="DSGVO-konform"
                className="h-32 w-auto object-contain"
              />
              <img
                src="/entwickelt-in-deutschland.png"
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

      <section className="py-[100px] px-6">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 text-center">
              Häufig gestellte Fragen
            </h2>
            <p className="text-gray-500 leading-relaxed mb-12 text-center max-w-[560px] mx-auto">
              Alles Wichtige über das Dokumentenmanagement mit rentably auf einen Blick.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="bg-white border border-gray-200 rounded-2xl px-8">
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
              Bereit, Ihre Dokumente digital zu verwalten?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Registrieren Sie sich kostenlos und archivieren Sie alle Ihre Dokumente
              ab sofort sicher in der Cloud — ohne Kreditkarte.
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
