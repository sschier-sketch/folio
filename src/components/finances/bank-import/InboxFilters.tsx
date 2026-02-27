import type { BankTransactionStatus } from '../../../lib/bankImport/types';

interface InboxFiltersProps {
  activeFilter: BankTransactionStatus | 'ALL_OPEN';
  onFilterChange: (filter: BankTransactionStatus | 'ALL_OPEN') => void;
  counts: Record<string, number>;
}

const FILTERS: { id: BankTransactionStatus | 'ALL_OPEN'; label: string }[] = [
  { id: 'ALL_OPEN', label: 'Offen' },
  { id: 'SUGGESTED', label: 'Vorschlaege' },
  { id: 'MATCHED_MANUAL', label: 'Zugeordnet' },
  { id: 'MATCHED_AUTO', label: 'Automatisch' },
  { id: 'IGNORED', label: 'Ignoriert' },
];

export default function InboxFilters({
  activeFilter,
  onFilterChange,
  counts,
}: InboxFiltersProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.id;
        const count = f.id === 'ALL_OPEN'
          ? (counts['UNMATCHED'] || 0) + (counts['SUGGESTED'] || 0)
          : counts[f.id] || 0;
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
  );
}
