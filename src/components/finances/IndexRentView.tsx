import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  EyeOff,
  ArrowUpRight,
  Calendar,
  Loader2,
  Send,
  CalendarClock,
  AlertOctagon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { createRentPeriod } from "../../lib/rentPeriods";
import { computeDeliveryTiming, formatDateDE, type DeliveryTiming } from "../../lib/indexRentTiming";
import IndexRentWizard from "./index-rent-wizard/IndexRentWizard";
import type { WizardCalc } from "./index-rent-wizard/types";

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
    property_id: string;
    contract_start: string | null;
    start_date: string | null;
    cold_rent: number;
    base_rent: number;
    additional_costs: number;
    utilities_advance: number;
    unit_id: string | null;
    tenants?: {
      id: string;
      name: string;
      first_name: string;
      last_name: string;
      salutation: string | null;
      street: string | null;
      house_number: string | null;
      zip_code: string | null;
      city: string | null;
    };
    properties?: {
      id: string;
      name: string;
      address: string;
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
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "-";
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
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
  const [wizardCalc, setWizardCalc] = useState<WizardCalc | null>(null);
  const [markAppliedTarget, setMarkAppliedTarget] = useState<IndexRentCalculation | null>(null);

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
            property_id,
            contract_start,
            start_date,
            cold_rent,
            base_rent,
            additional_costs,
            utilities_advance,
            unit_id,
            tenants:tenant_id (id, name, first_name, last_name, email, salutation, street, house_number, zip_code, city),
            properties:property_id (id, name, address)
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
          message: "Keine Verträge zu prüfen",
          details:
            "Es wurden keine Verträge mit Indexmiete gefunden.",
        });
      } else if (data.calculations_created === 0) {
        setResult({
          type: "info",
          message: `${data.contracts_checked} ${data.contracts_checked === 1 ? "Vertrag" : "Verträge"} geprüft`,
          details:
            "Keine neue Indexerhöhung möglich. Entweder läuft die Mindestfrist noch oder es besteht bereits eine offene Berechnung.",
        });
      } else {
        setResult({
          type: "success",
          message: `${data.calculations_created} mögliche ${data.calculations_created === 1 ? "Indexerhöhung" : "Indexerhöhungen"} gefunden`,
          details: `${data.contracts_checked} ${data.contracts_checked === 1 ? "Vertrag wurde" : "Verträge wurden"} geprüft. Bitte prüfen Sie den aktuellen VPI und entscheiden Sie, ob Sie die Erhöhung vornehmen möchten.`,
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
          "Es ist ein Fehler beim Verarbeiten der Berechnungen aufgetreten. Bitte versuchen Sie es später erneut.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const markAsApplied = (calculationId: string) => {
    const calc = calculations.find((c) => c.id === calculationId);
    if (calc) setMarkAppliedTarget(calc);
  };

  const confirmMarkAsApplied = async (calculationId: string, appliedDate: string, contractId: string, currentRent: number, utilities: number) => {
    try {
      const { error } = await supabase
        .from("index_rent_calculations")
        .update({
          status: "applied",
          applied_at: new Date(appliedDate).toISOString(),
        })
        .eq("id", calculationId);

      if (error) throw error;

      if (user) {
        await createRentPeriod({
          contractId,
          userId: user.id,
          effectiveDate: appliedDate,
          coldRent: currentRent,
          utilities,
          reason: "index",
          status: "active",
          notes: "Indexmieterhöhung als durchgeführt markiert",
          syncToContract: true,
        });
      }

      setMarkAppliedTarget(null);
      loadCalculations();
    } catch (error) {
      console.error("Error marking as applied:", error);
      alert("Fehler beim Markieren als durchgeführt");
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
            Automatische Prüfung der Mietanpassung nach §557b BGB
            (täglich um 3:00 Uhr)
          </p>
        </div>
        <Button
          onClick={processCalculations}
          disabled={processing}
          variant="primary"
        >
          {processing ? "Prüfe..." : "Jetzt prüfen"}
        </Button>
      </div>

      {lastRun && (
        <div className="bg-white rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-dark mb-1">
                Letzte automatische Prüfung
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
                    : "Verträge"}{" "}
                  geprüft
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
                  mögliche{" "}
                  {lastRun.calculations_created === 1
                    ? "Erhöhung"
                    : "Erhöhungen"}{" "}
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
                        ? "Keine Verträge"
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
        className="border rounded-lg p-4"
      >
        <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
        <p className="text-sm text-blue-900">
          Indexmieten werden rechtlich erst nach schriftlicher
          Mieterhöhungserklärung wirksam (§557b BGB). Dieses System
          erinnert Sie, wenn eine Indexmieterhöhung möglich ist. Bitte
          prüfen Sie den aktuellen Verbraucherpreisindex (VPI) der Deutschen
          Bundesbank und berechnen Sie die konkrete Erhöhung selbst. Sie
          entscheiden, ob und wann Sie die Erhöhung gegenüber dem Mieter
          geltend machen.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabButton
          active={activeTab === "open"}
          onClick={() => setActiveTab("open")}
          count={counts.open}
          highlight={counts.open > 0}
        >
          Mögliche Erhöhungen
        </TabButton>
        <TabButton
          active={activeTab === "applied"}
          onClick={() => setActiveTab("applied")}
          count={counts.applied}
        >
          Durchgeführt
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
              onStartWizard={(wc) => setWizardCalc(wc)}
            />
          ))}
        </div>
      )}

      {wizardCalc && (
        <IndexRentWizard
          calc={wizardCalc}
          onClose={() => setWizardCalc(null)}
          onComplete={() => {
            setWizardCalc(null);
            loadCalculations();
          }}
        />
      )}

      {markAppliedTarget && (
        <MarkAppliedModal
          calc={markAppliedTarget}
          onClose={() => setMarkAppliedTarget(null)}
          onConfirm={confirmMarkAsApplied}
        />
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
          ? "border-[#3c8af7] text-[#3c8af7]"
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
      title: "Keine offenen Indexerhöhungen",
      description:
        "Aktuell gibt es keine möglichen Indexmieterhöhungen. Berechnungen werden automatisch erstellt, sobald die Voraussetzungen erfüllt sind (12 Monate seit Mietbeginn oder letzter Erhöhung).",
    },
    applied: {
      icon: <CheckCircle className="w-12 h-12 text-gray-400" />,
      title: "Noch keine Erhöhungen durchgeführt",
      description:
        "Hier erscheinen Indexmieterhöhungen, die Sie als durchgeführt markiert haben.",
    },
    dismissed: {
      icon: <EyeOff className="w-12 h-12 text-gray-400" />,
      title: "Keine ausgeblendeten Erhöhungen",
      description:
        "Hier erscheinen Berechnungen, die Sie ausgeblendet haben. Diese können jederzeit wiederhergestellt werden.",
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
  onStartWizard,
}: {
  calc: IndexRentCalculation;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  onStartWizard: (wc: WizardCalc) => void;
}) {
  const tenantName =
    calc.rental_contract?.tenants?.name || "Unbekannter Mieter";
  const propertyName =
    calc.rental_contract?.properties?.name || "Unbekannte Immobilie";
  const currentRent = calc.rental_contract?.monthly_rent || 0;
  const isOpen =
    calc.status === "pending" ||
    calc.status === "calculated" ||
    calc.status === "notified";

  const timing = useMemo(
    () => (isOpen ? computeDeliveryTiming(calc.possible_since) : null),
    [calc.possible_since, isOpen]
  );

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden ${
        isOpen && timing?.timingStatus === "NOW_OPTIMAL"
          ? "border-emerald-300"
          : isOpen
            ? "border-amber-200"
            : "border-gray-200"
      }`}
    >
      {isOpen && calc.possible_since && (
        <div className={`px-6 py-2.5 flex flex-col gap-1.5 border-b ${
          timing?.timingStatus === "NOW_OPTIMAL"
            ? "bg-emerald-50 border-emerald-200"
            : timing?.timingStatus === "MISSED_WINDOW"
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-2">
            <ArrowUpRight className={`w-4 h-4 ${
              timing?.timingStatus === "NOW_OPTIMAL" ? "text-emerald-600" : timing?.timingStatus === "MISSED_WINDOW" ? "text-red-600" : "text-amber-600"
            }`} />
            <span className={`text-sm font-medium ${
              timing?.timingStatus === "NOW_OPTIMAL" ? "text-emerald-800" : timing?.timingStatus === "MISSED_WINDOW" ? "text-red-800" : "text-amber-800"
            }`}>
              Erhöhung möglich {calc.possible_since && calc.possible_since > new Date().toISOString().split("T")[0] ? "zum" : "seit"} {formatDate(calc.possible_since)}
            </span>
          </div>
          {timing && <TimingBanner timing={timing} />}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-semibold text-dark text-lg">{tenantName}</h3>
            <p className="text-sm text-gray-500">{propertyName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOpen && timing?.timingStatus === "NOW_OPTIMAL" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Jetzt zustellen
              </span>
            )}
            <StatusBadge status={calc.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <MetricBox
            label="Aktuelle Miete"
            value={formatCurrency(currentRent)}
            sublabel="pro Monat"
          />
          <MetricBox
            label="Basismonat"
            value={calc.basis_monat || "–"}
            sublabel={calc.basis_monat ? "für VPI-Vergleich" : "siehe Hinweis unten"}
          />
          <MetricBox
            label="Vergleichsmonat"
            value={calc.aktueller_monat || "–"}
            sublabel="für VPI-Vergleich"
          />
          {calc.wohnflaeche_qm ? (
            <MetricBox
              label="Wohnfläche"
              value={`${calc.wohnflaeche_qm} m²`}
            />
          ) : (
            <MetricBox
              label="Geprüft am"
              value={formatDate(calc.calculation_date)}
            />
          )}
        </div>

        {isOpen && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            {calc.basis_monat ? (
              <p className="text-sm text-blue-800">
                Bitte prüfen Sie den aktuellen VPI-Wert für den Vergleichsmonat{" "}
                <span className="font-semibold">{calc.aktueller_monat}</span> und
                vergleichen Sie ihn mit dem Basismonat{" "}
                <span className="font-semibold">{calc.basis_monat}</span>, um die
                konkrete Erhöhung zu berechnen.
              </p>
            ) : (
              <p className="text-sm text-blue-800">
                Bitte verwenden Sie als Basismonat den bei der letzten Erhöhung
                verwendeten VPI-Monat. Falls bislang nie eine Erhöhung stattfand,
                verwenden Sie den Monat des Mietbeginns. Als Vergleichsmonat ist
                standardmäßig der Vormonat eingetragen – Sie können jedoch auch
                einen anderen Monat wählen (z.{"\u00A0"}B. 3 Monate zurück).
              </p>
            )}
            {timing && (
              <p className="text-xs text-blue-700 mt-2 pt-2 border-t border-blue-200">
                Zustellfenster (für frühestmögliche Wirksamkeit): {formatDateDE(timing.serviceWindowStart)} – {formatDateDE(timing.serviceWindowEnd)}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-400">
            {calc.status === "applied" && calc.applied_at && (
              <>Durchgeführt am {formatDate(calc.applied_at)}</>
            )}
            {calc.status === "dismissed" && calc.dismissed_at && (
              <>Ausgeblendet am {formatDate(calc.dismissed_at)}</>
            )}
            {calc.wohnflaeche_qm && (
              <span className="text-gray-500">
                Geprüft am {formatDate(calc.calculation_date)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOpen && (
              <>
                <Button
                  onClick={() => onDismiss(calc.id)}
                  variant="secondary"
                >
                  Ausblenden
                </Button>
                <Button
                  onClick={() => onApply(calc.id)}
                  variant="secondary"
                >
                  Als durchgeführt markieren
                </Button>
                {calc.rental_contract?.tenants && calc.rental_contract?.properties && (
                  <Button
                    onClick={() => {
                      const rc = calc.rental_contract!;
                      const wc: WizardCalc = {
                        id: calc.id,
                        contract_id: calc.contract_id,
                        calculation_date: calc.calculation_date,
                        basis_monat: calc.basis_monat,
                        aktueller_monat: calc.aktueller_monat,
                        possible_since: calc.possible_since || null,
                        rental_contract: {
                          tenant_id: rc.tenant_id,
                          monthly_rent: rc.monthly_rent,
                          property_id: rc.property_id,
                          contract_start: rc.contract_start,
                          start_date: rc.start_date,
                          cold_rent: rc.cold_rent,
                          base_rent: rc.base_rent,
                          unit_id: rc.unit_id,
                          tenants: rc.tenants!,
                          properties: rc.properties!,
                        },
                      };
                      onStartWizard(wc);
                    }}
                    variant="primary"
                  >
                    Erhöhung erstellen
                  </Button>
                )}
              </>
            )}
            {calc.status === "dismissed" && (
              <Button
                onClick={() => onRestore(calc.id)}
                variant="secondary"
              >
                Wiederherstellen
              </Button>
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

function MarkAppliedModal({
  calc,
  onClose,
  onConfirm,
}: {
  calc: IndexRentCalculation;
  onClose: () => void;
  onConfirm: (calculationId: string, appliedDate: string, contractId: string, currentRent: number, utilities: number) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [dateOption, setDateOption] = useState<"today" | "custom">("today");
  const [customDate, setCustomDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const currentRent = calc.rental_contract?.monthly_rent || calc.rental_contract?.cold_rent || calc.rental_contract?.base_rent || 0;
  const utilities = calc.rental_contract?.additional_costs || calc.rental_contract?.utilities_advance || 0;
  const tenantName = calc.rental_contract?.tenants?.name || "Unbekannter Mieter";

  const handleConfirm = async () => {
    setSaving(true);
    const date = dateOption === "today" ? today : customDate;
    onConfirm(calc.id, date, calc.contract_id, currentRent, utilities);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-dark">Als durchgeführt markieren</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Wählen Sie das Datum, an dem die Mieterhöhung für <span className="font-semibold">{tenantName}</span> durchgeführt wurde. Dieses Datum wird als letzte Mieterhöhung gespeichert und für die nächste Indexberechnung verwendet.
          </p>

          <div className="space-y-3">
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                dateOption === "today" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="dateOption"
                checked={dateOption === "today"}
                onChange={() => setDateOption("today")}
                className="accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-dark">Heutiges Datum verwenden</p>
                <p className="text-xs text-gray-500">{formatDate(today)}</p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                dateOption === "custom" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="dateOption"
                checked={dateOption === "custom"}
                onChange={() => setDateOption("custom")}
                className="mt-0.5 accent-blue-600"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-dark">Anderes Datum wählen</p>
                {dateOption === "custom" && (
                  <div className="mt-2 relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      max={today}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              Das gewählte Datum wird in der Miethistorie als Zeitpunkt der letzten Indexmieterhöhung hinterlegt. Die nächste Erhöhung kann frühestens 12 Monate nach diesem Datum erfolgen.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button onClick={onClose} variant="secondary">Abbrechen</Button>
          <Button onClick={handleConfirm} disabled={saving} variant="primary">
            {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Speichern...</> : "Bestätigen"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimingBanner({ timing }: { timing: DeliveryTiming }) {
  if (timing.timingStatus === "NOW_OPTIMAL") {
    return (
      <div className="flex items-center gap-2 ml-6">
        <Send className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-sm text-emerald-800">
          Jetzt bis <span className="font-semibold">{formatDateDE(timing.serviceWindowEnd)}</span> zustellen,
          damit die Erhöhung ab <span className="font-semibold">{formatDateDE(timing.nextEarliestEffectiveFrom)}</span> wirksam
          wird (kein Ertrag verloren).
        </span>
      </div>
    );
  }

  if (timing.timingStatus === "BEFORE_WINDOW") {
    return (
      <div className="flex items-center gap-2 ml-6">
        <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-sm text-amber-800">
          Ab <span className="font-semibold">{formatDateDE(timing.serviceWindowStart)}</span> zustellen,
          damit die Erhöhung ab <span className="font-semibold">{formatDateDE(timing.nextEarliestEffectiveFrom)}</span> wirksam wird.
        </span>
      </div>
    );
  }

  if (timing.timingStatus === "MISSED_WINDOW") {
    return (
      <div className="flex items-center gap-2 ml-6">
        <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
        <span className="text-sm text-red-800">
          Zustellfrist für Wirksamkeit ab {formatDateDE(timing.nextEarliestEffectiveFrom)} verpasst.
          Bei Zustellung heute wird die Erhöhung ab <span className="font-semibold">{formatDateDE(timing.nextEffectiveIfSendToday)}</span> wirksam.
        </span>
      </div>
    );
  }

  return null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    pending: {
      label: "Ausstehend",
      classes: "bg-yellow-100 text-yellow-700",
    },
    calculated: {
      label: "Erhöhung möglich",
      classes: "bg-amber-100 text-amber-700",
    },
    notified: {
      label: "Benachrichtigt",
      classes: "bg-orange-100 text-orange-700",
    },
    applied: {
      label: "Durchgeführt",
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
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.classes}`}
    >
      {c.label}
    </span>
  );
}
