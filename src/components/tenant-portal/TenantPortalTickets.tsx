import { useState, useEffect } from "react";
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
  Eye,
  Calendar,
  Tag,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCategoryLabel } from "../../lib/ticketUtils";

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

interface TenantPortalTicketsProps {
  tenantId: string;
  tenantEmail: string;
  propertyId: string;
  userId: string;
}

export default function TenantPortalTickets({
  tenantId,
  tenantEmail,
  propertyId,
  userId,
}: TenantPortalTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    message: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendEmailCopy, setSendEmailCopy] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [tenantId]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

        const { error: messageError } = await supabase
          .from("ticket_messages")
          .insert([
            {
              ticket_id: ticket.id,
              sender_type: "tenant",
              sender_name: tenantEmail,
              sender_email: tenantEmail,
              message: newTicketForm.message,
              attachments: attachmentData,
            },
          ]);

        if (messageError) throw messageError;
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
                <p><strong>Priorität:</strong> ${newTicketForm.priority}</p>
                <p><strong>Nachricht:</strong></p>
                <p style="white-space: pre-wrap;">${newTicketForm.message}</p>
              </div>
              <p>Sie werden per E-Mail benachrichtigt, sobald ${landlordName} auf Ihre Anfrage antwortet.</p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
              </p>
            </div>
          `;

          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: tenantEmail,
                subject: `Kopie Ihrer Anfrage: ${newTicketForm.subject}`,
                html: emailHtml,
              }),
            }
          );
        } catch (emailError) {
          console.error("Error sending email copy:", emailError);
        }
      }

      setNewTicketForm({
        subject: "",
        category: "general",
        priority: "medium",
        message: "",
      });
      setAttachments([]);
      setSendEmailCopy(false);
      setShowNewTicket(false);
      loadTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Fehler beim Erstellen des Tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== files.length) {
      alert("Bitte wählen Sie nur Bilddateien aus");
    }

    setAttachments((prev) => [...prev, ...imageFiles].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (ticketId: string, message: string) => {
    if (!message.trim()) return;

    try {
      const { error } = await supabase.from("ticket_messages").insert([
        {
          ticket_id: ticketId,
          sender_type: "tenant",
          sender_name: tenantEmail,
          sender_email: tenantEmail,
          message: message.trim(),
        },
      ]);

      if (error) throw error;

      await supabase
        .from("tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      loadMessages(ticketId);
      loadTickets();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4 text-primary-blue" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      open: "Offen",
      in_progress: "In Bearbeitung",
      resolved: "Gelöst",
      closed: "Geschlossen",
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: "bg-gray-50 text-gray-600",
      medium: "bg-amber-100 text-amber-700",
      high: "bg-red-100 text-red-700",
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      low: "Niedrig",
      medium: "Mittel",
      high: "Hoch",
    };
    return priorityMap[priority] || priority;
  };

  if (selectedTicket) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedTicket(null);
              setMessages([]);
            }}
            className="flex items-center gap-2 text-primary-blue hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu allen Tickets
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">
                Ticket #{selectedTicket.ticket_number}
              </h2>
              <p className="text-gray-400">{selectedTicket.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5">
                {(() => {
                  switch (selectedTicket.status) {
                    case "open":
                      return <AlertCircle className="w-5 h-5 text-primary-blue" />;
                    case "in_progress":
                      return <Clock className="w-5 h-5 text-amber-600" />;
                    case "resolved":
                      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
                    case "closed":
                      return <XCircle className="w-5 h-5 text-gray-400" />;
                    default:
                      return <MessageSquare className="w-5 h-5 text-gray-400" />;
                  }
                })()}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {getStatusText(selectedTicket.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Noch keine Nachrichten
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === "tenant" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${msg.sender_type === "tenant" ? "bg-primary-blue text-white" : "bg-gray-50 text-dark"}`}
                  >
                    <div className="text-xs opacity-75 mb-1">
                      {msg.sender_type === "tenant" ? msg.sender_name : "Vermieter/Hausverwaltung"} •{" "}
                      {new Date(msg.created_at).toLocaleString("de-DE")}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.message}</div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.attachments.map((attachment, idx) => (
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
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem(
                    "message"
                  ) as HTMLTextAreaElement;
                  handleSendMessage(selectedTicket.id, input.value);
                  input.value = "";
                }}
              >
                <textarea
                  name="message"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={3}
                  placeholder="Ihre Nachricht..."
                  required
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nachricht senden
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-dark">Meine Anfragen</h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neue Anfrage
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Anfragen
          </h3>
          <p className="text-gray-400">
            Erstellen Sie Ihre erste Anfrage, um mit Ihrem Vermieter in Kontakt
            zu treten.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-dark">
              Übersicht ({tickets.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Ticket-Nr.
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Betreff
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Erstellt am
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Priorität
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-gray-700">
                          #{ticket.ticket_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-medium text-dark">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3" />
                        {getCategoryLabel(ticket.category)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(ticket.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                      >
                        {getPriorityText(ticket.priority)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-xs font-medium text-gray-700">
                          {getStatusText(ticket.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                        }}
                        className="text-primary-blue hover:text-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-dark">
                Neue Anfrage erstellen
              </h2>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Betreff *
                </label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) =>
                    setNewTicketForm({
                      ...newTicketForm,
                      subject: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Heizung defekt"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="general">Allgemein</option>
                    <option value="maintenance">Wartung</option>
                    <option value="repair">Reparatur</option>
                    <option value="complaint">Beschwerde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Priorität
                  </label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        priority: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Beschreibung *
                </label>
                <textarea
                  value={newTicketForm.message}
                  onChange={(e) =>
                    setNewTicketForm({
                      ...newTicketForm,
                      message: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={5}
                  placeholder="Beschreiben Sie Ihr Anliegen..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Bilder anhängen (max. 5)
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Bilder auswählen
                    </span>
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
                          <span className="text-xs text-gray-600 truncate flex-1">
                            {file.name}
                          </span>
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
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1 px-4 py-2 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Erstellen..." : "Anfrage erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
