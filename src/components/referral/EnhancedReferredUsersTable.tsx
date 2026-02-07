import { useState, useEffect } from 'react';
import { Download, Check, Clock, CreditCard, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BaseTable, StatusBadge } from '../common/BaseTable';

interface ReferredUser {
  id: string;
  referred_user_id: string | null;
  status: string;
  created_at: string;
  first_payment_at: string | null;
  lifetime_value: number;
  reward_earned: boolean;
  cash_reward_eur: number;
  commission_status: string;
  plan_name: string | null;
}

interface EnhancedReferredUsersTableProps {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export default function EnhancedReferredUsersTable({ userId, startDate, endDate }: EnhancedReferredUsersTableProps) {
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadReferredUsers();
  }, [userId, startDate, endDate, statusFilter]);

  async function loadReferredUsers() {
    setLoading(true);

    try {
      let query = supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: referralsData } = await query.order('created_at', { ascending: false });

      const affiliateQuery = supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', userId);

      if (startDate) {
        affiliateQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        affiliateQuery.lte('created_at', endDate.toISOString());
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'completed') {
          affiliateQuery.eq('status', 'paying');
        } else if (statusFilter === 'pending') {
          affiliateQuery.eq('status', 'registered');
        }
      }

      const { data: affiliateData } = await affiliateQuery.order('created_at', { ascending: false });

      const combinedData: ReferredUser[] = [
        ...(referralsData || []).map((r: any) => ({
          id: r.id,
          referred_user_id: r.referred_user_id,
          status: r.status,
          created_at: r.created_at,
          first_payment_at: r.completed_at,
          lifetime_value: r.cash_reward_eur || 10,
          reward_earned: r.reward_earned,
          cash_reward_eur: r.cash_reward_eur || 10,
          commission_status: r.status === 'completed' ? 'paid' : 'pending',
          plan_name: null,
        })),
        ...(affiliateData || []).map((a: any) => ({
          id: a.id,
          referred_user_id: a.referred_user_id,
          status: a.status === 'paying' ? 'completed' : 'pending',
          created_at: a.created_at,
          first_payment_at: a.first_payment_at,
          lifetime_value: a.lifetime_value || 0,
          reward_earned: a.status === 'paying',
          cash_reward_eur: a.lifetime_value || 0,
          commission_status: a.status === 'paying' ? 'available' : 'pending',
          plan_name: 'PRO',
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReferredUsers(combinedData);
    } catch (error) {
      console.error('Error loading referred users:', error);
      setReferredUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const headers = ['Datum', 'Status', 'Plan', 'Provision', 'Provisionsstatus'];
    const rows = referredUsers.map(user => [
      new Date(user.created_at).toLocaleDateString('de-DE'),
      user.status === 'completed' ? 'Zahlend' : user.status === 'pending' ? 'Ausstehend' : 'Registriert',
      user.plan_name || '-',
      `${user.cash_reward_eur.toFixed(2)} EUR`,
      user.commission_status === 'paid' ? 'Ausgezahlt' : user.commission_status === 'available' ? 'Verfügbar' : 'Verdient',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `geworbene-nutzer-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark">Geworbene Nutzer</h3>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Alle Status</option>
            <option value="pending">Ausstehend</option>
            <option value="completed">Zahlend</option>
          </select>
          <button
            onClick={exportToCSV}
            disabled={referredUsers.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>
        </div>
      </div>

      <BaseTable
        columns={[
          {
            key: 'date',
            header: 'Datum',
            render: (user: ReferredUser) => (
              <span className="text-sm text-gray-600">
                {new Date(user.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (user: ReferredUser) => {
              if (user.status === 'completed' || user.status === 'paying') {
                return (
                  <StatusBadge
                    type="success"
                    label="Zahlend"
                    icon={<CreditCard className="w-3 h-3" />}
                  />
                );
              }
              if (user.status === 'registered') {
                return (
                  <StatusBadge
                    type="info"
                    label="Registriert"
                    icon={<User className="w-3 h-3" />}
                  />
                );
              }
              return (
                <StatusBadge
                  type="warning"
                  label="Ausstehend"
                  icon={<Clock className="w-3 h-3" />}
                />
              );
            },
          },
          {
            key: 'plan',
            header: 'Abo/Plan',
            render: (user: ReferredUser) => (
              <span className="text-sm text-gray-600">
                {user.plan_name || '-'}
              </span>
            ),
          },
          {
            key: 'commission',
            header: 'Provision',
            render: (user: ReferredUser) => (
              <span className="text-sm font-semibold text-emerald-600">
                {user.cash_reward_eur > 0 ? `${user.cash_reward_eur.toFixed(2)} EUR` : '-'}
              </span>
            ),
          },
          {
            key: 'commission_status',
            header: 'Provisionsstatus',
            render: (user: ReferredUser) => {
              if (user.commission_status === 'paid') {
                return (
                  <StatusBadge
                    type="success"
                    label="Ausgezahlt"
                    icon={<Check className="w-3 h-3" />}
                  />
                );
              }
              if (user.commission_status === 'available') {
                return (
                  <StatusBadge
                    type="info"
                    label="Verfügbar"
                  />
                );
              }
              return (
                <StatusBadge
                  type="neutral"
                  label="Verdient"
                />
              );
            },
          },
          {
            key: 'first_payment',
            header: 'Erste Zahlung',
            render: (user: ReferredUser) => (
              <span className="text-sm text-gray-600">
                {user.first_payment_at
                  ? new Date(user.first_payment_at).toLocaleDateString('de-DE')
                  : '-'}
              </span>
            ),
          },
        ]}
        data={referredUsers}
        loading={loading}
        emptyMessage="Noch keine geworbenen Nutzer im gewählten Zeitraum."
      />
    </div>
  );
}
