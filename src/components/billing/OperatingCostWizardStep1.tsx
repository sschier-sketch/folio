import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { operatingCostService } from "../../lib/operatingCostService";

interface Property {
  id: string;
  name: string;
  address: string;
}

export default function OperatingCostWizardStep1() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear() - 1
  );

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  async function loadProperties() {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("id, name, address")
      .eq("user_id", user?.id)
      .order("name");

    if (data) {
      setProperties(data);
    }
    setLoading(false);
  }

  const availableYears = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 1 - i
  );

  const canProceed = selectedPropertyId && selectedYear;

  const deadlineYear = selectedYear + 1;

  async function handleNext() {
    if (!user || !canProceed) return;

    setCreating(true);
    setError(null);

    try {
      const { data, error } = await operatingCostService.createStatement(
        user.id,
        {
          property_id: selectedPropertyId,
          year: selectedYear,
        }
      );

      if (error) throw error;

      if (data) {
        navigate(`/abrechnungen/betriebskosten/${data.id}/kosten`);
      }
    } catch (err: any) {
      console.error("Error creating statement:", err);
      setError(
        err.message || "Fehler beim Erstellen der Abrechnung. Bitte versuchen Sie es erneut."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Neue Betriebskostenabrechnung
          </h1>
          <p className="text-gray-400">
            Erstellen Sie eine neue Abrechnung in 3 Schritten
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold mb-2">
                1
              </div>
              <span className="text-sm font-medium text-primary-blue">
                Objekt & Jahr
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 -mt-6" />

            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-semibold mb-2">
                2
              </div>
              <span className="text-sm text-gray-400">Kosten erfassen</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 -mt-6" />

            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-semibold mb-2">
                3
              </div>
              <span className="text-sm text-gray-400">Versand</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-dark mb-6">
            Schritt 1: Immobilie und Abrechnungsjahr wählen
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Lade Immobilien...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">Fehler</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immobilie <span className="text-red-500">*</span>
                </label>
                {properties.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      Sie haben noch keine Immobilien angelegt. Bitte erstellen
                      Sie zuerst eine Immobilie.
                    </p>
                    <button
                      onClick={() => navigate("/dashboard?view=properties")}
                      className="mt-3 px-4 py-2 bg-primary-blue text-white rounded-full text-sm font-medium hover:bg-primary-blue transition-colors"
                    >
                      Zur Immobilienverwaltung
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Immobilie auswählen...</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                        {property.address && ` - ${property.address}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abrechnungsjahr <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {selectedYear && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Hinweis zur Abrechnungsfrist
                    </h4>
                    <p className="text-sm text-blue-700">
                      Die Betriebskostenabrechnung für das Jahr {selectedYear}{" "}
                      muss bis zum <strong>31.12.{deadlineYear}</strong>{" "}
                      erstellt und versendet werden.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => navigate("/dashboard?view=billing")}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            disabled={creating}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed || creating || properties.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Erstelle...
              </>
            ) : (
              <>
                Weiter
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
