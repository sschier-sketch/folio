import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Users,
  TrendingUp,
  DollarSign,
  Linkedin,
  ExternalLink,
  CreditCard,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { BaseTable, StatusBadge } from "./common/BaseTable";

interface AffiliateStats {
  affiliateCode: string;
  totalReferrals: number;
  payingReferrals: number;
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  commissionRate: number;
  isBlocked: boolean;
}

interface Referral {
  id: string;
  status: string;
  created_at: string;
  first_payment_at: string | null;
  lifetime_value: number;
}

interface Commission {
  id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  invoice_id: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  rejected_reason: string | null;
}

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    loadAffiliateData();
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) return;

    try {
      const [affiliateRes, referralsRes, commissionsRes, payoutsRes] = await Promise.all([
        supabase
          .from("affiliates")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("affiliate_referrals")
          .select("id, status, created_at, first_payment_at, lifetime_value")
          .eq("affiliate_id", (await supabase.from("affiliates").select("id").eq("user_id", user.id).maybeSingle()).data?.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliate_commissions")
          .select("id, commission_amount, status, created_at, invoice_id")
          .eq("affiliate_id", (await supabase.from("affiliates").select("id").eq("user_id", user.id).maybeSingle()).data?.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("affiliate_payout_requests")
          .select("id, amount, status, created_at, processed_at, rejected_reason")
          .eq("affiliate_id", (await supabase.from("affiliates").select("id").eq("user_id", user.id).maybeSingle()).data?.id)
          .order("created_at", { ascending: false }),
      ]);

      if (affiliateRes.data) {
        setStats({
          affiliateCode: affiliateRes.data.affiliate_code,
          totalReferrals: affiliateRes.data.total_referrals,
          payingReferrals: affiliateRes.data.paying_referrals,
          totalEarned: affiliateRes.data.total_earned,
          totalPaid: affiliateRes.data.total_paid,
          totalPending: affiliateRes.data.total_pending,
          commissionRate: affiliateRes.data.commission_rate,
          isBlocked: affiliateRes.data.is_blocked,
        });
      }

      setReferrals(referralsRes.data || []);
      setCommissions(commissionsRes.data || []);
      setPayoutRequests(payoutsRes.data || []);
    } catch (error) {
      console.error("Error loading affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stats?.affiliateCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLinkedIn = () => {
    const affiliateUrl = `${window.location.origin}/?ref=${stats?.affiliateCode}`;
    const text = encodeURIComponent(
      "Ich nutze rentab.ly für meine Immobilienverwaltung - eine moderne, benutzerfreundliche Lösung für Vermieter!"
    );
    const url = encodeURIComponent(affiliateUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank"
    );
  };


  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stats) return;

    const amount = parseFloat(payoutAmount);

    if (amount < 50) {
      alert("Mindestbetrag für Auszahlungen: 50 EUR");
      return;
    }

    if (amount > stats.totalPending) {
      alert("Betrag übersteigt verfügbares Guthaben");
      return;
    }

    setSubmittingPayout(true);

    try {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!affiliate) throw new Error("Affiliate not found");

      let payoutMethodId = null;

      const { data: existingMethod } = await supabase
        .from("affiliate_payout_methods")
        .select("id")
        .eq("affiliate_id", affiliate.id)
        .eq("iban", iban)
        .maybeSingle();

      if (existingMethod) {
        payoutMethodId = existingMethod.id;
      } else {
        const { data: newMethod, error: methodError } = await supabase
          .from("affiliate_payout_methods")
          .insert({
            affiliate_id: affiliate.id,
            method_type: "sepa",
            account_holder_name: accountHolder,
            iban: iban,
            is_default: true,
          })
          .select()
          .single();

        if (methodError) throw methodError;
        payoutMethodId = newMethod.id;
      }

      const { error: payoutError } = await supabase
        .from("affiliate_payout_requests")
        .insert({
          affiliate_id: affiliate.id,
          amount: amount,
          payout_method_id: payoutMethodId,
          status: "pending",
        });

      if (payoutError) throw payoutError;

      alert("Auszahlungsanfrage erfolgreich erstellt!");
      setShowPayoutModal(false);
      setPayoutAmount("");
      setIban("");
      setAccountHolder("");
      loadAffiliateData();
    } catch (error) {
      console.error("Error requesting payout:", error);
      alert("Fehler bei der Auszahlungsanfrage. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark mb-2">
          Affiliate-Profil nicht gefunden
        </h3>
        <p className="text-gray-600">
          Bitte kontaktieren Sie den Support, falls das Problem weiterhin besteht.
        </p>
      </div>
    );
  }

  if (stats.isBlocked) {
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
        <h1 className="text-3xl font-bold text-dark mb-2">Partner-Programm</h1>
        <p className="text-gray-600">
          Verdienen Sie {(stats.commissionRate * 100).toFixed(0)}% Provision auf jeden zahlenden
          geworbenen Nutzer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <h2 className="text-lg font-semibold text-dark">Ihr Partner-Code</h2>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-2">Partner-Code:</p>
                <p className="text-2xl font-bold font-mono tracking-wider text-dark">
                  {stats.affiliateCode}
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
            <div className="text-sm text-gray-600">Geworbene Nutzer</div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.payingReferrals} davon zahlend
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1e1e24]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">
              {stats.commissionRate * 100}%
            </div>
            <div className="text-sm text-gray-600">Provision</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#1e1e24]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {stats.totalEarned.toFixed(2)} EUR
          </div>
          <div className="text-sm text-gray-600">Gesamt verdient</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#1e1e24]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {stats.totalPending.toFixed(2)} EUR
          </div>
          <div className="text-sm text-gray-600">Verfügbar</div>
          {stats.totalPending >= 50 && (
            <button
              onClick={() => setShowPayoutModal(true)}
              className="mt-4 w-full bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Auszahlung anfordern
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-[#1e1e24]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {stats.totalPaid.toFixed(2)} EUR
          </div>
          <div className="text-sm text-gray-600">Ausgezahlt</div>
        </div>
      </div>

      {stats.totalPending < 50 && stats.totalPending > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Mindestbetrag noch nicht erreicht
              </p>
              <p className="text-sm text-blue-700">
                Auszahlungen sind ab 50 EUR möglich. Noch{" "}
                <strong>{(50 - stats.totalPending).toFixed(2)} EUR</strong> bis zur
                nächsten Auszahlung.
              </p>
            </div>
          </div>
        </div>
      )}

      {payoutRequests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-dark">Auszahlungsanfragen</h3>
          </div>
          <BaseTable
            columns={[
              {
                key: "amount",
                header: "Betrag",
                render: (payout: PayoutRequest) => (
                  <span className="font-semibold text-dark">
                    {payout.amount.toFixed(2)} EUR
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (payout: PayoutRequest) => {
                  if (payout.status === "pending") {
                    return <StatusBadge type="warning" label="Ausstehend" />;
                  }
                  if (payout.status === "processing") {
                    return <StatusBadge type="info" label="In Bearbeitung" />;
                  }
                  if (payout.status === "paid") {
                    return <StatusBadge type="success" label="Ausgezahlt" icon={<Check className="w-3 h-3" />} />;
                  }
                  if (payout.status === "rejected") {
                    return <StatusBadge type="error" label="Abgelehnt" />;
                  }
                  return null;
                },
              },
              {
                key: "created_at",
                header: "Angefordert am",
                render: (payout: PayoutRequest) => (
                  <span className="text-sm text-gray-600">
                    {new Date(payout.created_at).toLocaleDateString("de-DE")}
                  </span>
                ),
              },
              {
                key: "processed_at",
                header: "Bearbeitet am",
                render: (payout: PayoutRequest) => (
                  <span className="text-sm text-gray-600">
                    {payout.processed_at
                      ? new Date(payout.processed_at).toLocaleDateString("de-DE")
                      : "-"}
                  </span>
                ),
              },
            ]}
            data={payoutRequests}
            loading={false}
          />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-dark">Geworbene Nutzer</h3>
        </div>
        <BaseTable
          columns={[
            {
              key: "status",
              header: "Status",
              render: (referral: Referral) => {
                if (referral.status === "paying") {
                  return (
                    <StatusBadge
                      type="success"
                      label="Zahlend"
                      icon={<Check className="w-3 h-3" />}
                    />
                  );
                }
                if (referral.status === "registered") {
                  return <StatusBadge type="info" label="Registriert" />;
                }
                if (referral.status === "churned") {
                  return <StatusBadge type="neutral" label="Gekündigt" />;
                }
                return null;
              },
            },
            {
              key: "created_at",
              header: "Registriert am",
              render: (referral: Referral) => (
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(referral.created_at).toLocaleDateString("de-DE")}
                </span>
              ),
            },
            {
              key: "first_payment_at",
              header: "Erste Zahlung",
              render: (referral: Referral) => (
                <span className="text-sm text-gray-600">
                  {referral.first_payment_at
                    ? new Date(referral.first_payment_at).toLocaleDateString("de-DE")
                    : "-"}
                </span>
              ),
            },
            {
              key: "lifetime_value",
              header: "Umsatz",
              render: (referral: Referral) => (
                <span className="font-semibold text-dark">
                  {referral.lifetime_value.toFixed(2)} EUR
                </span>
              ),
            },
          ]}
          data={referrals}
          loading={false}
          emptyMessage="Noch keine geworbenen Nutzer. Teilen Sie Ihren Partner-Link!"
        />
      </div>

      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-dark mb-4">
              Auszahlung anfordern
            </h3>
            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betrag (EUR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="50"
                  max={stats.totalPending}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Mindestens 50 EUR"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Verfügbar: {stats.totalPending.toFixed(2)} EUR
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontoinhaber *
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN *
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent uppercase"
                  placeholder="DE89370400440532013000"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  Die Auszahlung wird manuell geprüft und innerhalb von 3-5 Werktagen
                  bearbeitet.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                  className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingPayout ? "Wird erstellt..." : "Anfordern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
