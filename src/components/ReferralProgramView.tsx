import { useState, useEffect } from "react";
import {
  Gift,
  Copy,
  Check,
  Users,
  Award,
  TrendingUp,
  Mail,
  Send,
  Linkedin,
  Clock,
  Banknote,
  ArrowUpRight,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { BaseTable, StatusBadge } from "./common/BaseTable";
import ReferralChart from "./referral/ReferralChart";
import ReferralPayoutSection from "./referral/ReferralPayoutSection";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalMonthsEarned: number;
  activeMonths: number;
  usedMonths: number;
}

interface Referral {
  id: string;
  referred_user_id: string | null;
  status: string;
  reward_earned: boolean;
  reward_months: number;
  cash_reward_eur: number;
  created_at: string;
  completed_at: string | null;
  reward_activated_at: string | null;
}

interface ReferralReward {
  id: string;
  reward_type: string;
  months_granted: number;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  rejected_reason: string | null;
}

export default function ReferralProgramView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalMonthsEarned: 0,
    activeMonths: 0,
    usedMonths: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPaidOut, setTotalPaidOut] = useState(0);

  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      const [settingsRes, referralsRes, rewardsRes, payoutsRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("referral_code")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_referrals")
          .select("*")
          .eq("referrer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("referral_rewards")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("referral_payout_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (settingsRes.data) {
        setReferralCode(settingsRes.data.referral_code);
      }

      const referralsData = (referralsRes.data || []) as Referral[];
      setReferrals(referralsData);

      const rewardsData = rewardsRes.data || [];
      setRewards(rewardsData);

      const payoutsData = (payoutsRes.data || []) as PayoutRequest[];
      setPayoutRequests(payoutsData);

      const totalReferrals = referralsData.length;
      const completedReferrals = referralsData.filter(
        (r) => r.status === "completed"
      ).length;
      const pendingReferrals = referralsData.filter(
        (r) => r.status === "pending"
      ).length;

      const totalMonthsEarned = rewardsData.reduce(
        (sum, r) => sum + r.months_granted,
        0
      );
      const activeMonths = rewardsData
        .filter((r) => r.status === "active")
        .reduce((sum, r) => sum + r.months_granted, 0);
      const usedMonths = rewardsData
        .filter((r) => r.status === "used" || r.status === "expired")
        .reduce((sum, r) => sum + r.months_granted, 0);

      setStats({
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalMonthsEarned,
        activeMonths,
        usedMonths,
      });

      const earned = referralsData
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + (r.cash_reward_eur || 10), 0);
      setTotalEarned(earned);

      const paidOut = payoutsData
        .filter((p) => p.status === "paid" || p.status === "approved")
        .reduce((sum, p) => sum + p.amount, 0);
      setTotalPaidOut(paidOut);

      setBalance(earned - paidOut);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLinkedIn = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const text = encodeURIComponent(
      "Ich nutze rentab.ly für meine Immobilienverwaltung und bin begeistert! Mit meinem Empfehlungscode erhältst du 2 Monate PRO gratis."
    );
    const url = encodeURIComponent(referralUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank"
    );
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientEmail) return;

    setSendingEmail(true);
    setEmailSent(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-referral-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipientEmail,
            recipientName: recipientName || undefined,
            message: personalMessage || undefined,
            language: "de",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }

      setEmailSent(true);
      setRecipientEmail("");
      setRecipientName("");
      setPersonalMessage("");

      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Fehler beim Versenden der Einladung. Bitte versuchen Sie es erneut.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark">
          Empfehlungsprogramm
        </h1>
        <p className="text-gray-400 mt-1">
          Empfehlen Sie rentab.ly und erhalten Sie 2 Monate PRO gratis + 10 EUR pro erfolgreiche Empfehlung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <h2 className="text-lg font-semibold text-dark">
              Ihr persoenlicher Empfehlungscode
            </h2>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-2">
                  Ihr Empfehlungscode:
                </p>
                <p className="text-2xl font-bold font-mono tracking-wider text-dark">
                  {referralCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Kopieren
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-600 text-xs mb-2">Ihr persoenlicher Empfehlungslink:</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReferralLink}
                className="flex-1 flex items-center gap-2 text-left group"
              >
                <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-mono text-primary-blue truncate group-hover:underline">
                  {referralUrl}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary-blue transition-colors" />
              </button>
              <button
                onClick={handleCopyReferralLink}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  linkCopied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Link kopieren
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleShareLinkedIn}
              className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Linkedin className="w-4 h-4" />
              Auf LinkedIn teilen
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1e1e24]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">
              {stats.totalReferrals}
            </div>
            <div className="text-sm text-gray-600">Gesamt Empfehlungen</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
                <Banknote className="w-5 h-5 text-[#1e1e24]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">
              {balance.toFixed(2)} EUR
            </div>
            <div className="text-sm text-gray-600">Aktuelles Guthaben</div>
            <div className="pt-3 mt-3 border-t border-gray-200 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Verdient</span>
                <span className="font-medium text-dark">{totalEarned.toFixed(2)} EUR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Ausgezahlt</span>
                <span className="font-medium text-dark">{totalPaidOut.toFixed(2)} EUR</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-[#1e1e24]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">
              {stats.totalMonthsEarned}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Verdiente Belohnungen (Monate)
            </div>
            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" /> Aktiv
                </span>
                <span className="font-semibold text-dark">{stats.activeMonths} Monate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-600">
                  <Check className="w-4 h-4" /> Verwendet
                </span>
                <span className="font-semibold text-dark">{stats.usedMonths} Monate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReferralPayoutSection
        balance={balance}
        payoutRequests={payoutRequests}
        onPayoutRequested={loadReferralData}
      />

      <ReferralChart referrals={referrals} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <h3 className="text-lg font-semibold text-dark">
              Freunde per E-Mail einladen
            </h3>
          </div>

          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
                placeholder="freund@beispiel.de"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Max Mustermann"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persoenliche Nachricht (optional)
              </label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Fuegen Sie eine persoenliche Nachricht hinzu..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendingEmail || !recipientEmail}
              className="w-full bg-primary-blue hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Wird gesendet...
                </>
              ) : emailSent ? (
                <>
                  <Check className="w-5 h-5" />
                  Einladung gesendet!
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Einladung senden
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              Die E-Mail enthaelt Ihren persoenlichen Empfehlungslink und eine
              Beschreibung der Vorteile von rentab.ly.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <h3 className="text-lg font-semibold text-dark">
              So funktioniert's
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center text-[#1e1e24] font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1 text-sm">
                  Teilen Sie Ihren Code
                </h4>
                <p className="text-sm text-gray-600">
                  Teilen Sie Ihren persoenlichen Empfehlungscode oder Link mit
                  Freunden und Kollegen.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center text-[#1e1e24] font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1 text-sm">
                  Freunde registrieren sich
                </h4>
                <p className="text-sm text-gray-600">
                  Wenn sich Ihre Freunde mit Ihrem Code registrieren, erhalten
                  beide 2 Monate PRO gratis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center text-[#1e1e24] font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1 text-sm">
                  Belohnungen & Guthaben
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>PRO Monate:</strong> 2 Monate werden sofort aktiviert
                  <br />
                  <strong>Guthaben:</strong> 10 EUR pro Empfehlung, auszahlbar ab 25 EUR
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-dark">
            Ihre Empfehlungen
          </h3>
        </div>
        <BaseTable
          columns={[
            {
              key: "status",
              header: "Status",
              render: (referral: Referral) =>
                referral.status === "completed" ? (
                  <StatusBadge
                    type="success"
                    label="Abgeschlossen"
                    icon={<Check className="w-3 h-3" />}
                  />
                ) : (
                  <StatusBadge
                    type="warning"
                    label="Ausstehend"
                    icon={<Clock className="w-3 h-3" />}
                  />
                ),
            },
            {
              key: "date",
              header: "Datum",
              render: (referral: Referral) => (
                <span className="text-sm text-gray-600">
                  {new Date(referral.created_at).toLocaleDateString("de-DE")}
                </span>
              ),
            },
            {
              key: "reward",
              header: "Belohnung",
              render: (referral: Referral) =>
                referral.reward_earned ? (
                  <span className="inline-flex items-center gap-1 text-primary-blue font-semibold text-sm">
                    <Award className="w-4 h-4" /> Verdient
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Ausstehend</span>
                ),
            },
            {
              key: "months",
              header: "Monate",
              render: (referral: Referral) =>
                referral.reward_earned ? (
                  <span className="font-semibold text-dark text-sm">
                    {referral.reward_months} Monate
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                ),
            },
            {
              key: "cash",
              header: "Guthaben",
              render: (referral: Referral) =>
                referral.status === "completed" ? (
                  <span className="font-semibold text-emerald-600 text-sm">
                    +{referral.cash_reward_eur || 10} EUR
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                ),
            },
          ]}
          data={referrals}
          loading={false}
          emptyMessage="Noch keine Empfehlungen. Teilen Sie Ihren Empfehlungscode, um Ihre ersten Belohnungen zu verdienen."
        />
      </div>

      {rewards.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-dark">
              Belohnungshistorie
            </h3>
          </div>
          <BaseTable
            columns={[
              {
                key: "type",
                header: "Typ",
                render: (reward: ReferralReward) => (
                  <span className="text-sm text-gray-900">
                    {reward.reward_type === "pro_upgrade"
                      ? "PRO Upgrade"
                      : "PRO Verlaengerung"}
                  </span>
                ),
              },
              {
                key: "months",
                header: "Monate",
                render: (reward: ReferralReward) => (
                  <span className="text-sm font-semibold text-dark">
                    {reward.months_granted} Monate
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (reward: ReferralReward) => {
                  if (reward.status === "active") {
                    return (
                      <StatusBadge
                        type="success"
                        label="Aktiv"
                        icon={<Check className="w-3 h-3" />}
                      />
                    );
                  }
                  if (reward.status === "used") {
                    return <StatusBadge type="neutral" label="Verwendet" />;
                  }
                  if (reward.status === "expired") {
                    return <StatusBadge type="error" label="Abgelaufen" />;
                  }
                  if (reward.status === "pending") {
                    return <StatusBadge type="warning" label="Ausstehend" />;
                  }
                  return null;
                },
              },
              {
                key: "activated_at",
                header: "Aktiviert am",
                render: (reward: ReferralReward) => (
                  <span className="text-sm text-gray-600">
                    {reward.activated_at
                      ? new Date(reward.activated_at).toLocaleDateString("de-DE")
                      : "-"}
                  </span>
                ),
              },
              {
                key: "expires_at",
                header: "Laeuft ab am",
                render: (reward: ReferralReward) => (
                  <span className="text-sm text-gray-600">
                    {reward.expires_at
                      ? new Date(reward.expires_at).toLocaleDateString("de-DE")
                      : "-"}
                  </span>
                ),
              },
            ]}
            data={rewards}
            loading={false}
          />
        </div>
      )}
    </div>
  );
}
