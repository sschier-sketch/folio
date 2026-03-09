import { useState, useEffect } from 'react';
import {
  X, Mail, Calendar, Info, AlertTriangle, CheckCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  getLetterXpressConfigFast,
  queueLetterXpressJob,
  preparePdfForDispatch,
  setAccessToken,
} from '../../lib/letterxpress-api';
import type { LxConfig } from '../../lib/letterxpress-api';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface SendAsLetterModalProps {
  documentId: string;
  fileName: string;
  filePath: string;
  onClose: () => void;
  onSent: () => void;
}

export default function SendAsLetterModal({
  documentId,
  fileName,
  filePath,
  onClose,
  onSent,
}: SendAsLetterModalProps) {
  const { session } = useAuth();
  const { dataOwnerId } = usePermissions();

  useEffect(() => {
    setAccessToken(session?.access_token ?? null);
    return () => setAccessToken(null);
  }, [session?.access_token]);

  const [lxConfig, setLxConfig] = useState<LxConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [colorMode, setColorMode] = useState<'1' | '4'>('1');
  const [registeredType, setRegisteredType] = useState<'' | 'r1' | 'r2'>('');
  const [dispatchDate, setDispatchDate] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hasCredentials = lxConfig && lxConfig.has_api_key && lxConfig.is_enabled;

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadConfig();
  }, [dataOwnerId]);

  async function loadConfig() {
    if (!dataOwnerId) return;
    setConfigLoading(true);
    try {
      const config = await getLetterXpressConfigFast(dataOwnerId);
      setLxConfig(config);
    } catch {
      setLxConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }

  function validateDispatchDate(): boolean {
    if (!dispatchDate) return true;
    const d = new Date(dispatchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }

  async function handleSend() {
    if (!dataOwnerId || !hasCredentials) return;
    setError('');

    if (!validateDispatchDate()) {
      setError('Das Versanddatum muss in der Zukunft liegen.');
      return;
    }

    setSending(true);

    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (downloadError || !fileData) {
        setError('Dokument konnte nicht geladen werden.');
        setSending(false);
        return;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const { base64_file } = preparePdfForDispatch(arrayBuffer);

      const result = await queueLetterXpressJob({
        base64_file,
        filename_original: fileName,
        ...(registeredType ? { registered: registeredType as 'r1' | 'r2' } : {}),
        ...(dispatchDate ? { dispatch_date: dispatchDate } : {}),
        specification: {
          color: colorMode,
          mode: 'simplex',
          shipping: 'auto',
        },
      });

      if (!result.success) {
        setError('Fehler beim Erstellen des Briefauftrags.');
        setSending(false);
        return;
      }

      if (result.job_id) {
        await supabase
          .from('letterxpress_jobs')
          .update({ document_id: documentId })
          .eq('id', result.job_id);
      }

      setSuccess(true);
      setTimeout(() => onSent(), 1800);
    } catch (err: any) {
      console.error('Letter send error:', err);
      const msg = err?.message || 'Fehler beim Briefversand.';
      if (msg.includes('LX_INTERNAL_ERROR') || msg.includes('Internal server error')) {
        setError('Briefversand fehlgeschlagen. Bitte versuchen Sie es erneut oder prüfen Sie Ihr LetterXpress-Guthaben.');
      } else if (msg.includes('LX_')) {
        setError('Fehler beim Briefversand. Bitte prüfen Sie Ihre Zugangsdaten.');
      } else {
        setError(msg);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Mail className="w-4.5 h-4.5" style={{ color: '#1E1E24' }} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Als Brief versenden</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {configLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Brief in Warteschlange</h3>
              <p className="text-sm text-gray-500">
                Der Auftrag wird im Hintergrund an LetterXpress übermittelt.
                Den Status können Sie unter Profil &rarr; Briefversand verfolgen.
              </p>
            </div>
          ) : !hasCredentials ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Briefversand nicht eingerichtet
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Für den Briefversand müssen zuerst LetterXpress-Zugangsdaten
                    unter Profil &rarr; Briefversand hinterlegt werden.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>
                      Das Dokument muss als druckfertiges PDF vorliegen.
                      Die Empfängeradresse muss im PDF korrekt im Adressfenster positioniert sein,
                      damit der postalische Versand funktioniert.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
                  <Mail className="w-4 h-4" style={{ color: '#1E1E24' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                  <p className="text-xs text-gray-500">PDF-Dokument</p>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farbe</label>
                  <select
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value as '1' | '4')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="1">Schwarzweiß</option>
                    <option value="4">Farbe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Einschreiben
                  </label>
                  <select
                    value={registeredType}
                    onChange={(e) => setRegisteredType(e.target.value as '' | 'r1' | 'r2')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="">Kein Einschreiben</option>
                    <option value="r1">Einschreiben Einwurf</option>
                    <option value="r2">Einschreiben</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    Versanddatum (optional)
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    min={todayStr}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leer lassen für sofortigen Versand.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {!configLoading && !success && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onClose} disabled={sending}>
              Abbrechen
            </Button>
            {hasCredentials && (
              <Button variant="primary" size="md" onClick={handleSend} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  'Brief senden'
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
