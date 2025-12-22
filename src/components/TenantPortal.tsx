import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LogOut, Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TenantLogin from './TenantLogin';
import Footer from './Footer';

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

interface Property {
  id: string;
  name: string;
  address: string;
}

export default function TenantPortal() {
  const { userId } = useParams<{ userId: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  const [newTicketForm, setNewTicketForm] = useState({
    property_id: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  useEffect(() => {
    const savedSession = localStorage.getItem(`tenant_session_${userId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const expiryTime = new Date(session.expiry).getTime();
      if (Date.now() < expiryTime) {
        setIsAuthenticated(true);
        setTenantId(session.tenantId);
        setTenantEmail(session.email);
      } else {
        localStorage.removeItem(`tenant_session_${userId}`);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && tenantId) {
      loadData();
    }
  }, [isAuthenticated, tenantId]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const handleLoginSuccess = (id: string, email: string) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    localStorage.setItem(
      `tenant_session_${userId}`,
      JSON.stringify({ tenantId: id, email, expiry: expiry.toISOString() })
    );

    setIsAuthenticated(true);
    setTenantId(id);
    setTenantEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem(`tenant_session_${userId}`);
    setIsAuthenticated(false);
    setTenantId(null);
    setTenantEmail('');
    setTickets([]);
    setSelectedTicket(null);
  };

  const loadData = async () => {
    if (!tenantId) return;

    try {
      const [ticketsRes, propertiesRes] = await Promise.all([
        supabase
          .from('tickets')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false }),
        supabase
          .from('tenants')
          .select('property_id, properties(id, name, address)')
          .eq('id', tenantId)
      ]);

      setTickets(ticketsRes.data || []);

      if (propertiesRes.data && propertiesRes.data.length > 0) {
        const props = propertiesRes.data
          .map((t: any) => t.properties)
          .filter((p: any) => p !== null);
        setProperties(props);

        if (props.length > 0 && !newTicketForm.property_id) {
          setNewTicketForm(prev => ({ ...prev, property_id: props[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !userId) return;

    setLoading(true);

    try {
      const ticketNumber = `T${Date.now().toString().slice(-8)}`;

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([
          {
            ticket_number: ticketNumber,
            property_id: newTicketForm.property_id,
            tenant_id: tenantId,
            user_id: userId,
            subject: newTicketForm.subject,
            category: newTicketForm.category,
            priority: newTicketForm.priority,
            status: 'open',
          },
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      if (ticket && newTicketForm.message.trim()) {
        const { error: messageError } = await supabase
          .from('ticket_messages')
          .insert([
            {
              ticket_id: ticket.id,
              sender_type: 'tenant',
              sender_name: tenantEmail,
              sender_email: tenantEmail,
              message: newTicketForm.message,
            },
          ]);

        if (messageError) throw messageError;
      }

      setNewTicketForm({
        property_id: properties[0]?.id || '',
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
      });
      setShowNewTicket(false);
      loadData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Fehler beim Erstellen des Tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (ticketId: string, message: string) => {
    if (!message.trim()) return;

    try {
      const { error } = await supabase.from('ticket_messages').insert([
        {
          ticket_id: ticketId,
          sender_type: 'tenant',
          sender_name: tenantEmail,
          sender_email: tenantEmail,
          message: message.trim(),
        },
      ]);

      if (error) throw error;

      await supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      loadMessages(ticketId);
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-slate-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'resolved':
        return 'Gelöst';
      case 'closed':
        return 'Geschlossen';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-100 text-slate-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Niedrig';
      case 'medium':
        return 'Mittel';
      case 'high':
        return 'Hoch';
      default:
        return priority;
    }
  };

  if (!isAuthenticated) {
    return <TenantLogin landlordId={userId!} onLoginSuccess={handleLoginSuccess} />;
  }

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setMessages([]);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
              >
                ← Zurück zu allen Tickets
              </button>
              <h1 className="text-2xl font-bold text-slate-900">
                Ticket #{selectedTicket.ticket_number}
              </h1>
              <p className="text-slate-600">{selectedTicket.subject}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedTicket.status)}
                <span className="text-sm font-medium text-slate-700">
                  {getStatusText(selectedTicket.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Noch keine Nachrichten</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'tenant' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        msg.sender_type === 'tenant'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">
                        {msg.sender_name} • {new Date(msg.created_at).toLocaleString('de-DE')}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="border-t border-slate-200 p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('message') as HTMLTextAreaElement;
                    handleSendMessage(selectedTicket.id, input.value);
                    input.value = '';
                  }}
                >
                  <textarea
                    name="message"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    rows={3}
                    placeholder="Ihre Nachricht..."
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Nachricht senden
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mieter-Portal</h1>
            <p className="text-slate-600">{tenantEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Abmelden
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Meine Anfragen</h2>
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Neue Anfrage
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">Noch keine Anfragen</p>
            <p className="text-slate-500 text-sm">
              Erstellen Sie Ihre erste Anfrage, um mit Ihrem Vermieter in Kontakt zu treten.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-slate-500">
                        #{ticket.ticket_number}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {getPriorityText(ticket.priority)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Erstellt am {new Date(ticket.created_at).toLocaleDateString('de-DE')} •
                      Aktualisiert am {new Date(ticket.updated_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className="text-sm font-medium text-slate-700">
                      {getStatusText(ticket.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Neue Anfrage erstellen</h2>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {properties.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Immobilie
                  </label>
                  <select
                    value={newTicketForm.property_id}
                    onChange={(e) =>
                      setNewTicketForm({ ...newTicketForm, property_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name} - {prop.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Betreff *
                </label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) =>
                    setNewTicketForm({ ...newTicketForm, subject: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. Heizung defekt"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) =>
                      setNewTicketForm({ ...newTicketForm, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="general">Allgemein</option>
                    <option value="maintenance">Wartung</option>
                    <option value="repair">Reparatur</option>
                    <option value="complaint">Beschwerde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priorität
                  </label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) =>
                      setNewTicketForm({ ...newTicketForm, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Beschreibung *
                </label>
                <textarea
                  value={newTicketForm.message}
                  onChange={(e) =>
                    setNewTicketForm({ ...newTicketForm, message: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={5}
                  placeholder="Beschreiben Sie Ihr Anliegen..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Erstellen...' : 'Anfrage erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
