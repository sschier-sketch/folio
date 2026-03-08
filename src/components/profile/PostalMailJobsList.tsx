import { useState, useEffect, useCallback } from "react";
import { Info, XCircle, ChevronLeft, ChevronRight, Filter, Clock, Mail, CheckCircle, Pause, File as FileEdit, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { supabase } from "../../lib/supabase";
import { cancelLetterXpressJob, setAccessToken, LetterXpressApiError } from "../../lib/letterxpress-api";
import { Button } from "../ui/Button";
import PostalMailJobDetail from "./PostalMailJobDetail";

const PAGE_SIZE = 15;

type StatusFilter = "all" | "pending" | "processing" | "queue" | "hold" | "done" | "canceled" | "draft" | "error";

interface JobRow {
  id: string;
  external_job_id: number;
  status: string;
  filename_original: string | null;
  recipient_address_text: string | null;
  pages: number | null;
  amount: number | null;
  vat: number | null;
  currency: string;
  shipping: string | null;
  mode: string | null;
  color: string | null;
  c4: number;
  registered: string | null;
  notice: string | null;
  dispatch_date: string | null;
  created_at_provider: string | null;
  updated_at_provider: string | null;
  item_status: string | null;
  tracking_code: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  last_synced_at: string | null;
  is_cancelable: boolean;
  canceled_at: string | null;
  created_at: string;
  raw_payload_json: any;
}

function fmt(iso: string | null, lang: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusConfig(
  status: string,
  de: boolean
): { label: string; icon: React.ReactNode; badgeClass: string } {
  switch (status) {
    case "pending":
      return {
        label: de ? "Wird vorbereitet" : "Pending",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        badgeClass: "bg-amber-100 text-amber-700",
      };
    case "processing":
      return {
        label: de ? "Wird gesendet" : "Processing",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        badgeClass: "bg-blue-100 text-blue-700",
      };
    case "queue":
      return {
        label: de ? "Warteschlange" : "Queue",
        icon: <Clock className="w-3.5 h-3.5" />,
        badgeClass: "bg-blue-100 text-blue-700",
      };
    case "hold":
      return {
        label: de ? "Pausiert" : "On Hold",
        icon: <Pause className="w-3.5 h-3.5" />,
        badgeClass: "bg-amber-100 text-amber-700",
      };
    case "done":
      return {
        label: de ? "Verarbeitet" : "Done",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        badgeClass: "bg-emerald-100 text-emerald-700",
      };
    case "canceled":
      return {
        label: de ? "Storniert" : "Canceled",
        icon: <XCircle className="w-3.5 h-3.5" />,
        badgeClass: "bg-red-100 text-red-700",
      };
    case "error":
      return {
        label: de ? "Fehlgeschlagen" : "Failed",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        badgeClass: "bg-red-100 text-red-700",
      };
    case "draft":
      return {
        label: de ? "Entwurf" : "Draft",
        icon: <FileEdit className="w-3.5 h-3.5" />,
        badgeClass: "bg-gray-100 text-gray-700",
      };
    default:
      return {
        label: status,
        icon: <Mail className="w-3.5 h-3.5" />,
        badgeClass: "bg-gray-100 text-gray-600",
      };
  }
}

export default function PostalMailJobsList() {
  const { language } = useLanguage();
  const de = language === "de";
  const { session } = useAuth();
  const { dataOwnerId, isOwner } = usePermissions();

  useEffect(() => {
    setAccessToken(session?.access_token ?? null);
    return () => setAccessToken(null);
  }, [session?.access_token]);

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadJobs = useCallback(async () => {
    if (!dataOwnerId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("letterxpress_jobs")
        .select("*", { count: "exact" })
        .eq("user_id", dataOwnerId)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter === "pending") {
        query = query.in("status", ["pending", "processing"]);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setJobs((data as JobRow[]) || []);
      setTotalCount(count || 0);

      if (data && data.length > 0) {
        const mostRecent = data.reduce((latest: string | null, j: any) => {
          if (!j.last_synced_at) return latest;
          if (!latest) return j.last_synced_at;
          return j.last_synced_at > latest ? j.last_synced_at : latest;
        }, null);
        if (mostRecent) setLastSyncedAt(mostRecent);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [dataOwnerId, page, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleCancel = async (job: JobRow) => {
    if (!job.is_cancelable || !isOwner) return;

    const jobLabel = job.external_job_id ? `#${job.external_job_id}` : job.filename_original || job.id.substring(0, 8);
    const confirm = window.confirm(
      de
        ? `Möchten Sie den Auftrag ${jobLabel} wirklich stornieren?`
        : `Do you really want to cancel job ${jobLabel}?`
    );
    if (!confirm) return;

    setCancelingId(job.external_job_id);
    setMessage(null);
    try {
      await cancelLetterXpressJob(job.external_job_id);
      setMessage({
        type: "success",
        text: de
          ? `Auftrag #${job.external_job_id} wurde storniert.`
          : `Job #${job.external_job_id} has been canceled.`,
      });
      await loadJobs();
    } catch (err: any) {
      const msg =
        err instanceof LetterXpressApiError
          ? err.message
          : de
            ? "Stornierung fehlgeschlagen."
            : "Cancellation failed.";
      setMessage({ type: "error", text: msg });
    } finally {
      setCancelingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: de ? "Alle" : "All" },
    { value: "pending", label: de ? "Wird vorbereitet" : "Pending" },
    { value: "queue", label: de ? "Warteschlange" : "Queue" },
    { value: "hold", label: de ? "Pausiert" : "On Hold" },
    { value: "done", label: de ? "Verarbeitet" : "Done" },
    { value: "canceled", label: de ? "Storniert" : "Canceled" },
    { value: "error", label: de ? "Fehlgeschlagen" : "Failed" },
    { value: "draft", label: de ? "Entwurf" : "Draft" },
  ];

  return (
    <div className="bg-white rounded">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Mail className="w-5 h-5" style={{ color: '#1E1E24' }} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">
                {de ? "Versendete Briefe" : "Sent Letters"}
              </h3>
              {lastSyncedAt && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {de ? "Letzte Synchronisierung: " : "Last sync: "}
                  {fmt(lastSyncedAt, language)}
                </p>
              )}
            </div>
          </div>

        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center">
          <Mail className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {de ? "Keine Aufträge gefunden." : "No jobs found."}
          </p>
          <p className="text-gray-300 text-xs mt-1">
            {de
              ? "Aufträge erscheinen hier nach dem ersten Versand oder nach einer Synchronisierung."
              : "Jobs will appear here after the first dispatch or sync."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    {de ? "Erstellt" : "Created"}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Job-ID
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left hidden lg:table-cell">
                    {de ? "Empfänger" : "Recipient"}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left hidden lg:table-cell">
                    {de ? "Notiz" : "Notice"}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    {de ? "Aktionen" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job) => {
                  const sc = statusConfig(job.status, de);
                  const isCanceling = cancelingId === job.external_job_id;

                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {fmt(job.created_at_provider || job.created_at, language)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        {job.external_job_id ? `#${job.external_job_id}` : (
                          <span className="text-gray-400 text-xs font-sans">{de ? "Ausstehend" : "Pending"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.badgeClass}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                        {job.status === "error" && job.last_error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={job.last_error_message}>
                            {job.last_error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate hidden lg:table-cell" title={job.recipient_address_text || ""}>
                        {job.recipient_address_text || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[160px] truncate hidden lg:table-cell" title={job.notice || ""}>
                        {job.notice || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedJob(job)}
                            title={de ? "Details anzeigen" : "Show details"}
                            className="p-1.5 text-gray-300 hover:text-primary-blue transition-colors rounded-lg hover:bg-blue-50"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {job.is_cancelable && isOwner && (
                            <button
                              onClick={() => handleCancel(job)}
                              disabled={isCanceling}
                              title={de ? "Stornieren" : "Cancel"}
                              className="p-1.5 text-gray-300 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCanceling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {de
                  ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} von ${totalCount}`
                  : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount}`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedJob && (
        <PostalMailJobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
