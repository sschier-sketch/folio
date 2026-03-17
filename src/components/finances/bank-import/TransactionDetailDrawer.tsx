import { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  TrendingUp,
  TrendingDown,
  Ban,
  Undo2,
  Loader,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  ignoreBankTransaction,
  unignoreBankTransaction,
  undoAllocation,
  getAllocationsForTransaction,
} from '../../../lib/bankImport';
import type { BankTransaction, BankTransactionAllocation, BankMatchingRule } from '../../../lib/bankImport/types';
import { parseSuggestion } from '../../../lib/bankImport/suggestionEngine';
import { supabase } from '../../../lib/supabase';
import RentAssignmentPanel from './RentAssignmentPanel';
import IncomeExpenseAssignmentPanel from './IncomeExpenseAssignmentPanel';

type Action = 'none' | 'rent' | 'income' | 'expense';

interface TransactionDetailDrawerProps {
  tx: BankTransaction;
  userId: string;
  onClose: () => void;
  onRefresh: () => void;
}

function formatAmount(amount: number, direction?: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const isCredit = direction === 'credit' || amount > 0;
  return `${isCredit ? '+' : '-'}${formatted} EUR`;
}

export default function TransactionDetailDrawer({
  tx,
  userId,
  onClose,
  onRefresh,
}: TransactionDetailDrawerProps) {
  const isCredit = tx.direction === 'credit' || tx.amount > 0;
  const isOpen = tx.status === 'UNMATCHED' || tx.status === 'SUGGESTED';
  const isMatched = tx.status === 'MATCHED_AUTO' || tx.status === 'MATCHED_MANUAL';
  const isIgnored = tx.status === 'IGNORED';

  const parsed = tx.status === 'SUGGESTED' && tx.matched_by
    ? parseSuggestion(tx.matched_by)
    : null;

  const suggestedTenantId = parsed?.type === 'tenant' ? parsed.tenantId : undefined;
  const suggestedNk = parsed?.type === 'tenant' && parsed.isNk;

  const [ruleData, setRuleData] = useState<BankMatchingRule | null>(null);
  const [ruleLoading, setRuleLoading] = useState(parsed?.type === 'rule');

  useEffect(() => {
    if (parsed?.type === 'rule' && parsed.ruleId) {
      setRuleLoading(true);
      supabase
        .from('bank_matching_rules')
        .select('*')
        .eq('id', parsed.ruleId)
        .maybeSingle()
        .then(({ data }) => {
          setRuleData(data || null);
          if (data) {
            if (data.target_type === 'rent_payment') setAction('rent');
            else if (data.target_type === 'expense') setAction('expense');
            else if (data.target_type === 'income_entry') setAction('income');
          }
          setRuleLoading(false);
        });
    }
  }, [parsed?.type, parsed?.ruleId]);

  const ruleTenantId = ruleData?.target_type === 'rent_payment'
    ? (ruleData.target_config?.tenant_id as string) || undefined
    : undefined;

  const initialAction: Action = (() => {
    if (!parsed) return 'none';
    if (parsed.type === 'tenant') return 'rent';
    if (parsed.type === 'hausgeld' || parsed.type === 'existing_expense') return 'expense';
    if (parsed.type === 'existing_income') return 'income';
    if (parsed.type === 'rule') return 'none';
    return 'none';
  })();

  const [action, setAction] = useState<Action>(initialAction);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [allocations, setAllocations] = useState<BankTransactionAllocation[]>([]);

  useEffect(() => {
    if (isMatched) loadAllocations();
  }, [tx.id, isMatched]);

  async function loadAllocations() {
    try {
      const data = await getAllocationsForTransaction(tx.id);
      setAllocations(data);
    } catch {
      // ignore
    }
  }

  async function handleIgnore() {
    setProcessing(true);
    setError('');
    try {
      await ignoreBankTransaction(userId, tx.id);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUnignore() {
    setProcessing(true);
    setError('');
    try {
      await unignoreBankTransaction(userId, tx.id);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUndo() {
    setProcessing(true);
    setError('');
    try {
      await undoAllocation(userId, tx.id);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setProcessing(false);
    }
  }

  function handleComplete() {
    onRefresh();
    onClose();
  }

  const details = [
    { label: 'Datum', value: new Date(tx.transaction_date).toLocaleDateString('de-DE') },
    ...(tx.value_date
      ? [{ label: 'Wertstellung', value: new Date(tx.value_date).toLocaleDateString('de-DE') }]
      : []),
    { label: 'Gegenpartei', value: tx.counterparty_name || '--' },
    ...(tx.counterparty_iban ? [{ label: 'IBAN', value: tx.counterparty_iban }] : []),
    { label: 'Verwendungszweck', value: tx.usage_text || tx.description || '--' },
    ...(tx.end_to_end_id ? [{ label: 'End-to-End-Ref', value: tx.end_to_end_id }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isCredit ? 'bg-emerald-100' : 'bg-red-100'
                }`}
              >
                {isCredit ? (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div>
                <div
                  className={`text-lg font-bold tabular-nums ${
                    isCredit ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {formatAmount(tx.amount, tx.direction)}
                </div>
                <p className="text-xs text-gray-400">
                  {tx.counterparty_name || 'Unbekannt'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {details.map((d) => (
              <div key={d.label}>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                  {d.label}
                </p>
                <p className="text-sm text-dark break-all">{d.value}</p>
              </div>
            ))}
          </div>

          {isMatched && allocations.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">
                  Zuordnungen ({allocations.length})
                </span>
              </div>
              <div className="space-y-1">
                {allocations.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5"
                  >
                    <span className="text-gray-600">
                      {a.target_type === 'rent_payment'
                        ? 'Miete/NK'
                        : a.target_type === 'income_entry'
                        ? 'Einnahme'
                        : 'Ausgabe'}
                    </span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      {Number(a.amount_allocated).toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      EUR
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {action === 'none' && isOpen && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Zuordnen als
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setAction('rent')}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#3c8af7] hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Home className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">Miete / Nebenkosten</p>
                    <p className="text-[10px] text-gray-400">
                      Auf offene Miet- oder Nebenkostenforderungen anrechnen
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setAction('income')}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#3c8af7] hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">Einnahme</p>
                    <p className="text-[10px] text-gray-400">
                      Als sonstige Einnahme erfassen
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setAction('expense')}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#3c8af7] hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">Ausgabe</p>
                    <p className="text-[10px] text-gray-400">
                      Als Ausgabe erfassen
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <Button
                  variant="cancel"
                  size="sm"
                  fullWidth
                  onClick={handleIgnore}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Ban className="w-3.5 h-3.5" />
                  )}
                  Ignorieren
                </Button>
              </div>
            </div>
          )}

          {action === 'rent' && (
            <RentAssignmentPanel
              tx={tx}
              userId={userId}
              suggestedTenantId={suggestedTenantId || ruleTenantId}
              suggestedNk={suggestedNk}
              onComplete={handleComplete}
              onCancel={() => setAction('none')}
            />
          )}

          {action === 'income' && (
            <IncomeExpenseAssignmentPanel
              tx={tx}
              userId={userId}
              targetType="income_entry"
              suggestedExistingEntryId={parsed?.type === 'existing_income' ? parsed.existingEntryId : undefined}
              onComplete={handleComplete}
              onCancel={() => setAction('none')}
            />
          )}

          {action === 'expense' && (
            <IncomeExpenseAssignmentPanel
              tx={tx}
              userId={userId}
              targetType="expense"
              suggestedPropertyId={parsed?.type === 'hausgeld' ? parsed.propertyId : undefined}
              suggestedCategory={parsed?.type === 'hausgeld' ? parsed.category : undefined}
              suggestedExistingEntryId={parsed?.type === 'existing_expense' ? parsed.existingEntryId : undefined}
              onComplete={handleComplete}
              onCancel={() => setAction('none')}
            />
          )}

          {action === 'none' && isMatched && (
            <Button
              variant="warning"
              size="sm"
              fullWidth
              onClick={handleUndo}
              disabled={processing}
            >
              {processing ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Undo2 className="w-3.5 h-3.5" />
              )}
              Zuordnung aufheben
            </Button>
          )}

          {action === 'none' && isIgnored && (
            <Button
              variant="outlined"
              size="sm"
              fullWidth
              onClick={handleUnignore}
              disabled={processing}
            >
              {processing ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Undo2 className="w-3.5 h-3.5" />
              )}
              Wieder aktivieren
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
