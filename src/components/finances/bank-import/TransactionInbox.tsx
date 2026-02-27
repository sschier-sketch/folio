import { useState, useEffect, useCallback } from 'react';
import { Inbox, Loader, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../ui/Button';
import {
  listBankTransactions,
  ignoreBankTransaction,
  unignoreBankTransaction,
  undoAllocation,
  runSuggestionsForUnmatched,
} from '../../../lib/bankImport';
import type { BankTransaction, BankTransactionStatus } from '../../../lib/bankImport/types';
import InboxFilters from './InboxFilters';
import TransactionRow from './TransactionRow';
import TransactionDetailDrawer from './TransactionDetailDrawer';

type FilterType = BankTransactionStatus | 'ALL_OPEN';

export default function TransactionInbox() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL_OPEN');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
  const [runningAutoMatch, setRunningAutoMatch] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 30;

  const loadTransactions = useCallback(
    async (filter: FilterType, pageNum: number) => {
      if (!user) return;
      setLoading(true);

      try {
        const statusFilter: BankTransactionStatus[] =
          filter === 'ALL_OPEN'
            ? ['UNMATCHED', 'SUGGESTED']
            : [filter as BankTransactionStatus];

        const result = await listBankTransactions(user.id, {
          status: statusFilter,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
        });

        setTransactions(result.data);
        setTotalCount(result.count);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const loadCounts = useCallback(async () => {
    if (!user) return;

    const statuses: BankTransactionStatus[] = [
      'UNMATCHED',
      'SUGGESTED',
      'MATCHED_MANUAL',
      'MATCHED_AUTO',
      'IGNORED',
    ];

    const newCounts: Record<string, number> = {};

    for (const status of statuses) {
      const result = await listBankTransactions(user.id, {
        status,
        limit: 0,
        offset: 0,
      });
      newCounts[status] = result.count;
    }

    setCounts(newCounts);
  }, [user]);

  useEffect(() => {
    loadTransactions(activeFilter, page);
    loadCounts();
  }, [activeFilter, page, loadTransactions, loadCounts]);

  function handleFilterChange(filter: FilterType) {
    setActiveFilter(filter);
    setPage(0);
  }

  function refresh() {
    loadTransactions(activeFilter, page);
    loadCounts();
  }

  async function handleQuickIgnore(tx: BankTransaction) {
    if (!user) return;
    await ignoreBankTransaction(user.id, tx.id);
    refresh();
  }

  async function handleQuickUndo(tx: BankTransaction) {
    if (!user) return;
    await undoAllocation(user.id, tx.id);
    refresh();
  }

  async function handleUnignore(tx: BankTransaction) {
    if (!user) return;
    await unignoreBankTransaction(user.id, tx.id);
    refresh();
  }

  async function handleRunAutoMatch() {
    if (!user) return;
    setRunningAutoMatch(true);
    try {
      const matched = await runSuggestionsForUnmatched(user.id);
      if (matched > 0) {
        refresh();
      }
    } finally {
      setRunningAutoMatch(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <InboxFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={counts}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="sm"
            onClick={handleRunAutoMatch}
            disabled={runningAutoMatch}
            title="Automatische Vorschlaege generieren"
          >
            {runningAutoMatch ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Auto-Match</span>
          </Button>
          <Button
            variant="cancel"
            size="sm"
            onClick={refresh}
            title="Aktualisieren"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Inbox className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">
              Keine Transaktionen
            </p>
            <p className="text-xs text-gray-400">
              {activeFilter === 'ALL_OPEN'
                ? 'Alle Transaktionen wurden zugeordnet oder ignoriert.'
                : 'Keine Transaktionen mit diesem Filter.'}
            </p>
          </div>
        ) : (
          <>
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onSelect={setSelectedTx}
                onQuickIgnore={handleQuickIgnore}
                onQuickUndo={handleQuickUndo}
                onUnignore={handleUnignore}
              />
            ))}
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {totalCount} Transaktionen
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurueck
              </button>
              <span className="text-xs text-gray-500 px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTx && user && (
        <TransactionDetailDrawer
          tx={selectedTx}
          userId={user.id}
          onClose={() => setSelectedTx(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
