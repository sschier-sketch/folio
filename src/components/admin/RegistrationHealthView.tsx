import { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

export default function RegistrationHealthView() {
  const [errors, setErrors] = useState<RegistrationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registration_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setErrors(data || []);
      setUnresolvedCount(
        (data || []).filter((e: RegistrationError) => !e.resolved).length
      );
    } catch (err) {
      console.error("Error loading registration errors:", err);
    } finally {
      setLoading(false);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                unresolvedCount > 0
                  ? "bg-red-100"
                  : "bg-emerald-100"
              }`}
            >
              {unresolvedCount > 0 ? (
                <ShieldAlert className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark">
                Health Check: Registrierung
              </h2>
              <p className="text-sm text-gray-600">
                {unresolvedCount > 0
                  ? `${unresolvedCount} ungeloeste${unresolvedCount === 1 ? "r" : ""} Fehler`
                  : "Keine offenen Fehler"}
              </p>
            </div>
          </div>
          <button
            onClick={loadErrors}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-dark bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </button>
        </div>
      </div>

      {unresolvedCount > 0 && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold mb-1">
              Registrierung moeglicherweise gestoert
            </p>
            <p>
              Es gibt ungeloeste Registrierungsfehler. Solange dieser Fehler
              besteht, koennen sich moeglicherweise keine neuen Benutzer
              registrieren. Facebook/Meta Ads laufen ggf. ins Leere.
            </p>
          </div>
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-gray-400">
              Keine Registrierungsfehler aufgezeichnet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.map((err) => (
              <div
                key={err.id}
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
                          Schritt: <span className="font-medium">{getStepLabel(err.step)}</span>
                        </span>
                      )}
                      {err.source && (
                        <span>
                          Quelle: <span className="font-medium">{err.source}</span>
                        </span>
                      )}
                      {err.error_code && (
                        <span>
                          Code: <span className="font-mono font-medium">{err.error_code}</span>
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
                    onClick={() => toggleResolved(err.id, err.resolved)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
