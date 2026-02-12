import { FileText, Calculator, Archive, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HIGHLIGHTS: { icon: LucideIcon; text: string }[] = [
  { icon: FileText, text: "Mietverträge und Zahlungseingänge verwalten" },
  { icon: Calculator, text: "Betriebskostenabrechnungen automatisiert erstellen" },
  { icon: Archive, text: "Dokumente digital archivieren und teilen" },
  { icon: MessageCircle, text: "Kommunikation mit Mietern zentral bündeln" },
];

export default function FeatureHighlight() {
  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
              Alles, was Sie brauchen — an einem Ort
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-[650px]">
              Fünf Bereiche, die Ihre Immobilienverwaltung vollständig abdecken
              &ndash; von der Mietverwaltung bis zur Dokumentenablage.
            </p>
            <ul className="space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#3c8af7]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-[#3c8af7]" />
                  </span>
                  <span className="text-gray-700 leading-relaxed pt-1">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/[0.06] overflow-hidden">
              <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
              </div>
              <img
                src="/Bildschirmfoto_2026-02-12_um_17.32.18.png"
                alt="Rentably Immobilienübersicht"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
