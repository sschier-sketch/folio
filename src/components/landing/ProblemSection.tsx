import { FolderSearch, RotateCcw, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PROBLEMS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: FolderSearch,
    title: "Verstreute Daten",
    text: "Mietverträge in Ordnern, Zahlungen in Excel, Kommunikation per E-Mail. Informationen sind überall verteilt und schwer auffindbar.",
  },
  {
    icon: RotateCcw,
    title: "Manuelle Prozesse",
    text: "Betriebskostenabrechnungen per Hand, Zahlungseingänge manuell prüfen, Mieterhöhungen im Kalender notieren. Das kostet Zeit und ist fehleranfällig.",
  },
  {
    icon: BarChart3,
    title: "Fehlende Übersicht",
    text: "Wie steht meine Rendite? Welche Mieter zahlen verspätet? Welche Verträge laufen aus? Ohne System bleiben wichtige Fragen unbeantwortet.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-[100px] px-6 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-14 max-w-[700px]">
          Schluss mit Excel und Zettelwirtschaft.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PROBLEMS.map((p) => (
            <div
              key={p.title}
              className="bg-white border border-[#e5e7eb] rounded-xl p-8 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-[#3c8af7]/8 flex items-center justify-center mb-5">
                <p.icon className="w-5 h-5 text-[#3c8af7]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {p.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
