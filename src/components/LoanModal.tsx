import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { parseNumberInput } from '../lib/utils';

interface Loan {
  id: string;
  lender_name: string;
  loan_amount: number;
  remaining_balance: number;
  interest_rate: number;
  monthly_payment: number;
  monthly_principal: number;
  start_date: string;
  end_date: string;
  loan_type: string;
  notes: string;
}

interface LoanModalProps {
  propertyId: string;
  loan: Loan | null;
  onClose: () => void;
  onSave: () => void;
}

export default function LoanModal({ propertyId, loan, onClose, onSave }: LoanModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [principalType, setPrincipalType] = useState<'euro' | 'percent'>('euro');
  const [principalInput, setPrincipalInput] = useState(0);
  const [formData, setFormData] = useState({
    lender_name: '',
    loan_amount: 0,
    remaining_balance: 0,
    interest_rate: 0,
    monthly_payment: 0,
    monthly_principal: 0,
    start_date: '',
    end_date: '',
    loan_type: 'mortgage',
    notes: '',
  });

  useEffect(() => {
    if (loan) {
      setFormData({
        lender_name: loan.lender_name,
        loan_amount: loan.loan_amount,
        remaining_balance: loan.remaining_balance,
        interest_rate: loan.interest_rate,
        monthly_payment: loan.monthly_payment,
        monthly_principal: loan.monthly_principal || 0,
        start_date: loan.start_date,
        end_date: loan.end_date,
        loan_type: loan.loan_type,
        notes: loan.notes,
      });
      setPrincipalInput(loan.monthly_principal || 0);
    }
  }, [loan]);

  useEffect(() => {
    if (principalType === 'percent' && formData.loan_amount > 0) {
      const annualPrincipal = (formData.loan_amount * principalInput) / 100;
      const monthlyPrincipal = annualPrincipal / 12;
      setFormData({ ...formData, monthly_principal: Math.round(monthlyPrincipal * 100) / 100 });
    } else if (principalType === 'euro') {
      setFormData({ ...formData, monthly_principal: principalInput });
    }
  }, [principalInput, principalType, formData.loan_amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const data = {
        ...formData,
        property_id: propertyId,
        user_id: user.id,
      };

      if (loan) {
        const { error } = await supabase
          .from('loans')
          .update(data)
          .eq('id', loan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('loans').insert([data]);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving loan:', error);
      alert('Fehler beim Speichern des Kredits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark">
            {loan ? 'Kredit bearbeiten' : 'Neuer Kredit'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kreditgeber *
              </label>
              <input
                type="text"
                value={formData.lender_name}
                onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="z.B. Sparkasse"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kreditsumme (€) *
              </label>
              <input
                type="text"
                value={formData.loan_amount}
                onChange={(e) => setFormData({ ...formData, loan_amount: parseNumberInput(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="z.B. 200000 oder 200.000,00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Restschuld (€) *
              </label>
              <input
                type="text"
                value={formData.remaining_balance}
                onChange={(e) => setFormData({ ...formData, remaining_balance: parseNumberInput(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="z.B. 185000 oder 185.000,00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Zinssatz (%) *
              </label>
              <input
                type="text"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: parseNumberInput(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="z.B. 1,62 oder 2,5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Monatliche Rate (€) *
              </label>
              <input
                type="text"
                value={formData.monthly_payment}
                onChange={(e) => setFormData({ ...formData, monthly_payment: parseNumberInput(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="z.B. 306,28 oder 1200,50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Monatliche Tilgung *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(parseNumberInput(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={principalType === 'euro' ? 'z.B. 800' : 'z.B. 1,5 oder 2'}
                  required
                />
                <select
                  value={principalType}
                  onChange={(e) => setPrincipalType(e.target.value as 'euro' | 'percent')}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="euro">€</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-300">
                {principalType === 'euro'
                  ? 'Tilgungsanteil der monatlichen Rate (Rate - Zinsen)'
                  : `Jährliche Tilgung in % (${formData.monthly_principal.toFixed(2)}€ pro Monat)`
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kreditbeginn *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kreditende *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kreditart
              </label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="mortgage">Hypothek</option>
                <option value="renovation">Renovierungskredit</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Notizen
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
                placeholder="Zusätzliche Informationen..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
