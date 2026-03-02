import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface DayStat {
  stat_date: string;
  total_clicks: number;
  total_signups: number;
}

function getMonthRange(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function AdminAffiliateChart() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getMonthRange(year, month);
      const { data: rows, error } = await supabase.rpc(
        "admin_get_affiliate_daily_stats",
        { p_from_date: from, p_to_date: to }
      );
      if (error) throw error;
      setData((rows as DayStat[]) || []);
    } catch (err) {
      console.error("Error loading affiliate stats:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const goBack = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goForward = () => {
    if (isCurrentMonth) return;
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.stat_date,
        dateLabel: formatDate(d.stat_date),
        Klicks: Number(d.total_clicks),
        Registrierungen: Number(d.total_signups),
      })),
    [data]
  );

  const totals = useMemo(() => {
    let clicks = 0;
    let signups = 0;
    for (const d of chartData) {
      clicks += d.Klicks;
      signups += d.Registrierungen;
    }
    return { clicks, signups };
  }, [chartData]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#1e1e24]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark">
              Affiliate-Aktivität
            </h3>
            <p className="text-xs text-gray-500">
              Klicks auf Partnerlinks und geworbene Registrierungen pro Tag
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#3c8af7]" />
              <span className="text-xs font-medium text-gray-600">
                {totals.clicks.toLocaleString("de-DE")} Klicks
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-xs font-medium text-gray-600">
                {totals.signups.toLocaleString("de-DE")} Registrierungen
              </span>
            </div>
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-medium text-gray-700 min-w-[140px] text-center select-none">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={goForward}
              disabled={isCurrentMonth}
              className="p-2 hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-gray-400">
            Keine Daten für diesen Zeitraum vorhanden.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval="preserveStartEnd"
              minTickGap={28}
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
                if (payload?.[0]?.payload?.date)
                  return formatDateFull(payload[0].payload.date);
                return "";
              }}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            <Bar
              dataKey="Klicks"
              fill="#3c8af7"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
            <Bar
              dataKey="Registrierungen"
              fill="#10b981"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
