import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Loader2,
  Search,
  User,
  Mail,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";

interface AdminNewMessageModalProps {
  onClose: () => void;
  onCreated: (ticketId: string) => void;
  prefillEmail?: string;
  prefillName?: string;
}

interface UserSuggestion {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function AdminNewMessageModal({
  onClose,
  onCreated,
  prefillEmail,
  prefillName,
}: AdminNewMessageModalProps) {
  const [mode, setMode] = useState<"user" | "email">(prefillEmail ? "email" : "user");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [searching, setSearching] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState(prefillEmail || "");
  const [recipientName, setRecipientName] = useState(prefillName || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSignature();
    if (!prefillEmail) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, []);

  useEffect(() => {
    if (prefillEmail) {
      setMode("email");
      setRecipientEmail(prefillEmail);
      setRecipientName(prefillName || "");
    }
  }, [prefillEmail, prefillName]);

  async function loadSignature() {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("ticket_reply_signature")
        .limit(1)
        .maybeSingle();
      if (data?.ticket_reply_signature) {
        setSignature(data.ticket_reply_signature);
      }
    } catch {}
  }

  async function searchUsers(query: string) {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase.rpc("admin_get_users");
      if (data) {
        const q = query.toLowerCase();
        const filtered = (data as UserSuggestion[])
          .filter(
            (u) =>
              u.email.toLowerCase().includes(q) ||
              (u.first_name && u.first_name.toLowerCase().includes(q)) ||
              (u.last_name && u.last_name.toLowerCase().includes(q))
          )
          .slice(0, 8);
        setSuggestions(filtered);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setSelectedUser(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchUsers(value), 300);
  }

  function handleSelectUser(user: UserSuggestion) {
    setSelectedUser(user);
    setRecipientEmail(user.email);
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    setRecipientName(name || user.email.split("@")[0]);
    setSearchQuery("");
    setSuggestions([]);
  }

  async function handleSend() {
    setError("");

    if (!recipientEmail.trim()) {
      setError("Bitte eine E-Mail-Adresse angeben");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setError("Ungueltige E-Mail-Adresse");
      return;
    }
    if (!subject.trim()) {
      setError("Bitte einen Betreff angeben");
      return;
    }
    if (!message.trim()) {
      setError("Bitte eine Nachricht eingeben");
      return;
    }

    setSending(true);
    try {
      const { data: ticketNumberData } = await supabase.rpc(
        "generate_contact_ticket_number"
      );
      const ticketNumber = ticketNumberData || `CONTACT-${Date.now()}`;

      const contactName =
        recipientName.trim() || recipientEmail.trim().split("@")[0];

      const { data: newTicket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          user_id: null,
          ticket_number: ticketNumber,
          ticket_type: "contact",
          subject: subject.trim(),
          contact_name: contactName,
          contact_email: recipientEmail.trim().toLowerCase(),
          status: "answered",
          priority: "medium",
          category: "inquiry",
          created_by_name: "Rentably Support",
          notify_admin_on_reply: true,
          answered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { data: userData } = await supabase.auth.getUser();
      const senderName = userData.user?.email?.split("@")[0] || "Support";

      const fullMessage = signature
        ? `${message.trim()}\n\n${signature}`
        : message.trim();

      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: newTicket.id,
          sender_type: "admin",
          sender_name: senderName,
          sender_email: userData.user?.email,
          message: fullMessage,
        });

      if (messageError) throw messageError;

      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: recipientEmail.trim().toLowerCase(),
              templateKey: "ticket_reply",
              variables: {
                recipientName: contactName,
                ticketNumber,
                ticketSubject: subject.trim(),
                replyMessage: fullMessage,
                additionalInfo:
                  "Bei Fragen antworten Sie einfach auf diese E-Mail.",
                senderName,
              },
            }),
          }
        );
      } catch (emailErr) {
        console.warn("Email send failed:", emailErr);
      }

      onCreated(newTicket.id);
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen der Nachricht");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-dark flex items-center gap-2">
            <Send className="w-4 h-4 text-primary-blue" />
            Neue Nachricht
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!prefillEmail && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
              <button
                onClick={() => {
                  setMode("user");
                  setSelectedUser(null);
                  setRecipientEmail("");
                  setRecipientName("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === "user"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Nutzer suchen
              </button>
              <button
                onClick={() => {
                  setMode("email");
                  setSelectedUser(null);
                  setSearchQuery("");
                  setSuggestions([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === "email"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                E-Mail eingeben
              </button>
            </div>
          )}

          {mode === "user" && !prefillEmail && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Empfaenger
              </label>
              {selectedUser ? (
                <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {[selectedUser.first_name, selectedUser.last_name]
                          .filter(Boolean)
                          .join(" ") || selectedUser.email}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {selectedUser.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setRecipientEmail("");
                      setRecipientName("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Name oder E-Mail suchen..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
                  />
                  {searching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {[user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(" ") || user.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 &&
                    !searching &&
                    suggestions.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <p className="text-xs text-gray-500 text-center">
                          Keine Nutzer gefunden
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {mode === "email" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="nutzer@beispiel.de"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
                  readOnly={!!prefillEmail}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Vorname Nachname"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
                  readOnly={!!prefillName}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Betreff
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff der Nachricht"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nachricht
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ihre Nachricht..."
              rows={6}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue resize-none"
            />
          </div>

          {signature && (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-[10px] text-gray-300 uppercase tracking-wide font-medium mb-1">
                Signatur
              </p>
              <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">
                {signature}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button onClick={onClose} variant="secondary">
            Abbrechen
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sending ||
              !recipientEmail.trim() ||
              !subject.trim() ||
              !message.trim()
            }
            variant="primary"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                Nachricht senden
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
