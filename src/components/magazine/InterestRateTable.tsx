import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SeriesEntry } from "../../hooks/useInterestRates";

interface Props {
  series: SeriesEntry[];
}

const SERIES_ORDER = [
  "fixation_up_to_1y",
  "fixation_1_to_5y",
  "fixation_5_to_10y",
  "fixation_over_10y",
];

const SERIES_COLORS: Record<string, string> = {
  fixation_up_to_1y: "#f59e0b",
  fixation_1_to_5y: "#10b981",
  fixation_5_to_10y: "#3c8af7",
  fixation_over_10y: "#1e40af",
};

export default function InterestRateTable({ series }: Props) {
  const rows = useMemo(() => {
    return SERIES_ORDER
      .map((id) => series.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => {
        const sorted = [...(s as SeriesEntry).points].sort((a, b) => b.date.localeCompare(a.date));
        const latest = sorted[0];
        const previous = sorted[1];
        const diff = latest && previous ? +(latest.value - previous.value).toFixed(2) : null;
        return {
          id: (s as SeriesEntry).id,
          label: (s as SeriesEntry).label,
          value: latest?.value ?? null,
          date: latest?.date ?? null,
          diff,
        };
      });
  }, [series]);

  if (rows.length === 0) return null;

  const latestDate = rows[0]?.date;
  const formattedDate = latestDate
    ? (() => {
        const [y, m] = latestDate.split("-");
        const monthNames = [
          "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
          "Juli", "August", "September", "Oktober", "November", "Dezember",
        ];
        return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
      })()
    : "";

  return (
    <div className="my-8">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            Aktueller Effektivzins (% p.a.)
          </h3>
          {formattedDate && (
            <p className="text-xs text-gray-400 mt-0.5">
              Neuester Datenpunkt: {formattedDate}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-semibold text-gray-500 py-3 px-5">Zinsbindung</th>
                <th className="text-right font-semibold text-gray-500 py-3 px-5">Effektivzins</th>
                <th className="text-right font-semibold text-gray-500 py-3 px-5">gg. Vormonat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: SERIES_COLORS[row.id] }}
                      />
                      <span className="font-medium text-gray-800">{row.label}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-bold text-gray-900 text-base tabular-nums">
                      {row.value !== null ? `${row.value.toFixed(2)} %` : "–"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {row.diff !== null && row.diff !== 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          row.diff > 0 ? "text-red-500" : "text-emerald-600"
                        }`}
                      >
                        {row.diff > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {row.diff > 0 ? "+" : ""}
                        {row.diff.toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Minus className="w-3.5 h-3.5" />
                        0,00
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
