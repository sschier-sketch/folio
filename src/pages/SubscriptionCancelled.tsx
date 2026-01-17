import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export function SubscriptionCancelled() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:rounded-lg sm:px-10 text-center">
          <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Zahlung abgebrochen
          </h2>
          <p className="text-gray-600 mb-2">
            Die Zahlung wurde abgebrochen. Keine Sorge - es wurden keine Kosten verursacht.
          </p>
          <p className="text-gray-600 mb-8">
            Sie haben aktuell kein aktives Abonnement und können die Pro-Funktionen nicht nutzen.
          </p>
          <div className="space-y-4">
            <Link
              to="/subscription"
              className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Link>
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
