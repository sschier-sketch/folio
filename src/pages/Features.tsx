import { useNavigate } from "react-router-dom";
import { withRef } from "../lib/referralTracking";
import { RefLink } from "../components/common/RefLink";
import { RevealOnScroll } from "../components/common/RevealOnScroll";
import {
  Building2,
  Users,
  MessagesSquare,
  BarChart3,
  FolderOpen,
  Receipt,
  ClipboardCheck,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Zap,
  Laptop,
  Clock,
  LayoutDashboard,
} from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Immobilienmanagement",
    description:
      "Ihr gesamtes Portfolio digital verwaltet. Stammdaten, Einheiten, Kennzahlen und Fotos an einem Ort.",
    bullets: [
      "Unbegrenzt Immobilien & Einheiten",
      "Rendite & Auslastung im Blick",
      "Fotodokumentation & Ausstattung",
    ],
    path: "/funktionen/immobilienmanagement",
    visual: "property",
  },
  {
    icon: Users,
    title: "Mietverwaltung",
    description:
      "Mietverträge, Zahlungen und Erhöhungen zentral verwalten. Jedes Mietverhältnis im Griff.",
    bullets: [
      "Digitale Mietverträge",
      "Automatische Zahlungsverfolgung",
      "Index-basierte Mieterhöhungen",
    ],
    path: "/funktionen/mietverwaltung",
    visual: "tenants",
  },
  {
    icon: Receipt,
    title: "Nebenkostenabrechnung",
    description:
      "Rechtssichere Abrechnungen in wenigen Minuten erstellen und direkt an Ihre Mieter versenden.",
    bullets: [
      "Geführter Schritt-für-Schritt Assistent",
      "Automatische Umlageschlüssel",
      "PDF-Export & E-Mail-Versand",
    ],
    path: "/funktionen/nebenkostenabrechnung",
    visual: "billing",
  },
  {
    icon: BarChart3,
    title: "Buchhaltung & Finanzen",
    description:
      "Einnahmen, Ausgaben und Cashflow strukturiert aufbereitet. Steuerexporte auf Knopfdruck.",
    bullets: [
      "Einnahmen & Ausgaben erfassen",
      "Cashflow-Analyse pro Objekt",
      "Export für den Steuerberater",
    ],
    path: "/funktionen/buchhaltung",
    visual: "finance",
  },
  {
    icon: MessagesSquare,
    title: "Mieterkommunikation",
    description:
      "Ihre gesamte Kommunikation zentral gebündelt. E-Mail-Postfach, Vorlagen und Ticketsystem.",
    bullets: [
      "Integriertes E-Mail-Postfach",
      "Professionelle Vorlagen",
      "Ticketsystem für Anfragen",
    ],
    path: "/funktionen/kommunikation",
    visual: "messages",
  },
  {
    icon: FolderOpen,
    title: "Dokumentenmanagement",
    description:
      "Verträge, Abrechnungen und Belege sicher in der Cloud archivieren und sofort wiederfinden.",
    bullets: [
      "Cloud-Upload per Drag & Drop",
      "Automatische Kategorisierung",
      "Dokumente mit Mietern teilen",
    ],
    path: "/funktionen/dokumente",
    visual: "documents",
  },
  {
    icon: ClipboardCheck,
    title: "Übergabeprotokolle",
    description:
      "Professionelle Wohnungsübergaben dokumentieren. Raum für Raum, Zählerstand für Zählerstand.",
    bullets: [
      "Raum-für-Raum Checkliste",
      "Zählerstände & Schlüsselübergabe",
      "Sofortiger PDF-Export",
    ],
    path: "/funktionen/uebergabeprotokoll",
    visual: "handover",
  },
  {
    icon: UserCheck,
    title: "Mieterportal",
    description:
      "Self-Service Portal für Ihre Mieter. Dokumente einsehen, Zählerstände melden, Tickets erstellen.",
    bullets: [
      "Eigener Login für Mieter",
      "Dokumente & Abrechnungen einsehen",
      "Reparaturen direkt melden",
    ],
    path: "/funktionen/mieterportal",
    visual: "portal",
  },
];

const BENEFITS = [
  {
    icon: Clock,
    title: "Zeit sparen",
    description: "Automatisierte Prozesse und intelligente Assistenten nehmen Ihnen Routinearbeit ab.",
  },
  {
    icon: LayoutDashboard,
    title: "Voller Überblick",
    description: "Alle Immobilien, Mieter und Finanzen in einem einzigen Dashboard vereint.",
  },
  {
    icon: Shield,
    title: "DSGVO-konform",
    description: "Ihre Daten werden auf deutschen Servern verschlüsselt gespeichert.",
  },
  {
    icon: Sparkles,
    title: "Einfach bedienbar",
    description: "Intuitive Oberfläche ohne Einarbeitungszeit. Sofort loslegen.",
  },
  {
    icon: Zap,
    title: "Weniger Fehler",
    description: "Automatische Berechnungen und Validierungen eliminieren manuelle Rechenfehler.",
  },
  {
    icon: Laptop,
    title: "Von überall",
    description: "Webbasiert und responsive. Arbeiten Sie am PC, Tablet oder Smartphone.",
  },
];

function FeatureVisual({ type }: { type: string }) {
  if (type === "property") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3c8af7]/10 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded bg-[#3c8af7]/30" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-gray-200 rounded-full w-3/4" />
            <div className="h-1.5 bg-gray-100 rounded-full w-1/2" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">100%</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded bg-amber-200" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-gray-200 rounded-full w-5/6" />
            <div className="h-1.5 bg-gray-100 rounded-full w-2/5" />
          </div>
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">83%</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3c8af7]/10 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded bg-[#3c8af7]/30" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-gray-200 rounded-full w-full" />
            <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">100%</span>
        </div>
      </div>
    );
  }

  if (type === "tenants") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#3c8af7]/15" />
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 rounded-full w-20" />
              <div className="h-1.5 bg-gray-100 rounded-full w-14" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Bezahlt</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100" />
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 rounded-full w-24" />
              <div className="h-1.5 bg-gray-100 rounded-full w-16" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Bezahlt</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-100" />
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 rounded-full w-16" />
              <div className="h-1.5 bg-gray-100 rounded-full w-12" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Offen</span>
        </div>
      </div>
    );
  }

  if (type === "billing") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-2 bg-gray-200 rounded-full w-20" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-200 rounded-full w-full" />
          <div className="h-2 bg-gray-200 rounded-full w-3/4" />
          <div className="h-2 bg-gray-200 rounded-full w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
          <div className="h-2 bg-emerald-200 rounded-full w-16" />
          <div className="h-2 bg-emerald-200 rounded-full w-10" />
        </div>
      </div>
    );
  }

  if (type === "finance") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-end gap-1.5 h-12">
          {[40, 65, 50, 80, 60, 75, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                backgroundColor: i === 6 ? "#3c8af7" : "#E0EDFF",
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="h-1.5 bg-gray-100 rounded-full w-16" />
          <span className="text-[10px] font-bold text-emerald-600">+12,4%</span>
        </div>
      </div>
    );
  }

  if (type === "messages") {
    return (
      <div className="space-y-2">
        <div className="bg-[#3c8af7]/5 rounded-lg p-2.5 border border-[#3c8af7]/10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-[#3c8af7]/20" />
            <div className="h-1.5 bg-[#3c8af7]/20 rounded-full w-16" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-200 rounded-full w-full" />
            <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-200" />
            <div className="h-1.5 bg-gray-200 rounded-full w-20" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-200 rounded-full w-5/6" />
            <div className="h-1.5 bg-gray-100 rounded-full w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (type === "documents") {
    return (
      <div className="space-y-2">
        {[
          { color: "#3c8af7", label: "w-12" },
          { color: "#22c55e", label: "w-16" },
          { color: "#f59e0b", label: "w-10" },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-7 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-1 rounded-full" style={{ backgroundColor: d.color }} />
            </div>
            <div className="flex-1 space-y-1">
              <div className={`h-2 bg-gray-200 rounded-full ${d.label}`} />
              <div className="h-1.5 bg-gray-100 rounded-full w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "handover") {
    return (
      <div className="space-y-2">
        {["Wohnzimmer", "Küche", "Bad"].map((room, i) => (
          <div key={room} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  i < 2
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-300"
                }`}
              >
                {i < 2 && <div className="w-2 h-2 rounded-sm bg-emerald-500" />}
              </div>
              <span className="text-[11px] text-gray-600 font-medium">{room}</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                i < 2
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-400 bg-gray-100"
              }`}
            >
              {i < 2 ? "Geprüft" : "Offen"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "portal") {
    return (
      <div className="space-y-2.5">
        <div className="h-2 bg-gray-200 rounded-full w-20" />
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-200 rounded-full w-full" />
          <div className="h-2 bg-gray-200 rounded-full w-4/5" />
        </div>
        <div className="flex gap-2 pt-0.5">
          <div className="h-5 rounded-md bg-[#3c8af7]/10 flex-1" />
          <div className="h-5 rounded-md bg-amber-50 flex-1" />
          <div className="h-5 rounded-md bg-emerald-50 flex-1" />
        </div>
      </div>
    );
  }

  return null;
}

export default function Features() {
  const navigate = useNavigate();
  const goToSignup = () => navigate(withRef("/signup"));

  return (
    <div>
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="max-w-[800px] mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c8af7]" />
                <span className="text-sm font-medium text-[#3c8af7]">Alle Funktionen</span>
              </div>
              <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.08] tracking-tight">
                Alles was Sie für Ihre{" "}
                <span className="text-[#3c8af7]">Immobilienverwaltung</span>{" "}
                brauchen
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-[640px] mx-auto">
                Acht leistungsstarke Module, die Ihre gesamte Vermietung abdecken &ndash; von der
                Objektverwaltung bis zur Nebenkostenabrechnung. Alles in einer Plattform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature, i) => (
              <RevealOnScroll key={feature.title} delay={i * 60}>
                <RefLink to={feature.path} className="block h-full">
                  <div className="group relative bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:border-gray-300 transition-all duration-300 h-full overflow-hidden">
                    <div className="flex gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                          >
                            <feature.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3c8af7] transition-colors">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-gray-500 leading-relaxed text-sm mb-5">
                          {feature.description}
                        </p>
                        <ul className="space-y-2 mb-5">
                          {feature.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#3c8af7] flex-shrink-0" />
                              <span className="text-sm text-gray-600">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3c8af7] group-hover:gap-2.5 transition-all">
                          Mehr erfahren
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="hidden sm:block w-[180px] flex-shrink-0">
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 h-full flex flex-col justify-center group-hover:border-gray-200 group-hover:shadow-sm transition-all">
                          <FeatureVisual type={feature.visual} />
                        </div>
                      </div>
                    </div>
                  </div>
                </RefLink>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#EEF4FF]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#3c8af7] uppercase tracking-wide mb-3">Vorteile</p>
              <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Warum Vermieter rentably vertrauen
              </h2>
              <p className="text-gray-500 max-w-[640px] mx-auto leading-relaxed">
                Eine Plattform für alles &ndash; entwickelt von Vermietern, für Vermieter.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {BENEFITS.map((b, i) => (
              <RevealOnScroll key={b.title} delay={i * 80} className="h-full">
                <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm h-full text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: "#E0EDFF", border: "1px solid #C7DCFF" }}
                  >
                    <b.icon className="w-6 h-6 text-[#3c8af7]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
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
              <img src="/dsvgo-de.png" alt="DSGVO-konform" className="h-32 w-auto object-contain" />
              <img src="/entwickelt-in-deutschland-de.png" alt="Entwickelt in Deutschland" className="h-32 w-auto object-contain" />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-[80px] px-6 bg-[#f8fafc]">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Hausverwaltungssoftware mit allen Funktionen — von der Objektverwaltung bis zur Nebenkostenabrechnung
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Private Vermieter stehen vor der Herausforderung, zahlreiche Aufgaben rund um ihre
                Immobilien effizient zu organisieren: Mietverträge verwalten, Zahlungseingänge
                kontrollieren, Nebenkostenabrechnungen erstellen, Dokumente archivieren und mit
                Mietern kommunizieren. Ohne eine zentrale Lösung bedeutet das oft einen Mix aus
                Excel-Tabellen, E-Mails, Ordnern und verschiedenen Tools — ein System, das mit
                jedem weiteren Objekt unübersichtlicher wird.
              </p>
              <p>
                Rentably bündelt alle Bereiche der Immobilienverwaltung in einer einzigen
                Plattform: Immobilienmanagement mit Stammdaten, Einheiten und Fotodokumentation,
                Mietverwaltung mit digitalen Verträgen und automatischer Zahlungsüberwachung,
                Buchhaltung mit Einnahmen-Ausgaben-Erfassung und Steuerexport,
                Nebenkostenabrechnungen mit geführtem Assistenten, Dokumentenmanagement mit
                Cloud-Archiv, Mieterkommunikation über ein integriertes E-Mail-System,
                professionelle Übergabeprotokolle und ein Self-Service-Mieterportal.
              </p>
              <p>
                Jedes Modul ist so konzipiert, dass es für sich allein funktioniert, aber im
                Zusammenspiel mit den anderen Modulen seine volle Stärke entfaltet. Daten fließen
                automatisch zwischen den Bereichen — ein Mietvertrag liefert die Grundlage für
                die Zahlungsüberwachung, Zählerstände fließen in die Nebenkostenabrechnung, und
                Dokumente werden automatisch dem richtigen Objekt und Mieter zugeordnet.
              </p>
              <p>
                Die Software ist webbasiert und von jedem Gerät erreichbar. Alle Daten werden
                DSGVO-konform auf deutschen Servern gespeichert. Es gibt keinen Preis pro
                Einheit oder pro Immobilie — der Basic-Tarif ist dauerhaft kostenlos, der
                Pro-Tarif bietet erweiterte Funktionen zu einem festen monatlichen Preis.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-24 px-6">
        <RevealOnScroll>
          <div className="max-w-[1200px] mx-auto text-center">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight mb-4">
              Bereit, Ihre Verwaltung zu vereinfachen?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto">
              Erstellen Sie Ihren Account in unter einer Minute.
              Komplett kostenlos im Basic-Tarif &ndash; und 30 Tage
              alle Pro-Funktionen inklusive.
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
