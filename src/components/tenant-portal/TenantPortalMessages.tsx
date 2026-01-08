import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Message {
  id: string;
  subject: string;
  content: string;
  communication_type: string;
  created_at: string;
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

  useEffect(() => {
    loadMessages();
  }, [tenantId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_communications")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_internal", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
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

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-dark mb-2">
          Keine Nachrichten
        </h3>
        <p className="text-gray-400">
          Sie haben noch keine Nachrichten von Ihrem Vermieter erhalten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-dark text-lg mb-1">
                {message.subject}
              </h3>
              <p className="text-xs text-gray-400">
                {new Date(message.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {message.content && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-dark whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
