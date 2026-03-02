import type { BankTransactionStatus } from '../../../lib/bankImport/types';

export type FilterType = BankTransactionStatus | 'ALL_OPEN' | 'ALL';

interface InboxFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: Record<string, number>;
  unmatchedOnly: boolean;
  onUnmatchedOnlyChange: (value: boolean) => void;
  effectiveOpenCount?: number;
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'Alle' },
  { id: 'ALL_OPEN', label: 'Offen' },
  { id: 'SUGGESTED', label: 'Vorschläge' },
  { id: 'MATCHED_MANUAL', label: 'Zugeordnet' },
  { id: 'MATCHED_AUTO', label: 'Automatisch' },
  { id: 'IGNORED', label: 'Ignoriert' },
];

function getCount(id: FilterType, counts: Record<string, number>): number {
  if (id === 'ALL') {
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  }
  if (id === 'ALL_OPEN') {
    return (counts['UNMATCHED'] || 0) + (counts['SUGGESTED'] || 0);
  }
  return counts[id] || 0;
}

export default function InboxFilters({
  activeFilter,
  onFilterChange,
  counts,
  unmatchedOnly,
  onUnmatchedOnlyChange,
  effectiveOpenCount,
}: InboxFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          const count = f.id === 'ALL_OPEN' && effectiveOpenCount !== undefined
            ? effectiveOpenCount
            : getCount(f.id, counts);
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#3c8af7] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeFilter === 'ALL_OPEN' && (
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none ml-1">
          <input
            type="checkbox"
            checked={unmatchedOnly}
            onChange={(e) => onUnmatchedOnlyChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-[#3c8af7] focus:ring-[#3c8af7]"
          />
          <span className="text-xs text-gray-500">Nur unbekannte Posten</span>
        </label>
      )}
    </div>
  );
}
