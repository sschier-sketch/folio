import { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, Euro, ExternalLink, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Stats {
  propertiesCount: number;
  tenantsCount: number;
  totalMonthlyRent: number;
  totalPropertyValue: number;
  averageYield: number;
  totalMonthlyExpenses: number;
  monthlySurplus: number;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    propertiesCount: 0,
    tenantsCount: 0,
    totalMonthlyRent: 0,
    totalPropertyValue: 0,
    averageYield: 0,
    totalMonthlyExpenses: 0,
    monthlySurplus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [propertiesRes, tenantsRes, contractsRes, loansRes] = await Promise.all([
        supabase.from('properties').select('current_value').eq('user_id', user.id),
        supabase.from('tenants').select('id').eq('user_id', user.id).eq('is_active', true),
        supabase.from('rental_contracts').select('base_rent, property_id').eq('user_id', user.id),
        supabase.from('loans').select('monthly_payment').eq('user_id', user.id),
      ]);

      const propertiesCount = propertiesRes.data?.length || 0;
      const tenantsCount = tenantsRes.data?.length || 0;
      const totalMonthlyRent = contractsRes.data?.reduce((sum, c) => sum + Number(c.base_rent), 0) || 0;
      const totalPropertyValue = propertiesRes.data?.reduce((sum, p) => sum + Number(p.current_value), 0) || 0;
      const totalMonthlyExpenses = loansRes.data?.reduce((sum, l) => sum + Number(l.monthly_payment), 0) || 0;

      const annualRent = totalMonthlyRent * 12;
      const averageYield = totalPropertyValue > 0 ? (annualRent / totalPropertyValue) * 100 : 0;
      const monthlySurplus = totalMonthlyRent - totalMonthlyExpenses;

      setStats({
        propertiesCount,
        tenantsCount,
        totalMonthlyRent,
        totalPropertyValue,
        averageYield,
        totalMonthlyExpenses,
        monthlySurplus,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleCopyPortalLink = () => {
    const portalUrl = `${window.location.origin}/portal/${user?.id}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('dashboard.overview')}</h1>
        <p className="text-slate-600">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.propertiesCount}</div>
          <div className="text-sm text-slate-600">{t('dashboard.properties')}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.tenantsCount}</div>
          <div className="text-sm text-slate-600">{t('dashboard.tenants.active')}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {formatCurrency(stats.totalMonthlyRent)}
          </div>
          <div className="text-sm text-slate-600">{t('dashboard.rent.monthly')}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {stats.averageYield.toFixed(2)}%
          </div>
          <div className="text-sm text-slate-600">{t('dashboard.yield.average')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.portfolio.total')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t('dashboard.portfolio.value')}</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatCurrency(stats.totalPropertyValue)}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-600">{t('dashboard.portfolio.annual')}</span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(stats.totalMonthlyRent * 12)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Monatlich</span>
                <span className="text-sm text-slate-600">
                  {formatCurrency(stats.totalMonthlyRent)}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-600">Jährliche Ausgaben</span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(stats.totalMonthlyExpenses * 12)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Monatlich</span>
                <span className="text-sm text-slate-600">
                  {formatCurrency(stats.totalMonthlyExpenses)}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-600 font-medium">Jährlicher Überschuss</span>
                <span className={`text-lg font-bold ${stats.monthlySurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.monthlySurplus * 12)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Monatlich</span>
                <span className={`text-sm font-semibold ${stats.monthlySurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.monthlySurplus)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickstart')}</h3>
          <p className="text-blue-100 mb-4">
            {t('dashboard.quickstart.description')}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>{t('dashboard.quickstart.property')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>{t('dashboard.quickstart.tenant')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>{t('dashboard.quickstart.contract')}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{t('dashboard.portal.title')}</h3>
          </div>
          <p className="text-emerald-100 text-sm mb-4">
            {t('dashboard.portal.description')}
          </p>
          <div className="bg-white/20 rounded-lg p-3 mb-3">
            <div className="text-xs font-mono text-white/90 break-all">
              {window.location.origin}/portal/{user?.id}
            </div>
          </div>
          <button
            onClick={handleCopyPortalLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t('dashboard.portal.copied')}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t('dashboard.portal.copy')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
