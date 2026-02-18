import {
  FileText,
  Calculator,
  Archive,
  MessageCircle,
  Users,
  Building2,
  Receipt,
  MessageSquare,
  Wallet,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RefLink } from "../common/RefLink";
import { RevealOnScroll } from "../common/RevealOnScroll";

const HIGHLIGHTS: { icon: LucideIcon; text: string }[] = [
  { icon: FileText, text: "Mietverträge und Zahlungseingänge verwalten" },
  { icon: Calculator, text: "Betriebskostenabrechnungen automatisiert erstellen" },
  { icon: Archive, text: "Dokumente digital archivieren und teilen" },
  { icon: MessageCircle, text: "Kommunikation mit Mietern zentral bündeln" },
];

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
}[] = [
  {
    icon: Users,
    title: "Mietverwaltung",
    description:
      "Verträge, Mieterhöhungen und Zahlungseingänge an einem Ort. Behalten Sie jederzeit den Überblick über Ihre Mietverhältnisse.",
    path: "/funktionen/mietverwaltung",
  },
  {
    icon: Building2,
    title: "Immobilienmanagement",
    description:
      "Stammdaten, Einheiten, Zähler und Kontakte zentral verwalten. Jede Immobilie vollständig dokumentiert.",
    path: "/funktionen/immobilienmanagement",
  },
  {
    icon: Receipt,
    title: "Buchhaltung",
    description:
      "Einnahmen, Ausgaben, Betriebskostenabrechnungen und Mahnwesen. Ihre Finanzen strukturiert und nachvollziehbar.",
    path: "/funktionen/buchhaltung",
  },
  {
    icon: MessageSquare,
    title: "Kommunikation",
    description:
      "Mieterportal und Ticketsystem für transparente, nachvollziehbare Kommunikation mit Ihren Mietern.",
    path: "/funktionen/kommunikation",
  },
  {
    icon: Wallet,
    title: "Nebenkosten",
    description:
      "Betriebskostenabrechnungen erstellen, Umlageschlüssel verwalten und Abrechnungen direkt an Mieter versenden.",
    path: "/funktionen/buchhaltung",
  },
];

function PropertyMockup() {
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
            <Building2 className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
          </div>
          <div>
            <div className="h-4 w-40 bg-gray-100 rounded mb-1.5" />
            <div className="h-3 w-28 bg-gray-50 rounded" />
          </div>
        </div>
        <div className="flex gap-3 mb-5 border-b border-gray-100 pb-3">
          {["Übersicht", "Einheiten", "Mieter", "Dokumente"].map((tab, i) => (
            <div
              key={tab}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: i === 0 ? "#EEF4FF" : "transparent",
                color: i === 0 ? "#1E1E24" : "#9ca3af",
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: Building2, label: "4 Einheiten" },
            { icon: Users, label: "3 Mieter" },
          ].map((item) => (
            <div key={item.label} className="border border-gray-100 rounded-lg p-3 flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
              >
                <item.icon className="w-4 h-4" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="h-24 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-3 w-20 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-8 w-28 bg-[#3c8af7]/10 rounded mx-auto" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 rounded border border-gray-100 flex items-center px-3 gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-100" />
              <div className="h-2.5 flex-1 bg-gray-100 rounded" />
              <div className="h-5 w-14 bg-[#22c55e]/10 rounded text-[10px] flex items-center justify-center text-[#22c55e] font-medium">
                Aktiv
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeatureHighlight() {
  return (
    <section className="py-16 sm:py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-12 sm:mb-20">
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
              Alles, was Sie brauchen — an einem Ort
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-[650px]">
              F&uuml;nf Bereiche, die Ihre Immobilienverwaltung vollst&auml;ndig abdecken
              &ndash; von der Mietverwaltung bis zur Nebenkostenabrechnung.
              Im Basic-Tarif kostenlos, mit dem Pro-Test sogar mit
              allen Premium-Funktionen.
            </p>
            <ul className="space-y-4 mb-6">
              {HIGHLIGHTS.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <span className="text-gray-700 leading-relaxed pt-2">{item.text}</span>
                </li>
              ))}
            </ul>
            <RefLink
              to="/funktionen"
              className="inline-flex items-center gap-2 text-[#3c8af7] hover:text-[#3579de] font-medium transition-colors"
            >
              Alle Funktionen ansehen
              <span className="text-lg">→</span>
            </RefLink>
          </RevealOnScroll>
          <RevealOnScroll delay={100} className="hidden lg:block">
            <PropertyMockup />
          </RevealOnScroll>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <RevealOnScroll key={f.title} delay={i * 80} className="h-full">
              <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6 sm:p-8 hover:shadow-md transition-shadow h-full">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  {f.description}
                </p>
                <RefLink
                  to={f.path}
                  className="text-sm font-medium text-[#3c8af7] hover:text-[#3579de] transition-colors"
                >
                  Mehr erfahren
                </RefLink>
              </div>
            </RevealOnScroll>
          ))}

          <RevealOnScroll delay={FEATURES.length * 80} className="h-full">
            <RefLink
              to="/funktionen"
              className="group rounded-xl border-2 border-dashed border-gray-300 hover:border-[#3c8af7] p-8 h-full flex flex-col items-center justify-center text-center transition-all hover:bg-[#3c8af7]/[0.03]"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#3c8af7]/10 flex items-center justify-center mb-4 transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-[#3c8af7] transition-colors" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Stetig weiterentwickelt
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm mb-4">
                rentably wird permanent nach Nutzerbed&uuml;rfnissen weiterentwickelt &ndash; immer auf dem neuesten Stand der Technik.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3c8af7] group-hover:gap-2.5 transition-all">
                Alle Funktionen entdecken
                <ArrowRight className="w-4 h-4" />
              </span>
            </RefLink>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
