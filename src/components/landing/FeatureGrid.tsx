import { Users, Building2, Receipt, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RefLink } from "../common/RefLink";

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
];

export default function FeatureGrid() {
  return (
    <section className="py-[100px] px-6 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
          Ihre Verwaltung. Komplett digital.
        </h2>
        <p className="text-gray-500 leading-relaxed mb-14 max-w-[650px]">
          Vier Kernbereiche, die Ihren Alltag als Vermieter grundlegend
          vereinfachen — alle kostenlos im Basic-Tarif enthalten.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-[#e5e7eb] rounded-xl p-8 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-[#3c8af7]/8 flex items-center justify-center mb-5">
                <f.icon className="w-5 h-5 text-[#3c8af7]" />
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
          ))}
        </div>
      </div>
    </section>
  );
}
