import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  Zap,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RefundPreview {
  charge: {
    id: string;
    amount: number;
    currency: string;
    created: number;
    refunded: boolean;
    description: string | null;
  };
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    planAmount: number | null;
    planInterval: string | null;
    planCurrency: string | null;
  } | null;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
  } | null;
}

interface RefundResult {
  success: boolean;
  refund_id: string;
  amount: number;
  currency: string;
  cancelledImmediately: boolean;
}

interface RefundWizardProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'loading' | 'details' | 'confirm' | 'processing' | 'success' | 'error';

export default function RefundWizard({ userId, userEmail, onClose, onComplete }: RefundWizardProps) {
  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [cancelImmediately, setCancelImmediately] = useState(true);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<RefundResult | null>(null);

  useEffect(() => {
    loadPreview();
  }, [userId]);

  async function loadPreview() {
    setStep('loading');
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-refund`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, preview: true }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Vorschau konnte nicht geladen werden');

      setPreview(data);
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setStep('error');
    }
  }

  async function executeRefund() {
    setStep('processing');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-refund`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            reason: reason || undefined,
            cancelImmediately,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Rueckerstattung fehlgeschlagen');

      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setStep('error');
    }
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  function daysUntil(timestamp: number) {
    const diff = timestamp * 1000 - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function formatCardBrand(brand: string | null) {
    if (!brand) return 'Karte';
    const map: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' };
    return map[brand.toLowerCase()] || brand;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Rueckerstattung</h2>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-300 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Abo-Daten werden geladen...</p>
            </div>
          )}

          {step === 'details' && preview && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Letzte Zahlung</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(preview.charge.amount, preview.charge.currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(preview.charge.created)}
                        {preview.paymentMethod?.last4 && (
                          <span> &middot; {formatCardBrand(preview.paymentMethod.brand)} ****{preview.paymentMethod.last4}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {preview.charge.refunded && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Bereits erstattet
                    </span>
                  )}
                </div>
              </div>

              {preview.subscription && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktives Abonnement</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Laufzeit-Beginn</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDate(preview.subscription.currentPeriodStart)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Laufzeit-Ende</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDate(preview.subscription.currentPeriodEnd)}
                        <span className="text-xs text-gray-400 ml-1">
                          ({daysUntil(preview.subscription.currentPeriodEnd)} Tage)
                        </span>
                      </p>
                    </div>
                  </div>
                  {preview.subscription.planAmount && (
                    <p className="text-xs text-gray-400">
                      Tarif: {formatCurrency(preview.subscription.planAmount, preview.subscription.planCurrency || 'eur')} / {preview.subscription.planInterval === 'month' ? 'Monat' : preview.subscription.planInterval === 'year' ? 'Jahr' : preview.subscription.planInterval}
                    </p>
                  )}
                </div>
              )}

              {preview.charge.refunded ? (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Die letzte Zahlung wurde bereits erstattet. Eine erneute Rueckerstattung ist nicht moeglich.
                  </p>
                </div>
              ) : (
                <>
                  {preview.subscription && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Abo-Beendigung</h3>
                      <div className="space-y-2">
                        <label
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            cancelImmediately
                              ? 'border-red-200 bg-red-50/50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cancelType"
                            checked={cancelImmediately}
                            onChange={() => setCancelImmediately(true)}
                            className="mt-0.5 accent-red-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-sm font-medium text-gray-800">Sofort beenden</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Abo wird sofort gekuendigt, Zugang wird auf Gratis zurueckgesetzt
                            </p>
                          </div>
                        </label>
                        <label
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            !cancelImmediately
                              ? 'border-blue-200 bg-blue-50/50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cancelType"
                            checked={!cancelImmediately}
                            onChange={() => setCancelImmediately(false)}
                            className="mt-0.5 accent-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm font-medium text-gray-800">Zum Laufzeitende</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Pro-Zugang bleibt bis {preview.subscription ? formatDate(preview.subscription.currentPeriodEnd) : '---'} aktiv
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Grund (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="z.B. Kunde unzufrieden, Fehlbuchung..."
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none placeholder:text-gray-300"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'confirm' && preview && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Rueckerstattung bestaetigen</p>
                  <p className="text-sm text-red-600 mt-1">
                    Diese Aktion kann nicht rueckgaengig gemacht werden. Folgendes wird ausgefuehrt:
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <RotateCcw className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{formatCurrency(preview.charge.amount, preview.charge.currency)}</span> an Stripe zurueckerstatten
                  </p>
                </div>
                {preview.subscription && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Abo {cancelImmediately ? (
                        <span className="font-medium text-red-600">sofort beenden</span>
                      ) : (
                        <>zum <span className="font-medium">{formatDate(preview.subscription.currentPeriodEnd)}</span> beenden</>
                      )}
                    </p>
                  </div>
                )}
                {reason && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">Grund:</span>
                    <p className="text-sm text-gray-700">{reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-500 font-medium">Rueckerstattung wird verarbeitet...</p>
              <p className="text-xs text-gray-400 mt-1">Stripe wird kontaktiert</p>
            </div>
          )}

          {step === 'success' && result && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Rueckerstattung erfolgreich</h3>
              <p className="text-sm text-gray-400 mb-5">
                {formatCurrency(result.amount, result.currency)} wurden erstattet
              </p>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-400">Stripe Refund-ID</span>
                  <span className="text-gray-700 font-mono text-xs">{result.refund_id}</span>
                </div>
                <div className="flex justify-between text-sm px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-400">Abo-Status</span>
                  <span className="text-gray-700">
                    {result.cancelledImmediately ? 'Sofort beendet' : 'Endet zum Laufzeitende'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Fehler aufgetreten</h3>
              <p className="text-sm text-red-500 text-center max-w-xs">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {step === 'details' && !preview?.charge.refunded && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'details' && preview?.charge.refunded && (
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Schliessen
            </button>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('details')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </button>
              <button
                onClick={executeRefund}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Jetzt erstatten
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={() => { onComplete(); onClose(); }}
              className="ml-auto px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Fertig
            </button>
          )}

          {step === 'error' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Schliessen
              </button>
              <button
                onClick={loadPreview}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Erneut versuchen
              </button>
            </>
          )}

          {(step === 'loading' || step === 'processing') && <div />}
        </div>
      </div>
    </div>
  );
}
