import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, Award, TrendingUp, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
}

interface Referral {
  id: string;
  referred_user_id: string | null;
  status: string;
  reward_earned: boolean;
  created_at: string;
  completed_at: string | null;
}

export default function ReferralProgramView() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    rewardsEarned: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      const [settingsRes, referralsRes] = await Promise.all([
        supabase
          .from('user_settings')
          .select('referral_code')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_referrals')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (settingsRes.data) {
        setReferralCode(settingsRes.data.referral_code);
      }

      const referralsData = referralsRes.data || [];
      setReferrals(referralsData);

      const totalReferrals = referralsData.length;
      const completedReferrals = referralsData.filter((r) => r.status === 'completed').length;
      const pendingReferrals = referralsData.filter((r) => r.status === 'pending').length;
      const rewardsEarned = referralsData.filter((r) => r.reward_earned).length;

      setStats({
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        rewardsEarned,
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralCode = () => {
    const referralUrl = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Empfehlungsprogramm</h1>
        <p className="text-gray-400">Empfehlen Sie Rentab.ly und verdienen Sie Belohnungen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-primary-blue rounded-full p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Ihr persönlicher Empfehlungscode</h2>
          </div>

          <div className="bg-white/20 backdrop-blur rounded p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-primary-blue/20 text-sm mb-2">Ihr Empfehlungscode:</p>
                <p className="text-3xl font-bold font-mono tracking-wider">{referralCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Kopieren
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded p-6">
            <p className="text-primary-blue/20 text-sm mb-2">Empfehlungslink:</p>
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm font-mono bg-white/10 px-4 py-2 rounded-lg break-all">
                {window.location.origin}/?ref={referralCode}
              </p>
              <button
                onClick={handleCopyReferralCode}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                Teilen
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">{stats.totalReferrals}</div>
            <div className="text-sm text-gray-400">Gesamt Empfehlungen</div>
          </div>

          <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-primary-blue" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">{stats.rewardsEarned}</div>
            <div className="text-sm text-gray-400">Verdiente Belohnungen</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-dark">So funktioniert's</h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">Teilen Sie Ihren Code</h4>
                <p className="text-sm text-gray-400">
                  Teilen Sie Ihren persönlichen Empfehlungscode oder Link mit Freunden und Kollegen.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">Freunde registrieren sich</h4>
                <p className="text-sm text-gray-400">
                  Wenn sich Ihre Freunde mit Ihrem Code registrieren, erhalten beide einen Bonus.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">Belohnungen erhalten</h4>
                <p className="text-sm text-gray-400">
                  Sobald Ihr Freund aktiv wird, erhalten Sie beide Ihre Belohnung.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-full p-6 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Ihre Vorteile</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <h4 className="font-semibold mb-2">Für jede erfolgreiche Empfehlung:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  1 Monat Premium kostenlos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Exklusive Features freischalten
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Prioritäts-Support
                </li>
              </ul>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <h4 className="font-semibold mb-2">Ihre Freunde erhalten:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  20% Rabatt auf das erste Jahr
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Kostenlose Onboarding-Session
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Ihre Empfehlungen</h3>
        </div>

        {referrals.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Noch keine Empfehlungen</p>
            <p className="text-gray-300 text-sm">
              Teilen Sie Ihren Empfehlungscode, um Ihre ersten Belohnungen zu verdienen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Datum</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Belohnung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {referral.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Abgeschlossen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          Ausstehend
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(referral.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {referral.reward_earned ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Award className="w-4 h-4" />
                          Verdient
                        </span>
                      ) : (
                        <span className="text-gray-300">Ausstehend</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-primary-blue/5 border border-blue-200 rounded-full p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Hinweis:</span> Das Empfehlungsprogramm befindet sich derzeit in der
          Beta-Phase. Die finalen Belohnungen und Konditionen werden vor dem offiziellen Launch bekanntgegeben.
        </p>
      </div>
    </div>
  );
}
