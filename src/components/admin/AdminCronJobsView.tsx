import { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Zap,
  Database,
  Activity,
  Shield,
  HelpCircle,
  Timer,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";

interface HealthJobRaw {
  r_name: string;
  r_type: string;
  r_desc: string;
  r_schedule: string;
  r_active: boolean;
  r_health: string;
  r_last_run: string | null;
  r_last_status: string | null;
  r_last_msg: string | null;
  r_duration: number | null;
  r_24h: number;
  r_7d: number;
  r_fail7d: number;
  r_runs: RunEntry[];
}

interface HealthJob {
  job_name: string;
  job_type: "pg_cron" | "edge_function";
  description: string;
  schedule: string;
  is_active: boolean;
  health_status: "healthy" | "warning" | "error" | "unknown";
  last_run_at: string | null;
  last_status: string | null;
  last_message: string | null;
  last_duration_ms: number | null;
  runs_last_24h: number;
  runs_last_7d: number;
  failures_last_7d: number;
  recent_runs: RunEntry[];
}

function mapRawToHealthJob(raw: HealthJobRaw): HealthJob {
  return {
    job_name: raw.r_name,
    job_type: raw.r_type as "pg_cron" | "edge_function",
    description: raw.r_desc,
    schedule: raw.r_schedule,
    is_active: raw.r_active,
    health_status: raw.r_health as "healthy" | "warning" | "error" | "unknown",
    last_run_at: raw.r_last_run,
    last_status: raw.r_last_status,
    last_message: raw.r_last_msg,
    last_duration_ms: raw.r_duration,
    runs_last_24h: raw.r_24h,
    runs_last_7d: raw.r_7d,
    failures_last_7d: raw.r_fail7d,
    recent_runs: raw.r_runs || [],
  };
}

interface RunEntry {
  status: string;
  message: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(ts: string | null): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60000).toFixed(1)} min`;
}

const healthConfig = {
  healthy: {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    label: "Aktiv",
    icon: CheckCircle2,
    pulse: false,
  },
  warning: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    label: "Warnung",
    icon: AlertTriangle,
    pulse: true,
  },
  error: {
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    label: "Fehler",
    icon: XCircle,
    pulse: true,
  },
  unknown: {
    bg: "bg-gray-400",
    bgLight: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-500",
    label: "Unbekannt",
    icon: HelpCircle,
    pulse: false,
  },
};

function HealthDot({ status }: { status: keyof typeof healthConfig }) {
  const cfg = healthConfig[status];
  return (
    <span className="relative flex h-3 w-3">
      {cfg.pulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.bg}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${cfg.bg}`}
      />
    </span>
  );
}

function HealthBadge({ status }: { status: keyof typeof healthConfig }) {
  const cfg = healthConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgLight} ${cfg.text} border ${cfg.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

const TRIGGERABLE_JOBS: Record<string, { fnName: string; label: string }> = {
  "weekly-interest-rate-fetch": {
    fnName: "fetch-interest-rates",
    label: "Zinsdaten jetzt aktualisieren",
  },
};

export default function AdminCronJobsView() {
  const [jobs, setJobs] = useState<HealthJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{
    job: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadJobs() {
    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc(
        "admin_get_system_health"
      );
      if (rpcError) {
        setError(rpcError.message || JSON.stringify(rpcError));
        return;
      }
      const rawJobs = (data as HealthJobRaw[]) || [];
      setJobs(rawJobs.map(mapRawToHealthJob));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unbekannter Fehler beim Laden"
      );
    }
  }

  useEffect(() => {
    setLoading(true);
    loadJobs().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  }

  async function handleTriggerJob(jobName: string) {
    const cfg = TRIGGERABLE_JOBS[jobName];
    if (!cfg) return;
    setTriggering(jobName);
    setTriggerResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${cfg.fnName}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        setTriggerResult({ job: jobName, type: "error", text: data.error || "Fehler beim Ausfuehren" });
      } else {
        setTriggerResult({ job: jobName, type: "success", text: data.message || "Erfolgreich ausgefuehrt" });
        await loadJobs();
      }
    } catch (err) {
      setTriggerResult({ job: jobName, type: "error", text: err instanceof Error ? err.message : "Unbekannter Fehler" });
    } finally {
      setTriggering(null);
    }
  }

  const healthyCount = jobs.filter((j) => j.health_status === "healthy").length;
  const warningCount = jobs.filter((j) => j.health_status === "warning").length;
  const errorCount = jobs.filter((j) => j.health_status === "error").length;
  const unknownCount = jobs.filter((j) => j.health_status === "unknown").length;

  const overallHealth =
    errorCount > 0
      ? "error"
      : warningCount > 0
      ? "warning"
      : unknownCount === jobs.length
      ? "unknown"
      : "healthy";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-700 font-medium">
          Fehler beim Laden der System-Tasks
        </p>
        <p className="text-xs text-red-500 mt-1 max-w-md mx-auto break-words">
          {error}
        </p>
        <Button onClick={handleRefresh} variant="secondary" className="mt-4">
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            System-Gesundheit
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Übersicht aller automatischen Hintergrundprozesse und deren Status
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outlined"
        >
          {refreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            "Aktualisieren"
          )}
        </Button>
      </div>

      <div
        className={`rounded-xl p-5 flex items-center gap-4 border ${
          overallHealth === "healthy"
            ? "bg-emerald-50/60 border-emerald-200"
            : overallHealth === "warning"
            ? "bg-amber-50/60 border-amber-200"
            : overallHealth === "error"
            ? "bg-red-50/60 border-red-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            overallHealth === "healthy"
              ? "bg-emerald-100"
              : overallHealth === "warning"
              ? "bg-amber-100"
              : overallHealth === "error"
              ? "bg-red-100"
              : "bg-gray-100"
          }`}
        >
          <Shield
            className={`w-6 h-6 ${
              overallHealth === "healthy"
                ? "text-emerald-600"
                : overallHealth === "warning"
                ? "text-amber-600"
                : overallHealth === "error"
                ? "text-red-600"
                : "text-gray-400"
            }`}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">
            {overallHealth === "healthy"
              ? "Alle Systeme funktionieren ordnungsgemaess"
              : overallHealth === "warning"
              ? "Einige Systeme benoetigen Aufmerksamkeit"
              : overallHealth === "error"
              ? "Es gibt Fehler bei System-Tasks"
              : "Status der System-Tasks unbekannt"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {healthyCount} aktiv, {warningCount} Warnungen, {errorCount} Fehler,{" "}
            {unknownCount} unbekannt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Gesamt"
          value={jobs.length}
          sub={`${jobs.filter((j) => j.is_active).length} aktiv`}
          icon={Activity}
          color="bg-slate-50 border-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          label="Aktiv"
          value={healthyCount}
          sub="laufen normal"
          icon={CheckCircle2}
          color="bg-emerald-50 border-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Warnungen"
          value={warningCount}
          sub="überprüfen"
          icon={AlertTriangle}
          color="bg-amber-50 border-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Fehler / Unbekannt"
          value={errorCount + unknownCount}
          sub={errorCount > 0 ? "Aktion erforderlich" : "nicht protokolliert"}
          icon={errorCount > 0 ? XCircle : HelpCircle}
          color={
            errorCount > 0
              ? "bg-red-50 border-red-100"
              : "bg-gray-50 border-gray-100"
          }
          iconColor={errorCount > 0 ? "text-red-600" : "text-gray-400"}
        />
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const isExpanded = expandedJob === job.job_name;
          const runs = job.recent_runs || [];
          const cfg = healthConfig[job.health_status] || healthConfig.unknown;

          return (
            <div
              key={job.job_name}
              className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-sm ${
                job.health_status === "error"
                  ? "border-red-200"
                  : job.health_status === "warning"
                  ? "border-amber-200"
                  : "border-gray-100"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedJob(isExpanded ? null : job.job_name)
                }
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      job.job_type === "edge_function"
                        ? "bg-amber-50"
                        : "bg-blue-50"
                    }`}
                  >
                    {job.job_type === "edge_function" ? (
                      <Zap className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Database className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <HealthDot status={job.health_status} />
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {job.job_name}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        job.job_type === "edge_function"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}
                    >
                      {job.job_type === "edge_function"
                        ? "Edge Function"
                        : "pg_cron"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {job.schedule}
                    {job.description && ` — ${job.description}`}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <HealthBadge status={job.health_status} />
                    {job.last_run_at ? (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {timeAgo(job.last_run_at)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-300 mt-1">
                        Kein Lauf protokolliert
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  {job.description && (
                    <div className="px-5 py-3 bg-blue-50/40 border-b border-gray-100">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                  )}

                  {TRIGGERABLE_JOBS[job.job_name] && (
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerJob(job.job_name);
                        }}
                        disabled={triggering === job.job_name}
                        variant="primary"
                        className="!py-1.5 !px-3 !text-xs"
                      >
                        {triggering === job.job_name ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {TRIGGERABLE_JOBS[job.job_name].label}
                      </Button>
                      {triggerResult && triggerResult.job === job.job_name && (
                        <span className={`text-xs ${triggerResult.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                          {triggerResult.text}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="px-5 py-4 bg-gray-50/50 grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <DetailItem
                      label="Letzter Lauf"
                      value={
                        job.last_run_at
                          ? formatTimestamp(job.last_run_at)
                          : "Nie"
                      }
                    />
                    <DetailItem
                      label="Status"
                      value={
                        job.last_status
                          ? job.last_status === "succeeded" ||
                            job.last_status === "completed"
                            ? "Erfolgreich"
                            : job.last_status === "failed"
                            ? "Fehlgeschlagen"
                            : job.last_status
                          : "-"
                      }
                    />
                    <DetailItem
                      label="Dauer"
                      value={formatDuration(job.last_duration_ms)}
                      icon={<Timer className="w-3.5 h-3.5 text-gray-400" />}
                    />
                    <DetailItem
                      label="Laeufe (24h / 7d)"
                      value={`${job.runs_last_24h} / ${job.runs_last_7d}`}
                    />
                    <DetailItem
                      label="Fehler (7d)"
                      value={String(job.failures_last_7d)}
                      highlight={job.failures_last_7d > 0}
                    />
                  </div>

                  {job.last_message && (
                    <div className="px-5 py-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Letzte Rueckmeldung
                      </p>
                      <pre
                        className={`text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto ${
                          job.last_status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {job.last_message}
                      </pre>
                    </div>
                  )}

                  {job.health_status === "unknown" && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                          <p className="font-semibold mb-1">
                            Kein Ausfuehrungsprotokoll vorhanden
                          </p>
                          <p>
                            Diese Edge Function hat noch keine Ausfuehrung in der
                            Datenbank protokolliert. Moegliche Ursachen:
                          </p>
                          <ul className="list-disc ml-4 mt-1 space-y-0.5">
                            <li>
                              Der externe Cron-Trigger (z.B. Supabase Cron,
                              cron-job.org) ist nicht konfiguriert
                            </li>
                            <li>
                              Der Cron-Secret oder die Autorisierung ist nicht
                              korrekt eingerichtet
                            </li>
                            <li>
                              Die Function wurde noch nie aufgerufen
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {runs.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        Letzte {runs.length} Ausfuehrungen
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-400 border-b border-gray-100">
                              <th className="pb-2 pr-4 font-medium">Status</th>
                              <th className="pb-2 pr-4 font-medium">
                                Gestartet
                              </th>
                              <th className="pb-2 pr-4 font-medium">Dauer</th>
                              <th className="pb-2 font-medium">Meldung</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runs.map((run, idx) => {
                              const isSuccess =
                                run.status === "succeeded" ||
                                run.status === "completed";
                              const isFailed = run.status === "failed";
                              return (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-50 last:border-0"
                                >
                                  <td className="py-2 pr-4">
                                    <div className="flex items-center gap-1.5">
                                      {isSuccess ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : isFailed ? (
                                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      )}
                                      <span
                                        className={
                                          isSuccess
                                            ? "text-emerald-700"
                                            : isFailed
                                            ? "text-red-700"
                                            : "text-gray-600"
                                        }
                                      >
                                        {isSuccess
                                          ? "OK"
                                          : isFailed
                                          ? "Fehler"
                                          : run.status}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                                    {formatTimestamp(run.started_at)}
                                  </td>
                                  <td className="py-2 pr-4 text-gray-600 font-mono whitespace-nowrap">
                                    {formatDuration(run.duration_ms)}
                                  </td>
                                  <td className="py-2 text-gray-500 max-w-xs">
                                    <span
                                      className={`truncate block ${
                                        isFailed ? "text-red-600" : ""
                                      }`}
                                      title={run.message || undefined}
                                    >
                                      {run.message || "-"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {runs.length === 0 && job.health_status !== "unknown" && (
                    <div className="px-5 py-6 border-t border-gray-100 text-center">
                      <Clock className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">
                        Keine detaillierten Ausfuehrungsdaten vorhanden
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Keine System-Tasks konfiguriert
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  iconColor,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  color: string;
  iconColor: string;
}) {
  return (
    <div className={`${color} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-2xl font-bold ${iconColor}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p
          className={`text-sm ${
            highlight ? "text-red-600 font-semibold" : "text-gray-700"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
