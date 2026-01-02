import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import {
  Users, Mail, DollarSign, TrendingUp, Shield,
  UserCheck, Settings, Activity, Eye, XCircle, ArrowLeft, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminTicketsView } from '../components/AdminTicketsView';
import { AdminEmailTemplatesView } from '../components/AdminEmailTemplatesView';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  subscription_plan?: string;
  subscription_status?: string;
  properties_count?: number;
  tenants_count?: number;
}

interface Stats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  monthlyRevenue: number;
}

export function Admin() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets' | 'templates'>('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    monthlyRevenue: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  console.log('Admin Component - isAdmin:', isAdmin, 'adminLoading:', adminLoading);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadData() {
      try {
        const { data: usersData, error: usersError } = await supabase
          .rpc('admin_get_users');

        if (usersError) {
          console.error('Error loading users:', usersError);
          setLoadingData(false);
          return;
        }

        setUsers(usersData as UserData[]);

        const freeCount = (usersData || []).filter(u => u.subscription_plan === 'free').length;
        const premiumCount = (usersData || []).filter(u => u.subscription_plan === 'premium').length;

        setStats({
          totalUsers: (usersData || []).length,
          freeUsers: freeCount,
          premiumUsers: premiumCount,
          monthlyRevenue: premiumCount * 9,
        });
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [isAdmin]);

  if (adminLoading) {
    console.log('Admin Component - Still loading admin status, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    console.log('Admin Component - User is not admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Admin Component - User is admin, rendering admin interface');

  async function handleCancelSubscription(userId: string) {
    if (!confirm('Möchten Sie das Abonnement dieses Nutzers wirklich beenden?')) return;

    try {
      const { error } = await supabase
        .from('billing_info')
        .update({ subscription_plan: 'free', subscription_status: 'canceled' })
        .eq('user_id', userId);

      if (error) throw error;

      await supabase.from('admin_activity_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'cancel_subscription',
        target_user_id: userId,
        details: { timestamp: new Date().toISOString() },
      });

      alert('Abonnement wurde beendet');
      window.location.reload();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      alert('Fehler beim Beenden des Abonnements');
    }
  }

  async function handleImpersonate(userId: string, userEmail: string) {
    if (!confirm(`Möchten Sie sich als ${userEmail} anmelden?`)) return;

    try {
      await supabase.from('admin_activity_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'impersonate_user',
        target_user_id: userId,
        details: { timestamp: new Date().toISOString() },
      });

      alert('Impersonation-Feature wird in einer späteren Version implementiert');
    } catch (err) {
      console.error('Error logging impersonation:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-dark transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark">Admin-Dashboard</h1>
              <p className="text-gray-400">System-Verwaltung & Übersicht</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-gray-400 hover:text-dark'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-gray-400 hover:text-dark'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Benutzer
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'tickets'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-gray-400 hover:text-dark'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Tickets
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'templates'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-gray-400 hover:text-dark'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            E-Mail Templates
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-primary-blue" />
                  <span className="text-3xl font-bold text-dark">{stats.totalUsers}</span>
                </div>
                <p className="text-gray-400 font-medium">Gesamt Nutzer</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <UserCheck className="w-8 h-8 text-emerald-600" />
                  <span className="text-3xl font-bold text-dark">{stats.freeUsers}</span>
                </div>
                <p className="text-gray-400 font-medium">Gratis Nutzer</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                  <span className="text-3xl font-bold text-dark">{stats.premiumUsers}</span>
                </div>
                <p className="text-gray-400 font-medium">Premium Nutzer</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-dark">{stats.monthlyRevenue}€</span>
                </div>
                <p className="text-gray-400 font-medium">Monatl. Umsatz</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-dark mb-4">Schnellzugriff</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-blue hover:bg-primary-blue/5 transition-all text-left"
                >
                  <Users className="w-6 h-6 text-primary-blue mb-2" />
                  <p className="font-semibold text-dark">Benutzer verwalten</p>
                  <p className="text-sm text-gray-400">Alle Nutzer anzeigen & verwalten</p>
                </button>

                <button
                  onClick={() => setActiveTab('templates')}
                  className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-blue hover:bg-primary-blue/5 transition-all text-left"
                >
                  <Mail className="w-6 h-6 text-primary-blue mb-2" />
                  <p className="font-semibold text-dark">E-Mail Templates</p>
                  <p className="text-sm text-gray-400">Templates bearbeiten</p>
                </button>

                <div className="p-4 border-2 border-gray-100 rounded-xl bg-gray-50">
                  <Settings className="w-6 h-6 text-gray-300 mb-2" />
                  <p className="font-semibold text-dark">System-Einstellungen</p>
                  <p className="text-sm text-gray-400">Bald verfügbar</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-dark">Alle Benutzer</h2>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        E-Mail
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Registriert
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tarif
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.subscription_plan === 'premium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-50 text-dark'
                            }`}
                          >
                            {user.subscription_plan === 'premium' ? 'Premium' : 'Gratis'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.subscription_status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.subscription_status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleImpersonate(user.id, user.email)}
                              className="text-primary-blue hover:text-primary-blue transition-colors"
                              title="Als Nutzer anmelden"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user.subscription_plan === 'premium' && (
                              <button
                                onClick={() => handleCancelSubscription(user.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Abo beenden"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && <AdminTicketsView />}

        {activeTab === 'templates' && <AdminEmailTemplatesView />}
      </div>
    </div>
  );
}
