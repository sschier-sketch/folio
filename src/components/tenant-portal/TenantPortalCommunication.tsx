import { useState, useEffect, useRef } from "react";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Upload,
  X as XIcon,
  Image as ImageIcon,
  Send,
  FileText,
  Download,
  Tag,
  Mail,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCategoryLabel } from "../../lib/ticketUtils";
import { Button } from '../ui/Button';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface Attachment {
  filename: string;
  data: string;
  size: number;
  type: string;
}

interface TicketMessage {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
  attachments?: Attachment[] | null;
}

interface Communication {
  id: string;
  subject: string;
  content: string;
  communication_type: string;
  created_at: string;
  attachment_id?: string;
  attachment_name?: string;
  attachment_path?: string;
}

type ConversationItem =
  | { type: "ticket"; data: Ticket; sortDate: string }
  | { type: "communication"; data: Communication; sortDate: string };

interface Props {
  tenantId: string;
  tenantEmail: string;
  propertyId: string;
  userId: string;
}

export default function TenantPortalCommunication({
  tenantId,
  tenantEmail,
  propertyId,
  userId,
}: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    message: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendEmailCopy, setSendEmailCopy] = useState(false);
  const [filter, setFilter] = useState<"all" | "tickets" | "messages">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAll();
  }, [tenantId]);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadTickets(), loadCommunications()]);
    setLoading(false);
  }

  async function loadTickets() {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setTickets(data || []);
  }

  async function loadCommunications() {
    const { data } = await supabase
      .from("tenant_communications")
      .select(`
        *,
        documents:attachment_id(id, file_name, file_path)
      `)
      .eq("tenant_id", tenantId)
      .eq("is_internal", false)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    const mapped = (data || []).map((c: any) => ({
      ...c,
      attachment_id: c.documents?.id,
      attachment_name: c.documents?.file_name,
      attachment_path: c.documents?.file_path,
    }));
    setCommunications(mapped);
  }

  async function loadTicketMessages(ticketId: string) {
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }

  const conversationItems: ConversationItem[] = (() => {
    const items: ConversationItem[] = [];
    if (filter === "all" || filter === "tickets") {
      tickets.forEach((t) =>
        items.push({ type: "ticket", data: t, sortDate: t.updated_at || t.created_at })
      );
    }
    if (filter === "all" || filter === "messages") {
      communications.forEach((c) =>
        items.push({ type: "communication", data: c, sortDate: c.created_at })
      );
    }
    items.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
    return items;
  })();

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const ticketNumber = `T${Date.now().toString().slice(-8)}`;
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert([
          {
            ticket_number: ticketNumber,
            property_id: propertyId,
            tenant_id: tenantId,
            user_id: userId,
            subject: newTicketForm.subject,
            category: newTicketForm.category,
            priority: newTicketForm.priority,
            status: "open",
          },
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      if (ticket && newTicketForm.message.trim()) {
        const attachmentData = [];
        for (const file of attachments) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          attachmentData.push({
            filename: file.name,
            data: base64,
            size: file.size,
            type: file.type,
          });
        }

        await supabase.from("ticket_messages").insert([
          {
            ticket_id: ticket.id,
            sender_type: "tenant",
            sender_name: tenantEmail,
            sender_email: tenantEmail,
            message: newTicketForm.message,
            attachments: attachmentData,
          },
        ]);
      }

      if (sendEmailCopy && ticket) {
        try {
          const { data: landlordProfile } = await supabase
            .from("account_profiles")
            .select("first_name, last_name")
            .eq("user_id", userId)
            .maybeSingle();

          const landlordName = landlordProfile
            ? `${landlordProfile.first_name} ${landlordProfile.last_name}`.trim()
            : "Ihr Vermieter";

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Kopie Ihrer Anfrage</h2>
              <p>Hallo,</p>
              <p>hier ist eine Kopie Ihrer soeben erstellten Anfrage an ${landlordName}:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Ticket-Nummer:</strong> ${ticket.ticket_number}</p>
                <p><strong>Betreff:</strong> ${newTicketForm.subject}</p>
                <p><strong>Kategorie:</strong> ${getCategoryLabel(newTicketForm.category)}</p>
                <p><strong>Priorit&auml;t:</strong> ${newTicketForm.priority}</p>
                <p><strong>Nachricht:</strong></p>
                <p style="white-space: pre-wrap;">${newTicketForm.message}</p>
              </div>
              <p>Sie werden per E-Mail benachrichtigt, sobald ${landlordName} auf Ihre Anfrage antwortet.</p>
            </div>
          `;

          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: tenantEmail,
                subject: `Kopie Ihrer Anfrage: ${newTicketForm.subject}`,
                html: emailHtml,
              }),
            }
          );
        } catch {
          // silent
        }
      }

      setNewTicketForm({ subject: "", category: "general", priority: "medium", message: "" });
      setAttachments([]);
      setSendEmailCopy(false);
      setShowNewTicket(false);
      loadAll();
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Fehler beim Erstellen der Anfrage");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (ticketId: string, message: string) => {
    if (!message.trim()) return;
    await supabase.from("ticket_messages").insert([
      {
        ticket_id: ticketId,
        sender_type: "tenant",
        sender_name: tenantEmail,
        sender_email: tenantEmail,
        message: message.trim(),
      },
    ]);
    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    loadTicketMessages(ticketId);
    loadTickets();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      alert("Bitte nur Bilddateien auswaehlen");
    }
    setAttachments((prev) => [...prev, ...imageFiles].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
      open: { icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Offen", cls: "bg-blue-50 text-blue-700" },
      in_progress: { icon: <Clock className="w-3.5 h-3.5" />, label: "In Bearbeitung", cls: "bg-amber-50 text-amber-700" },
      resolved: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Geloest", cls: "bg-emerald-50 text-emerald-700" },
      closed: { icon: <XCircle className="w-3.5 h-3.5" />, label: "Geschlossen", cls: "bg-gray-100 text-gray-500" },
    };
    const s = map[status] || map.open;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500",
      medium: "bg-amber-400",
      low: "bg-gray-300",
    };
    return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />;
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffH = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffH < 1) return "Gerade eben";
    if (diffH < 24)
      return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    if (diffH < 168)
      return date.toLocaleDateString("de-DE", { weekday: "short" }) +
        " " +
        date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // ---- DETAIL: Communication (landlord message) ----
  if (selectedComm) {
    return (
      <div>
        <button
          onClick={() => setSelectedComm(null)}
          className="flex items-center gap-2 text-primary-blue hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurueck
        </button>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <Mail className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-bold text-dark">{selectedComm.subject}</h2>
            </div>
            <p className="text-sm text-gray-400 ml-8">
              Vermieter/Hausverwaltung &bull;{" "}
              {new Date(selectedComm.created_at).toLocaleString("de-DE")}
            </p>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-5">
              <p className="text-dark whitespace-pre-wrap leading-relaxed">
                {selectedComm.content}
              </p>
            </div>

            {selectedComm.attachment_name && selectedComm.attachment_path && (
              <div
                style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }}
                className="mt-4 flex items-center gap-2 p-3 border rounded-lg"
              >
                <FileText className="w-5 h-5 text-primary-blue" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{selectedComm.attachment_name}</p>
                  <p className="text-xs text-gray-500">Anhang</p>
                </div>
                <Button
                  onClick={() => {
                    const { data } = supabase.storage
                      .from("documents")
                      .getPublicUrl(selectedComm.attachment_path!);
                    window.open(data.publicUrl, "_blank");
                  }}
                  variant="primary"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- DETAIL: Ticket thread ----
  if (selectedTicket) {
    return (
      <div>
        <button
          onClick={() => {
            setSelectedTicket(null);
            setMessages([]);
          }}
          className="flex items-center gap-2 text-primary-blue hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurueck
        </button>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-dark">{selectedTicket.subject}</h2>
              {getStatusBadge(selectedTicket.status)}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>#{selectedTicket.ticket_number}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {getCategoryLabel(selectedTicket.category)}
              </span>
              <span>&bull;</span>
              <span>{getPriorityDot(selectedTicket.priority)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col" style={{ maxHeight: "70vh" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Noch keine Nachrichten</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === "tenant" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
                      msg.sender_type === "tenant"
                        ? "bg-primary-blue text-white rounded-br-md"
                        : "bg-gray-50 text-dark border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    <div className="text-xs opacity-60 mb-1.5">
                      {msg.sender_type === "tenant" ? "Sie" : "Vermieter/Hausverwaltung"} &bull;{" "}
                      {new Date(msg.created_at).toLocaleString("de-DE")}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx}>
                            {att.type.startsWith("image/") ? (
                              <div className="mt-2">
                                <img
                                  src={att.data}
                                  alt={att.filename}
                                  className="max-w-full rounded border border-white/20"
                                  style={{ maxHeight: "300px" }}
                                />
                                <p className="text-xs opacity-60 mt-1">{att.filename}</p>
                              </div>
                            ) : (
                              <a
                                href={att.data}
                                download={att.filename}
                                className="inline-flex items-center gap-2 text-xs underline opacity-75 hover:opacity-100"
                              >
                                <FileText className="w-3 h-3" /> {att.filename}
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
            <div ref={messagesEndRef} />
          </div>

          {selectedTicket.status !== "closed" && (
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem("message") as HTMLTextAreaElement;
                  handleSendMessage(selectedTicket.id, input.value);
                  input.value = "";
                }}
                className="flex gap-3"
              >
                <textarea
                  name="message"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={2}
                  placeholder="Ihre Nachricht..."
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                >
                  <Send className="w-4 h-4" />
                  Senden
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- LIST VIEW ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-dark">Kommunikation</h2>
        <Button
          onClick={() => setShowNewTicket(true)}
          variant="primary"
        >
          <Plus className="w-5 h-5" />
          Neue Anfrage
        </Button>
      </div>

      <div className="flex gap-2 mb-5">
        {(["all", "tickets", "messages"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-blue text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {f === "all" ? "Alle" : f === "tickets" ? "Anfragen" : "Nachrichten"}
          </button>
        ))}
      </div>

      {conversationItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">Keine Eintraege</h3>
          <p className="text-gray-400">
            {filter === "tickets"
              ? "Noch keine Anfragen vorhanden."
              : filter === "messages"
                ? "Noch keine Nachrichten von Ihrem Vermieter."
                : "Erstellen Sie eine Anfrage oder warten Sie auf Nachrichten Ihres Vermieters."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {conversationItems.map((item) => {
            if (item.type === "ticket") {
              const t = item.data;
              return (
                <div
                  key={`ticket-${t.id}`}
                  onClick={() => setSelectedTicket(t)}
                  className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <MessageSquare className="w-5 h-5 text-dark" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityDot(t.priority)}
                      <h3 className="font-semibold text-dark truncate">{t.subject}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-mono">#{t.ticket_number}</span>
                      <span>&bull;</span>
                      <span>{getCategoryLabel(t.category)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    {getStatusBadge(t.status)}
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(t.updated_at || t.created_at)}
                    </span>
                  </div>
                </div>
              );
            }

            const c = item.data;
            return (
              <div
                key={`comm-${c.id}`}
                onClick={() => setSelectedComm(c)}
                className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#F0FDF4", border: "1px solid #D1FAE5" }}
                >
                  <Mail className="w-5 h-5 text-emerald-700" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark truncate mb-1">{c.subject}</h3>
                  <p className="text-xs text-gray-400 truncate">{c.content}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    <Mail className="w-3.5 h-3.5" />
                    Nachricht
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatRelativeDate(c.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-dark">Neue Anfrage erstellen</h2>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Betreff *</label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Heizung defekt"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Kategorie</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="general">Allgemein</option>
                    <option value="maintenance">Wartung</option>
                    <option value="repair">Reparatur</option>
                    <option value="complaint">Beschwerde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Prioritaet</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Beschreibung *</label>
                <textarea
                  value={newTicketForm.message}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={5}
                  placeholder="Beschreiben Sie Ihr Anliegen..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Bilder anhaengen (max. 5)
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Bilder auswaehlen</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={attachments.length >= 5}
                    />
                  </label>

                  {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="relative group border border-gray-200 rounded-lg p-2 flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate flex-1">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailCopy}
                    onChange={(e) => setSendEmailCopy(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                  />
                  <span className="text-sm text-gray-600">
                    Kopie dieser Anfrage per E-Mail an {tenantEmail} senden
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  variant="cancel"
                  fullWidth
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                  fullWidth
                >
                  {submitting ? "Erstellen..." : "Anfrage erstellen"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
