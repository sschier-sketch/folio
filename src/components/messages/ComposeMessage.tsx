import { useState, useEffect } from 'react';
import { X, Send, Search, Users, AtSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  property_name?: string;
}

interface ComposeMessageProps {
  isOpen: boolean;
  onClose: () => void;
  userAlias: string;
  onSent: () => void;
}

export default function ComposeMessage({ isOpen, onClose, userAlias, onSent }: ComposeMessageProps) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientType, setRecipientType] = useState<'tenant' | 'manual'>('tenant');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

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

  const filteredTenants = tenants.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.first_name.toLowerCase().includes(q) ||
      t.last_name.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q))
    );
  });

  async function handleSend() {
    if (!user) return;
    setError('');

    const recipientEmail = recipientType === 'tenant'
      ? selectedTenant?.email || ''
      : manualEmail.trim();

    const recipientName = recipientType === 'tenant'
      ? `${selectedTenant?.first_name} ${selectedTenant?.last_name}`.trim()
      : manualName.trim() || manualEmail.trim();

    if (!recipientEmail && recipientType === 'manual') {
      setError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    if (recipientType === 'tenant' && !selectedTenant) {
      setError('Bitte waehlen Sie einen Mieter aus.');
      return;
    }
    if (!subject.trim()) {
      setError('Bitte geben Sie einen Betreff ein.');
      return;
    }
    if (!content.trim()) {
      setError('Bitte geben Sie eine Nachricht ein.');
      return;
    }

    setSending(true);

    const senderAddr = userAlias ? `${userAlias}@rentab.ly` : '';
    const tenantId = recipientType === 'tenant' ? selectedTenant?.id : null;

    const { data: thread, error: threadErr } = await supabase
      .from('mail_threads')
      .insert({
        user_id: user.id,
        tenant_id: tenantId,
        external_email: recipientType === 'manual' ? recipientEmail : null,
        external_name: recipientType === 'manual' ? manualName.trim() || null : null,
        subject: subject.trim(),
        folder: 'sent',
        status: 'read',
        last_message_at: new Date().toISOString(),
        message_count: 1,
      })
      .select('id')
      .maybeSingle();

    if (threadErr || !thread) {
      setError('Fehler beim Erstellen der Nachricht.');
      setSending(false);
      return;
    }

    const { error: msgErr } = await supabase.from('mail_messages').insert({
      thread_id: thread.id,
      user_id: user.id,
      direction: 'outbound',
      sender_address: senderAddr,
      sender_name: '',
      recipient_address: recipientEmail,
      recipient_name: recipientName,
      body_text: content.trim(),
    });

    if (msgErr) {
      setError('Fehler beim Senden der Nachricht.');
      setSending(false);
      return;
    }

    if (tenantId) {
      await supabase.from('tenant_communications').insert({
        user_id: user.id,
        tenant_id: tenantId,
        communication_type: 'message',
        subject: subject.trim(),
        content: content.trim(),
        is_internal: false,
      });
    }

    setSending(false);
    resetForm();
    onSent();
    onClose();
  }

  function resetForm() {
    setSelectedTenant(null);
    setManualEmail('');
    setManualName('');
    setSubject('');
    setContent('');
    setSearchTerm('');
    setError('');
    setRecipientType('tenant');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Neue Nachricht</h2>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setRecipientType('tenant'); setManualEmail(''); setManualName(''); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                recipientType === 'tenant' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" /> Mieter
            </button>
            <button
              onClick={() => { setRecipientType('manual'); setSelectedTenant(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                recipientType === 'manual' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <AtSign className="w-4 h-4" /> E-Mail
            </button>
          </div>

          {recipientType === 'tenant' ? (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Empfaenger (Mieter)</label>
              {selectedTenant ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 flex-1">
                    {selectedTenant.first_name} {selectedTenant.last_name}
                    {selectedTenant.email && <span className="text-blue-600 font-normal ml-1">({selectedTenant.email})</span>}
                  </span>
                  <button onClick={() => setSelectedTenant(null)} className="text-blue-500 hover:text-blue-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowTenantDropdown(true); }}
                      onFocus={() => setShowTenantDropdown(true)}
                      placeholder="Mieter suchen..."
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  {showTenantDropdown && filteredTenants.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredTenants.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setSelectedTenant(t); setShowTenantDropdown(false); setSearchTerm(''); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm transition-colors"
                        >
                          <span className="font-medium text-gray-900">{t.first_name} {t.last_name}</span>
                          {t.email && <span className="text-gray-500 ml-2">{t.email}</span>}
                          {t.property_name && <span className="text-gray-400 ml-2 text-xs">({t.property_name})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="empfaenger@beispiel.de"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Name des Empfaengers"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff der Nachricht"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Ihre Nachricht..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <AtSign className="w-3 h-3" />
            Gesendet von: {userAlias ? `${userAlias}@rentab.ly` : 'Wird geladen...'}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Wird gesendet...' : 'Senden'}
          </button>
        </div>
      </div>
    </div>
  );
}
