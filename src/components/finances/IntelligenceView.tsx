import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
} from "lucide-react";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";

export default function IntelligenceView() {
  return (
    <PremiumFeatureGuard featureName="KI-Finanzintelligenz">
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                KI-gestützte Finanzanalyse
              </h3>
              <p className="text-sm text-gray-400">
                Intelligente Warnungen und Prognosen für Ihre Immobilien
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-violet-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center mb-3">
                <Lightbulb className="w-5 h-5 text-violet-600" />
              </div>
              <div className="text-2xl font-bold text-dark mb-1">12</div>
              <div className="text-sm text-gray-600">Erkannte Muster</div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-dark mb-1">3</div>
              <div className="text-sm text-gray-600">Aktive Warnungen</div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-dark mb-1">95%</div>
              <div className="text-sm text-gray-600">Prognosegenauigkeit</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Aktuelle Warnungen
          </h3>

          <div className="space-y-3">
            <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-dark mb-1">
                    Ungewöhnlich niedrige Mietzahlung
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Einheit 5 hat diesen Monat nur 650 € statt der üblichen 850
                    € überwiesen. Abweichung: -23.5%
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Erkannt: Heute, 09:23</span>
                    <button className="text-primary-blue font-medium hover:underline">
                      Details ansehen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-dark mb-1">
                    Wiederholte Zahlungsverzögerungen
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Einheit 7 zahlt seit 3 Monaten durchschnittlich 8 Tage zu
                    spät. Mögliches finanzielles Problem erkannt.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Muster erkannt: 15.12.2024</span>
                    <button className="text-primary-blue font-medium hover:underline">
                      Gespräch empfohlen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Optimierungspotenzial erkannt</p>
              <p className="text-sm text-blue-900 mb-2">
                Ihre Instandhaltungskosten sind in den letzten 6 Monaten um
                45% gestiegen. Prüfen Sie mögliche präventive Maßnahmen.
              </p>
              <div className="flex items-center gap-4 text-xs text-blue-700">
                <span>Analyse: Letzte 6 Monate</span>
                <button className="text-primary-blue font-medium hover:underline">
                  Empfehlungen ansehen
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Cashflow-Prognose
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  Erwarteter Cashflow Januar 2025
                </div>
                <div className="text-2xl font-bold text-dark">+4.250 €</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">+12%</span>
                </div>
                <div className="text-xs text-gray-400">vs. Vormonat</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">
                  Erwartete Einnahmen
                </div>
                <div className="text-xl font-semibold text-dark">
                  7.500 €
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">
                  Erwartete Ausgaben
                </div>
                <div className="text-xl font-semibold text-dark">
                  3.250 €
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Intelligente Einblicke
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Pünktlichkeitstrend positiv
                </h4>
                <p className="text-sm text-gray-600">
                  92% Ihrer Mieter zahlen pünktlich. Das ist 8% besser als der
                  Durchschnitt vergleichbarer Objekte in Ihrer Region.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-primary-blue" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Kostenoptimierung möglich
                </h4>
                <p className="text-sm text-gray-600">
                  Durch präventive Instandhaltung könnten Sie bis zu 15% Ihrer
                  Reparaturkosten einsparen. Empfohlene Maßnahmen verfügbar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Mietanpassungspotenzial
                </h4>
                <p className="text-sm text-gray-600">
                  Basierend auf aktuellen Marktdaten liegt Ihre Miete für
                  Einheit 3 ca. 12% unter dem lokalen Durchschnitt. Potenzial:
                  +102 € / Monat.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-600 mt-0.5" />
            <div className="text-sm text-violet-900">
              <p className="font-semibold mb-1">KI-Power für Ihre Finanzen:</p>
              <p>
                Unsere KI analysiert kontinuierlich Ihre Finanzströme,
                vergleicht mit Markdaten und erkennt Muster, die Ihnen helfen,
                bessere Entscheidungen zu treffen und Risiken frühzeitig zu
                erkennen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
