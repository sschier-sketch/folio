import { ArrowDownLeft, ArrowUpRight, Eye, Ban, Undo2, Sparkles } from 'lucide-react';
import type { BankTransaction } from '../../../lib/bankImport/types';

interface TransactionRowProps {
  tx: BankTransaction;
  onSelect: (tx: BankTransaction) => void;
  onQuickIgnore: (tx: BankTransaction) => void;
  onQuickUndo: (tx: BankTransaction) => void;
  onUnignore: (tx: BankTransaction) => void;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  UNMATCHED: { label: 'Offen', className: 'bg-amber-100 text-amber-700' },
  SUGGESTED: { label: 'Vorschlag', className: 'bg-blue-100 text-blue-700' },
  MATCHED_AUTO: { label: 'Auto', className: 'bg-emerald-100 text-emerald-700' },
  MATCHED_MANUAL: { label: 'Zugeordnet', className: 'bg-emerald-100 text-emerald-700' },
  IGNORED: { label: 'Ignoriert', className: 'bg-gray-100 text-gray-500' },
};

function formatAmount(amount: number, direction?: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const isCredit = direction === 'credit' || amount > 0;
  return `${isCredit ? '+' : '-'}${formatted} EUR`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function TransactionRow({
  tx,
  onSelect,
  onQuickIgnore,
  onQuickUndo,
  onUnignore,
}: TransactionRowProps) {
  const badge = STATUS_BADGES[tx.status] || STATUS_BADGES.UNMATCHED;
  const isCredit = tx.direction === 'credit' || tx.amount > 0;
  const isOpen = tx.status === 'UNMATCHED' || tx.status === 'SUGGESTED';
  const isMatched = tx.status === 'MATCHED_AUTO' || tx.status === 'MATCHED_MANUAL';
  const isIgnored = tx.status === 'IGNORED';

  const suggestion =
    tx.status === 'SUGGESTED' && tx.matched_by?.startsWith('suggestion:')
      ? tx.matched_by
      : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer group ${
        isIgnored ? 'opacity-60' : ''
      }`}
      onClick={() => onSelect(tx)}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCredit ? 'bg-emerald-100' : 'bg-red-100'
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-dark truncate">
            {tx.counterparty_name || 'Unbekannt'}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
          {suggestion && (
            <Sparkles className="w-3 h-3 text-[#3c8af7]" />
          )}
        </div>
        <p className="text-xs text-gray-400 truncate max-w-[400px]">
          {tx.usage_text || tx.description || '--'}
        </p>
      </div>

      <div className="text-right flex-shrink-0 mr-2">
        <div
          className={`text-sm font-semibold tabular-nums ${
            isCredit ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {formatAmount(tx.amount, tx.direction)}
        </div>
        <div className="text-[10px] text-gray-400">
          {formatDate(tx.transaction_date)}
        </div>
      </div>

      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen && (
          <>
            <button
              onClick={() => onSelect(tx)}
              className="p-1.5 rounded-lg hover:bg-blue-100 text-[#3c8af7] transition-colors"
              title="Zuordnen"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onQuickIgnore(tx)}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors"
              title="Ignorieren"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {isMatched && (
          <button
            onClick={() => onQuickUndo(tx)}
            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
            title="Zuordnung aufheben"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        )}
        {isIgnored && (
          <button
            onClick={() => onUnignore(tx)}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-[#3c8af7] transition-colors"
            title="Wieder aktivieren"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
