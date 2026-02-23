import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeriesEntry } from "../../hooks/useInterestRates";

interface Props {
  series: SeriesEntry[];
  endPeriod: string;
  fetchedAt: string;
  range: string;
  onRangeChange: (range: "1y" | "3y" | "5y" | "max") => void;
}

const SERIES_COLORS: Record<string, string> = {
  fixation_up_to_1y: "#f59e0b",
  fixation_1_to_5y: "#10b981",
  fixation_5_to_10y: "#3c8af7",
  fixation_over_10y: "#1e40af",
};

const SERIES_ORDER = [
  "fixation_up_to_1y",
  "fixation_1_to_5y",
  "fixation_5_to_10y",
  "fixation_over_10y",
];

const RANGE_OPTIONS: { key: "1y" | "3y" | "5y" | "max"; label: string }[] = [
  { key: "1y", label: "1J" },
  { key: "3y", label: "3J" },
  { key: "5y", label: "5J" },
  { key: "max", label: "Max" },
];

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const monthNames = [
    "Jan", "Feb", "Mrz", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function formatFetchedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ChartDataPoint {
  date: string;
  label: string;
  [seriesId: string]: string | number | undefined;
}

export default function InterestRateChart({
  series,
  endPeriod,
  fetchedAt,
  range,
  onRangeChange,
}: Props) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    for (const s of series) {
      for (const p of s.points) {
        allDates.add(p.date);
      }
    }

    const sortedDates = Array.from(allDates).sort();
    const pointMaps: Record<string, Map<string, number>> = {};
    for (const s of series) {
      const map = new Map<string, number>();
      for (const p of s.points) {
        map.set(p.date, p.value);
      }
      pointMaps[s.id] = map;
    }

    return sortedDates.map((date): ChartDataPoint => {
      const row: ChartDataPoint = { date, label: formatPeriod(date) };
      for (const s of series) {
        const val = pointMaps[s.id]?.get(date);
        if (val !== undefined) {
          row[s.id] = val;
        }
      }
      return row;
    });
  }, [series]);

  const orderedSeries = useMemo(
    () => SERIES_ORDER.map((id) => series.find((s) => s.id === id)).filter(Boolean) as SeriesEntry[],
    [series]
  );

  function toggleSeries(id: string) {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < orderedSeries.length - 1) {
          next.add(id);
        }
      }
      return next;
    });
  }

  const tickInterval = useMemo(() => {
    const count = chartData.length;
    if (count <= 15) return 0;
    if (count <= 40) return 2;
    if (count <= 80) return 5;
    return 11;
  }, [chartData.length]);

  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of chartData) {
      for (const s of orderedSeries) {
        if (hiddenSeries.has(s.id)) continue;
        const val = row[s.id];
        if (typeof val === "number") {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
    }
    if (!isFinite(min)) return [0, 6];
    const padding = (max - min) * 0.1;
    return [Math.max(0, Math.floor((min - padding) * 2) / 2), Math.ceil((max + padding) * 2) / 2];
  }, [chartData, orderedSeries, hiddenSeries]);

  return (
    <div className="my-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <div className="text-xs text-gray-400">
          Stand: {formatPeriod(endPeriod)} &middot; Quelle: Deutsche Bundesbank, BBIM1
        </div>
        <div className="text-xs text-gray-400">
          Letzte Aktualisierung: {formatFetchedAt(fetchedAt)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {orderedSeries.map((s) => {
              const isHidden = hiddenSeries.has(s.id);
              const color = SERIES_COLORS[s.id] || "#888";
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSeries(s.id)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    isHidden
                      ? "border-gray-200 text-gray-400 bg-gray-50"
                      : "border-current bg-white"
                  }`}
                  style={{ color: isHidden ? undefined : color, borderColor: isHidden ? undefined : `${color}40` }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isHidden ? "#d1d5db" : color }}
                  />
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onRangeChange(opt.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  range === opt.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full" style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatPeriod}
                interval={tickInterval}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                tickFormatter={(v: number) => `${v.toFixed(1)} %`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
                      <p className="font-semibold text-gray-900 mb-2">{formatPeriod(label as string)}</p>
                      {payload.map((entry) => {
                        const s = orderedSeries.find((s) => s.id === entry.dataKey);
                        if (!s) return null;
                        return (
                          <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-gray-600">{s.label}</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {typeof entry.value === "number" ? `${entry.value.toFixed(2)} %` : "–"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {orderedSeries.map((s) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  stroke={SERIES_COLORS[s.id]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  hide={hiddenSeries.has(s.id)}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
