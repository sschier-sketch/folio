import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Mail,
  AlertTriangle,
  Activity,
  Users,
  Zap,
  Timer,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";

interface RegistrationError {
  id: string;
  created_at: string;
  email: string | null;
  source: string | null;
  step: string | null;
  error_message: string;
  error_code: string | null;
  error_details: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
}

interface HealthStatus {
  status: "healthy" | "warning" | "critical" | "unknown";
  last_success: string | null;
  last_failure: string | null;
  last_failure_message: string | null;
  errors_24h: number;
  checks_24h: number;
  failures_24h: number;
  last_real_signup: string | null;
  real_signups_24h: number;
}

const STATUS_CONFIG = {
  healthy: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "Registrierung funktioniert",
    textColor: "text-emerald-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    label: "Warnung: Erhoehte Fehlerrate",
    textColor: "text-amber-800",
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    label: "KRITISCH: Registrierung gestoert",
    textColor: "text-red-800",
  },
  unknown: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    label: "Kein Healthcheck-Ergebnis",
    textColor: "text-gray-700",
  },
};

export default function RegistrationHealthView() {
  const [errors, setErrors] = useState<RegistrationError[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringCheck, setTriggeringCheck] = useState(false);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [errResult, healthResult] = await Promise.all([
        supabase
          .from("registration_error_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.rpc("check_signup_health_status"),
      ]);

      if (errResult.data) {
        setErrors(errResult.data);
        setUnresolvedCount(
          errResult.data.filter((e: RegistrationError) => !e.resolved).length
        );
      }

      if (healthResult.data) {
        setHealth(healthResult.data as HealthStatus);
      }
    } catch (err) {
      console.error("Error loading registration health data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualCheck = async () => {
    setTriggeringCheck(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-healthcheck`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );
      await res.json();
      await loadData();
    } catch {
      // ignore
    } finally {
      setTriggeringCheck(false);
    }
  };

  const toggleResolved = async (id: string, currentResolved: boolean) => {
    const { error } = await supabase
      .from("registration_error_logs")
      .update({ resolved: !currentResolved })
      .eq("id", id);

    if (!error) {
      setErrors((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, resolved: !currentResolved } : e
        )
      );
      setUnresolvedCount((c) => c + (currentResolved ? 1 : -1));
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return "nie";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins} Min.`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tag${days > 1 ? "en" : ""}`;
  };

  const getStepLabel = (step: string | null) => {
    const labels: Record<string, string> = {
      auth_signup: "Supabase Auth SignUp",
      handle_new_user: "DB Trigger: handle_new_user",
      profile_creation: "Profil-Erstellung",
      signup_unexpected: "Unerwarteter Fehler",
    };
    return step ? labels[step] || step : "-";
  };

  const statusCfg = health
    ? STATUS_CONFIG[health.status]
    : STATUS_CONFIG.unknown;

  const StatusIcon =
    health?.status === "healthy"
      ? CheckCircle
      : health?.status === "critical"
        ? ShieldAlert
        : health?.status === "warning"
          ? AlertTriangle
          : Activity;

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusCfg.iconBg}`}
            >
              <StatusIcon className={`w-5 h-5 ${statusCfg.iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark">
                Health Check: Registrierung
              </h2>
              <p className={`text-sm font-medium ${statusCfg.textColor}`}>
                {statusCfg.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleManualCheck}
              disabled={triggeringCheck || loading}
              variant="outlined"
            >
              {triggeringCheck ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Zap className="w-3.5 h-3.5 mr-1.5" />
              )}
              Jetzt pruefen
            </Button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-dark bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {health?.status === "critical" && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold mb-1">
              Registrierung gestoert -- Sofortiges Handeln erforderlich
            </p>
            <p>
              Der letzte automatische Healthcheck ist fehlgeschlagen. Neue
              Benutzer koennen sich wahrscheinlich nicht registrieren.
              Facebook/Meta Ads laufen moeglicherweise ins Leere.
            </p>
            {health.last_failure_message && (
              <p className="mt-2 font-mono text-xs bg-red-100 rounded p-2">
                {health.last_failure_message}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {loading && !health ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                label="Letzter erfolgreicher Check"
                value={formatRelative(health?.last_success ?? null)}
                sub={formatDate(health?.last_success ?? null)}
              />
              <StatCard
                icon={<XCircle className="w-4 h-4 text-red-500" />}
                label="Letzter fehlgeschlagener Check"
                value={formatRelative(health?.last_failure ?? null)}
                sub={formatDate(health?.last_failure ?? null)}
              />
              <StatCard
                icon={<Users className="w-4 h-4 text-blue-500" />}
                label="Echte Registrierungen (24h)"
                value={String(health?.real_signups_24h ?? 0)}
                sub={`Letzte: ${formatRelative(health?.last_real_signup ?? null)}`}
              />
              <StatCard
                icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                label="Fehler (24h)"
                value={String(health?.errors_24h ?? 0)}
                sub={`${health?.checks_24h ?? 0} Checks / ${health?.failures_24h ?? 0} fehlgeschlagen`}
                highlight={(health?.errors_24h ?? 0) > 0}
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                Automatischer Healthcheck alle 10 Minuten |
                Anomalie-Erkennung alle 15 Minuten
              </span>
            </div>

            {unresolvedCount > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  {unresolvedCount} ungeloeste
                  {unresolvedCount === 1
                    ? "r Registrierungsfehler"
                    : " Registrierungsfehler"}
                </p>
              </div>
            )}

            {errors.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  Keine Registrierungsfehler aufgezeichnet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-dark">
                  Letzte Registrierungsfehler
                </h3>
                {errors.map((err) => (
                  <ErrorRow
                    key={err.id}
                    err={err}
                    onToggle={toggleResolved}
                    formatDate={formatDate}
                    getStepLabel={getStepLabel}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${highlight ? "border-amber-200 bg-amber-50/50" : "border-gray-200 bg-gray-50/50"}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500 truncate">{label}</span>
      </div>
      <p
        className={`text-lg font-bold ${highlight ? "text-amber-700" : "text-dark"}`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 truncate">{sub}</p>
    </div>
  );
}

function ErrorRow({
  err,
  onToggle,
  formatDate,
  getStepLabel,
}: {
  err: RegistrationError;
  onToggle: (id: string, resolved: boolean) => void;
  formatDate: (d: string | null) => string;
  getStepLabel: (s: string | null) => string;
}) {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        err.resolved
          ? "border-gray-200 bg-gray-50/50"
          : "border-red-200 bg-red-50/30"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                err.resolved
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {err.resolved ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {err.resolved ? "Geloest" : "Offen"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatDate(err.created_at)}
            </span>
            {err.email && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Mail className="w-3 h-3" />
                {err.email}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-dark mb-1 break-all">
            {err.error_message}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {err.step && (
              <span>
                Schritt:{" "}
                <span className="font-medium">{getStepLabel(err.step)}</span>
              </span>
            )}
            {err.source && (
              <span>
                Quelle: <span className="font-medium">{err.source}</span>
              </span>
            )}
            {err.error_code && (
              <span>
                Code:{" "}
                <span className="font-mono font-medium">{err.error_code}</span>
              </span>
            )}
          </div>

          {err.error_details && (
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Technische Details
              </summary>
              <pre className="mt-1 text-xs text-gray-500 bg-gray-100 rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                {err.error_details}
              </pre>
            </details>
          )}
        </div>

        <button
          onClick={() => onToggle(err.id, err.resolved)}
          className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            err.resolved
              ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          }`}
        >
          {err.resolved ? "Erneut oeffnen" : "Als geloest markieren"}
        </button>
      </div>
    </div>
  );
}
