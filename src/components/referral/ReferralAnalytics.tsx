import { useState, useEffect } from 'react';
import { TrendingUp, Users, MousePointerClick, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  time_bucket: string;
  clicks_count: number;
  signups_count: number;
  paying_count: number;
  commission_earned: number;
  commission_available: number;
  commission_paid: number;
}

interface ReferralAnalyticsProps {
  userId: string;
}

type TimeRange = '7d' | '30d' | '90d' | '6m' | '12m' | 'custom';

export default function ReferralAnalytics({ userId }: ReferralAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const timeRangeLabels: Record<TimeRange, string> = {
    '7d': '7 Tage',
    '30d': '30 Tage',
    '90d': '90 Tage',
    '6m': '6 Monate',
    '12m': '12 Monate',
    'custom': 'Benutzerdefiniert',
  };

  useEffect(() => {
    loadAnalytics();
  }, [userId, timeRange, granularity, customStartDate, customEndDate]);

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : timeRange === '6m' ? 180 : timeRange === '12m' ? 365 : 0;

    if (days > 0) {
      if (days <= 31) {
        setGranularity('day');
      } else if (days <= 180) {
        setGranularity('week');
      } else {
        setGranularity('month');
      }
    }
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);

    let startDate: Date;
    let endDate: Date = new Date();

    if (timeRange === 'custom') {
      if (!customStartDate || !customEndDate) {
        setLoading(false);
        return;
      }
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : timeRange === '6m' ? 180 : 365;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    try {
      const { data, error } = await supabase.rpc('get_referral_analytics', {
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_granularity: granularity,
      });

      if (error) throw error;
      setAnalyticsData(data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData([]);
    } finally {
      setLoading(false);
    }
  }

  const totalClicks = analyticsData.reduce((sum, d) => sum + Number(d.clicks_count), 0);
  const totalSignups = analyticsData.reduce((sum, d) => sum + Number(d.signups_count), 0);
  const totalPaying = analyticsData.reduce((sum, d) => sum + Number(d.paying_count), 0);
  const totalCommissionEarned = analyticsData.reduce((sum, d) => sum + Number(d.commission_earned), 0);
  const totalCommissionAvailable = analyticsData.reduce((sum, d) => sum + Number(d.commission_available), 0);
  const totalCommissionPaid = analyticsData.reduce((sum, d) => sum + Number(d.commission_paid), 0);

  const clickToSignupRate = totalClicks > 0 ? (totalSignups / totalClicks * 100) : 0;
  const signupToPayingRate = totalSignups > 0 ? (totalPaying / totalSignups * 100) : 0;

  const chartData = analyticsData.map(d => ({
    date: new Date(d.time_bucket).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      ...(granularity === 'month' ? { year: '2-digit' } : {})
    }),
    Clicks: Number(d.clicks_count),
    Signups: Number(d.signups_count),
    Zahlend: Number(d.paying_count),
    'Provision (EUR)': Number(d.commission_earned),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Auswertung & Analytics</h2>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {Object.entries(timeRangeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {timeRange === 'custom' && (
          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Von</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Bis</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointerClick className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Clicks</span>
            </div>
            <div className="text-2xl font-bold text-dark mb-1">{totalClicks}</div>
            <div className="text-xs text-gray-500">Link-Aufrufe</div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Signups</span>
            </div>
            <div className="text-2xl font-bold text-dark mb-1">{totalSignups}</div>
            <div className="text-xs text-gray-500">
              {totalClicks > 0 ? `${clickToSignupRate.toFixed(1)}% von Clicks` : 'Registrierungen'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Conversions</span>
            </div>
            <div className="text-2xl font-bold text-dark mb-1">{totalPaying}</div>
            <div className="text-xs text-gray-500">
              {totalSignups > 0 ? `${signupToPayingRate.toFixed(1)}% von Signups` : 'Zahlende Nutzer'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Provision</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {totalCommissionEarned.toFixed(2)} EUR
            </div>
            <div className="text-xs text-gray-500">Verdient im Zeitraum</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Clicks & Signups über Zeit</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#999" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Clicks" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Signups" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversions & Provision über Zeit</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#999" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#999" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="Zahlend" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Provision (EUR)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Noch keine Daten für den gewählten Zeitraum verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
