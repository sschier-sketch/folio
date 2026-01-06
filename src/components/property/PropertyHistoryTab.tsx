import { useState, useEffect } from "react";
import { Clock, FileText, User, Home, TrendingUp, FileCheck, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyHistoryTabProps {
  propertyId: string;
}

interface HistoryEntry {
  id: string;
  event_type: string;
  event_description: string;
  changed_by_name: string | null;
  created_at: string;
}

export default function PropertyHistoryTab({ propertyId }: PropertyHistoryTabProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, propertyId]);

  async function loadHistory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_history")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "unit_created":
      case "unit_updated":
        return <Home className="w-5 h-5 text-primary-blue" />;
      case "equipment_updated":
        return <FileCheck className="w-5 h-5 text-primary-blue" />;
      case "tenant_change":
        return <User className="w-5 h-5 text-emerald-600" />;
      case "rent_increase":
        return <TrendingUp className="w-5 h-5 text-amber-600" />;
      case "maintenance":
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case "billing":
        return <FileText className="w-5 h-5 text-green-600" />;
      case "document_uploaded":
        return <FileText className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      unit_created: "Einheit angelegt",
      unit_updated: "Einheit aktualisiert",
      equipment_updated: "Ausstattung aktualisiert",
      tenant_change: "Mieterwechsel",
      rent_increase: "Mieterhöhung",
      maintenance: "Instandhaltung",
      billing: "Abrechnung",
      document_uploaded: "Dokument hochgeladen",
      other: "Sonstiges",
    };
    return labels[eventType] || eventType;
  };

  if (!isPremium) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">Pro-Funktion</h3>
          <p className="text-gray-600 mb-6">
            Die Änderungshistorie für Immobilien ist im Pro-Tarif verfügbar. Behalten Sie den Überblick über alle Änderungen:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <Home className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Einheit angelegt / geändert</span>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Mieterwechsel dokumentiert</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Mieterhöhungen nachvollziehen</span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Abrechnungen erstellt</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Änderungsprotokoll (wer / wann)</span>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            Jetzt auf Pro upgraden
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Änderungshistorie</h3>
          <p className="text-sm text-gray-400 mt-1">
            Chronologische Auflistung aller Änderungen an dieser Immobilie
          </p>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">Noch keine Einträge vorhanden</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    {getEventIcon(entry.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded">
                        {getEventTypeLabel(entry.event_type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{entry.event_description}</p>
                    {entry.changed_by_name && (
                      <p className="text-xs text-gray-400 mt-1">
                        von {entry.changed_by_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Die Historie wird automatisch aktualisiert, wenn Änderungen an Einheiten,
          Mietverhältnissen oder anderen Objektdaten vorgenommen werden.
        </p>
      </div>
    </div>
  );
}
