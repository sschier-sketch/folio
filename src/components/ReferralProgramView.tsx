import { useState, useEffect } from "react";
import {
  Gift,
  Copy,
  Check,
  Users,
  Award,
  TrendingUp,
  Share2,
  Mail,
  Send,
  Calendar,
  Linkedin,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { BaseTable, StatusBadge, TableColumn } from "./common/BaseTable";

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

export default function ReferralProgramView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
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

  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      const [settingsRes, referralsRes, rewardsRes] = await Promise.all([
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
      ]);

      if (settingsRes.data) {
        setReferralCode(settingsRes.data.referral_code);
      }

      const referralsData = referralsRes.data || [];
      setReferrals(referralsData);

      const rewardsData = rewardsRes.data || [];
      setRewards(rewardsData);

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
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLinkedIn = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const text = encodeURIComponent(
      "Ich nutze rentab.ly für meine Immobilienverwaltung und bin begeistert! Mit meinem Empfehlungscode erhältst du 2 Monate PRO gratis. 🏘️"
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          Empfehlungsprogramm
        </h1>
        <p className="text-gray-600">
          Empfehlen Sie rentab.ly und erhalten Sie 2 Monate PRO gratis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-primary-blue rounded-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Ihr persönlicher Empfehlungscode
            </h2>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-white/70 text-sm mb-2">
                  Ihr Empfehlungscode:
                </p>
                <p className="text-3xl font-bold font-mono tracking-wider">
                  {referralCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" /> Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" /> Kopieren
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-6">
            <p className="text-white/70 text-sm mb-2">Empfehlungslink:</p>
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm font-mono bg-white/10 px-4 py-3 rounded-lg break-all">
                {window.location.origin}/signup?ref={referralCode}
              </p>
              <button
                onClick={handleCopyReferralLink}
                className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" /> Teilen
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleShareLinkedIn}
              className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Linkedin className="w-5 h-5" />
              Auf LinkedIn teilen
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">
              {stats.totalReferrals}
            </div>
            <div className="text-sm text-gray-600">Gesamt Empfehlungen</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">
              {stats.totalMonthsEarned}
            </div>
            <div className="text-sm text-white/80 mb-4">
              Verdiente Belohnungen (Monate)
            </div>
            <div className="pt-4 border-t border-white/20 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Aktiv
                </span>
                <span className="font-semibold">{stats.activeMonths} Monate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Verwendet
                </span>
                <span className="font-semibold">{stats.usedMonths} Monate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-blue" />
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
                Persönliche Nachricht (optional)
              </label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Fügen Sie eine persönliche Nachricht hinzu..."
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

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              Die E-Mail enthält Ihren persönlichen Empfehlungslink und eine
              Beschreibung der Vorteile von rentab.ly.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-dark">
              So funktioniert's
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Teilen Sie Ihren Code
                </h4>
                <p className="text-sm text-gray-600">
                  Teilen Sie Ihren persönlichen Empfehlungscode oder Link mit
                  Freunden und Kollegen.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Freunde registrieren sich
                </h4>
                <p className="text-sm text-gray-600">
                  Wenn sich Ihre Freunde mit Ihrem Code registrieren, erhalten
                  beide 2 Monate PRO gratis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Belohnungen werden aktiviert
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Basic Kunden:</strong> 2 Monate PRO werden sofort aktiviert
                  <br />
                  <strong>PRO Kunden:</strong> 2 Monate werden am Ende Ihrer Laufzeit hinzugefügt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
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
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm">
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
          ]}
          data={referrals}
          loading={false}
          emptyMessage="Noch keine Empfehlungen. Teilen Sie Ihren Empfehlungscode, um Ihre ersten Belohnungen zu verdienen."
        />
      </div>

      {rewards.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                      : "PRO Verlängerung"}
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
                header: "Läuft ab am",
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
