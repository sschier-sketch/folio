import { ChevronDown } from 'lucide-react';

interface CsvColumnMapperProps {
  headers: string[];
  columnAssignments: Record<string, string>;
  onChange: (field: string, columnName: string) => void;
}

const FIELDS = [
  { key: 'bookingDate', label: 'Buchungsdatum', required: true },
  { key: 'amount', label: 'Betrag', required: true },
  { key: 'usageText', label: 'Verwendungszweck', required: false },
  { key: 'counterpartyName', label: 'Auftraggeber / Empfaenger', required: false },
  { key: 'counterpartyIban', label: 'IBAN', required: false },
  { key: 'valueDate', label: 'Wertstellung', required: false },
  { key: 'creditDebitIndicator', label: 'Soll/Haben Kennzeichen', required: false },
  { key: 'currency', label: 'Waehrung', required: false },
] as const;

export default function CsvColumnMapper({
  headers,
  columnAssignments,
  onChange,
}: CsvColumnMapperProps) {
  const usedColumns = new Set(
    Object.values(columnAssignments).filter(Boolean)
  );

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Spalten zuordnen
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((field) => {
          const currentValue = columnAssignments[field.key] || '';
          return (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              <div className="relative">
                <select
                  value={currentValue}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={`w-full h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors ${
                    !currentValue && field.required
                      ? 'border-red-300 text-gray-400'
                      : currentValue
                      ? 'border-emerald-300 text-gray-900'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  <option value="">-- nicht zugeordnet --</option>
                  {headers.map((h) => {
                    const isUsedElsewhere =
                      usedColumns.has(h) && currentValue !== h;
                    return (
                      <option
                        key={h}
                        value={h}
                        disabled={isUsedElsewhere}
                      >
                        {h}
                        {isUsedElsewhere ? ' (bereits zugeordnet)' : ''}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getRequiredFieldsMissing(
  assignments: Record<string, string>
): string[] {
  const missing: string[] = [];
  for (const field of FIELDS) {
    if (field.required && !assignments[field.key]) {
      missing.push(field.label);
    }
  }
  return missing;
}
