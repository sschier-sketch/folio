import { Lock, Users } from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyContactsTabProps {
  propertyId: string;
}

export default function PropertyContactsTab({ propertyId }: PropertyContactsTabProps) {
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
            Die Kontaktverwaltung für Immobilien ist im Pro-Tarif verfügbar. Upgrade
            jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Hausmeister-Kontakte zentral verwalten
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Dienstleister und Handwerker hinterlegen
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Eigentümer-Daten bei Verwaltung
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Schneller Zugriff auf alle wichtigen Kontakte
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
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">Kontakte</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            <Users className="w-4 h-4" />
            Kontakt hinzufügen
          </button>
        </div>

        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Kontakte hinterlegt</p>
        </div>
      </div>
    </div>
  );
}
