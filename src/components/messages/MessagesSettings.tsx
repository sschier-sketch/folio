import { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, User, FileSignature, AtSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface MessagesSettingsProps {
  onSettingsChanged?: () => void;
  currentAlias?: string;
  onAliasUpdated?: (newAlias: string) => void;
}

export default function MessagesSettings({ onSettingsChanged, currentAlias, onAliasUpdated }: MessagesSettingsProps) {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState('');
  const [signature, setSignature] = useState('');
  const [signatureDefaultOn, setSignatureDefaultOn] = useState(true);
  const [alias, setAlias] = useState(currentAlias || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAlias, setSavingAlias] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  useEffect(() => {
    if (currentAlias) setAlias(currentAlias);
  }, [currentAlias]);

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
      setSignatureDefaultOn(data.signature_default_on ?? true);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const { error: upsertError } = await supabase
      .from('user_mail_settings')
      .upsert({
        user_id: user.id,
        sender_name: senderName.trim(),
        signature: signature.trim(),
        signature_default_on: signatureDefaultOn,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      setError('Fehler beim Speichern der Einstellungen.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess('settings');
    onSettingsChanged?.();
    setTimeout(() => setSuccess(''), 2500);
  }

  function validateAlias(val: string): string | null {
    const v = val.toLowerCase().trim();
    if (v.length < 3) return 'Mindestens 3 Zeichen erforderlich.';
    if (v.length > 64) return 'Maximal 64 Zeichen erlaubt.';
    if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(v)) {
      return 'Erlaubt: a-z, 0-9, Punkt, Minus, Unterstrich. Muss mit Buchstabe/Zahl beginnen und enden.';
    }
    if (v.includes('..')) return 'Keine aufeinanderfolgenden Punkte erlaubt.';
    return null;
  }

  async function handleSaveAlias() {
    const cleaned = alias.toLowerCase().trim();
    const validationError = validateAlias(cleaned);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (cleaned === currentAlias) {
      setSuccess('alias');
      setTimeout(() => setSuccess(''), 2500);
      return;
    }

    setSavingAlias(true);
    setError('');
    setSuccess('');

    const { data: reserved } = await supabase
      .from('reserved_email_aliases')
      .select('alias_localpart')
      .eq('alias_localpart', cleaned)
      .maybeSingle();

    if (reserved) {
      setError('Dieser Alias ist reserviert und kann nicht verwendet werden.');
      setSavingAlias(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc('update_user_mailbox_alias', {
      new_alias: cleaned,
    });

    if (rpcError) {
      setError(rpcError.message || 'Fehler beim Speichern der Adresse.');
      setSavingAlias(false);
      return;
    }

    setSavingAlias(false);
    setSuccess('alias');
    onAliasUpdated?.(cleaned);
    setTimeout(() => setSuccess(''), 2500);
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
      <p className="text-sm text-gray-500 mb-8">
        Konfigurieren Sie Ihre E-Mail-Adresse, Absendernamen und Signatur.
      </p>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success === 'settings' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 mb-6">
          <Check className="w-4 h-4" />
          <span>Einstellungen erfolgreich gespeichert!</span>
        </div>
      )}

      {success === 'alias' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 mb-6">
          <Check className="w-4 h-4" />
          <span>E-Mail-Adresse erfolgreich gespeichert!</span>
        </div>
      )}

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">E-Mail-Adresse</h3>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <AtSign className="w-4 h-4 text-gray-400" />
              Ihre Rentably E-Mail
            </label>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={alias}
                onChange={(e) => { setAlias(e.target.value.toLowerCase()); setError(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="mein-alias"
              />
              <span className="px-4 py-2.5 bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500 font-medium whitespace-nowrap">
                @rentab.ly
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Unter dieser Adresse empfangen und senden Sie E-Mails.
            </p>
          </div>
          {alias.trim() !== currentAlias && alias.trim().length >= 3 && (
            <Button variant="primary" onClick={handleSaveAlias} disabled={savingAlias}>
              {savingAlias ? 'Speichern...' : 'Adresse speichern'}
            </Button>
          )}
        </div>

        <div className="border-t border-gray-100 pt-8 space-y-6">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Absender & Signatur</h3>

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
              placeholder={"Mit freundlichen Grüßen\nMax Mustermann\nHausverwaltung Mustermann\nTel: +49 123 456789"}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono leading-relaxed"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Wird automatisch am Ende jeder neuen E-Mail eingefügt.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setSignatureDefaultOn(!signatureDefaultOn)}
              className="flex items-center gap-3 w-full text-left group"
            >
              {signatureDefaultOn ? (
                <ToggleRight className="w-8 h-8 text-blue-600 flex-shrink-0" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-300 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Signatur standardmäßig anhängen
                </p>
                <p className="text-xs text-gray-400">
                  {signatureDefaultOn
                    ? 'Die Signatur wird beim Antworten automatisch angehangen.'
                    : 'Die Signatur wird beim Antworten nicht automatisch angehangen.'}
                </p>
              </div>
            </button>
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
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Speichern...' : 'Einstellungen speichern'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
