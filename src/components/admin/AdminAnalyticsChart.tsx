import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChevronDown, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, GitCompareArrows } from "lucide-react";
import { supabase } from "../../lib/supabase";

type MetricKey = "total_users" | "pro_vs_free" | "revenue";

interface Snapshot {
  snapshot_date: string;
  total_users: number;
  pro_users: number;
  free_users: number;
  trial_users: number;
  monthly_revenue_cents: number;
  new_registrations: number;
}

interface TimeRange {
  key: string;
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { key: "7d", label: "7 Tage", days: 7 },
  { key: "30d", label: "30 Tage", days: 30 },
  { key: "90d", label: "90 Tage", days: 90 },
  { key: "180d", label: "6 Monate", days: 180 },
  { key: "365d", label: "1 Jahr", days: 365 },
];

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "total_users", label: "Entwicklung Anzahl Nutzer" },
  { key: "pro_vs_free", label: "Pro Nutzer vs. Gratis Nutzer" },
  { key: "revenue", label: "Entwicklung Umsatz" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getDatesRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function AdminAnalyticsChart() {
  const [metric, setMetric] = useState<MetricKey>("total_users");
  const [timeRange, setTimeRange] = useState("90d");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [compareSnapshots, setCompareSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);

  const selectedRange = TIME_RANGES.find((r) => r.key === timeRange) || TIME_RANGES[2];

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.rpc("admin_take_analytics_snapshot");

      const { from, to } = getDatesRange(selectedRange.days);
      const { data, error } = await supabase.rpc("admin_get_analytics_snapshots", {
        p_from_date: from,
        p_to_date: to,
      });
      if (error) throw error;
      setSnapshots((data as Snapshot[]) || []);

      if (compareEnabled) {
        const compFrom = new Date(from);
        compFrom.setDate(compFrom.getDate() - selectedRange.days);
        const compTo = new Date(from);
        compTo.setDate(compTo.getDate() - 1);
        const { data: compData } = await supabase.rpc("admin_get_analytics_snapshots", {
          p_from_date: compFrom.toISOString().split("T")[0],
          p_to_date: compTo.toISOString().split("T")[0],
        });
        setCompareSnapshots((compData as Snapshot[]) || []);
      } else {
        setCompareSnapshots([]);
      }
    } catch (err) {
      console.error("Error loading analytics snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange.days, compareEnabled]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      await supabase.rpc("admin_backfill_analytics_snapshots");
      await loadSnapshots();
    } catch (err) {
      console.error("Error backfilling:", err);
    } finally {
      setBackfilling(false);
    }
  };

  const chartData = useMemo(() => {
    return snapshots.map((s) => ({
      date: s.snapshot_date,
      dateLabel: formatDate(s.snapshot_date),
      total_users: s.total_users,
      pro_users: s.pro_users,
      free_users: s.free_users,
      trial_users: s.trial_users,
      revenue: s.monthly_revenue_cents / 100,
      new_registrations: s.new_registrations,
    }));
  }, [snapshots]);

  const summaryStats = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];

    const getValue = (d: (typeof chartData)[0]) => {
      switch (metric) {
        case "total_users":
          return d.total_users;
        case "pro_vs_free":
          return d.pro_users;
        case "revenue":
          return d.revenue;
      }
    };

    const startVal = getValue(first);
    const endVal = getValue(last);
    const change = endVal - startVal;
    const changePct = startVal > 0 ? ((change / startVal) * 100) : 0;

    let compChange: number | null = null;
    let compChangePct: number | null = null;
    if (compareEnabled && compareSnapshots.length >= 2) {
      const compFirst = compareSnapshots[0];
      const compLast = compareSnapshots[compareSnapshots.length - 1];
      const getCompValue = (s: Snapshot) => {
        switch (metric) {
          case "total_users": return s.total_users;
          case "pro_vs_free": return s.pro_users;
          case "revenue": return s.monthly_revenue_cents / 100;
        }
      };
      const compStartVal = getCompValue(compFirst);
      const compEndVal = getCompValue(compLast);
      compChange = compEndVal - compStartVal;
      compChangePct = compStartVal > 0 ? ((compChange / compStartVal) * 100) : 0;
    }

    return { startVal, endVal, change, changePct, compChange, compChangePct };
  }, [chartData, metric, compareEnabled, compareSnapshots]);

  const metricLabel = METRICS.find((m) => m.key === metric)?.label || "";

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-[320px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="h-[320px] flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-400">Keine Daten vorhanden.</p>
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${backfilling ? "animate-spin" : ""}`} />
            {backfilling ? "Daten werden generiert..." : "Historische Daten generieren"}
          </button>
        </div>
      );
    }

    if (metric === "pro_vs_free") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradFree" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradTrial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                padding: "10px 14px",
              }}
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.date) return formatDateFull(payload[0].payload.date);
                return "";
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  pro_users: "Pro Nutzer",
                  free_users: "Gratis Nutzer",
                  trial_users: "Trial Nutzer",
                };
                return [value, labels[name] || name];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  pro_users: "Pro Nutzer",
                  free_users: "Gratis Nutzer",
                  trial_users: "Trial Nutzer",
                };
                return labels[value] || value;
              }}
            />
            <Area type="monotone" dataKey="pro_users" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPro)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="free_users" stroke="#10b981" strokeWidth={2} fill="url(#gradFree)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="trial_users" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradTrial)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    const color = metric === "revenue" ? "#10b981" : "#3c8af7";
    const dataKey = metric === "revenue" ? "revenue" : "total_users";
    const gradId = metric === "revenue" ? "gradRevenue" : "gradUsers";

    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={metric === "revenue"}
            tickFormatter={metric === "revenue" ? (v: number) => `${v}€` : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              padding: "10px 14px",
            }}
            labelFormatter={(_, payload) => {
              if (payload?.[0]?.payload?.date) return formatDateFull(payload[0].payload.date);
              return "";
            }}
            formatter={(value: number) => {
              if (metric === "revenue") return [`${value.toFixed(0)} €`, "Monatl. Umsatz"];
              return [value, "Nutzer gesamt"];
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => { setMetricOpen(!metricOpen); setRangeOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {metricLabel}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${metricOpen ? "rotate-180" : ""}`} />
            </button>
            {metricOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => { setMetric(m.key); setMetricOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      metric === m.key
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {summaryStats && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-800">
                {metric === "revenue"
                  ? `${summaryStats.endVal.toFixed(0)} €`
                  : summaryStats.endVal.toLocaleString("de-DE")}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  summaryStats.change > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : summaryStats.change < 0
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {summaryStats.change > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : summaryStats.change < 0 ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {summaryStats.changePct >= 0 ? "+" : ""}
                {summaryStats.changePct.toFixed(1)}%
              </span>
              {compareEnabled && summaryStats.compChangePct !== null && (
                <span className="text-xs text-gray-400">
                  vs. Vorperiode{" "}
                  <span className={summaryStats.compChangePct! > summaryStats.changePct ? "text-red-500" : "text-emerald-600"}>
                    {summaryStats.compChangePct! >= 0 ? "+" : ""}
                    {summaryStats.compChangePct!.toFixed(1)}%
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareEnabled(!compareEnabled)}
            title="Vergleichszeitraum"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              compareEnabled
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            Vergleich
          </button>

          <div className="relative">
            <button
              onClick={() => { setRangeOpen(!rangeOpen); setMetricOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {selectedRange.label}
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
            </button>
            {rangeOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {TIME_RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { setTimeRange(r.key); setRangeOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      timeRange === r.key
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleBackfill}
            disabled={backfilling}
            title="Historische Daten generieren / aktualisieren"
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${backfilling ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {renderChart()}
    </div>
  );
}
