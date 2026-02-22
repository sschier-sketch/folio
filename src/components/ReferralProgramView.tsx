import { useState, useEffect } from "react";
import {
  Gift,
  Copy,
  Check,
  Users,
  Percent,
  TrendingUp,
  Mail,
  Send,
  Linkedin,
  Banknote,
  Link as LinkIcon,
  Code,
  AlertCircle,
  ChevronDown,
  BarChart3,
  Eye,
  ArrowLeft,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import ReferralChart from "./referral/ReferralChart";
import ReferralPayoutSection from "./referral/ReferralPayoutSection";
import ReferralAnalytics from "./referral/ReferralAnalytics";
import ConversionFunnel from "./referral/ConversionFunnel";
import EnhancedReferredUsersTable from "./referral/EnhancedReferredUsersTable";
import { Button } from './ui/Button';

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
  const [commissionRate, setCommissionRate] = useState(0.25);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [payingReferrals, setPayingReferrals] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPaidOut, setTotalPaidOut] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalConversions, setTotalConversions] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  const [expertMode, setExpertMode] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [inviterDisplayName, setInviterDisplayName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewBody, setPreviewBody] = useState("");

  useEffect(() => {
    loadReferralData();
  }, [user]);

  useEffect(() => {
    if (referralCode && affiliateId) {
      loadAnalyticsSummary(referralCode, affiliateId);
    }
  }, [referralCode, affiliateId, user]);

  const loadAnalyticsSummary = async (code: string, affId: string) => {
    if (!user || !code) return;

    try {
      const { count: clickCount } = await supabase
        .from('referral_click_events')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code', code);

      const { data: affiliateData } = await supabase
        .from('affiliate_referrals')
        .select('id, status')
        .eq('affiliate_id', affId);

      const conversionCount = affiliateData?.filter((a: any) => a.status === 'paying').length || 0;

      setTotalClicks(clickCount ?? 0);
      setTotalConversions(conversionCount);
    } catch (error) {
      console.error('Error loading analytics summary:', error);
    }
  };

  const loadReferralData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from("account_profiles")
        .select("company_name, first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        if (profileData.company_name) {
          setInviterDisplayName(profileData.company_name);
        } else if (profileData.first_name || profileData.last_name) {
          setInviterDisplayName(`${profileData.first_name || ""} ${profileData.last_name || ""}`.trim());
        } else {
          setInviterDisplayName(user.email?.split("@")[0] || "");
        }
      } else {
        setInviterDisplayName(user.email?.split("@")[0] || "");
      }

      const [settingsRes, referralsRes, payoutsRes, affiliateRes] = await Promise.all([
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
          .from("referral_payout_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliates")
          .select("id, commission_rate, total_earned, total_paid, total_pending, is_blocked")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (settingsRes.data) {
        setReferralCode(settingsRes.data.referral_code);
      }

      if (affiliateRes.data) {
        if (affiliateRes.data.is_blocked) setIsBlocked(true);
        setAffiliateId(affiliateRes.data.id);
        setCommissionRate(affiliateRes.data.commission_rate || 0.25);
        setTotalEarned(Number(affiliateRes.data.total_earned) || 0);
        setTotalPaidOut(Number(affiliateRes.data.total_paid) || 0);
        setBalance(Number(affiliateRes.data.total_pending) || 0);

        const [userRefTotal, userRefPaying, affRefTotal, affRefPaying] = await Promise.all([
          supabase
            .from('user_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('referrer_id', user.id),
          supabase
            .from('user_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('referrer_id', user.id)
            .eq('status', 'completed'),
          supabase
            .from('affiliate_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('affiliate_id', affiliateRes.data.id),
          supabase
            .from('affiliate_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('affiliate_id', affiliateRes.data.id)
            .eq('status', 'paying'),
        ]);

        setTotalReferrals((userRefTotal.count ?? 0) + (affRefTotal.count ?? 0));
        setPayingReferrals((userRefPaying.count ?? 0) + (affRefPaying.count ?? 0));
      }

      const referralsData = (referralsRes.data || []) as Referral[];
      setReferrals(referralsData);

      const payoutsData = (payoutsRes.data || []) as PayoutRequest[];
      setPayoutRequests(payoutsData);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    const referralUrl = `${window.location.origin}/?ref=${referralCode}`;
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
    const referralUrl = `${window.location.origin}/?ref=${referralCode}&utm_source=linkedin&utm_medium=referral&utm_campaign=partner_program`;
    const text = encodeURIComponent(
      "Ich nutze rentab.ly für meine Immobilienverwaltung und bin begeistert! Teste es jetzt kostenlos:"
    );
    const url = encodeURIComponent(referralUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank"
    );
  };

  const handleShareEmail = () => {
    const referralUrl = `${window.location.origin}/?ref=${referralCode}&utm_source=email&utm_medium=referral&utm_campaign=partner_program`;
    const subject = encodeURIComponent('Entdecke rentab.ly - Die beste Immobilienverwaltung');
    const body = encodeURIComponent(
      `Hallo,\n\nIch nutze rentab.ly für meine Immobilienverwaltung und bin begeistert! Die Software macht die Verwaltung von Immobilien so viel einfacher.\n\nSchau es dir gerne an:\n${referralUrl}\n\nViel Erfolg!\n\nViele Grüße`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShowPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    const name = inviterDisplayName || user?.email?.split("@")[0] || "Ein Freund";
    const greeting = recipientName ? `Hallo ${recipientName},` : "Hallo,";
    const defaultBody = [
      greeting,
      "",
      `${name} empfiehlt Ihnen rentab.ly - die professionelle Lösung für Ihre Immobilienverwaltung.`,
      "",
      "Registrieren Sie sich jetzt und erhalten Sie 1 Monat PRO kostenlos!",
      ...(personalMessage ? ["", `Persönliche Nachricht: ${personalMessage}`] : []),
    ].join("\n");

    setPreviewSubject("Entdecke rentab.ly - Deine Immobilienverwaltung");
    setPreviewBody(defaultBody);
    setShowPreview(true);
  };

  const handleSendInvitation = async () => {
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
            language: "de",
            appUrl: window.location.origin,
            customSubject: previewSubject,
            customBodyText: previewBody,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }

      setEmailSent(true);
      setShowPreview(false);
      setRecipientEmail("");
      setRecipientName("");
      setPersonalMessage("");
      setPreviewSubject("");
      setPreviewBody("");

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

  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;

  if (isBlocked) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Partner-Konto gesperrt
        </h3>
        <p className="text-red-700">
          Ihr Partner-Konto wurde gesperrt. Bitte kontaktieren Sie den Support für weitere Informationen.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark">
          Empfehlungsprogramm
        </h1>
        <p className="text-gray-400 mt-1">
          Empfehlen Sie rentab.ly und verdienen Sie {Math.round(commissionRate * 100)}% wiederkehrende Provision auf die Abogebuehren geworbener Nutzer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-[#1e1e24]" />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {Math.round(commissionRate * 100)}% Provision
            </span>
          </div>
          <div className="text-2xl font-bold text-dark mb-0.5">
            {totalReferrals}
          </div>
          <div className="text-sm text-gray-600">Gesamt Empfehlungen</div>
          <div className="pt-2 mt-2 border-t border-gray-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Davon zahlend</span>
              <span className="font-medium text-dark">{payingReferrals}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Banknote className="w-4 h-4 text-[#1e1e24]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-dark mb-0.5">
            {balance.toFixed(2)} EUR
          </div>
          <div className="text-sm text-gray-600">Aktuelles Guthaben</div>
          <div className="pt-2 mt-2 border-t border-gray-200 space-y-1 text-xs">
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

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Percent className="w-4 h-4 text-[#1e1e24]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-dark mb-0.5">
            {Math.round(commissionRate * 100)}%
          </div>
          <div className="text-sm text-gray-600">Ihre Provision</div>
          <div className="pt-2 mt-2 border-t border-gray-200 text-xs text-gray-500">
            Wiederkehrend auf jede Abo-Zahlung Ihrer geworbenen Nutzer
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <h2 className="text-lg font-semibold text-dark">
              Empfehlungscode & Link
            </h2>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 text-xs font-medium mb-1.5">
              Ihr persoenlicher Empfehlungslink:
            </p>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 mb-3 min-w-0 overflow-hidden">
              <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs font-mono text-gray-700 truncate">
                {referralUrl}
              </span>
            </div>
            <Button
              onClick={handleCopyReferralLink}
              variant="primary"
              fullWidth
              className={`py-2.5 flex items-center justify-center gap-2 text-sm shadow-sm ${linkCopied ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4" /> Link kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Link kopieren
                </>
              )}
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs mb-0.5">Empfehlungscode:</p>
                <p className="text-base font-bold font-mono tracking-wider text-dark">
                  {referralCode}
                </p>
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outlined"
                className="flex-shrink-0 px-3 py-1.5 flex items-center gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Kopiert
                  </>
                ) : (
                  <>
                    <Code className="w-3.5 h-3.5" /> Code
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShareLinkedIn}
              variant="primary"
              className="bg-[#0A66C2] hover:bg-[#004182] px-4 py-2 flex items-center justify-center gap-2 text-sm"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button
              onClick={handleShareEmail}
              variant="dark"
              className="px-4 py-2 flex items-center justify-center gap-2 text-sm"
            >
              <Mail className="w-4 h-4" />
              E-Mail
            </Button>
          </div>
        </div>

        <ReferralPayoutSection
          balance={balance}
          payoutRequests={payoutRequests}
          onPayoutRequested={loadReferralData}
        />
      </div>

      <div className="mb-8">
        <button
          onClick={() => setExpertMode(!expertMode)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {expertMode ? 'Standardansicht' : 'Expertenansicht'}
          <ChevronDown className={`w-4 h-4 transition-transform ${expertMode ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expertMode && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <ReferralAnalytics userId={user?.id || ''} />
            </div>
            <div>
              <ConversionFunnel
                clicks={totalClicks}
                signups={totalReferrals}
                conversions={totalConversions}
              />
            </div>
          </div>

          <ReferralChart referrals={referrals} />
        </>
      )}

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

          {!showPreview ? (
            <>
              <form onSubmit={handleShowPreview} className="space-y-4">
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
                    Name des Bekannten (optional)
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

                <Button
                  type="submit"
                  disabled={!recipientEmail}
                  variant="primary"
                  fullWidth
                >
                  {emailSent ? (
                    <>
                      <Check className="w-5 h-5" />
                      Einladung gesendet!
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Vorschau anzeigen
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  Im nächsten Schritt sehen Sie eine Vorschau der E-Mail und
                  können den Text vor dem Versand noch anpassen.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="text-sm text-gray-500">
                  An: <span className="font-medium text-dark">{recipientEmail}</span>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betreff
                </label>
                <input
                  type="text"
                  value={previewSubject}
                  onChange={(e) => setPreviewSubject(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nachricht
                </label>
                <textarea
                  value={previewBody}
                  onChange={(e) => setPreviewBody(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm leading-relaxed"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Referral-Link in der E-Mail:</p>
                <p className="text-xs font-mono text-gray-700 break-all">{referralUrl}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outlined"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Zurück
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={sendingEmail || !previewSubject || !previewBody}
                  variant="primary"
                  className="flex-1"
                >
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Jetzt senden
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
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
                  Teilen Sie Ihren Link
                </h4>
                <p className="text-sm text-gray-600">
                  Teilen Sie Ihren persoenlichen Empfehlungslink mit
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
                  Nutzer abonnieren PRO
                </h4>
                <p className="text-sm text-gray-600">
                  Wenn geworbene Nutzer ein kostenpflichtiges Abo abschliessen,
                  beginnt Ihre Provision.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center text-[#1e1e24] font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1 text-sm">
                  {Math.round(commissionRate * 100)}% wiederkehrende Provision
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Monatlich:</strong> {Math.round(commissionRate * 100)}% jeder monatlichen Abo-Zahlung
                  <br />
                  <strong>Jaehrlich:</strong> {Math.round(commissionRate * 100)}% der Jahressumme bei Zahlung
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EnhancedReferredUsersTable userId={user?.id || ''} />
    </div>
  );
}
