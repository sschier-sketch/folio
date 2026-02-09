import { Download, FileText, Users, CheckCircle } from "lucide-react";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";
import { Button } from "../ui/Button";

export default function BillingExportView() {
  return (
    <PremiumFeatureGuard featureName="PDF-Export & Dokumenten-Export">
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                PDF-Export Funktionen
              </h3>
              <p className="text-sm text-gray-400">
                Professionelle Abrechnungen als PDF exportieren
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-primary-blue" />
                <div>
                  <h4 className="font-semibold text-dark">Einzelexport</h4>
                  <p className="text-sm text-gray-400">
                    Eine Abrechnung als PDF
                  </p>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Professionelles Layout
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Alle Kostenpositionen
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Verbrauchsübersicht
                </li>
              </ul>
              <Button variant="primary" fullWidth>
                PDF erstellen
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-dark">Serienexport</h4>
                  <p className="text-sm text-gray-400">
                    Für alle Einheiten gleichzeitig
                  </p>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Alle Mieter auf einmal
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Automatische Benennung
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ZIP-Download
                </li>
              </ul>
              <Button variant="cancel" fullWidth>
                Alle exportieren
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Export-Einstellungen
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo hochladen
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-2">
                  Ziehen Sie Ihr Logo hierher oder klicken Sie zum Auswählen
                </p>
                <Button variant="cancel">
                  Datei auswählen
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Absenderadresse
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                rows={4}
                placeholder="Ihre Adresse für die Abrechnung..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zusätzliche Hinweise
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                rows={3}
                placeholder="Optional: Zusätzliche Informationen für die Abrechnung..."
              />
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
