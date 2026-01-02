import { useState, useEffect } from "react";
import { MessageSquare, Plus, FileText, Calendar, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";

interface TenantCommunicationTabProps {
  tenantId: string;
}

interface Communication {
  id: string;
  communication_type: string;
  subject: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export default function TenantCommunicationTab({
  tenantId,
}: TenantCommunicationTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<Communication[]>([]);

  useEffect(() => {
    if (user && tenantId && isPremium) {
      loadCommunications();
    } else {
      setLoading(false);
    }
  }, [user, tenantId, isPremium]);

  async function loadCommunications() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("tenant_communications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (data) setCommunications(data);
    } catch (error) {
      console.error("Error loading communications:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return MessageSquare;
      case "document_sent":
        return FileText;
      case "note":
        return FileText;
      default:
        return MessageSquare;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "message":
        return "Nachricht";
      case "document_sent":
        return "Dokument versendet";
      case "note":
        return "Notiz";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-100 text-blue-700";
      case "document_sent":
        return "bg-emerald-100 text-emerald-700";
      case "note":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <PremiumFeatureGuard featureName="Kommunikationshistorie">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Kommunikationshistorie
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Alle Nachrichten, Dokumente und Notizen zu diesem
                Mietverhältnis
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              <Plus className="w-4 h-4" />
              Eintrag hinzufügen
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Lädt...</div>
          ) : communications.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Keine Kommunikation vorhanden
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Erfassen Sie Nachrichten, versendete Dokumente oder interne
                Notizen
              </p>
              <button className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
                Ersten Eintrag erstellen
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {communications.map((comm) => {
                  const Icon = getTypeIcon(comm.communication_type);
                  return (
                    <div
                      key={comm.id}
                      className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0"
                    >
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-primary-blue rounded-full"></div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(comm.created_at).toLocaleDateString(
                              "de-DE",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                              comm.communication_type
                            )}`}
                          >
                            <Icon className="w-3 h-3 inline mr-1" />
                            {getTypeLabel(comm.communication_type)}
                          </span>
                          {comm.is_internal && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                              Intern
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-dark mb-1">
                          {comm.subject}
                        </div>
                        {comm.content && (
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {comm.content}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary-blue mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Mieterportal:</p>
              <p>
                In Zukunft wird die Kommunikation direkt mit dem Mieterportal
                verknüpft. Mieter können dann Nachrichten senden und empfangen,
                Dokumente einsehen und Tickets erstellen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
