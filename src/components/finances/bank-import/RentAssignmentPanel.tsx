import { useState, useEffect, useMemo } from 'react';
import { Search, Check, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { allocateBankTransaction } from '../../../lib/bankImport';
import type { BankTransaction, AllocationInput } from '../../../lib/bankImport/types';

interface RentPayment {
  id: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  payment_status: string;
  description?: string;
  contract_id?: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  property_id: string;
  iban?: string;
}

interface RentAssignmentPanelProps {
  tx: BankTransaction;
  userId: string;
  suggestedTenantId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function RentAssignmentPanel({
  tx,
  userId,
  suggestedTenantId,
  onComplete,
  onCancel,
}: RentAssignmentPanelProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(suggestedTenantId || '');
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  const txAmount = Math.abs(tx.amount);

  useEffect(() => {
    loadTenants();
  }, [userId]);

  useEffect(() => {
    if (selectedTenantId) loadOpenRentPayments(selectedTenantId);
  }, [selectedTenantId]);

  async function loadTenants() {
    const { data } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, name, property_id, iban')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_name');
    if (data) setTenants(data);
  }

  async function loadOpenRentPayments(tenantId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('rent_payments')
      .select('id, due_date, amount, paid_amount, payment_status, description, contract_id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .in('payment_status', ['unpaid', 'partial'])
      .order('due_date', { ascending: true });

    const payments = data || [];
    setRentPayments(payments);

    if (mode === 'auto') {
      autoAllocate(payments);
    } else {
      setAllocations({});
    }
    setLoading(false);
  }

  function autoAllocate(payments: RentPayment[]) {
    let remaining = txAmount;
    const newAllocations: Record<string, number> = {};

    for (const rp of payments) {
      if (remaining <= 0) break;
      const open = Number(rp.amount) - Number(rp.paid_amount || 0);
      if (open <= 0) continue;
      const alloc = Math.min(remaining, open);
      newAllocations[rp.id] = Math.round(alloc * 100) / 100;
      remaining -= alloc;
    }

    setAllocations(newAllocations);
  }

  function handleModeChange(newMode: 'auto' | 'manual') {
    setMode(newMode);
    if (newMode === 'auto') {
      autoAllocate(rentPayments);
    } else {
      setAllocations({});
    }
  }

  function handleManualChange(rpId: string, value: string) {
    const num = parseFloat(value.replace(',', '.')) || 0;
    setAllocations((prev) => ({ ...prev, [rpId]: Math.max(0, num) }));
  }

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((s, v) => s + v, 0),
    [allocations]
  );

  const remaining = txAmount - totalAllocated;
  const hasOverflow = totalAllocated > txAmount + 0.01;

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.first_name.toLowerCase().includes(q) ||
        t.last_name.toLowerCase().includes(q) ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.iban || '').includes(q)
    );
  }, [tenants, search]);

  async function handleSave() {
    if (hasOverflow) return;

    const inputs: AllocationInput[] = Object.entries(allocations)
      .filter(([, amount]) => amount > 0)
      .map(([rpId, amount]) => ({
        target_type: 'rent_payment' as const,
        target_id: rpId,
        amount_allocated: amount,
      }));

    if (inputs.length === 0) {
      setError('Bitte mindestens eine Forderung zuordnen.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await allocateBankTransaction(userId, tx.id, inputs, 'manual');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zuordnung fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  if (!selectedTenantId) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mieter suchen (Name oder IBAN)..."
            className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filteredTenants.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Keine Mieter gefunden
            </div>
          ) : (
            filteredTenants.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTenantId(t.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {t.first_name[0]}
                  {t.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">
                    {t.first_name} {t.last_name}
                  </p>
                  {t.iban && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      {t.iban}
                    </p>
                  )}
                </div>
                {suggestedTenantId === t.id && (
                  <span className="text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                    Vorschlag
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="cancel" size="sm" onClick={onCancel}>
            Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
            {selectedTenant?.first_name[0]}
            {selectedTenant?.last_name[0]}
          </div>
          <span className="text-sm font-medium text-dark">
            {selectedTenant?.first_name} {selectedTenant?.last_name}
          </span>
        </div>
        <button
          onClick={() => {
            setSelectedTenantId('');
            setRentPayments([]);
            setAllocations({});
          }}
          className="text-xs text-[#3c8af7] hover:underline"
        >
          Anderen Mieter waehlen
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => handleModeChange('auto')}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            mode === 'auto'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Automatisch verteilen
        </button>
        <button
          onClick={() => handleModeChange('manual')}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            mode === 'manual'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manuell verteilen
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : rentPayments.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">
            Keine offenen Forderungen fuer diesen Mieter
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-500">Faellig</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Soll</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Bezahlt</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Offen</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500 w-28">Zuordnen</th>
              </tr>
            </thead>
            <tbody>
              {rentPayments.map((rp) => {
                const open = Number(rp.amount) - Number(rp.paid_amount || 0);
                const allocated = allocations[rp.id] || 0;
                return (
                  <tr
                    key={rp.id}
                    className={`border-t border-gray-100 ${
                      allocated > 0 ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-700">
                      {new Date(rp.due_date).toLocaleDateString('de-DE', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 tabular-nums">
                      {Number(rp.amount).toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                      {Number(rp.paid_amount || 0).toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-amber-600 tabular-nums">
                      {open.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {mode === 'manual' ? (
                        <input
                          type="text"
                          value={allocated || ''}
                          onChange={(e) => handleManualChange(rp.id, e.target.value)}
                          placeholder="0,00"
                          className="w-24 h-7 px-2 text-right text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3c8af7] focus:border-[#3c8af7]"
                        />
                      ) : (
                        <span
                          className={`tabular-nums font-medium ${
                            allocated > 0 ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {allocated.toLocaleString('de-DE', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-gray-500">
          Transaktion:{' '}
          <span className="font-semibold text-dark tabular-nums">
            {txAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>
            Zugeordnet:{' '}
            <span className="font-semibold text-emerald-600 tabular-nums">
              {totalAllocated.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </span>
          </span>
          {remaining > 0.01 && (
            <span>
              Rest:{' '}
              <span className="font-semibold text-amber-600 tabular-nums">
                {remaining.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </span>
            </span>
          )}
        </div>
      </div>

      {hasOverflow && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">
            Die Zuordnung uebersteigt den Transaktionsbetrag.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="cancel" size="sm" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || totalAllocated < 0.01 || hasOverflow}
        >
          {saving ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {saving ? 'Speichert...' : 'Zuordnung speichern'}
        </Button>
      </div>
    </div>
  );
}
