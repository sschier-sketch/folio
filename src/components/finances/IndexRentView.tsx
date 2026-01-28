import { useState, useEffect } from "react";
import { Calculator, TrendingUp, FileText, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
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

interface CalculationResult {
  type: "success" | "info";
  message: string;
  details?: string;
}

interface CalculationRun {
  id: string;
  run_date: string;
  contracts_checked: number;
  calculations_created: number;
  status: string;
  error_message?: string;
}

export default function IndexRentView() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<IndexRentCalculation[]>([]);
  const [lastRun, setLastRun] = useState<CalculationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    if (user) {
      loadCalculations();
      loadLastRun();
    }
  }, [user]);

  const loadCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from("index_rent_calculations")
        .select(`
          *,
          rental_contract:rental_contracts!contract_id (
            user_id,
            tenant_id,
            tenants:tenant_id (name),
            properties:property_id (name)
          )
        `)
        .eq("rental_contracts.user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalculations(data || []);
    } catch (error) {
      console.error("Error loading calculations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastRun = async () => {
    try {
      // Get the last global run date
      const { data: globalRun, error: globalRunError } = await supabase
        .from("index_rent_calculation_runs")
        .select("*")
        .order("run_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalRunError) throw globalRunError;

      if (globalRun) {
        // Count user-specific contracts that would be checked
        const { count: userContractsCount, error: contractsError } = await supabase
          .from("rental_contracts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("rent_type", "index_rent")
          .is("contract_end", null)
          .or(`contract_end.gte.${new Date().toISOString().split('T')[0]}`);

        if (contractsError) throw contractsError;

        // Count user-specific calculations created during the last run
        const { data: userCalculations, error: calculationsError } = await supabase
          .from("index_rent_calculations")
          .select("id, rental_contracts!contract_id(user_id)")
          .gte("created_at", globalRun.run_date);

        if (calculationsError) throw calculationsError;

        // Filter calculations for this user
        const userCalculationsCount = userCalculations?.filter(
          (calc: any) => calc.rental_contracts?.user_id === user?.id
        ).length || 0;

        // Create user-specific run info
        setLastRun({
          ...globalRun,
          contracts_checked: userContractsCount || 0,
          calculations_created: userCalculationsCount || 0,
        });
      } else {
        setLastRun(null);
      }
    } catch (error) {
      console.error("Error loading last run:", error);
    }
  };

  const processCalculations = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc('run_automatic_index_rent_calculations');

      if (error) throw error;

      if (data.status === 'error') {
        setResult({
          type: "info",
          message: "Fehler bei der Verarbeitung",
          details: data.error_message || "Es ist ein Fehler aufgetreten."
        });
      } else if (data.contracts_checked === 0) {
        setResult({
          type: "info",
          message: "Keine Verträge zu prüfen",
          details: "Es wurden keine Verträge mit Indexmiete gefunden."
        });
      } else if (data.calculations_created === 0) {
        setResult({
          type: "info",
          message: `${data.contracts_checked} ${data.contracts_checked === 1 ? 'Vertrag' : 'Verträge'} geprüft`,
          details: "Keine Indexerhöhung notwendig. Entweder ist die Mindestfrist noch nicht abgelaufen oder die Indexänderung ist zu gering."
        });
      } else {
        setResult({
          type: "success",
          message: `Berechnung durchgeführt: ${data.calculations_created} ${data.calculations_created === 1 ? 'Indexerhöhung' : 'Indexerhöhungen'} erstellt`,
          details: `${data.contracts_checked} ${data.contracts_checked === 1 ? 'Vertrag wurde' : 'Verträge wurden'} geprüft`
        });
      }

      loadCalculations();
      loadLastRun();
    } catch (error) {
      console.error("Error processing calculations:", error);
      setResult({
        type: "info",
        message: "Fehler bei der Verarbeitung",
        details: "Es ist ein Fehler beim Verarbeiten der Berechnungen aufgetreten. Bitte versuchen Sie es später erneut."
      });
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
            Automatische Berechnung der Mietanpassung nach §557b BGB (täglich um 3:00 Uhr)
          </p>
        </div>
        <button
          onClick={processCalculations}
          disabled={processing}
          className="px-6 py-3 bg-[#008CFF] text-white rounded-full font-medium hover:bg-[#0073CC] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          {processing ? "Verarbeite..." : "Manuelle Berechnung"}
        </button>
      </div>

      {lastRun && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-dark mb-1">Letzte automatische Berechnung</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(lastRun.run_date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })} um {new Date(lastRun.run_date).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} Uhr
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">
                    <span className="font-medium">{lastRun.contracts_checked}</span> {lastRun.contracts_checked === 1 ? 'Vertrag' : 'Verträge'} geprüft
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={lastRun.calculations_created > 0 ? "text-green-600 font-medium" : "text-gray-700"}>
                    <span className="font-medium">{lastRun.calculations_created}</span> {lastRun.calculations_created === 1 ? 'Berechnung' : 'Berechnungen'} erstellt
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lastRun.status === 'success' ? 'bg-green-100 text-green-700' :
                    lastRun.status === 'error' ? 'bg-red-100 text-red-700' :
                    lastRun.status === 'no_contracts' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {lastRun.status === 'success' ? 'Erfolgreich' :
                     lastRun.status === 'error' ? 'Fehler' :
                     lastRun.status === 'no_contracts' ? 'Keine Verträge' :
                     'Ausstehend'}
                  </span>
                </div>
                {lastRun.error_message && (
                  <p className="text-sm text-red-600 mt-2">{lastRun.error_message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-5 flex items-start gap-4 relative ${
            result.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3
              className={`font-semibold mb-1 ${
                result.type === "success" ? "text-green-900" : "text-blue-900"
              }`}
            >
              {result.message}
            </h3>
            {result.details && (
              <p
                className={`text-sm ${
                  result.type === "success" ? "text-green-800" : "text-blue-800"
                }`}
              >
                {result.details}
              </p>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
              result.type === "success"
                ? "hover:bg-green-200 text-green-700"
                : "hover:bg-blue-200 text-blue-700"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

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
                <div>
                  <h3 className="font-semibold text-dark">
                    {calc.rental_contract?.tenants?.name || "Unbekannter Mieter"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {calc.rental_contract?.properties?.name || "Unbekannte Immobilie"}
                  </p>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
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
