import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Message {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
  ticket: {
    ticket_number: string;
    subject: string;
    status: string;
  };
}

interface TenantPortalMessagesProps {
  tenantId: string;
  tenantEmail: string;
}

export default function TenantPortalMessages({
  tenantId,
  tenantEmail,
}: TenantPortalMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedMessages, setGroupedMessages] = useState<{
    [key: string]: Message[];
  }>({});

  useEffect(() => {
    loadMessages();
  }, [tenantId]);

  const loadMessages = async () => {
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id")
        .eq("tenant_id", tenantId);

      if (ticketsError) throw ticketsError;

      const ticketIds = tickets?.map((t) => t.id) || [];

      if (ticketIds.length > 0) {
        const { data, error } = await supabase
          .from("ticket_messages")
          .select(
            `
            *,
            ticket:tickets(ticket_number, subject, status)
          `
          )
          .in("ticket_id", ticketIds)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const grouped: { [key: string]: Message[] } = {};
        data?.forEach((message) => {
          const ticketId = message.ticket_id;
          if (!grouped[ticketId]) {
            grouped[ticketId] = [];
          }
          grouped[ticketId].push(message as Message);
        });

        setGroupedMessages(grouped);
        setMessages(data as Message[] || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("de-DE", { weekday: "short" });
    } else {
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (Object.keys(groupedMessages).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-dark mb-2">
          Keine Nachrichten
        </h3>
        <p className="text-gray-400">
          Sie haben noch keine Nachrichten. Nachrichten erscheinen hier, wenn
          Sie ein Ticket erstellen oder eine Antwort erhalten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedMessages).map(([ticketId, ticketMessages]) => {
        const latestMessage = ticketMessages[0];
        const unreadCount = ticketMessages.filter(
          (m) => m.sender_type !== "tenant"
        ).length;

        return (
          <div
            key={ticketId}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-dark">
                    {latestMessage.ticket.subject}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    #{latestMessage.ticket.ticket_number}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {ticketMessages.length}{" "}
                  {ticketMessages.length === 1 ? "Nachricht" : "Nachrichten"}
                </p>
              </div>
              {unreadCount > 0 && (
                <span className="bg-primary-blue text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {ticketMessages.slice(0, 3).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === "tenant" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender_type === "tenant"
                        ? "bg-primary-blue/10 text-dark"
                        : "bg-gray-50 text-dark"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {ticketMessages.length > 3 && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-400">
                  + {ticketMessages.length - 3} weitere Nachrichten
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
