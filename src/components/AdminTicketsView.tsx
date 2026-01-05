import { useState, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Filter,
} from "lucide-react";
import { supabase } from "../lib/supabase";
interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
  answered_at?: string;
  closed_at?: string;
}
interface TicketMessage {
  id: string;
  sender_type: string;
  sender_name: string;
  sender_email?: string;
  message: string;
  created_at: string;
}
export function AdminTicketsView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "answered" | "closed"
  >("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [closeAfterReply, setCloseAfterReply] = useState(false);
  useEffect(() => {
    loadTickets();
  }, [statusFilter]);
  async function loadTickets() {
    try {
      setLoading(true);
      let query = supabase
        .from("tickets")
        .select("*")
        .eq("ticket_type", "contact");
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      const sortedTickets = (data || []).sort((a, b) => {
        const statusOrder = {
          open: 1,
          answered: 2,
          closed: 3,
        };
        const statusDiff =
          (statusOrder[a.status as keyof typeof statusOrder] || 999) -
          (statusOrder[b.status as keyof typeof statusOrder] || 999);
        if (statusDiff !== 0) return statusDiff;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setTickets(sortedTickets);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  }
  async function loadMessages(ticketId: string) {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", {
          ascending: true,
        });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }
  async function handleSelectTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    await loadMessages(ticket.id);
    setReplyMessage("");
    setCloseAfterReply(false);
  }
  async function handleSendReply() {
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      setSending(true);
      const { data: userData } = await supabase.auth.getUser();
      const senderName = userData.user?.email?.split("@")[0] || "Support";
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_type: "admin",
          sender_name: senderName,
          sender_email: userData.user?.email,
          message: replyMessage.trim(),
        });
      if (messageError) throw messageError;

      const newStatus = closeAfterReply ? "closed" : "answered";
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "answered" && selectedTicket.status === "open") {
        updateData.answered_at = new Date().toISOString();
      }
      if (newStatus === "closed") {
        updateData.closed_at = new Date().toISOString();
      }
      const { error: updateError } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", selectedTicket.id);
      if (updateError) throw updateError;

      const additionalInfo = closeAfterReply
        ? "Dieses Ticket wurde geschlossen. Bei weiteren Fragen können Sie uns jederzeit erneut kontaktieren."
        : "Bei weiteren Fragen können Sie uns jederzeit kontaktieren.";

      try {
        const emailResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: selectedTicket.contact_email,
              templateKey: "ticket_reply",
              variables: {
                recipientName: selectedTicket.contact_name,
                ticketNumber: selectedTicket.ticket_number,
                ticketSubject: selectedTicket.subject,
                replyMessage: replyMessage.trim(),
                additionalInfo: additionalInfo,
                senderName: senderName,
              },
            }),
          },
        );
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({}));
          console.warn("Email notification could not be sent:", errorData);
        }
      } catch (emailError) {
        console.warn("Email notification service unavailable:", emailError);
      }

      await loadTickets();
      await loadMessages(selectedTicket.id);
      setReplyMessage("");
      setCloseAfterReply(false);
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Fehler beim Senden der Antwort");
    } finally {
      setSending(false);
    }
  }
  async function handleChangeStatus(newStatus: string) {
    if (!selectedTicket) return;
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "answered" && selectedTicket.status === "open") {
        updateData.answered_at = new Date().toISOString();
      }
      if (newStatus === "closed") {
        updateData.closed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", selectedTicket.id);
      if (error) throw error;
      await loadTickets();
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    } catch (err) {
      console.error("Error changing ticket status:", err);
      alert("Fehler beim Ändern des Status");
    }
  }
  async function handleCloseTicket() {
    if (!selectedTicket) return;
    if (!confirm("Möchten Sie dieses Ticket wirklich schließen?")) return;
    await handleChangeStatus("closed");
  }
  const getStatusBadge = (status: string) => {
    const badges = {
      open: {
        bg: "bg-primary-blue/10",
        text: "text-primary-blue",
        icon: Clock,
        label: "Offen",
      },
      answered: {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        icon: CheckCircle,
        label: "Beantwortet",
      },
      closed: {
        bg: "bg-gray-50",
        text: "text-dark",
        icon: XCircle,
        label: "Geschlossen",
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.open;
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${badge.bg}
${badge.text}`}
      >
        {" "}
        <Icon className="w-3 h-3" /> {badge.label}
      </span>
    );
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
      {" "}
      <div className="lg:col-span-1 bg-white rounded overflow-hidden flex flex-col">
        {" "}
        <div className="p-4 border-b ">
          {" "}
          <h2 className="text-lg font-bold text-dark mb-3">
            Kontakt-Tickets
          </h2>{" "}
          <div className="flex gap-2">
            {" "}
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === "all" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
            >
              {" "}
              Alle ({tickets.length}){" "}
            </button>{" "}
            <button
              onClick={() => setStatusFilter("open")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === "open" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
            >
              {" "}
              Offen{" "}
            </button>{" "}
            <button
              onClick={() => setStatusFilter("answered")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === "answered" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
            >
              {" "}
              Beantwortet{" "}
            </button>{" "}
            <button
              onClick={() => setStatusFilter("closed")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === "closed" ? "bg-primary-blue text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
            >
              {" "}
              Geschlossen{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex-1 overflow-y-auto">
          {" "}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              {" "}
              <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />{" "}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center text-gray-300">
              {" "}
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-200" />{" "}
              <p>Keine Tickets gefunden</p>{" "}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {" "}
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? "bg-primary-blue/5" : ""}`}
                >
                  {" "}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {" "}
                    <span className="text-xs text-gray-300">
                      #{ticket.ticket_number}
                    </span>{" "}
                    {getStatusBadge(ticket.status)}
                  </div>{" "}
                  <h3 className="font-semibold text-dark mb-1 line-clamp-1">
                    {ticket.subject}
                  </h3>{" "}
                  <p className="text-sm text-gray-400 mb-1">
                    {ticket.contact_name}
                  </p>{" "}
                  <p className="text-xs text-gray-300">
                    {new Date(ticket.created_at).toLocaleString("de-DE")}
                  </p>{" "}
                </button>
              ))}
            </div>
          )}
        </div>{" "}
      </div>{" "}
      <div className="lg:col-span-2 bg-white rounded overflow-hidden flex flex-col">
        {" "}
        {selectedTicket ? (
          <>
            {" "}
            <div className="p-6 border-b ">
              {" "}
              <div className="flex items-start justify-between mb-3">
                {" "}
                <div className="flex-1">
                  {" "}
                  <div className="flex items-center gap-2 mb-2">
                    {" "}
                    <h2 className="text-xl font-bold text-dark">
                      {selectedTicket.subject}
                    </h2>{" "}
                    {getStatusBadge(selectedTicket.status)}
                  </div>{" "}
                  <p className="text-sm text-gray-400">
                    Ticket #{selectedTicket.ticket_number}
                  </p>{" "}
                </div>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleChangeStatus(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    {" "}
                    <option value="open">Offen</option>{" "}
                    <option value="answered">Beantwortet</option>{" "}
                    <option value="closed">Geschlossen</option>{" "}
                  </select>{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {" "}
                <div>
                  {" "}
                  <p className="text-gray-300">Von:</p>{" "}
                  <p className="font-medium text-dark">
                    {selectedTicket.contact_name}
                  </p>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="text-gray-300">E-Mail:</p>{" "}
                  <p className="font-medium text-dark">
                    {selectedTicket.contact_email}
                  </p>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="text-gray-300">Erstellt:</p>{" "}
                  <p className="font-medium text-dark">
                    {new Date(selectedTicket.created_at).toLocaleString(
                      "de-DE",
                    )}
                  </p>{" "}
                </div>{" "}
                {selectedTicket.answered_at && (
                  <div>
                    {" "}
                    <p className="text-gray-300">Beantwortet:</p>{" "}
                    <p className="font-medium text-dark">
                      {new Date(selectedTicket.answered_at).toLocaleString(
                        "de-DE",
                      )}
                    </p>{" "}
                  </div>
                )}
              </div>{" "}
            </div>{" "}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {" "}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender_type === "admin" ? "flex-row-reverse" : ""}`}
                >
                  {" "}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.sender_type === "admin" ? "bg-primary-blue" : "bg-gray-400"}`}
                  >
                    {" "}
                    {msg.sender_type === "admin" ? (
                      <Mail className="w-5 h-5 text-white" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-white" />
                    )}
                  </div>{" "}
                  <div
                    className={`flex-1 ${msg.sender_type === "admin" ? "text-right" : ""}`}
                  >
                    {" "}
                    <div className="flex items-center gap-2 mb-1">
                      {" "}
                      <span className="font-medium text-dark">
                        {msg.sender_name}
                      </span>{" "}
                      <span className="text-xs text-gray-300">
                        {new Date(msg.created_at).toLocaleString("de-DE")}
                      </span>{" "}
                    </div>{" "}
                    <div
                      className={`inline-block max-w-[80%] p-3 rounded-lg ${msg.sender_type === "admin" ? "bg-primary-blue text-white" : "bg-gray-50 text-dark"}`}
                    >
                      {" "}
                      <p className="whitespace-pre-wrap">{msg.message}</p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              ))}
            </div>{" "}
            {selectedTicket.status !== "closed" && (
              <div className="p-6 border-t ">
                {" "}
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Antwort eingeben..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none mb-3"
                />{" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    {" "}
                    <input
                      type="checkbox"
                      checked={closeAfterReply}
                      onChange={(e) => setCloseAfterReply(e.target.checked)}
                      className="rounded"
                    />{" "}
                    Ticket nach Antwort schließen{" "}
                  </label>{" "}
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sending}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {" "}
                    {sending ? (
                      <>
                        {" "}
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                        Wird gesendet...{" "}
                      </>
                    ) : (
                      <>
                        {" "}
                        <Send className="w-4 h-4" /> Antworten{" "}
                      </>
                    )}
                  </button>{" "}
                </div>{" "}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            {" "}
            <div className="text-center">
              {" "}
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-200" />{" "}
              <p>Wählen Sie ein Ticket aus der Liste</p>{" "}
            </div>{" "}
          </div>
        )}
      </div>{" "}
    </div>
  );
}
