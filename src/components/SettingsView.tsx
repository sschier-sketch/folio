import { useState, useEffect } from 'react';
import { User, Users, Mail, Trash2, Check, X, Loader, Globe, CreditCard, Building, FileText, Shield, MessageCircle, Send, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { stripeProducts } from '../stripe-config';
import { SubscriptionCard } from './subscription/SubscriptionCard';
import { SubscriptionStatus } from './subscription/SubscriptionStatus';
import { useSubscription } from '../hooks/useSubscription';

interface Invitation {
  id: string;
  invitee_email: string;
  status: string;
  role: string;
  created_at: string;
  expires_at: string;
}

interface UserSettings {
  role: string;
  can_invite_users: boolean;
  can_manage_properties: boolean;
  can_manage_tenants: boolean;
  can_manage_finances: boolean;
  can_view_analytics: boolean;
}

interface BillingInfo {
  company_name: string | null;
  vat_id: string | null;
  billing_address: string | null;
  billing_email: string | null;
  payment_method: string | null;
  subscription_plan: string;
  subscription_status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  invoice_date: string;
  invoice_pdf_url: string | null;
}

interface Feedback {
  id: string;
  feedback_text: string;
  willing_to_pay: boolean;
  payment_amount: string | null;
  status: string;
  created_at: string;
}

interface SettingsViewProps {
  activeTab?: 'profile' | 'users' | 'billing';
}

export default function SettingsView({ activeTab: initialTab = 'profile' }: SettingsViewProps) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'billing' | 'feedback'>(initialTab);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('member');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [willingToPay, setWillingToPay] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUserSettings();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadInvitations();
    } else if (activeTab === 'billing') {
      loadBillingInfo();
      loadInvoices();
    } else if (activeTab === 'feedback') {
      loadFeedback();
    }
  }, [activeTab]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('role, can_invite_users, can_manage_properties, can_manage_tenants, can_manage_finances, can_view_analytics')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserSettings(data);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const loadBillingInfo = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setBillingInfo(data);
    } catch (error) {
      console.error('Error loading billing info:', error);
    }
  };

  const loadInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newInviteEmail.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.from('user_invitations').insert([
        {
          inviter_id: user.id,
          invitee_email: newInviteEmail.toLowerCase().trim(),
          role: newInviteRole,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setSuccessMessage(t('settings.users.invite.success'));
      setNewInviteEmail('');
      setNewInviteRole('member');
      loadInvitations();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setErrorMessage('Fehler beim Versenden der Einladung.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
    }
  };

  const handleUpdateBillingInfo = async (updates: Partial<BillingInfo>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('billing_info')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      setSuccessMessage('Informationen erfolgreich aktualisiert');
      loadBillingInfo();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating billing info:', error);
      setErrorMessage('Fehler beim Aktualisieren der Informationen');
    }
  };

  const loadFeedback = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedback.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.from('user_feedback').insert([
        {
          user_id: user.id,
          feedback_text: newFeedback.trim(),
          willing_to_pay: willingToPay,
          payment_amount: willingToPay ? paymentAmount.trim() : null,
        },
      ]);

      if (error) throw error;

      setSuccessMessage(t('settings.feedback.success'));
      setNewFeedback('');
      setWillingToPay(false);
      setPaymentAmount('');
      loadFeedback();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      setErrorMessage('Fehler beim Senden des Feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            <Loader className="w-3 h-3" />
            {t('settings.users.pending')}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
            <Check className="w-3 h-3" />
            {t('settings.users.accepted')}
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
            <X className="w-3 h-3" />
            Abgelaufen
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: { label: t('settings.users.admin'), color: 'bg-blue-100 text-blue-700' },
      member: { label: t('settings.users.member'), color: 'bg-emerald-100 text-emerald-700' },
      viewer: { label: t('settings.users.viewer'), color: 'bg-slate-100 text-slate-700' },
    };

    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.member;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 ${roleInfo.color} rounded text-xs font-medium`}>
        <Shield className="w-3 h-3" />
        {roleInfo.label}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planMap = {
      free: { label: t('settings.plan.free'), color: 'bg-slate-100 text-slate-700' },
      pro: { label: t('settings.plan.pro'), color: 'bg-blue-100 text-blue-700' },
      enterprise: { label: t('settings.plan.enterprise'), color: 'bg-purple-100 text-purple-700' },
    };

    const planInfo = planMap[plan as keyof typeof planMap] || planMap.free;

    return (
      <span className={`inline-flex items-center px-3 py-1.5 ${planInfo.color} rounded-lg text-sm font-semibold`}>
        {planInfo.label}
      </span>
    );
  };

  const getFeedbackStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: t('settings.feedback.status.pending'), color: 'bg-amber-100 text-amber-700' },
      reviewed: { label: t('settings.feedback.status.reviewed'), color: 'bg-blue-100 text-blue-700' },
      planned: { label: t('settings.feedback.status.planned'), color: 'bg-purple-100 text-purple-700' },
      implemented: { label: t('settings.feedback.status.implemented'), color: 'bg-emerald-100 text-emerald-700' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;

    return (
      <span className={`inline-flex items-center px-2 py-1 ${statusInfo.color} rounded text-xs font-medium`}>
        {statusInfo.label}
      </span>
    );
  };

  const canInviteUsers = userSettings?.can_invite_users || userSettings?.role === 'admin';

  const tabs = [
    { id: 'profile' as const, label: t('settings.profile'), icon: User },
    { id: 'users' as const, label: t('settings.users'), icon: Users, show: canInviteUsers },
    { id: 'billing' as const, label: t('settings.billing'), icon: CreditCard },
    { id: 'feedback' as const, label: t('settings.feedback.title'), icon: MessageCircle },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-slate-600">
          {language === 'de' ? 'Verwalten Sie Ihre Einstellungen und Präferenzen.' : 'Manage your settings and preferences.'}
        </p>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-1">
          {tabs.filter(tab => tab.show !== false).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('settings.profile')}</h3>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('settings.email')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
              />
              <p className="text-sm text-slate-500 mt-1">
                {language === 'de' ? 'Ihre E-Mail-Adresse kann derzeit nicht geändert werden.' : 'Your email address cannot be changed currently.'}
              </p>
            </div>

            {userSettings && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.users.role')}
                </label>
                <div>
                  {getRoleBadge(userSettings.role)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('settings.language')}
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLanguage('de')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    language === 'de'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Deutsch
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {language === 'de' ? 'Aktive Benutzer' : 'Active Users'}
                </h3>
                <p className="text-slate-600 text-sm">
                  {language === 'de'
                    ? `Sie haben ${invitations.filter(i => i.status === 'accepted').length + 1} aktive Benutzer (inklusive Ihres Accounts)`
                    : `You have ${invitations.filter(i => i.status === 'accepted').length + 1} active users (including your account)`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">
                  {invitations.filter(i => i.status === 'accepted').length + 1}
                </div>
                <div className="text-sm text-slate-600">
                  {language === 'de' ? 'Benutzer' : 'Users'}
                </div>
              </div>
            </div>
          </div>

          {canInviteUsers && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.users.invite')}</h3>

              {successMessage && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      placeholder={language === 'de' ? 'benutzer@beispiel.de' : 'user@example.com'}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="admin">{t('settings.users.admin')}</option>
                    <option value="member">{t('settings.users.member')}</option>
                    <option value="viewer">{t('settings.users.viewer')}</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (language === 'de' ? 'Senden...' : 'Sending...') : t('settings.users.invite.button')}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">{language === 'de' ? 'Hinweis:' : 'Note:'}</span>{' '}
                  {language === 'de'
                    ? 'Eingeladene Benutzer sind derzeit kostenlos. In zukünftigen Versionen können pro zusätzlichem Benutzer Kosten anfallen.'
                    : 'Invited users are currently free. In future versions, additional costs may apply per user.'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {language === 'de' ? 'Einladungen' : 'Invitations'}
              </h3>
            </div>

            {invitations.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">
                  {language === 'de' ? 'Noch keine Einladungen' : 'No invitations yet'}
                </p>
                <p className="text-slate-500 text-sm">
                  {language === 'de'
                    ? 'Laden Sie Benutzer ein, um gemeinsam Immobilien zu verwalten.'
                    : 'Invite users to manage properties together.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {t('settings.users.email')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {t('settings.users.role')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {t('settings.users.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {language === 'de' ? 'Gesendet am' : 'Sent on'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {language === 'de' ? 'Läuft ab' : 'Expires'}
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                        {t('settings.users.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {invitation.invitee_email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getRoleBadge(invitation.role)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(invitation.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(invitation.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(invitation.expires_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canInviteUsers && (
                            <button
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              title={t('settings.users.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {language === 'de' ? 'Empfehlungscode einlösen' : 'Redeem Referral Code'}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              {language === 'de'
                ? 'Haben Sie einen Empfehlungscode? Lösen Sie ihn ein und erhalten Sie 20% Rabatt auf Ihr erstes Jahr!'
                : 'Have a referral code? Redeem it and get 20% off your first year!'}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const codeInput = form.elements.namedItem('referralCode') as HTMLInputElement;
                const code = codeInput.value.trim().toUpperCase();

                if (!code) return;

                try {
                  const { data: referrerSettings } = await supabase
                    .from('user_settings')
                    .select('user_id')
                    .eq('referral_code', code)
                    .maybeSingle();

                  if (!referrerSettings) {
                    setErrorMessage(language === 'de' ? 'Ungültiger Empfehlungscode' : 'Invalid referral code');
                    return;
                  }

                  const { error } = await supabase.from('user_referrals').insert({
                    referrer_id: referrerSettings.user_id,
                    referred_user_id: user!.id,
                    referral_code: code,
                    status: 'pending',
                  });

                  if (error) {
                    if (error.code === '23505') {
                      setErrorMessage(language === 'de' ? 'Sie haben bereits einen Empfehlungscode eingelöst' : 'You have already redeemed a referral code');
                    } else {
                      throw error;
                    }
                  } else {
                    setSuccessMessage(language === 'de' ? 'Empfehlungscode erfolgreich eingelöst!' : 'Referral code redeemed successfully!');
                    codeInput.value = '';
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }
                } catch (error) {
                  console.error('Error redeeming referral code:', error);
                  setErrorMessage(language === 'de' ? 'Fehler beim Einlösen des Codes' : 'Error redeeming code');
                }
              }}
              className="flex gap-3"
            >
              <input
                name="referralCode"
                type="text"
                placeholder={language === 'de' ? 'CODE EINGEBEN' : 'ENTER CODE'}
                className="flex-1 px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase font-mono"
                maxLength={8}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                {language === 'de' ? 'Einlösen' : 'Redeem'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('settings.plan')}</h3>

            <div className="mb-6">
              <p className="text-slate-600 mb-4">{language === 'de' ? 'Ihr aktueller Tarif:' : 'Your current plan:'}</p>
              <SubscriptionStatus />
            </div>

            <div className="mt-8">
              <h4 className="text-md font-semibold text-slate-900 mb-4">
                {language === 'de' ? 'Verfügbare Tarife' : 'Available Plans'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stripeProducts.map((product) => (
                  <SubscriptionCard
                    key={product.priceId}
                    product={product}
                    isCurrentPlan={subscription?.price_id === product.priceId}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('settings.billing.company')}</h3>

            {successMessage && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                {successMessage}
              </div>
            )}

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.billing.name')}
                </label>
                <input
                  type="text"
                  value={billingInfo?.company_name || ''}
                  onChange={(e) => setBillingInfo({ ...billingInfo!, company_name: e.target.value })}
                  onBlur={() => handleUpdateBillingInfo({ company_name: billingInfo?.company_name })}
                  placeholder={language === 'de' ? 'Musterfirma GmbH' : 'Company Name Ltd.'}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.billing.vat')}
                </label>
                <input
                  type="text"
                  value={billingInfo?.vat_id || ''}
                  onChange={(e) => setBillingInfo({ ...billingInfo!, vat_id: e.target.value })}
                  onBlur={() => handleUpdateBillingInfo({ vat_id: billingInfo?.vat_id })}
                  placeholder="DE123456789"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.billing.address')}
                </label>
                <textarea
                  value={billingInfo?.billing_address || ''}
                  onChange={(e) => setBillingInfo({ ...billingInfo!, billing_address: e.target.value })}
                  onBlur={() => handleUpdateBillingInfo({ billing_address: billingInfo?.billing_address })}
                  placeholder={language === 'de' ? 'Musterstraße 123\n12345 Musterstadt\nDeutschland' : '123 Example St\n12345 Example City\nGermany'}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.billing.payment')}
                </label>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">
                    {billingInfo?.payment_method === 'none' || !billingInfo?.payment_method
                      ? (language === 'de' ? 'Noch keine Zahlungsart hinterlegt' : 'No payment method added yet')
                      : billingInfo?.payment_method}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{t('settings.billing.invoices')}</h3>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">
                  {language === 'de' ? 'Noch keine Rechnungen' : 'No invoices yet'}
                </p>
                <p className="text-slate-500 text-sm">
                  {language === 'de'
                    ? 'Ihre Rechnungen werden hier angezeigt, sobald Sie einen kostenpflichtigen Tarif buchen.'
                    : 'Your invoices will appear here once you subscribe to a paid plan.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {language === 'de' ? 'Rechnungsnummer' : 'Invoice Number'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {language === 'de' ? 'Datum' : 'Date'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        {language === 'de' ? 'Betrag' : 'Amount'}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                        {t('settings.users.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900 font-mono">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(invoice.invoice_date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                          {invoice.amount.toFixed(2)} {invoice.currency}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {invoice.status === 'paid' ? (language === 'de' ? 'Bezahlt' : 'Paid') : (language === 'de' ? 'Offen' : 'Open')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {invoice.invoice_pdf_url && (
                            <a
                              href={invoice.invoice_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {language === 'de' ? 'PDF anzeigen' : 'View PDF'}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('settings.feedback.title')}</h3>
              <p className="text-slate-600 text-sm">{t('settings.feedback.description')}</p>
            </div>

            {successMessage && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.feedback.idea')}
                </label>
                <textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder={t('settings.feedback.idea.placeholder')}
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('settings.feedback.willing_to_pay')}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="willingToPay"
                      checked={willingToPay === true}
                      onChange={() => setWillingToPay(true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{t('settings.feedback.willing_to_pay.yes')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="willingToPay"
                      checked={willingToPay === false}
                      onChange={() => setWillingToPay(false)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{t('settings.feedback.willing_to_pay.no')}</span>
                  </label>
                </div>
              </div>

              {willingToPay && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('settings.feedback.amount')}
                  </label>
                  <input
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={t('settings.feedback.amount.placeholder')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? (language === 'de' ? 'Senden...' : 'Sending...') : t('settings.feedback.submit')}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">{t('settings.feedback.history')}</h3>
            </div>

            {feedbackList.length === 0 ? (
              <div className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">
                  {language === 'de' ? 'Noch kein Feedback eingereicht' : 'No feedback submitted yet'}
                </p>
                <p className="text-slate-500 text-sm">
                  {language === 'de'
                    ? 'Teilen Sie uns Ihre Ideen und Vorschläge mit.'
                    : 'Share your ideas and suggestions with us.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {feedbackList.map((feedback) => (
                  <div key={feedback.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-slate-900 whitespace-pre-wrap">{feedback.feedback_text}</p>
                      </div>
                      <div className="ml-4">
                        {getFeedbackStatusBadge(feedback.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{new Date(feedback.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}</span>
                      {feedback.willing_to_pay && feedback.payment_amount && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {feedback.payment_amount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
