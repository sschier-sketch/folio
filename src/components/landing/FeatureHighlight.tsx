import { Check } from "lucide-react";

const HIGHLIGHTS = [
  "Mietverträge und Zahlungseingänge verwalten",
  "Betriebskostenabrechnungen automatisiert erstellen",
  "Dokumente digital archivieren und teilen",
  "Kommunikation mit Mietern zentral bündeln",
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
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#3c8af7]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#3c8af7]" />
                  </span>
                  <span className="text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/[0.06] overflow-hidden">
              <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="h-2 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="h-2 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-20 bg-[#3c8af7]/10 rounded" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#3c8af7]/15 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="w-6 h-6 rounded bg-gray-100" />
                      <div className="h-2.5 bg-gray-100 rounded flex-1" />
                      <div className="h-2.5 w-16 bg-gray-50 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
