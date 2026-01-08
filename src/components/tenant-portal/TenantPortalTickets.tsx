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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

interface TicketMessage {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
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

      setNewTicketForm({
        subject: "",
        category: "general",
        priority: "medium",
        message: "",
      });
      setAttachments([]);
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
              {getStatusIcon(selectedTicket.status)}
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
                      {msg.sender_name} •{" "}
                      {new Date(msg.created_at).toLocaleString("de-DE")}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.message}</div>
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
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-400">
                      #{ticket.ticket_number}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                    >
                      {getPriorityText(ticket.priority)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-dark mb-1">
                    {ticket.subject}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Erstellt am{" "}
                    {new Date(ticket.created_at).toLocaleDateString("de-DE")} •
                    Aktualisiert am{" "}
                    {new Date(ticket.updated_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <span className="text-sm font-medium text-gray-600">
                    {getStatusText(ticket.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
