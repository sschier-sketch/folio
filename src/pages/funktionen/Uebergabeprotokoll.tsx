import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../../components/common/RefLink";
import { RevealOnScroll } from "../../components/common/RevealOnScroll";
import FaqSection from "../../components/landing/FaqSection";
import {
  ArrowLeft,
  ClipboardList,
  Gauge,
  Key,
  Camera,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Home,
  FolderOpen,
  CreditCard,
  Calendar,
  MessagesSquare,
  BarChart3,
  LayoutDashboard,
  Shield,
  Sparkles,
  Zap,
  Laptop,
  Check,
} from "lucide-react";

const HERO_CHECKS = [
  "Raum-für-Raum Dokumentation",
  "Zählerstände & Schlüssel erfassen",
  "PDF-Protokoll mit digitaler Unterschrift",
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Raum-für-Raum",
    description:
      "Dokumentieren Sie jeden Raum einzeln. Zustand von Boden, Wänden, Decke und Ausstattung systematisch erfasst.",
  },
  {
    icon: Gauge,
    title: "Zählerstände",
    description:
      "Erfassen Sie Strom-, Gas-, Wasser- und Heizungszählerstände direkt im Protokoll. Keine Ablesung geht verloren.",
  },
  {
    icon: Key,
    title: "Schlüsselübergabe",
    description:
      "Dokumentieren Sie Art und Anzahl aller übergebenen Schlüssel. Vollständige Schlüsselhistorie je Einheit.",
  },
  {
    icon: Camera,
    title: "Fotodokumentation",
    description:
      "Hinterlegen Sie Fotos zu jedem Raum und jedem Mangel. Visuelle Beweissicherung für den Ernstfall.",
  },
  {
    icon: FileDown,
    title: "PDF-Export",
    description:
      "Erstellen Sie per Klick ein professionelles PDF-Protokoll. Druckfertig und rechtsicher dokumentiert.",
  },
  {
    icon: AlertTriangle,
    title: "Mängeldokumentation",
    description:
      "Erfassen Sie Mängel mit Beschreibung, Foto und Bewertung. Klar dokumentiert für spätere Kautionsabrechnung.",
  },
];

const OTHER_FEATURES = [
  { icon: Home, title: "Immobilienmanagement", description: "Alle Immobilien und Einheiten zentral verwalten.", path: "/funktionen/immobilienmanagement" },
  { icon: CreditCard, title: "Mietverwaltung", description: "Mietverträge, Zahlungen und Erhöhungen effizient verwalten.", path: "/funktionen/mietverwaltung" },
  { icon: FolderOpen, title: "Dokumentenmanagement", description: "Verwalten Sie Ihre Dokumente einfach & sicher in der Cloud.", path: "/funktionen/dokumente" },
  { icon: BarChart3, title: "Finanzmanagement", description: "Finanzen und Mieteinnahmen jederzeit im Blick behalten.", path: "/funktionen/buchhaltung" },
  { icon: MessagesSquare, title: "Mieterkommunikation", description: "Ihre gesamte Kommunikation zentral gebündelt.", path: "/funktionen/kommunikation" },
  { icon: Calendar, title: "Nebenkostenabrechnung", description: "Versandfertige Nebenkostenabrechnung in wenigen Minuten.", path: "/funktionen/nebenkostenabrechnung" },
];

const BENEFITS = [
  { icon: LayoutDashboard, title: "Alles auf einen Blick", description: "Alle Übergaben mit Räumen, Mängeln und Zählerständen übersichtlich dokumentiert." },
  { icon: Shield, title: "Rechtssicher dokumentiert", description: "Lückenlose Protokolle schützen Sie bei Streitigkeiten um Kaution und Schäden." },
  { icon: Camera, title: "Visuelle Beweissicherung", description: "Fotos zu jedem Mangel dokumentieren den Zustand Ihrer Immobilie eindeutig." },
  { icon: Sparkles, title: "Einfach bedienbar", description: "Geführte Dokumentation Raum für Raum — keine Vorkenntnisse nötig." },
  { icon: Zap, title: "In Minuten erstellt", description: "Strukturierte Eingabemasken beschleunigen die Dokumentation erheblich." },
  { icon: Laptop, title: "Flexibel arbeiten", description: "Erstellen Sie Protokolle direkt vor Ort auf Ihrem Tablet oder Smartphone." },
];

const MOCK_ROOMS = [
  { name: "Wohnzimmer", status: "Keine Mängel", color: "#22c55e", bg: "#f0fdf4" },
  { name: "Küche", status: "1 Mangel", color: "#f59e0b", bg: "#fffbeb" },
  { name: "Bad", status: "Keine Mängel", color: "#22c55e", bg: "#f0fdf4" },
  { name: "Schlafzimmer", status: "Keine Mängel", color: "#22c55e", bg: "#f0fdf4" },
];

function ProtocolMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">Übergabeprotokoll</h3>
          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: "#3c8af7", backgroundColor: "#EEF4FF" }}>Einzug</span>
        </div>
      </div>
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-400 text-xs block">Objekt</span>
            <span className="font-semibold text-gray-900">Musterstr. 10, EG links</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block">Mieter</span>
            <span className="font-semibold text-gray-900">Sarah Meyer</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block">Datum</span>
            <span className="font-semibold text-gray-900">01.03.2025</span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Räume</div>
        {MOCK_ROOMS.map((room, i) => (
          <div key={room.name} className={`flex items-center justify-between px-6 py-3.5 ${i < MOCK_ROOMS.length - 1 ? "border-b border-gray-100" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-gray-900">{room.name}</span>
            </div>
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: room.color, backgroundColor: room.bg }}>{room.status}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">Zählerstände: <span className="font-bold text-gray-900">3</span></span>
          <span className="text-sm text-gray-500 font-medium">Schlüssel: <span className="font-bold text-gray-900">2</span></span>
        </div>
      </div>
    </div>
  );
}

export default function Uebergabeprotokoll() {
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
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
                <span className="text-sm font-medium text-[#3c8af7]">Kerntechnologie</span>
              </div>
              <h1 className="text-3xl sm:text-[40px] md:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Wohnungsübergabe{" "}
                <span className="text-[#3c8af7]">professionell dokumentiert</span>
              </h1>
              <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
                Kratzer an der Wand, fehlende Schlüssel, strittige Zählerstände &mdash; ohne lückenloses Protokoll wird jede Übergabe zum Risiko. Mit rentably dokumentieren Sie alles strukturiert und rechtssicher.
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
              <ProtocolMockup />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Leistungsumfang</p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Lückenlose Übergabeprotokolle
              </h2>
              <p className="text-gray-500 max-w-[700px] mx-auto">
                Vom Raumzustand bis zum letzten Schlüssel &ndash; rentably dokumentiert jede Übergabe vollständig und rechtssicher.
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
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                So dokumentieren Sie eine Wohnungsübergabe
              </h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#3c8af7] to-[#3579de] p-6 sm:p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Übergabeprotokoll &mdash; Einzug</h3>
                    <p className="text-white/80 text-sm">Musterstraße 10, EG links</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Küche</h4>
                    <div className="space-y-3">
                      {[
                        { item: "Boden", status: "Gut", isMangel: false },
                        { item: "Wände", status: "Mangel", isMangel: true, detail: "Kratzer an der Wand neben Fenster" },
                        { item: "Decke", status: "Gut", isMangel: false },
                        { item: "Fenster", status: "Gut", isMangel: false },
                      ].map((entry, idx) => (
                        <div key={entry.item} className={`py-2 ${idx < 3 ? "border-b border-gray-100" : ""}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">{entry.item}</span>
                            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${entry.isMangel ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"}`}>
                              {entry.status}
                            </span>
                          </div>
                          {entry.detail && (
                            <p className="text-xs text-amber-600 mt-1">{entry.detail}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Zählerstände</h4>
                      <div className="space-y-3">
                        {[
                          ["Strom", "45.892 kWh"],
                          ["Gas", "12.340 m³"],
                          ["Wasser", "156,8 m³"],
                        ].map(([label, value], idx) => (
                          <div key={label} className={`flex justify-between py-2 ${idx < 2 ? "border-b border-gray-100" : ""}`}>
                            <span className="text-gray-600">{label}</span>
                            <span className="font-semibold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Schlüssel</h4>
                      <div className="space-y-3">
                        {[
                          ["Haustür", "2 Stk"],
                          ["Wohnungstür", "2 Stk"],
                          ["Briefkasten", "1 Stk"],
                        ].map(([label, value], idx) => (
                          <div key={label} className={`flex justify-between py-2 ${idx < 2 ? "border-b border-gray-100" : ""}`}>
                            <span className="text-gray-600">{label}</span>
                            <span className="font-semibold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
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
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">Ihre Daten in sicheren Händen</h2>
              <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">rentably wird in Deutschland betrieben und erfüllt die Anforderungen der DSGVO. Ihre Daten gehören Ihnen &ndash; heute und in Zukunft.</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
              <img src="/dsvgo-de.png" alt="DSGVO-konform" className="h-24 sm:h-32 w-auto object-contain" />
              <img src="/entwickelt-in-deutschland-de.png" alt="Entwickelt in Deutschland" className="h-24 sm:h-32 w-auto object-contain" />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#EEF4FF]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Vorteile</p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">Darum dokumentieren Vermieter mit rentably</h2>
              <p className="text-gray-500 max-w-[700px] mx-auto leading-relaxed">Ob Einzug oder Auszug &ndash; rentably sorgt für lückenlose, rechtssichere Übergabeprotokolle in wenigen Minuten.</p>
            </div>
          </RevealOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((b, i) => (
              <RevealOnScroll key={b.title} delay={i * 80} className="h-full">
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm h-full text-center">
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
              <p className="text-gray-600 mb-6">Testen Sie rentably jetzt kostenlos und unverbindlich.</p>
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
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">Weitere Funktionen für Vermieter</h2>
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

      <FaqSection pageSlug="uebergabeprotokoll" />

      <section className="py-12 sm:py-[80px] px-6 bg-[#f8fafc]">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Digitales &Uuml;bergabeprotokoll f&uuml;r Vermieter &ndash; rechtssicher dokumentieren, Streit vermeiden
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Bei jeder Wohnungs&uuml;bergabe stehen Vermieter vor der gleichen Herausforderung: den
                Zustand der Wohnung l&uuml;ckenlos dokumentieren, Z&auml;hlerst&auml;nde erfassen, Schl&uuml;ssel
                protokollieren und eventuelle M&auml;ngel nachweisbar festhalten. Ohne ein strukturiertes
                Protokoll wird jede sp&auml;tere Auseinandersetzung um Kaution oder Sch&auml;den zum
                Risiko &ndash; f&uuml;r beide Seiten.
              </p>
              <p>
                rentably f&uuml;hrt Sie Raum f&uuml;r Raum durch die gesamte &Uuml;bergabe: Boden, W&auml;nde,
                Decke, Fenster und Ausstattung werden systematisch bewertet. M&auml;ngel dokumentieren
                Sie mit Beschreibung und Bewertung direkt im System. Z&auml;hlerst&auml;nde f&uuml;r Strom,
                Gas und Wasser werden erfasst und die Schl&uuml;ssel&uuml;bergabe mit Art und Anzahl
                aller Schl&uuml;ssel protokolliert.
              </p>
              <p>
                Das fertige Protokoll exportieren Sie per Klick als professionelles PDF-Dokument &ndash;
                druckfertig und rechtssicher dokumentiert. Alle Protokolle werden automatisch dem
                Objekt und dem Mieter zugeordnet und in Ihrem Dokumentenarchiv gespeichert. So
                haben Sie bei jeder sp&auml;teren R&uuml;ckfrage den vollst&auml;ndigen Nachweis &uuml;ber den
                Zustand der Wohnung zum Zeitpunkt der &Uuml;bergabe.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight mb-4">Bereit für professionelle Wohnungsübergaben?</h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">Registrieren Sie sich kostenlos und dokumentieren Sie Ihre nächste Übergabe digital und rechtssicher &mdash; ohne Kreditkarte.</p>
            <button onClick={goToSignup} className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors">Jetzt kostenlos starten</button>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
