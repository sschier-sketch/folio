import { useState } from 'react';
import { Calendar, FileSignature, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface Props {
  tenantId: string;
  tenantName: string;
  contractId: string | null;
  onClose: () => void;
  onSaved: () => void;
  onNavigateToWizard: () => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export default function EndContractModal({
  tenantId,
  tenantName,
  contractId,
  onClose,
  onSaved,
  onNavigateToWizard,
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'choice' | 'date'>('choice');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleEndContract() {
    if (!moveOutDate || !user) return;
    setSaving(true);
    setError('');

    try {
      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({ move_out_date: moveOutDate })
        .eq('id', tenantId);

      if (tenantErr) throw tenantErr;

      if (contractId) {
        await supabase
          .from('rental_contracts')
          .update({ contract_end: moveOutDate, end_date: moveOutDate })
          .eq('id', contractId);

        const endMonth = new Date(moveOutDate);
        const cutoffDate = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 1);
        const cutoff = cutoffDate.toISOString().split('T')[0];

        await supabase
          .from('rent_payments')
          .delete()
          .eq('contract_id', contractId)
          .eq('payment_status', 'unpaid')
          .gte('due_date', cutoff);
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Beenden des Mietverhältnisses');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-dark">Mietverhältnis beenden</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {step === 'choice' && (
            <div>
              <p className="text-sm text-gray-600 mb-6">
                Wie möchten Sie das Mietverhältnis mit <span className="font-semibold text-dark">{tenantName}</span> beenden?
              </p>

              <div className="space-y-3">
                <button
                  onClick={onNavigateToWizard}
                  className="w-full p-5 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-primary-blue hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <FileSignature className="w-5 h-5 text-primary-blue" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark mb-1 group-hover:text-primary-blue transition-colors">
                        Kündigungsbestätigung erstellen
                      </h4>
                      <p className="text-sm text-gray-500">
                        Erstellen Sie eine Kündigungsbestätigung und senden Sie diese direkt an den Mieter. Das Mietverhältnis wird dabei automatisch als beendet eingetragen.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep('date')}
                  className="w-full p-5 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-primary-blue hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                      <Calendar className="w-5 h-5 text-gray-600 group-hover:text-primary-blue transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark mb-1 group-hover:text-primary-blue transition-colors">
                        Nur Auszugsdatum eintragen
                      </h4>
                      <p className="text-sm text-gray-500">
                        Tragen Sie das Auszugsdatum ein und beenden Sie das Mietverhältnis, ohne ein Dokument zu erstellen.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'date' && (
            <div>
              <p className="text-sm text-gray-600 mb-6">
                Geben Sie das Auszugsdatum für <span className="font-semibold text-dark">{tenantName}</span> ein.
                Ab dem Folgemonat werden keine Mieten mehr berechnet.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Auszugsdatum *
                </label>
                <input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button onClick={() => setStep('choice')} variant="outlined">
                  Zurück
                </Button>
                <Button
                  onClick={handleEndContract}
                  disabled={!moveOutDate || saving}
                  variant="primary"
                >
                  {saving ? 'Wird gespeichert...' : 'Mietverhältnis beenden'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
