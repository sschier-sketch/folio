import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Property {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}

interface InvitedUser {
  id: string;
  email: string;
}

interface Ticket {
  id: string;
  property_id: string;
  tenant_id: string | null;
  subject: string;
  status: string;
  priority: string;
  category: string;
}

interface TicketModalProps {
  ticket: Ticket | null;
  properties: Property[];
  tenants: Tenant[];
  onClose: () => void;
  onSave: () => void;
}

export default function TicketModal({ ticket, properties, tenants, onClose, onSave }: TicketModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [formData, setFormData] = useState({
    property_id: '',
    tenant_id: '',
    subject: '',
    status: 'open',
    priority: 'medium',
    category: 'general',
    message: '',
    assigned_user_id: '',
    notify_user_by_email: false,
    notify_tenant_by_email: false,
  });

  useEffect(() => {
    loadInvitedUsers();
  }, [user]);

  useEffect(() => {
    if (ticket) {
      setFormData({
        property_id: ticket.property_id,
        tenant_id: ticket.tenant_id || '',
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        message: '',
        assigned_user_id: '',
        notify_user_by_email: false,
        notify_tenant_by_email: false,
      });
    }
  }, [ticket]);

  const loadInvitedUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('invitee_user_id, invitee_email')
        .eq('inviter_id', user.id)
        .eq('status', 'accepted')
        .not('invitee_user_id', 'is', null);

      if (error) throw error;

      const users: InvitedUser[] = (data || []).map((inv: any) => ({
        id: inv.invitee_user_id,
        email: inv.invitee_email,
      }));

      setInvitedUsers(users);
    } catch (error) {
      console.error('Error loading invited users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const ticketData = {
        property_id: formData.property_id,
        tenant_id: formData.tenant_id || null,
        user_id: user.id,
        ticket_type: 'property',
        subject: formData.subject,
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        created_by_name: user.email,
        assigned_user_id: formData.assigned_user_id || null,
        notify_user_by_email: formData.notify_user_by_email,
        notify_tenant_by_email: formData.notify_tenant_by_email,
      };

      if (ticket) {
        // Don't update ticket_number on edit
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', ticket.id);
        if (error) throw error;

        if (formData.message.trim()) {
          const { error: messageError } = await supabase.from('ticket_messages').insert([
            {
              ticket_id: ticket.id,
              sender_type: 'landlord',
              sender_name: user.email || 'Vermieter',
              sender_email: user.email,
              message: formData.message,
            },
          ]);
          if (messageError) throw messageError;
        }
      } else {
        const { data: newTicket, error } = await supabase
          .from('tickets')
          .insert([ticketData])
          .select()
          .single();

        if (error) throw error;

        if (formData.message.trim() && newTicket) {
          const { error: messageError } = await supabase.from('ticket_messages').insert([
            {
              ticket_id: newTicket.id,
              sender_type: 'landlord',
              sender_name: user.email || 'Vermieter',
              sender_email: user.email,
              message: formData.message,
            },
          ]);
          if (messageError) throw messageError;
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Fehler beim Speichern des Tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {ticket ? 'Ticket bearbeiten' : 'Neues Ticket'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Immobilie *
              </label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">Bitte wählen...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mieter
              </label>
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Kein Mieter zugeordnet</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.first_name} {tenant.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Betreff *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="z.B. Heizung defekt"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="general">Allgemein</option>
                <option value="maintenance">Wartung</option>
                <option value="repair">Reparatur</option>
                <option value="complaint">Beschwerde</option>
                <option value="question">Frage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priorität
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="closed">Geschlossen</option>
              </select>
            </div>

            {invitedUsers.length > 0 && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Benutzer zuweisen
                </label>
                <select
                  value={formData.assigned_user_id}
                  onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Keinem Benutzer zugewiesen</option>
                  {invitedUsers.map((invitedUser) => (
                    <option key={invitedUser.id} value={invitedUser.id}>
                      {invitedUser.email}
                    </option>
                  ))}
                </select>
                {formData.assigned_user_id && (
                  <label className="flex items-center gap-2 mt-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_user_by_email}
                      onChange={(e) => setFormData({ ...formData, notify_user_by_email: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    Benutzer per E-Mail benachrichtigen
                  </label>
                )}
              </div>
            )}

            {formData.tenant_id && (
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notify_tenant_by_email}
                    onChange={(e) => setFormData({ ...formData, notify_tenant_by_email: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  Mieter per E-Mail benachrichtigen
                </label>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {ticket ? 'Nachricht hinzufügen' : 'Beschreibung'}
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={4}
                placeholder="Beschreiben Sie das Anliegen..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
