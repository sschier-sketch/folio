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
  metadata?: {
    table_name?: string;
    operation?: string;
    changed_fields?: string[];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  };
}

export default function PropertyHistoryTab({ propertyId }: PropertyHistoryTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
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
      case "property_created":
      case "property_updated":
      case "property_deleted":
        return <Home className="w-5 h-5 text-primary-blue" />;
      case "unit_created":
      case "unit_updated":
      case "unit_deleted":
        return <Home className="w-5 h-5 text-blue-600" />;
      case "tenant_created":
      case "tenant_updated":
      case "tenant_deleted":
      case "tenant_change":
        return <User className="w-5 h-5 text-emerald-600" />;
      case "contract_created":
      case "contract_updated":
      case "contract_deleted":
        return <FileText className="w-5 h-5 text-green-600" />;
      case "equipment_updated":
        return <FileCheck className="w-5 h-5 text-primary-blue" />;
      case "contact_created":
      case "contact_updated":
      case "contact_deleted":
        return <User className="w-5 h-5 text-blue-500" />;
      case "maintenance_created":
      case "maintenance_updated":
      case "maintenance_completed":
        return <FileCheck className="w-5 h-5 text-amber-600" />;
      case "document_uploaded":
      case "document_deleted":
        return <FileText className="w-5 h-5 text-gray-600" />;
      case "rent_increase":
        return <TrendingUp className="w-5 h-5 text-amber-600" />;
      case "billing":
        return <FileText className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      property_created: "Immobilie angelegt",
      property_updated: "Immobilie aktualisiert",
      property_deleted: "Immobilie gelöscht",
      unit_created: "Einheit angelegt",
      unit_updated: "Einheit aktualisiert",
      unit_deleted: "Einheit gelöscht",
      tenant_created: "Mieter angelegt",
      tenant_updated: "Mieter aktualisiert",
      tenant_deleted: "Mieter gelöscht",
      contract_created: "Vertrag angelegt",
      contract_updated: "Vertrag aktualisiert",
      contract_deleted: "Vertrag gelöscht",
      equipment_updated: "Ausstattung aktualisiert",
      contact_created: "Kontakt angelegt",
      contact_updated: "Kontakt aktualisiert",
      contact_deleted: "Kontakt gelöscht",
      maintenance_created: "Wartung angelegt",
      maintenance_updated: "Wartung aktualisiert",
      maintenance_completed: "Wartung abgeschlossen",
      document_uploaded: "Dokument hochgeladen",
      document_deleted: "Dokument gelöscht",
      tenant_change: "Mieterwechsel",
      rent_increase: "Mieterhöhung",
      billing: "Abrechnung",
      other: "Sonstiges",
    };
    return labels[eventType] || eventType;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (typeof value === "number") return value.toLocaleString("de-DE");
    if (typeof value === "string") {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return new Date(value).toLocaleDateString("de-DE");
        } catch {
          return value;
        }
      }
      return value;
    }
    return String(value);
  };

  const renderChangedFields = (entry: HistoryEntry) => {
    if (!entry.metadata?.changed_fields || entry.metadata.changed_fields.length === 0) {
      return null;
    }

    const oldValues = entry.metadata.old_values || {};
    const newValues = entry.metadata.new_values || {};

    return (
      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-500 uppercase">Geänderte Felder:</p>
        <div className="space-y-2">
          {entry.metadata.changed_fields.map((field, idx) => {
            const fieldKey = Object.keys(newValues).find(
              (k) => k.toLowerCase().includes(field.toLowerCase()) ||
                    field.toLowerCase().includes(k.toLowerCase())
            );

            const oldVal = fieldKey ? oldValues[fieldKey] : undefined;
            const newVal = fieldKey ? newValues[fieldKey] : undefined;

            if (fieldKey && (oldVal !== undefined || newVal !== undefined)) {
              return (
                <div key={idx} className="text-xs bg-white rounded px-3 py-2">
                  <div className="font-medium text-gray-700 mb-1">{field}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 line-through">
                      {formatValue(oldVal)}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium">
                      {formatValue(newVal)}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
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
          <button className="px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors">
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-3 py-1 bg-white text-xs font-medium text-gray-700 rounded-full shadow-sm">
                        {getEventTypeLabel(entry.event_type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} Uhr
                      </span>
                      {entry.changed_by_name && (
                        <span className="text-xs text-gray-500">
                          • von {entry.changed_by_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{entry.event_description}</p>
                    {entry.metadata?.operation && (
                      <p className="text-xs text-gray-400 mb-1">
                        Aktion: {entry.metadata.operation === 'INSERT' ? 'Neu angelegt' :
                                 entry.metadata.operation === 'UPDATE' ? 'Aktualisiert' :
                                 entry.metadata.operation === 'DELETE' ? 'Gelöscht' :
                                 entry.metadata.operation}
                      </p>
                    )}
                    {renderChangedFields(entry)}
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
