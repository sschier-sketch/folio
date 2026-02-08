import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ArrowUpRight,
  Bell,
} from "lucide-react";
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
  status: "pending" | "calculated" | "notified" | "applied" | "dismissed";
  notified_at?: string;
  applied_at?: string;
  dismissed_at?: string;
  possible_since?: string;
  notes?: string;
  created_at: string;
  rental_contract?: {
    tenant_id: string;
    monthly_rent: number;
    tenants?: { name: string };
    properties?: { name: string };
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

type TabFilter = "open" | "applied" | "dismissed";

const formatCurrency = (amount?: number) => {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function IndexRentView() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<IndexRentCalculation[]>([]);
  const [lastRun, setLastRun] = useState<CalculationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("open");

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
            monthly_rent,
            tenants:tenant_id (name),
            properties:property_id (name)
          )
        `)
        .eq("user_id", user?.id)
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
      const { data: globalRun, error: globalRunError } = await supabase
        .from("index_rent_calculation_runs")
        .select("*")
        .order("run_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalRunError) throw globalRunError;

      if (globalRun) {
        const { count: userContractsCount } = await supabase
          .from("rental_contracts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("rent_increase_type", "index")
          .or(
            `contract_end.is.null,contract_end.gte.${new Date().toISOString().split("T")[0]}`
          );

        const { data: userCalculations } = await supabase
          .from("index_rent_calculations")
          .select("id")
          .eq("user_id", user?.id)
          .gte("created_at", globalRun.run_date);

        setLastRun({
          ...globalRun,
          contracts_checked: userContractsCount || 0,
          calculations_created: userCalculations?.length || 0,
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
      const { data, error } = await supabase.rpc(
        "run_automatic_index_rent_calculations"
      );

      if (error) throw error;

      if (data.status === "error") {
        setResult({
          type: "info",
          message: "Fehler bei der Verarbeitung",
          details: data.error_message || "Es ist ein Fehler aufgetreten.",
        });
      } else if (data.contracts_checked === 0) {
        setResult({
          type: "info",
          message: "Keine Vertraege zu pruefen",
          details:
            "Es wurden keine Vertraege mit Indexmiete gefunden.",
        });
      } else if (data.calculations_created === 0) {
        setResult({
          type: "info",
          message: `${data.contracts_checked} ${data.contracts_checked === 1 ? "Vertrag" : "Vertraege"} geprueft`,
          details:
            "Keine neue Indexerhoehung moeglich. Entweder laeuft die Mindestfrist noch oder es besteht bereits eine offene Berechnung.",
        });
      } else {
        setResult({
          type: "success",
          message: `${data.calculations_created} moegliche ${data.calculations_created === 1 ? "Indexerhoehung" : "Indexerhoehungen"} berechnet`,
          details: `${data.contracts_checked} ${data.contracts_checked === 1 ? "Vertrag wurde" : "Vertraege wurden"} geprueft. Pruefen Sie die Details unten und entscheiden Sie, ob Sie die Erhoehung vornehmen moechten.`,
        });
      }

      loadCalculations();
      loadLastRun();
    } catch (error) {
      console.error("Error processing calculations:", error);
      setResult({
        type: "info",
        message: "Fehler bei der Verarbeitung",
        details:
          "Es ist ein Fehler beim Verarbeiten der Berechnungen aufgetreten. Bitte versuchen Sie es spaeter erneut.",
      });
    } finally {
      setProcessing(false);
    }
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
    }
  };

  const dismissCalculation = async (calculationId: string) => {
    try {
      const { error } = await supabase
        .from("index_rent_calculations")
        .update({
          status: "dismissed",
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", calculationId);

      if (error) throw error;
      loadCalculations();
    } catch (error) {
      console.error("Error dismissing calculation:", error);
    }
  };

  const undismissCalculation = async (calculationId: string) => {
    try {
      const { error } = await supabase
        .from("index_rent_calculations")
        .update({
          status: "calculated",
          dismissed_at: null,
        })
        .eq("id", calculationId);

      if (error) throw error;
      loadCalculations();
    } catch (error) {
      console.error("Error restoring calculation:", error);
    }
  };

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "open":
        return calculations.filter(
          (c) =>
            c.status === "pending" ||
            c.status === "calculated" ||
            c.status === "notified"
        );
      case "applied":
        return calculations.filter((c) => c.status === "applied");
      case "dismissed":
        return calculations.filter((c) => c.status === "dismissed");
    }
  }, [calculations, activeTab]);

  const counts = useMemo(() => {
    const open = calculations.filter(
      (c) =>
        c.status === "pending" ||
        c.status === "calculated" ||
        c.status === "notified"
    ).length;
    const applied = calculations.filter((c) => c.status === "applied").length;
    const dismissed = calculations.filter(
      (c) => c.status === "dismissed"
    ).length;
    return { open, applied, dismissed };
  }, [calculations]);

  const summaryMetrics = useMemo(() => {
    const openCalcs = calculations.filter(
      (c) =>
        c.status === "pending" ||
        c.status === "calculated" ||
        c.status === "notified"
    );
    const totalPending = openCalcs.length;
    const totalDiffMonthly = openCalcs.reduce((sum, c) => {
      const oldTotal = c.rental_contract?.monthly_rent || 0;
      const newTotal = c.gesamtmiete_eur || 0;
      return sum + (newTotal - oldTotal);
    }, 0);

    return { totalPending, totalDiffMonthly };
  }, [calculations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">Indexmiete</h2>
          <p className="text-gray-500 mt-1">
            Automatische Pruefung der Mietanpassung nach &sect;557b BGB
            (taeglich um 3:00 Uhr)
          </p>
        </div>
        <button
          onClick={processCalculations}
          disabled={processing}
          className="px-6 py-3 bg-[#008CFF] text-white rounded-full font-medium hover:bg-[#0073CC] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          {processing ? "Pruefe..." : "Jetzt pruefen"}
        </button>
      </div>

      {summaryMetrics.totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">
              {summaryMetrics.totalPending} moegliche{" "}
              {summaryMetrics.totalPending === 1
                ? "Indexmieterhoehung"
                : "Indexmieterhoehungen"}
            </h3>
            <p className="text-sm text-amber-800 mt-0.5">
              {summaryMetrics.totalDiffMonthly > 0 && (
                <>
                  Moegliches Mietplus:{" "}
                  <span className="font-semibold">
                    +{formatCurrency(summaryMetrics.totalDiffMonthly)}
                  </span>{" "}
                  pro Monat.{" "}
                </>
              )}
              Pruefen Sie die Berechnungen und entscheiden Sie, ob Sie die
              Erhoehung vornehmen moechten.
            </p>
          </div>
        </div>
      )}

      {lastRun && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-dark mb-1">
                Letzte automatische Pruefung
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(lastRun.run_date).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                um{" "}
                {new Date(lastRun.run_date).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                Uhr
              </p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-gray-700">
                  <span className="font-medium">
                    {lastRun.contracts_checked}
                  </span>{" "}
                  {lastRun.contracts_checked === 1
                    ? "Vertrag"
                    : "Vertraege"}{" "}
                  geprueft
                </span>
                <span className="text-gray-400">&bull;</span>
                <span
                  className={
                    lastRun.calculations_created > 0
                      ? "text-amber-600 font-medium"
                      : "text-gray-700"
                  }
                >
                  <span className="font-medium">
                    {lastRun.calculations_created}
                  </span>{" "}
                  moegliche{" "}
                  {lastRun.calculations_created === 1
                    ? "Erhoehung"
                    : "Erhoehungen"}{" "}
                  gefunden
                </span>
                <span className="text-gray-400">&bull;</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lastRun.status === "success"
                      ? "bg-green-100 text-green-700"
                      : lastRun.status === "error"
                        ? "bg-red-100 text-red-700"
                        : lastRun.status === "no_contracts"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {lastRun.status === "success"
                    ? "Erfolgreich"
                    : lastRun.status === "error"
                      ? "Fehler"
                      : lastRun.status === "no_contracts"
                        ? "Keine Vertraege"
                        : "Ausstehend"}
                </span>
              </div>
              {lastRun.error_message && (
                <p className="text-sm text-red-600 mt-2">
                  {lastRun.error_message}
                </p>
              )}
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
                  result.type === "success"
                    ? "text-green-800"
                    : "text-blue-800"
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

      <div
        style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }}
        className="border rounded-lg p-4 flex items-start gap-3"
      >
        <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Wichtiger Hinweis
          </h3>
          <p className="text-sm text-blue-800">
            Indexmieten werden rechtlich erst nach schriftlicher
            Mieterhoehungserklaerung wirksam (&sect;557b BGB). Die hier
            berechneten Werte sind Empfehlungen basierend auf dem
            Verbraucherpreisindex (VPI) der Deutschen Bundesbank. Sie
            entscheiden, ob und wann Sie die Erhoehung gegenueber dem Mieter
            geltend machen.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabButton
          active={activeTab === "open"}
          onClick={() => setActiveTab("open")}
          count={counts.open}
          highlight={counts.open > 0}
        >
          Moegliche Erhoehungen
        </TabButton>
        <TabButton
          active={activeTab === "applied"}
          onClick={() => setActiveTab("applied")}
          count={counts.applied}
        >
          Durchgefuehrt
        </TabButton>
        <TabButton
          active={activeTab === "dismissed"}
          onClick={() => setActiveTab("dismissed")}
          count={counts.dismissed}
        >
          Ausgeblendet
        </TabButton>
      </div>

      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {filtered.map((calc) => (
            <CalculationCard
              key={calc.id}
              calc={calc}
              onApply={markAsApplied}
              onDismiss={dismissCalculation}
              onRestore={undismissCalculation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  highlight,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#008CFF] text-[#008CFF]"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
            highlight && !active
              ? "bg-amber-100 text-amber-700"
              : active
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ tab }: { tab: TabFilter }) {
  const config = {
    open: {
      icon: <Calculator className="w-12 h-12 text-gray-400" />,
      title: "Keine offenen Indexerhoehungen",
      description:
        "Aktuell gibt es keine moeglichen Indexmieterhoehungen. Berechnungen werden automatisch erstellt, sobald die Voraussetzungen erfuellt sind (12 Monate seit Mietbeginn oder letzter Erhoehung).",
    },
    applied: {
      icon: <CheckCircle className="w-12 h-12 text-gray-400" />,
      title: "Noch keine Erhoehungen durchgefuehrt",
      description:
        "Hier erscheinen Indexmieterhoehungen, die Sie als durchgefuehrt markiert haben.",
    },
    dismissed: {
      icon: <EyeOff className="w-12 h-12 text-gray-400" />,
      title: "Keine ausgeblendeten Erhoehungen",
      description:
        "Hier erscheinen Berechnungen, die Sie ausgeblendet haben. Diese koennen jederzeit wiederhergestellt werden.",
    },
  };
  const c = config[tab];

  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="mx-auto mb-3 flex justify-center">{c.icon}</div>
      <p className="text-gray-500 font-medium">{c.title}</p>
      <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
        {c.description}
      </p>
    </div>
  );
}

function CalculationCard({
  calc,
  onApply,
  onDismiss,
  onRestore,
}: {
  calc: IndexRentCalculation;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const tenantName =
    calc.rental_contract?.tenants?.name || "Unbekannter Mieter";
  const propertyName =
    calc.rental_contract?.properties?.name || "Unbekannte Immobilie";
  const oldRent = calc.rental_contract?.monthly_rent || 0;
  const newRent = calc.gesamtmiete_eur || 0;
  const diff = newRent - oldRent;
  const pctIncrease =
    oldRent > 0 ? ((newRent / oldRent - 1) * 100).toFixed(2) : "0.00";
  const isOpen =
    calc.status === "pending" ||
    calc.status === "calculated" ||
    calc.status === "notified";

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${
        isOpen ? "border-amber-200" : "border-gray-200"
      }`}
    >
      {isOpen && calc.possible_since && (
        <div className="bg-amber-50 px-6 py-2.5 flex items-center gap-2 border-b border-amber-200">
          <ArrowUpRight className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Erhoehung moeglich seit {formatDate(calc.possible_since)}
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-semibold text-dark text-lg">{tenantName}</h3>
            <p className="text-sm text-gray-500">{propertyName}</p>
          </div>
          <StatusBadge status={calc.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <MetricBox
            label="Aktuelle Miete"
            value={formatCurrency(oldRent)}
            sublabel="pro Monat"
          />
          <MetricBox
            label="Neue Miete (berechnet)"
            value={formatCurrency(newRent)}
            sublabel="pro Monat"
            highlight
          />
          <MetricBox
            label="Differenz"
            value={diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
            sublabel="pro Monat"
            highlight
          />
          <MetricBox
            label="Erhoehung"
            value={`+${pctIncrease}%`}
            sublabel="nach VPI"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-400">Basis-Monat</p>
            <p className="text-sm font-medium text-gray-700">
              {calc.basis_monat}{" "}
              <span className="text-gray-400">(Index: {calc.basis_index})</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Aktueller Monat</p>
            <p className="text-sm font-medium text-gray-700">
              {calc.aktueller_monat}{" "}
              <span className="text-gray-400">
                (Index: {calc.aktueller_index})
              </span>
            </p>
          </div>
          {calc.wohnflaeche_qm && (
            <div>
              <p className="text-xs text-gray-400">Wohnflaeche</p>
              <p className="text-sm font-medium text-gray-700">
                {calc.wohnflaeche_qm} m&sup2;
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Berechnet am</p>
            <p className="text-sm font-medium text-gray-700">
              {formatDate(calc.calculation_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-400">
            {calc.status === "applied" && calc.applied_at && (
              <>Durchgefuehrt am {formatDate(calc.applied_at)}</>
            )}
            {calc.status === "dismissed" && calc.dismissed_at && (
              <>Ausgeblendet am {formatDate(calc.dismissed_at)}</>
            )}
            {isOpen && calc.notes && (
              <span className="text-gray-500">{calc.notes}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOpen && (
              <>
                <button
                  onClick={() => onDismiss(calc.id)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <EyeOff className="w-4 h-4" />
                  Ausblenden
                </button>
                <button
                  onClick={() => onApply(calc.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Als durchgefuehrt markieren
                </button>
              </>
            )}
            {calc.status === "dismissed" && (
              <button
                onClick={() => onRestore(calc.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                Wiederherstellen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-lg font-bold ${highlight ? "text-emerald-600" : "text-dark"}`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    pending: {
      label: "Ausstehend",
      classes: "bg-yellow-100 text-yellow-700",
    },
    calculated: {
      label: "Erhoehung moeglich",
      classes: "bg-amber-100 text-amber-700",
    },
    notified: {
      label: "Benachrichtigt",
      classes: "bg-orange-100 text-orange-700",
    },
    applied: {
      label: "Durchgefuehrt",
      classes: "bg-green-100 text-green-700",
    },
    dismissed: {
      label: "Ausgeblendet",
      classes: "bg-gray-100 text-gray-500",
    },
  };
  const c = config[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${c.classes}`}
    >
      {c.label}
    </span>
  );
}
