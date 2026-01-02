import { Lock, BarChart3 } from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyMetricsTabProps {
  propertyId: string;
}

export default function PropertyMetricsTab({ propertyId }: PropertyMetricsTabProps) {
  const { isPremium } = useSubscription();

  if (!isPremium) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">Premium-Funktion</h3>
          <p className="text-gray-600 mb-6">
            Erweiterte Kennzahlen und Analysen sind im Pro-Tarif verfügbar. Upgrade
            jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Miete pro m² und Leerstandsquote
              </span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Kostenquote und ROI-Berechnung
              </span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Vergleich Vormonat und Vorjahr
              </span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Visuelle Auswertungen und Diagramme
              </span>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            Jetzt auf Pro upgraden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-6">
          Kennzahlen & Analysen
        </h3>

        <div className="p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">Kennzahlen werden berechnet...</p>
        </div>
      </div>
    </div>
  );
}
