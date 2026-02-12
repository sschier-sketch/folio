import { FileText, Calculator, Archive, MessageCircle, Building2, Home, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HIGHLIGHTS: { icon: LucideIcon; text: string }[] = [
  { icon: FileText, text: "Mietverträge und Zahlungseingänge verwalten" },
  { icon: Calculator, text: "Betriebskostenabrechnungen automatisiert erstellen" },
  { icon: Archive, text: "Dokumente digital archivieren und teilen" },
  { icon: MessageCircle, text: "Kommunikation mit Mietern zentral bündeln" },
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
            { icon: Home, label: "4 Einheiten" },
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
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
              Alles, was Sie brauchen — an einem Ort
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-[650px]">
              Vier Bereiche, die Ihre Immobilienverwaltung vollständig abdecken
              &ndash; von der Mietverwaltung bis zur Dokumentenablage.
              Im Basic-Tarif kostenlos, mit dem 30-Tage-Pro-Test sogar mit
              allen Premium-Funktionen.
            </p>
            <ul className="space-y-4">
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
          </div>

          <div className="hidden lg:block">
            <PropertyMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
