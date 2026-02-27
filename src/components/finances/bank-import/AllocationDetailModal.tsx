import { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Loader,
  Landmark,
  FileText,
  Undo2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { undoAllocation } from '../../../lib/bankImport';
import type { BankTransactionAllocation } from '../../../lib/bankImport/types';
import { Button } from '../../ui/Button';

interface BankTxDetails {
  id: string;
  transaction_date: string;
  value_date?: string;
  amount: number;
  direction?: string;
  counterparty_name?: string;
  counterparty_iban?: string;
  usage_text?: string;
  end_to_end_id?: string;
  mandate_id?: string;
  bank_reference?: string;
  status: string;
  matched_by?: string;
  confidence?: number;
  import_file?: {
    filename: string;
    uploaded_at: string;
    source_type: string;
  } | null;
}

interface AllocationDetailModalProps {
  rentPaymentId: string;
  userId: string;
  onClose: () => void;
  onUndone: () => void;
}

export default function AllocationDetailModal({
  rentPaymentId,
  userId,
  onClose,
  onUndone,
}: AllocationDetailModalProps) {
  const [allocations, setAllocations] = useState<
    (BankTransactionAllocation & { bank_tx?: BankTxDetails })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadAllocations();
  }, [rentPaymentId]);

  async function loadAllocations() {
    setLoading(true);
    try {
      const { data: allocs } = await supabase
        .from('bank_transaction_allocations')
        .select('*')
        .eq('target_type', 'rent_payment')
        .eq('target_id', rentPaymentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (!allocs || allocs.length === 0) {
        setAllocations([]);
        setLoading(false);
        return;
      }

      const txIds = [...new Set(allocs.map((a) => a.bank_transaction_id))];

      const { data: txs } = await supabase
        .from('bank_transactions')
        .select(
          `id, transaction_date, value_date, amount, direction,
           counterparty_name, counterparty_iban, usage_text,
           end_to_end_id, mandate_id, bank_reference,
           status, matched_by, confidence,
           import_file:bank_import_files(filename, uploaded_at, source_type)`
        )
        .in('id', txIds);

      const txMap = new Map((txs || []).map((t) => [t.id, t]));

      setAllocations(
        allocs.map((a) => ({
          ...a,
          bank_tx: txMap.get(a.bank_transaction_id) || undefined,
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUndo(bankTransactionId: string) {
    setUndoing(bankTransactionId);
    try {
      await undoAllocation(userId, bankTransactionId);
      onUndone();
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setUndoing(null);
      setShowConfirm(null);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatAmount(amount: number): string {
    return Math.abs(amount).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function matchLabel(matchedBy?: string): string {
    if (!matchedBy) return 'Manuell';
    if (matchedBy === 'auto') return 'Automatisch';
    if (matchedBy === 'manual') return 'Manuell';
    if (matchedBy.startsWith('suggestion:')) return 'Vorschlag (bestaetigt)';
    return matchedBy;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#3c8af7]" />
            <h3 className="text-base font-semibold text-dark">
              Bank-Zuordnung
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : allocations.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Keine Bank-Zuordnungen gefunden
            </div>
          ) : (
            <div className="space-y-4">
              {allocations.map((alloc) => {
                const tx = alloc.bank_tx;
                if (!tx) return null;

                const isCredit =
                  tx.direction === 'credit' || tx.amount > 0;

                return (
                  <div
                    key={alloc.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          isCredit ? 'bg-emerald-100' : 'bg-red-100'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            isCredit ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatAmount(tx.amount)} EUR
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          alloc.created_by === 'auto'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {matchLabel(tx.matched_by)}
                      </span>
                    </div>

                    <div className="px-4 py-3 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400">Buchungsdatum</span>
                          <p className="text-dark font-medium">
                            {formatDate(tx.transaction_date)}
                          </p>
                        </div>
                        {tx.value_date && (
                          <div>
                            <span className="text-gray-400">Wertstellung</span>
                            <p className="text-dark font-medium">
                              {formatDate(tx.value_date)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Gegenpartei</span>
                          <p className="text-dark font-medium">
                            {tx.counterparty_name || '--'}
                          </p>
                        </div>
                        {tx.counterparty_iban && (
                          <div>
                            <span className="text-gray-400">IBAN</span>
                            <p className="text-dark font-mono text-[11px]">
                              {tx.counterparty_iban}
                            </p>
                          </div>
                        )}
                      </div>

                      {tx.usage_text && (
                        <div>
                          <span className="text-gray-400">
                            Verwendungszweck
                          </span>
                          <p className="text-dark mt-0.5">{tx.usage_text}</p>
                        </div>
                      )}

                      {tx.end_to_end_id && (
                        <div>
                          <span className="text-gray-400">End-to-End-Ref</span>
                          <p className="text-dark font-mono text-[11px]">
                            {tx.end_to_end_id}
                          </p>
                        </div>
                      )}

                      {tx.import_file && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-400">
                            {tx.import_file.filename}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-400">
                            {new Date(
                              tx.import_file.uploaded_at
                            ).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-gray-400">
                            Zugeordneter Betrag
                          </span>
                          <p className="text-emerald-600 font-bold tabular-nums">
                            {formatAmount(alloc.amount_allocated)} EUR
                          </p>
                        </div>

                        {showConfirm === tx.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-600 font-medium">
                              Wirklich aufheben?
                            </span>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleUndo(tx.id)}
                              disabled={!!undoing}
                            >
                              {undoing === tx.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                'Ja'
                              )}
                            </Button>
                            <Button
                              variant="cancel"
                              size="sm"
                              onClick={() => setShowConfirm(null)}
                            >
                              Nein
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowConfirm(tx.id)}
                            className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-700 transition-colors px-2 py-1 rounded-md hover:bg-amber-50"
                          >
                            <Undo2 className="w-3 h-3" />
                            Aufheben
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
