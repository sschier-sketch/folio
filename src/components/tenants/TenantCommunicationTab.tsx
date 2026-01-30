import { useState, useEffect } from "react";
import { MessageSquare, Plus, FileText, Calendar, Lock, Wrench, X, Upload, File as FileIcon, Trash2, Mail } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";
import { sanitizeFileName } from "../../lib/utils";
import { getCategoryLabel } from "../../lib/ticketUtils";

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
  is_deleted?: boolean;
  deleted_at?: string;
  attachment_id?: string;
  attachment_name?: string;
  attachment_path?: string;
}

export default function TenantCommunicationTab({
  tenantId,
}: TenantCommunicationTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newReply, setNewReply] = useState("");
  const [newEntryForm, setNewEntryForm] = useState({
    type: "message",
    subject: "",
    content: "",
    is_internal: false,
    send_email: false,
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [attachmentDocId, setAttachmentDocId] = useState<string | null>(null);

  useEffect(() => {
    if (user && tenantId && isPremium) {
      loadCommunications();
      loadTenant();
    } else {
      setLoading(false);
    }
  }, [user, tenantId, isPremium]);

  async function loadTenant() {
    try {
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (data) setTenant(data);
    } catch (error) {
      console.error("Error loading tenant:", error);
    }
  }

  async function loadCommunications() {
    try {
      setLoading(true);

      const { data: commsData } = await supabase
        .from("tenant_communications")
        .select(`
          *,
          documents:attachment_id(
            id,
            file_name,
            file_path
          )
        `)
        .eq("tenant_id", tenantId);

      const { data: ticketsData } = await supabase
        .from("tickets")
        .select("*")
        .eq("tenant_id", tenantId);

      const allCommunications: Communication[] = [];

      if (commsData) {
        for (const comm of commsData) {
          const doc = (comm as any).documents;
          allCommunications.push({
            ...comm,
            attachment_id: doc?.id,
            attachment_name: doc?.file_name,
            attachment_path: doc?.file_path,
          });
        }
      }

      if (ticketsData) {
        allCommunications.push(
          ...ticketsData.map((ticket) => ({
            id: ticket.id,
            communication_type: "ticket",
            subject: ticket.subject,
            content: `Ticket ${ticket.ticket_number} - ${getCategoryLabel(ticket.category)}`,
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
    if (!user || !newEntryForm.subject.trim() || !tenant) return;

    try {
      setLoading(true);

      let documentId = null;

      if (attachedFile) {
        const sanitizedFileName = sanitizeFileName(attachedFile.name);
        const fileName = `${Date.now()}_${sanitizedFileName}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, attachedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: document, error: docError } = await supabase
          .from("documents")
          .insert([
            {
              user_id: user.id,
              file_name: attachedFile.name,
              file_path: filePath,
              file_size: attachedFile.size,
              file_type: attachedFile.type,
              document_type: "other",
              category: "communication",
              description: `Anhang zu: ${newEntryForm.subject}`,
              shared_with_tenant: true,
            },
          ])
          .select()
          .single();

        if (docError) throw docError;

        documentId = document.id;

        if (document && tenant.property_id) {
          await supabase.from("document_associations").insert([
            {
              document_id: document.id,
              association_type: "tenant",
              association_id: tenantId,
              created_by: user.id,
            },
          ]);
        }
      }

      const { data: newComm, error } = await supabase
        .from("tenant_communications")
        .insert([
          {
            user_id: user.id,
            tenant_id: tenantId,
            communication_type: newEntryForm.type,
            subject: newEntryForm.subject,
            content: newEntryForm.content,
            is_internal: newEntryForm.is_internal,
            attachment_id: documentId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (newEntryForm.send_email && tenant.email && !newEntryForm.is_internal) {
        try {
          let emailContent = `${newEntryForm.content}`;

          if (attachedFile && documentId) {
            const { data: { publicUrl } } = supabase.storage
              .from("documents")
              .getPublicUrl(`${user.id}/${Date.now()}_${attachedFile.name}`);

            emailContent += `\n\nAnhang: ${attachedFile.name}`;
          }

          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              to: tenant.email,
              subject: "Neue Nachricht von Ihrem Vermieter",
              html: `
                <h2>${newEntryForm.subject}</h2>
                <p>${emailContent.replace(/\n/g, "<br>")}</p>
              `,
            }),
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }

      setNewEntryForm({
        type: "message",
        subject: "",
        content: "",
        is_internal: false,
        send_email: false,
      });
      setAttachedFile(null);
      setShowNewEntry(false);
      loadCommunications();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Fehler beim Speichern des Eintrags");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCommunication(commId: string) {
    if (!user || !confirm("Möchten Sie diese Nachricht wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("tenant_communications")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq("id", commId);

      if (error) throw error;

      loadCommunications();
    } catch (error) {
      console.error("Error deleting communication:", error);
      alert("Fehler beim Löschen der Nachricht");
    }
  }

  async function loadTicketDetails(ticketId: string) {
    try {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      const { data: messages } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      setSelectedTicket(ticket);
      setTicketMessages(messages || []);
    } catch (error) {
      console.error("Error loading ticket details:", error);
    }
  }

  async function handleTicketReply() {
    if (!user || !selectedTicket || !newReply.trim()) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("ticket_messages").insert([
        {
          ticket_id: selectedTicket.id,
          sender_type: "landlord",
          sender_name: user.email,
          sender_email: user.email,
          message: newReply,
        },
      ]);

      if (error) throw error;

      await supabase
        .from("tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      setNewReply("");
      loadTicketDetails(selectedTicket.id);
      loadCommunications();
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Fehler beim Senden der Antwort");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket({ ...selectedTicket, status: newStatus });
      loadCommunications();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Fehler beim Aktualisieren des Status");
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
                Alle Nachrichten von Ihnen oder dem Mieter zentral verwaltet
              </p>
            </div>
            <button
              onClick={() => setShowNewEntry(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nachricht versenden
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
                      className={`relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0 ${
                        comm.is_ticket ? "cursor-pointer hover:bg-gray-50 -mx-6 px-14 py-4" : ""
                      } ${comm.is_deleted ? "opacity-60" : ""}`}
                      onClick={() => comm.is_ticket && loadTicketDetails(comm.id)}
                    >
                      <div className="absolute left-6 top-4 -translate-x-1/2 w-4 h-4 bg-primary-blue rounded-full"></div>
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
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                              comm.communication_type
                            )}`}
                          >
                            <Icon className="w-3 h-3 inline mr-1" />
                            {getTypeLabel(comm.communication_type)}
                          </span>
                          {comm.is_internal && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              Intern
                            </span>
                          )}
                          {comm.is_deleted && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Gelöscht
                            </span>
                          )}
                          {!comm.is_ticket && !comm.is_deleted && (
                            <button
                              onClick={() => handleDeleteCommunication(comm.id)}
                              className="ml-auto p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Nachricht löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="font-semibold text-dark mb-1">
                          {comm.is_deleted ? "[Gelöschte Nachricht]" : comm.subject}
                        </div>
                        {comm.content && !comm.is_deleted && (
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {comm.content}
                          </div>
                        )}
                        {comm.attachment_name && comm.attachment_path && !comm.is_deleted && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <FileIcon className="w-4 h-4 text-gray-400" />
                            <button
                              onClick={async () => {
                                const { data } = supabase.storage
                                  .from("documents")
                                  .getPublicUrl(comm.attachment_path!);
                                window.open(data.publicUrl, "_blank");
                              }}
                              className="text-primary-blue hover:underline"
                            >
                              {comm.attachment_name}
                            </button>
                          </div>
                        )}
                        {comm.is_ticket && comm.ticket_status && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Status: {getTicketStatusLabel(comm.ticket_status)}
                            </span>
                            <span className="text-xs text-gray-400">
                              Klicken zum Bearbeiten
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

        <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
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
                  Nachricht versenden
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

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Dokument anhängen (optional)
                  </label>
                  <div className="space-y-3">
                    {!attachedFile ? (
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Dokument auswählen
                        </span>
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachedFile(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <FileIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600 flex-1">
                          {attachedFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
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

                  {!newEntryForm.is_internal && tenant?.email && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="send_email"
                        checked={newEntryForm.send_email}
                        onChange={(e) =>
                          setNewEntryForm({
                            ...newEntryForm,
                            send_email: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                      />
                      <label
                        htmlFor="send_email"
                        className="text-sm font-medium text-gray-600 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Auch per E-Mail an {tenant.email} senden
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewEntry(false)}
                    style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
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

        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-dark">
                    Ticket #{selectedTicket.ticket_number}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedTicket.subject}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setTicketMessages([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 border-b">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option value="open">Offen</option>
                      <option value="in_progress">In Bearbeitung</option>
                      <option value="resolved">Gelöst</option>
                      <option value="closed">Geschlossen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Priorität
                    </label>
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium inline-block">
                      {selectedTicket.priority === "high"
                        ? "Hoch"
                        : selectedTicket.priority === "medium"
                        ? "Mittel"
                        : "Niedrig"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Kategorie
                    </label>
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium inline-block">
                      {getCategoryLabel(selectedTicket.category)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {ticketMessages.length === 0 ? (
                  <p className="text-center text-gray-400">
                    Keine Nachrichten vorhanden
                  </p>
                ) : (
                  ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === "tenant"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          msg.sender_type === "tenant"
                            ? "bg-gray-100 text-dark"
                            : "bg-primary-blue text-white"
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {msg.sender_name} •{" "}
                          {new Date(msg.created_at).toLocaleString("de-DE")}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((attachment: any, idx: number) => (
                              <div key={idx}>
                                {attachment.type.startsWith("image/") ? (
                                  <div className="mt-2">
                                    <img
                                      src={attachment.data}
                                      alt={attachment.filename}
                                      className="max-w-full rounded border border-gray-200"
                                      style={{ maxHeight: "300px" }}
                                    />
                                    <p className="text-xs opacity-75 mt-1">{attachment.filename}</p>
                                  </div>
                                ) : (
                                  <a
                                    href={attachment.data}
                                    download={attachment.filename}
                                    className="inline-flex items-center gap-2 text-xs underline opacity-75 hover:opacity-100"
                                  >
                                    📎 {attachment.filename}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="border-t p-6">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                    rows={3}
                    placeholder="Ihre Antwort..."
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleTicketReply}
                      disabled={loading || !newReply.trim()}
                      className="px-6 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Senden..." : "Antwort senden"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PremiumFeatureGuard>
  );
}
