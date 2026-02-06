import { useState } from 'react';
import { X, AtSign, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AliasSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentAlias: string;
  onUpdated: (newAlias: string) => void;
}

export default function AliasSettings({ isOpen, onClose, currentAlias, onUpdated }: AliasSettingsProps) {
  const [newAlias, setNewAlias] = useState(currentAlias);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function validate(val: string): string | null {
    const v = val.toLowerCase().trim();
    if (v.length < 3) return 'Mindestens 3 Zeichen erforderlich.';
    if (v.length > 64) return 'Maximal 64 Zeichen erlaubt.';
    if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(v)) {
      return 'Erlaubt: a-z, 0-9, Punkt, Minus, Unterstrich. Muss mit Buchstabe/Zahl beginnen und enden.';
    }
    if (v.includes('..')) return 'Keine aufeinanderfolgenden Punkte erlaubt.';
    return null;
  }

  async function handleSave() {
    const cleaned = newAlias.toLowerCase().trim();
    const validationError = validate(cleaned);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (cleaned === currentAlias) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    const { data: reserved } = await supabase
      .from('reserved_email_aliases')
      .select('alias_localpart')
      .eq('alias_localpart', cleaned)
      .maybeSingle();

    if (reserved) {
      setError('Dieser Alias ist reserviert und kann nicht verwendet werden.');
      setSaving(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc('update_user_mailbox_alias', {
      new_alias: cleaned,
    });

    if (rpcError) {
      setError(rpcError.message || 'Fehler beim Speichern.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    onUpdated(cleaned);
    setTimeout(() => { setSuccess(false); onClose(); }, 1200);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">E-Mail-Adresse aendern</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
              <Check className="w-4 h-4" />
              <span>Adresse erfolgreich geaendert!</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Neuer Alias</label>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={newAlias}
                onChange={(e) => { setNewAlias(e.target.value.toLowerCase()); setError(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="mein-alias"
              />
              <span className="px-4 py-2.5 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500 font-medium whitespace-nowrap">
                @rentab.ly
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Erlaubt: Kleinbuchstaben, Zahlen, Punkt, Minus, Unterstrich. Min. 3 Zeichen. Muss eindeutig sein.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
            <AtSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Vorschau: <span className="font-medium text-gray-900">{newAlias.toLowerCase().trim() || '...'}@rentab.ly</span>
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
