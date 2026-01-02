import { History, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";

export default function BillingHistoryView() {
  return (
    <PremiumFeatureGuard featureName="Abrechnungshistorie & Plausibilitätschecks">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Abrechnungshistorie
              </h3>
              <p className="text-sm text-gray-400">
                Vergleichen Sie Abrechnungen über mehrere Jahre
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-dark">Abrechnung 2024</h4>
                  <p className="text-sm text-gray-400">
                    01.01.2024 - 31.12.2024
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">
                  Versendet
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Gesamtkosten
                  </div>
                  <div className="font-semibold text-dark">12.450,00 €</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Einheiten</div>
                  <div className="font-semibold text-dark">5</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Änderung</div>
                  <div className="font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +5.2%
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-dark">Abrechnung 2023</h4>
                  <p className="text-sm text-gray-400">
                    01.01.2023 - 31.12.2023
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                  Archiviert
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Gesamtkosten
                  </div>
                  <div className="font-semibold text-dark">11.830,00 €</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Einheiten</div>
                  <div className="font-semibold text-dark">5</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Änderung</div>
                  <div className="font-semibold text-gray-600">-</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Plausibilitätschecks
              </h3>
              <p className="text-sm text-gray-400">
                Automatische Prüfung auf Auffälligkeiten
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-dark mb-1">
                    Kostenabweichung erkannt
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Die Heizkosten sind im Vergleich zum Vorjahr um 32%
                    gestiegen. Bitte prüfen Sie die Werte.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>2023: 4.200,00 €</span>
                    <span>→</span>
                    <span>2024: 5.544,00 €</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-dark mb-1">
                    Vorauszahlung extrem niedrig
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Die Vorauszahlung für Einheit 3 liegt deutlich unter den
                    tatsächlichen Kosten. Nachzahlung: 850,00 €
                  </p>
                  <button className="text-sm text-primary-blue font-medium hover:underline">
                    Vorauszahlung anpassen
                  </button>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-dark mb-1">
                    Abrechnung vollständig
                  </h4>
                  <p className="text-sm text-gray-600">
                    Alle erforderlichen Werte wurden erfasst. Die Abrechnung
                    kann versendet werden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Kostenentwicklung
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">
                Detaillierte Kostenanalyse über mehrere Jahre
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
