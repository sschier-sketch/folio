import { useMemo } from 'react';

interface CsvPreviewTableProps {
  headers: string[];
  rows: string[][];
  columnAssignments: Record<string, string>;
  maxRows?: number;
}

const FIELD_COLORS: Record<string, string> = {
  bookingDate: 'bg-blue-50 border-blue-200',
  valueDate: 'bg-sky-50 border-sky-200',
  amount: 'bg-emerald-50 border-emerald-200',
  counterpartyName: 'bg-amber-50 border-amber-200',
  counterpartyIban: 'bg-orange-50 border-orange-200',
  usageText: 'bg-teal-50 border-teal-200',
  creditDebitIndicator: 'bg-rose-50 border-rose-200',
  currency: 'bg-gray-50 border-gray-300',
};

const FIELD_LABELS: Record<string, string> = {
  bookingDate: 'Buchungsdatum',
  valueDate: 'Wertstellung',
  amount: 'Betrag',
  counterpartyName: 'Name',
  counterpartyIban: 'IBAN',
  usageText: 'Verwendungszweck',
  creditDebitIndicator: 'Soll/Haben',
  currency: 'Waehrung',
};

export default function CsvPreviewTable({
  headers,
  rows,
  columnAssignments,
  maxRows = 10,
}: CsvPreviewTableProps) {
  const reverseMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [field, colName] of Object.entries(columnAssignments)) {
      if (colName) map[colName] = field;
    }
    return map;
  }, [columnAssignments]);

  const previewRows = rows.slice(0, maxRows);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-medium text-gray-500 border-b border-gray-200 w-8">
                #
              </th>
              {headers.map((h, i) => {
                const assignedField = reverseMap[h];
                const colorClass = assignedField ? FIELD_COLORS[assignedField] : '';
                return (
                  <th
                    key={i}
                    className={`px-3 py-2 text-left font-medium border-b border-gray-200 whitespace-nowrap ${
                      assignedField
                        ? `${colorClass} text-gray-900`
                        : 'text-gray-500'
                    }`}
                  >
                    <div>{h}</div>
                    {assignedField && (
                      <div className="text-[10px] font-semibold mt-0.5 text-gray-600">
                        {FIELD_LABELS[assignedField]}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="px-3 py-1.5 text-gray-400 border-b border-gray-100">
                  {rowIdx + 1}
                </td>
                {headers.map((h, colIdx) => {
                  const assignedField = reverseMap[h];
                  const colorClass = assignedField ? FIELD_COLORS[assignedField] : '';
                  return (
                    <td
                      key={colIdx}
                      className={`px-3 py-1.5 border-b border-gray-100 max-w-[200px] truncate ${
                        assignedField ? colorClass : ''
                      }`}
                    >
                      {row[colIdx] || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
          Vorschau: {maxRows} von {rows.length} Zeilen
        </div>
      )}
    </div>
  );
}
