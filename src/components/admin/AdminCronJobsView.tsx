import { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface CronRun {
  runid: number;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
  duration_ms: number | null;
}

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_return_message: string | null;
  last_duration_ms: number | null;
  recent_runs: CronRun[];
}

const JOB_DESCRIPTIONS: Record<string, string> = {
  "daily-index-rent-calculations":
    "Berechnet automatisch Indexmieten-Anpassungen basierend auf dem Verbraucherpreisindex.",
  "daily-rent-increase-reminders":
    "Erstellt Erinnerungs-Tickets 3 Monate vor faelligen Mieterhoehungen (Index- und Staffelmiete).",
};

function parseCronSchedule(schedule: string): string {
  const parts = schedule.split(" ");
  if (parts.length !== 5) return schedule;
  const [minute, hour] = parts;
  return `Taeglich um ${hour.padStart(2, "0")}:${minute.padStart(2, "0")} UTC`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "-";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60000).toFixed(1)} min`;
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

function StatusIcon({ status }: { status: string | null }) {
  if (!status) return <Clock className="w-4 h-4 text-gray-300" />;
  if (status === "succeeded")
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "failed")
    return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertTriangle className="w-4 h-4 text-amber-500" />;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <Clock className="w-3 h-3" />
        Noch nicht gelaufen
      </span>
    );
  if (status === "succeeded")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Erfolgreich
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3" />
        Fehlgeschlagen
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function AdminCronJobsView() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadJobs() {
    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc(
        "admin_get_cron_jobs"
      );
      if (rpcError) throw rpcError;
      setJobs((data as CronJob[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
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

  const succeededCount = jobs.filter(
    (j) => j.last_status === "succeeded"
  ).length;
  const failedCount = jobs.filter((j) => j.last_status === "failed").length;
  const neverRanCount = jobs.filter((j) => !j.last_status).length;

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
          Fehler beim Laden der Cron-Jobs
        </p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Cron Jobs</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Automatische Hintergrundprozesse und deren Ausfuehrungsstatus
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Gesamt"
          value={jobs.length}
          color="bg-gray-50"
          textColor="text-gray-700"
        />
        <SummaryCard
          label="Aktiv"
          value={jobs.filter((j) => j.active).length}
          color="bg-blue-50"
          textColor="text-blue-700"
        />
        <SummaryCard
          label="Letzter Lauf OK"
          value={succeededCount}
          color="bg-emerald-50"
          textColor="text-emerald-700"
        />
        <SummaryCard
          label="Fehlgeschlagen"
          value={failedCount + neverRanCount}
          color={failedCount > 0 ? "bg-red-50" : "bg-gray-50"}
          textColor={failedCount > 0 ? "text-red-700" : "text-gray-500"}
        />
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const isExpanded = expandedJob === job.jobid;
          const description = JOB_DESCRIPTIONS[job.jobname] || "";
          const recentRuns = job.recent_runs || [];

          return (
            <div
              key={job.jobid}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() =>
                  setExpandedJob(isExpanded ? null : job.jobid)
                }
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
              >
                <div className="flex-shrink-0">
                  {job.active ? (
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Play className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Pause className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {job.jobname}
                    </p>
                    {!job.active && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                        INAKTIV
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {parseCronSchedule(job.schedule)}
                    {description && ` -- ${description}`}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <StatusBadge status={job.last_status} />
                    {job.last_run_at && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {timeAgo(job.last_run_at)}
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
                  <div className="px-5 py-4 bg-gray-50/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DetailItem
                      label="Letzter Lauf"
                      value={formatTimestamp(job.last_run_at)}
                    />
                    <DetailItem
                      label="Dauer"
                      value={formatDuration(job.last_duration_ms)}
                      icon={<Timer className="w-3.5 h-3.5 text-gray-400" />}
                    />
                    <DetailItem
                      label="Schedule"
                      value={job.schedule}
                      mono
                    />
                  </div>

                  {job.last_return_message && (
                    <div className="px-5 py-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Letzte Rueckmeldung
                      </p>
                      <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto">
                        {job.last_return_message}
                      </pre>
                    </div>
                  )}

                  <div className="px-5 py-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      SQL-Befehl
                    </p>
                    <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {job.command}
                    </pre>
                  </div>

                  {recentRuns.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        Letzte Ausfuehrungen ({recentRuns.length})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-400 border-b border-gray-100">
                              <th className="pb-2 pr-4 font-medium">
                                Status
                              </th>
                              <th className="pb-2 pr-4 font-medium">
                                Gestartet
                              </th>
                              <th className="pb-2 pr-4 font-medium">
                                Beendet
                              </th>
                              <th className="pb-2 pr-4 font-medium">
                                Dauer
                              </th>
                              <th className="pb-2 font-medium">
                                Meldung
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentRuns.map((run) => (
                              <tr
                                key={run.runid}
                                className="border-b border-gray-50 last:border-0"
                              >
                                <td className="py-2 pr-4">
                                  <div className="flex items-center gap-1.5">
                                    <StatusIcon status={run.status} />
                                    <span
                                      className={
                                        run.status === "succeeded"
                                          ? "text-emerald-700"
                                          : run.status === "failed"
                                          ? "text-red-700"
                                          : "text-gray-600"
                                      }
                                    >
                                      {run.status === "succeeded"
                                        ? "OK"
                                        : run.status === "failed"
                                        ? "Fehler"
                                        : run.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 pr-4 text-gray-600">
                                  {formatTimestamp(run.start_time)}
                                </td>
                                <td className="py-2 pr-4 text-gray-600">
                                  {formatTimestamp(run.end_time)}
                                </td>
                                <td className="py-2 pr-4 text-gray-600 font-mono">
                                  {formatDuration(run.duration_ms)}
                                </td>
                                <td className="py-2 text-gray-500 max-w-xs truncate">
                                  {run.return_message || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {recentRuns.length === 0 && (
                    <div className="px-5 py-6 border-t border-gray-100 text-center">
                      <Clock className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">
                        Noch keine Ausfuehrungen vorhanden
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
              Keine Cron-Jobs konfiguriert
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Es wurden noch keine automatischen Hintergrundprozesse
              eingerichtet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  textColor,
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
}) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <p className="text-2xl font-bold ${textColor}">
        <span className={textColor}>{value}</span>
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p
          className={`text-sm text-gray-700 ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
