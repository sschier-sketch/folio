import { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, User, FileSignature } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MessagesSettingsProps {
  onSettingsChanged?: () => void;
}

export default function MessagesSettings({ onSettingsChanged }: MessagesSettingsProps) {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_mail_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSenderName(data.sender_name || '');
      setSignature(data.signature || '');
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess(false);

    const { error: upsertError } = await supabase
      .from('user_mail_settings')
      .upsert({
        user_id: user.id,
        sender_name: senderName.trim(),
        signature: signature.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      setError('Fehler beim Speichern der Einstellungen.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    onSettingsChanged?.();
    setTimeout(() => setSuccess(false), 2500);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-xl">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">E-Mail Einstellungen</h2>
      <p className="text-sm text-gray-500 mb-8">
        Konfigurieren Sie Ihren Absendernamen und Ihre Signatur fuer ausgehende E-Mails.
      </p>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 mb-6">
          <Check className="w-4 h-4" />
          <span>Einstellungen erfolgreich gespeichert!</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 text-gray-400" />
            Absendername
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="z.B. Max Mustermann oder Hausverwaltung Mustermann"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Wird als Absender in ausgehenden E-Mails angezeigt.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileSignature className="w-4 h-4 text-gray-400" />
            Signatur
          </label>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={6}
            placeholder={"Mit freundlichen Gruessen\nMax Mustermann\nHausverwaltung Mustermann\nTel: +49 123 456789"}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono leading-relaxed"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Wird automatisch am Ende jeder neuen E-Mail eingefuegt.
          </p>
        </div>

        {signature.trim() && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Vorschau</p>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{signature}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
