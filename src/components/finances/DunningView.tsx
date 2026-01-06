import { Bell, AlertTriangle, Send, CheckCircle, TrendingUp } from "lucide-react";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";

export default function DunningView() {
  return (
    <PremiumFeatureGuard featureName="Offene Posten & Mahnwesen">
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Intelligentes Mahnwesen
              </h3>
              <p className="text-sm text-gray-400">
                Automatische Erkennung und Eskalation offener Posten
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-dark mb-1">3</div>
              <div className="text-sm text-gray-600">Offene Posten</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Send className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="text-2xl font-bold text-dark mb-1">5</div>
              <div className="text-sm text-gray-600">
                Erinnerungen versendet
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-dark mb-1">12</div>
              <div className="text-sm text-gray-600">
                Erfolgreich eingezogen
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Automatische Erkennung
          </h3>

          <div className="space-y-3">
            <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-dark">
                      Einheit 3 - Teilzahlung erkannt
                    </h4>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      Stufe 1
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Nur 450 € von 850 € eingegangen. Fehlbetrag: 400 €
                  </p>
                  <button className="text-sm text-primary-blue font-medium hover:underline">
                    Freundliche Erinnerung senden
                  </button>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-dark">
                      Einheit 7 - Miete fehlt
                    </h4>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Stufe 3
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Zahlung seit 3 Monaten ausstehend. Gesamtbetrag: 2.550 €
                  </p>
                  <button className="text-sm text-red-600 font-medium hover:underline">
                    Mahnung versenden
                  </button>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-dark">
                      Einheit 2 - Zahlung eingegangen
                    </h4>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                      Erledigt
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Nach freundlicher Erinnerung wurde die ausstehende Miete
                    vollständig bezahlt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Eskalationsstufen
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary-blue">
                  1
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-dark mb-1">
                  Freundliche Erinnerung
                </h4>
                <p className="text-sm text-gray-600">
                  Automatisch nach 3 Tagen Zahlungsverzug. Höflicher Ton,
                  Hinweis auf möglicherweise vergessene Überweisung.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-amber-600">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-dark mb-1">
                  Formelle Zahlungsaufforderung
                </h4>
                <p className="text-sm text-gray-600">
                  Nach 10 Tagen ohne Reaktion. Formeller Ton, Fristsetzung,
                  Hinweis auf mögliche Konsequenzen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-red-600">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-dark mb-1">Mahnung</h4>
                <p className="text-sm text-gray-600">
                  Nach 20 Tagen. Offizielle Mahnung mit Mahngebühren,
                  rechtlichen Hinweisen und letzter Frist vor weiteren
                  Schritten.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary-blue mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Erfolgsquote:</p>
              <p>
                Im Durchschnitt werden 85% der offenen Posten nach der ersten
                freundlichen Erinnerung beglichen. Nur 5% erreichen die dritte
                Eskalationsstufe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
