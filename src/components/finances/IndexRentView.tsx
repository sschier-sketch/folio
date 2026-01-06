import { useState, useEffect } from "react";
import { Calculator, TrendingUp, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface IndexRentCalculation {
  id: string;
  contract_id: string;
  calculation_date: string;
  basis_monat: string;
  basis_index: number;
  aktueller_monat: string;
  aktueller_index: number;
  ausgangsmiete_eur_qm: number;
  neue_miete_eur_qm: number;
  wohnflaeche_qm?: number;
  gesamtmiete_eur?: number;
  status: "pending" | "calculated" | "notified" | "applied";
  notified_at?: string;
  applied_at?: string;
  notes?: string;
  created_at: string;
  rental_contract?: {
    tenant_id: string;
    tenants?: {
      name: string;
    };
    properties?: {
      name: string;
    };
  };
}

export default function IndexRentView() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<IndexRentCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadCalculations();
    }
  }, [user]);

  const loadCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from("index_rent_calculations")
        .select(`
          *,
          rental_contract:rental_contracts!contract_id (
            tenant_id,
            tenants:tenant_id (name),
            properties:property_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalculations(data || []);
    } catch (error) {
      console.error("Error loading calculations:", error);
    } finally {
      setLoading(false);
    }
  };

  const processCalculations = async () => {
    setProcessing(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-index-rent-calculations`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        throw new Error("Fehler beim Verarbeiten der Berechnungen");
      }

      const result = await response.json();
      alert(`Erfolgreich ${result.processed} von ${result.total_contracts} Berechnungen durchgeführt`);
      loadCalculations();
    } catch (error) {
      console.error("Error processing calculations:", error);
      alert("Fehler beim Verarbeiten der Berechnungen");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "calculated":
        return <Calculator className="w-5 h-5 text-blue-500" />;
      case "notified":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "applied":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Ausstehend";
      case "calculated":
        return "Berechnet";
      case "notified":
        return "Benachrichtigt";
      case "applied":
        return "Angewendet";
      default:
        return status;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const markAsApplied = async (calculationId: string) => {
    try {
      const { error } = await supabase
        .from("index_rent_calculations")
        .update({
          status: "applied",
          applied_at: new Date().toISOString(),
        })
        .eq("id", calculationId);

      if (error) throw error;
      loadCalculations();
    } catch (error) {
      console.error("Error marking as applied:", error);
      alert("Fehler beim Aktualisieren des Status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Lade Indexmieten-Berechnungen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">Indexmieten-Berechnungen</h2>
          <p className="text-gray-500 mt-1">
            Automatische Berechnung der Mietanpassung nach §557b BGB
          </p>
        </div>
        <button
          onClick={processCalculations}
          disabled={processing}
          className="px-6 py-3 bg-[#008CFF] text-white rounded-lg font-medium hover:bg-[#0073CC] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          {processing ? "Verarbeite..." : "Berechnungen durchführen"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Wichtiger Hinweis</h3>
          <p className="text-sm text-blue-800">
            Indexmieten werden rechtlich erst nach schriftlicher Mieterhöhungserklärung wirksam (§557b BGB).
            Die hier berechneten Werte sind Empfehlungen basierend auf dem Verbraucherpreisindex (VPI) der
            Deutschen Bundesbank.
          </p>
        </div>
      </div>

      {calculations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            Noch keine Indexmieten-Berechnungen vorhanden.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Berechnungen werden automatisch 1 Jahr nach Mietbeginn für Verträge mit Indexmiete erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(calc.status)}
                  <div>
                    <h3 className="font-semibold text-dark">
                      {calc.rental_contract?.tenants?.name || "Unbekannter Mieter"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {calc.rental_contract?.properties?.name || "Unbekannte Immobilie"}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    calc.status === "applied"
                      ? "bg-green-100 text-green-700"
                      : calc.status === "notified"
                      ? "bg-orange-100 text-orange-700"
                      : calc.status === "calculated"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {getStatusText(calc.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Basis-Monat</p>
                  <p className="font-semibold text-dark">{calc.basis_monat}</p>
                  <p className="text-sm text-gray-600">Index: {calc.basis_index}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Aktueller Monat</p>
                  <p className="font-semibold text-dark">{calc.aktueller_monat}</p>
                  <p className="text-sm text-gray-600">Index: {calc.aktueller_index}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ausgangsmiete/m²</p>
                  <p className="font-semibold text-dark">
                    {formatCurrency(calc.ausgangsmiete_eur_qm)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Neue Miete/m²</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(calc.neue_miete_eur_qm)}
                  </p>
                  <p className="text-xs text-green-600">
                    +{((calc.neue_miete_eur_qm / calc.ausgangsmiete_eur_qm - 1) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {calc.wohnflaeche_qm && calc.gesamtmiete_eur && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Wohnfläche</p>
                      <p className="font-semibold text-dark">{calc.wohnflaeche_qm} m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Neue Gesamtmiete</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(calc.gesamtmiete_eur)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {calc.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{calc.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Berechnet am: {new Date(calc.calculation_date).toLocaleDateString("de-DE")}
                </p>
                {calc.status !== "applied" && (
                  <button
                    onClick={() => markAsApplied(calc.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Als angewendet markieren
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
