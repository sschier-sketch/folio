import { CreditCard, Plus, CheckCircle, Zap, Shield } from "lucide-react";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";

export default function BankConnectionView() {
  return (
    <PremiumFeatureGuard featureName="Bankanbindung">
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Automatische Bankanbindung
              </h3>
              <p className="text-sm text-gray-400">
                Verbinden Sie Ihr Bankkonto für automatische Transaktionsimporte
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-primary-blue" />
                <div>
                  <h4 className="font-semibold text-dark">Automatisch</h4>
                  <p className="text-xs text-gray-400">
                    Transaktionen werden automatisch importiert
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-dark">Intelligent</h4>
                  <p className="text-xs text-gray-400">
                    KI-gestützte Zuordnung zu Mietern
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-dark">Sicher</h4>
                  <p className="text-xs text-gray-400">
                    Verschlüsselte Verbindung nach EU-Standard
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Bankkonto verbinden
          </button>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Funktionen der Bankanbindung
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Transaktionsimport
                </h4>
                <p className="text-sm text-gray-600">
                  Alle Banktransaktionen werden automatisch importiert und
                  stehen zur Zuordnung bereit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Intelligente Zuordnung
                </h4>
                <p className="text-sm text-gray-600">
                  Das System erkennt wiederkehrende Zahlungen und schlägt
                  automatisch die richtige Zuordnung vor: "Sieht aus wie Miete
                  Einheit A"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Regelbasierte Automatik
                </h4>
                <p className="text-sm text-gray-600">
                  Definieren Sie Regeln für wiederkehrende Transaktionen.
                  Gleiche Absender werden automatisch der gleichen Einheit
                  zugeordnet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Mehrere Konten
                </h4>
                <p className="text-sm text-gray-600">
                  Verbinden Sie beliebig viele Bankkonten und verwalten Sie
                  alle Transaktionen zentral an einem Ort.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-blue mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Sicherheitshinweis:</p>
              <p>
                Die Bankanbindung erfolgt über eine verschlüsselte,
                PSD2-konforme Schnittstelle. Ihre Zugangsdaten werden nie bei
                uns gespeichert. Sie behalten die volle Kontrolle über Ihre
                Daten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
