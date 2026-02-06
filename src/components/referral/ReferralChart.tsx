import { useMemo } from "react";
import { BarChart3 } from "lucide-react";

interface Referral {
  id: string;
  status: string;
  cash_reward_eur: number;
  created_at: string;
}

interface MonthData {
  label: string;
  users: number;
  revenue: number;
}

interface ReferralChartProps {
  referrals: Referral[];
}

export default function ReferralChart({ referrals }: ReferralChartProps) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: MonthData[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
      months.push({ label, users: 0, revenue: 0 });

      referrals.forEach((r) => {
        const rDate = new Date(r.created_at);
        const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, "0")}`;
        if (rKey === key) {
          months[months.length - 1].users += 1;
          if (r.status === "completed") {
            months[months.length - 1].revenue += r.cash_reward_eur || 10;
          }
        }
      });
    }

    return months;
  }, [referrals]);

  const maxUsers = Math.max(...monthlyData.map((m) => m.users), 1);
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 10);

  const chartW = 560;
  const chartH = 200;
  const padL = 40;
  const padR = 50;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barGroupW = innerW / monthlyData.length;
  const barW = barGroupW * 0.3;

  const revenuePoints = monthlyData.map((m, i) => {
    const x = padL + i * barGroupW + barGroupW / 2;
    const y = padT + innerH - (m.revenue / maxRevenue) * innerH;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#1e1e24]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dark">
            Empfehlungsstatistik
          </h3>
          <p className="text-xs text-gray-500">Letzte 6 Monate</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary-blue" />
          <span className="text-xs text-gray-600">Geworbene Nutzer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600">Umsatz (EUR)</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" style={{ minWidth: 400, maxHeight: 260 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padT + innerH - frac * innerH;
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-gray-400"
                  fontSize={9}
                >
                  {Math.round(frac * maxUsers)}
                </text>
                <text
                  x={chartW - padR + 6}
                  y={y + 3}
                  textAnchor="start"
                  className="fill-emerald-500"
                  fontSize={9}
                >
                  {Math.round(frac * maxRevenue)}
                </text>
              </g>
            );
          })}

          {monthlyData.map((m, i) => {
            const x = padL + i * barGroupW + (barGroupW - barW) / 2;
            const h = (m.users / maxUsers) * innerH;
            const y = padT + innerH - h;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={3}
                  className="fill-primary-blue/80"
                >
                  <animate
                    attributeName="height"
                    from="0"
                    to={h}
                    dur="0.6s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="y"
                    from={padT + innerH}
                    to={y}
                    dur="0.6s"
                    fill="freeze"
                  />
                </rect>

                {m.users > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="fill-gray-700"
                    fontSize={10}
                    fontWeight={600}
                  >
                    {m.users}
                  </text>
                )}

                <text
                  x={padL + i * barGroupW + barGroupW / 2}
                  y={chartH - 8}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize={10}
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          <polyline
            points={revenuePoints}
            fill="none"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {monthlyData.map((m, i) => {
            const x = padL + i * barGroupW + barGroupW / 2;
            const y = padT + innerH - (m.revenue / maxRevenue) * innerH;
            return (
              <g key={`dot-${i}`}>
                <circle cx={x} cy={y} r={4} fill="white" stroke="#10b981" strokeWidth={2} />
                {m.revenue > 0 && (
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="fill-emerald-600"
                    fontSize={9}
                    fontWeight={600}
                  >
                    {m.revenue}
                  </text>
                )}
              </g>
            );
          })}

          <text
            x={padL / 2}
            y={padT - 6}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={9}
          >
            Nutzer
          </text>
          <text
            x={chartW - padR / 2}
            y={padT - 6}
            textAnchor="middle"
            className="fill-emerald-500"
            fontSize={9}
          >
            EUR
          </text>
        </svg>
      </div>
    </div>
  );
}
