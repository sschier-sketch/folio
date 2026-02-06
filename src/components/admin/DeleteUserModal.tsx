import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DeleteUserModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteUserModal({ userId, userEmail, onClose, onDeleted }: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText === 'DELETE';

  async function handleDelete() {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Nicht authentifiziert. Bitte erneut anmelden.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Unbekannter Fehler beim Loeschen');
        setLoading(false);
        return;
      }

      if (result.partial) {
        setError('Oeffentliche Daten geloescht, aber Auth-Eintrag konnte nicht entfernt werden. Bitte manuell pruefen.');
        setLoading(false);
        return;
      }

      onDeleted();
    } catch (err) {
      console.error('Delete user error:', err);
      setError('Netzwerkfehler. Bitte erneut versuchen.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">User komplett loeschen</h3>
            <p className="text-sm text-gray-500">Diese Aktion kann nicht rueckgaengig gemacht werden</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 font-medium mb-2">
            Folgende Daten werden unwiderruflich geloescht:
          </p>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>Alle Objekte, Einheiten und Mieter</li>
            <li>Alle Vertraege, Zahlungen und Finanzdaten</li>
            <li>Alle Dokumente und Kommunikation</li>
            <li>Affiliate- und Referral-Daten</li>
            <li>Profil, Einstellungen und Billing</li>
            <li>Der Auth-Account selbst</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 mb-1">Betroffener User:</p>
          <p className="text-sm font-mono font-bold text-gray-900">{userEmail}</p>
          <p className="text-xs text-gray-400 mt-1">ID: {userId}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tippen Sie <span className="font-mono font-bold text-red-600">DELETE</span> zur Bestaetigung:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
            autoComplete="off"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Endgueltig loeschen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
