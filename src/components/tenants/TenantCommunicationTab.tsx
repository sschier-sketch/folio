import { useState, useEffect } from "react";
import { MessageSquare, Plus, FileText, Calendar, Lock, Wrench, X } from "lucide-react";
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
  is_ticket?: boolean;
  ticket_status?: string;
  ticket_category?: string;
}

export default function TenantCommunicationTab({
  tenantId,
}: TenantCommunicationTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    type: "message",
    subject: "",
    content: "",
    is_internal: false,
  });

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

      const { data: commsData } = await supabase
        .from("tenant_communications")
        .select("*")
        .eq("tenant_id", tenantId);

      const { data: ticketsData } = await supabase
        .from("tickets")
        .select("*")
        .eq("tenant_id", tenantId);

      const allCommunications: Communication[] = [];

      if (commsData) {
        allCommunications.push(...commsData);
      }

      if (ticketsData) {
        allCommunications.push(
          ...ticketsData.map((ticket) => ({
            id: ticket.id,
            communication_type: "ticket",
            subject: ticket.subject,
            content: `Ticket ${ticket.ticket_number} - ${ticket.category}`,
            is_internal: false,
            created_at: ticket.created_at,
            is_ticket: true,
            ticket_status: ticket.status,
            ticket_category: ticket.category,
          }))
        );
      }

      allCommunications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCommunications(allCommunications);
    } catch (error) {
      console.error("Error loading communications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEntry() {
    if (!user || !newEntryForm.subject.trim()) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("tenant_communications").insert([
        {
          user_id: user.id,
          tenant_id: tenantId,
          communication_type: newEntryForm.type,
          subject: newEntryForm.subject,
          content: newEntryForm.content,
          is_internal: newEntryForm.is_internal,
        },
      ]);

      if (error) throw error;

      setNewEntryForm({
        type: "message",
        subject: "",
        content: "",
        is_internal: false,
      });
      setShowNewEntry(false);
      loadCommunications();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Fehler beim Speichern des Eintrags");
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
      case "ticket":
        return Wrench;
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
      case "ticket":
        return "Mieter-Anfrage";
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
      case "ticket":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTicketStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      open: "Offen",
      in_progress: "In Bearbeitung",
      resolved: "Gelöst",
      closed: "Geschlossen",
    };
    return statusMap[status] || status;
  };

  return (
    <PremiumFeatureGuard featureName="Kommunikationshistorie">
      <div className="space-y-6">
        <div className="bg-white rounded-lg">
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
            <button
              onClick={() => setShowNewEntry(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
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
              <button
                onClick={() => setShowNewEntry(true)}
                className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
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
                        {comm.is_ticket && comm.ticket_status && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              Status: {getTicketStatusLabel(comm.ticket_status)}
                            </span>
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
                Mieter-Anfragen aus dem Mieterportal werden automatisch hier
                angezeigt und können direkt bearbeitet werden.
              </p>
            </div>
          </div>
        </div>

        {showNewEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-dark">
                  Neuer Eintrag
                </h2>
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Typ
                  </label>
                  <select
                    value={newEntryForm.type}
                    onChange={(e) =>
                      setNewEntryForm({ ...newEntryForm, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="message">Nachricht</option>
                    <option value="document_sent">Dokument versendet</option>
                    <option value="note">Notiz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Betreff *
                  </label>
                  <input
                    type="text"
                    value={newEntryForm.subject}
                    onChange={(e) =>
                      setNewEntryForm({ ...newEntryForm, subject: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. Miete für Januar erhalten"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Inhalt
                  </label>
                  <textarea
                    value={newEntryForm.content}
                    onChange={(e) =>
                      setNewEntryForm({ ...newEntryForm, content: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                    rows={5}
                    placeholder="Details..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_internal"
                    checked={newEntryForm.is_internal}
                    onChange={(e) =>
                      setNewEntryForm({
                        ...newEntryForm,
                        is_internal: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_internal"
                    className="text-sm font-medium text-gray-600"
                  >
                    Interner Eintrag (nur für Vermieter sichtbar)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewEntry(false)}
                    className="flex-1 px-4 py-2 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEntry}
                    disabled={loading || !newEntryForm.subject.trim()}
                    className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Speichern..." : "Eintrag speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PremiumFeatureGuard>
  );
}
