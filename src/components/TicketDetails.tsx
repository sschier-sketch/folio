import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  created_by_name: string | null;
  ticket_type?: string;
  contact_name?: string | null;
  contact_email?: string | null;
  properties?: {
    name: string;
  };
  tenants?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface TicketDetailsProps {
  ticket: Ticket;
  onBack: () => void;
}

export default function TicketDetails({ ticket, onBack }: TicketDetailsProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [ticket]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);

    try {
      if (ticket.ticket_type === 'contact' && ticket.contact_email) {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-reply`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketId: ticket.id,
              message: newMessage,
              senderName: user.email || 'Rentab.ly Support',
              senderEmail: user.email || 'support@rentab.ly',
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send reply');
        }

        setNewMessage('');
        loadMessages();
      } else {
        const { error } = await supabase.from('ticket_messages').insert([
          {
            ticket_id: ticket.id,
            sender_type: 'landlord',
            sender_name: user.email || 'Vermieter',
            sender_email: user.email,
            message: newMessage,
          },
        ]);

        if (error) throw error;

        setNewMessage('');
        loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;
      onBack();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'closed':
        return 'Geschlossen';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück zur Übersicht
      </button>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(ticket.status)}
              <div>
                <div className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-1">
                  {ticket.ticket_number}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  ticket.status === 'open'
                    ? 'bg-red-100 text-red-700'
                    : ticket.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {getStatusLabel(ticket.status)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {ticket.status === 'open' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-all hover:"
                >
                  In Bearbeitung
                </button>
              )}
              {ticket.status !== 'closed' && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all hover:"
                >
                  Schließen
                </button>
              )}
              {ticket.status === 'closed' && (
                <button
                  onClick={() => handleStatusChange('open')}
                  className="px-4 py-2 bg-primary-blue text-white rounded-full text-sm font-medium hover:bg-primary-blue transition-all hover:"
                >
                  Wieder öffnen
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-dark mb-4">{ticket.subject}</h1>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {ticket.ticket_type === 'contact' ? (
              <>
                <div>
                  <span className="text-gray-300 font-medium">Typ:</span>
                  <div className="text-dark mt-1">
                    <span className="inline-flex items-center px-2 py-1 bg-primary-blue/10 text-primary-blue rounded-full text-xs font-medium">
                      Kontaktanfrage
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-300 font-medium">Kontakt Name:</span>
                  <div className="text-dark mt-1">{ticket.contact_name}</div>
                </div>

                <div>
                  <span className="text-gray-300 font-medium">Kontakt E-Mail:</span>
                  <div className="text-dark mt-1">
                    <a href={`mailto:${ticket.contact_email}`} className="text-primary-blue hover:underline">
                      {ticket.contact_email}
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-gray-300 font-medium">Immobilie:</span>
                  <div className="text-dark mt-1">{ticket.properties?.name}</div>
                </div>

                {ticket.tenants && (
                  <div>
                    <span className="text-gray-300 font-medium">Mieter:</span>
                    <div className="text-dark mt-1">
                      {ticket.tenants.first_name} {ticket.tenants.last_name}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <span className="text-gray-300 font-medium">Erstellt am:</span>
              <div className="text-dark mt-1">
                {new Date(ticket.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} Uhr
              </div>
            </div>

            {ticket.created_by_name && (
              <div>
                <span className="text-gray-300 font-medium">Erstellt von:</span>
                <div className="text-dark mt-1">{ticket.created_by_name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-dark mb-4">Nachrichtenverlauf</h2>

        {messages.length === 0 ? (
          <p className="text-gray-300 text-center py-8">Noch keine Nachrichten</p>
        ) : (
          <div className="space-y-4 mb-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'landlord' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.sender_type === 'landlord'
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-50 text-dark'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-2">
                    {message.sender_name} • {new Date(message.created_at).toLocaleString('de-DE')}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {ticket.status !== 'closed' && (
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Nachricht schreiben..."
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Senden
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
