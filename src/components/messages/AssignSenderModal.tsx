import { useState, useEffect } from 'react';
import { X, Search, UserPlus, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { MailThread } from './types';
import { Button } from '../ui/Button';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  property_name?: string;
}

interface AssignSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: MailThread;
  onAssigned: () => void;
}

export default function AssignSenderModal({ isOpen, onClose, thread, onAssigned }: AssignSenderModalProps) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) loadTenants();
  }, [isOpen, user]);

  async function loadTenants() {
    if (!user) return;
    const { data } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, email, properties(name)')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('last_name');

    setTenants(
      (data || []).map((t: any) => ({
        id: t.id,
        first_name: t.first_name,
        last_name: t.last_name,
        email: t.email,
        property_name: t.properties?.name || '',
      }))
    );
  }

  const filtered = tenants.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.first_name.toLowerCase().includes(q) ||
      t.last_name.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q))
    );
  });

  async function handleAssign(tenant: Tenant) {
    setAssigning(true);
    setError('');

    const { error: rpcErr } = await supabase.rpc('assign_thread_to_tenant', {
      p_thread_id: thread.id,
      p_tenant_id: tenant.id,
    });

    if (rpcErr) {
      setError(rpcErr.message || 'Fehler bei der Zuordnung.');
      setAssigning(false);
      return;
    }

    setAssigning(false);
    onAssigned();
    onClose();
  }

  if (!isOpen) return null;

  const senderDisplay = thread.external_name || thread.external_email || 'Unbekannter Absender';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Absender zuordnen</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">{senderDisplay}</span>
              {thread.external_email && thread.external_name && (
                <span className="text-amber-600 ml-1">({thread.external_email})</span>
              )}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Ordnen Sie diesen Absender einem Mieter zu, um den Thread in den Posteingang zu verschieben.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mieter suchen..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Keine Mieter gefunden.</p>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => handleAssign(t)}
                disabled={assigning}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.first_name} {t.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {t.email || 'Keine E-Mail'}
                    {t.property_name && ` -- ${t.property_name}`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
}
