import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  DollarSign,
  Ban,
  CheckCircle,
  Search,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { BaseTable, StatusBadge } from "./common/BaseTable";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: string;
  commission_rate: number;
  total_referrals: number;
  paying_referrals: number;
  total_earned: number;
  total_paid: number;
  total_pending: number;
  is_blocked: boolean;
  created_at: string;
  user_email?: string;
}

interface Referral {
  id: string;
  status: string;
  created_at: string;
  first_payment_at: string | null;
  lifetime_value: number;
  referred_user_email: string;
}

export default function AdminAffiliatesView() {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      const { data: affiliatesData, error } = await supabase
        .from("affiliates")
        .select(`
          *,
          user_email:user_id(email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (affiliatesData || []).map((a: any) => ({
        ...a,
        user_email: a.user_email?.[0]?.email || "Unknown",
      }));

      setAffiliates(formatted);
    } catch (error) {
      console.error("Error loading affiliates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferrals = async (affiliateId: string) => {
    try {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select(`
          *,
          referred_user_email:referred_user_id(email)
        `)
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((r: any) => ({
        ...r,
        referred_user_email: r.referred_user_email?.[0]?.email || "Unknown",
      }));

      setReferrals(formatted);
    } catch (error) {
      console.error("Error loading referrals:", error);
    }
  };

  const handleViewAffiliate = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    loadReferrals(affiliate.id);
  };

  const handleBlockAffiliate = async () => {
    if (!selectedAffiliate || !blockReason.trim()) return;

    setBlocking(true);

    try {
      const { error } = await supabase
        .from("affiliates")
        .update({
          is_blocked: true,
          status: "blocked",
          blocked_reason: blockReason,
          blocked_at: new Date().toISOString(),
        })
        .eq("id", selectedAffiliate.id);

      if (error) throw error;

      alert("Affiliate erfolgreich gesperrt");
      setShowBlockModal(false);
      setBlockReason("");
      loadAffiliates();
      setSelectedAffiliate(null);
    } catch (error) {
      console.error("Error blocking affiliate:", error);
      alert("Fehler beim Sperren des Affiliates");
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockAffiliate = async (affiliateId: string) => {
    if (!confirm("Affiliate wirklich entsperren?")) return;

    try {
      const { error } = await supabase
        .from("affiliates")
        .update({
          is_blocked: false,
          status: "active",
          blocked_reason: null,
          blocked_at: null,
        })
        .eq("id", affiliateId);

      if (error) throw error;

      alert("Affiliate erfolgreich entsperrt");
      loadAffiliates();
      if (selectedAffiliate?.id === affiliateId) {
        setSelectedAffiliate(null);
      }
    } catch (error) {
      console.error("Error unblocking affiliate:", error);
      alert("Fehler beim Entsperren des Affiliates");
    }
  };

  const filteredAffiliates = affiliates.filter(
    (a) =>
      a.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.affiliate_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter((a) => !a.is_blocked).length,
    totalEarned: affiliates.reduce((sum, a) => sum + a.total_earned, 0),
    totalPending: affiliates.reduce((sum, a) => sum + a.total_pending, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (selectedAffiliate) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setSelectedAffiliate(null)}
            className="text-primary-blue hover:underline flex items-center gap-2 mb-4"
          >
            ← Zurück zur Übersicht
          </button>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-2">
                  {selectedAffiliate.user_email}
                </h2>
                <p className="text-gray-600">
                  Code: <span className="font-mono font-bold">{selectedAffiliate.affiliate_code}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {selectedAffiliate.is_blocked ? (
                  <button
                    onClick={() => handleUnblockAffiliate(selectedAffiliate.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Entsperren
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBlockModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Sperren
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Geworbene Nutzer</div>
                <div className="text-2xl font-bold text-dark">
                  {selectedAffiliate.total_referrals}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedAffiliate.paying_referrals} zahlend
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Gesamt verdient</div>
                <div className="text-2xl font-bold text-dark">
                  {selectedAffiliate.total_earned.toFixed(2)} EUR
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Verfügbar</div>
                <div className="text-2xl font-bold text-dark">
                  {selectedAffiliate.total_pending.toFixed(2)} EUR
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Ausgezahlt</div>
                <div className="text-2xl font-bold text-dark">
                  {selectedAffiliate.total_paid.toFixed(2)} EUR
                </div>
              </div>
            </div>

            {selectedAffiliate.is_blocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Affiliate gesperrt</p>
                    <p className="text-sm text-red-700">
                      Grund: {selectedAffiliate.blocked_reason || "Kein Grund angegeben"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold text-dark mb-4">Geworbene Nutzer</h3>
            <BaseTable
              columns={[
                {
                  key: "email",
                  header: "E-Mail",
                  render: (referral: Referral) => (
                    <span className="text-sm text-gray-900">
                      {referral.referred_user_email}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (referral: Referral) => {
                    if (referral.status === "paying") {
                      return <StatusBadge type="success" label="Zahlend" />;
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
                  header: "Registriert",
                  render: (referral: Referral) => (
                    <span className="text-sm text-gray-600">
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
              emptyMessage="Keine geworbenen Nutzer"
            />
          </div>
        </div>

        {showBlockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-dark mb-4">Affiliate sperren</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund für Sperrung *
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
                  placeholder="Bitte geben Sie einen Grund an..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleBlockAffiliate}
                  disabled={blocking || !blockReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {blocking ? "Wird gesperrt..." : "Sperren"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Affiliate-Verwaltung</h1>
        <p className="text-gray-600">Verwalten Sie Partner und deren Provisionen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {totalStats.totalAffiliates}
          </div>
          <div className="text-sm text-gray-600">Gesamt Affiliates</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalStats.activeAffiliates} aktiv
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {totalStats.totalEarned.toFixed(2)} EUR
          </div>
          <div className="text-sm text-white/80">Gesamt Provisionen</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {totalStats.totalPending.toFixed(2)} EUR
          </div>
          <div className="text-sm text-white/80">Ausstehende Auszahlungen</div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {(totalStats.totalEarned - totalStats.totalPending).toFixed(2)} EUR
          </div>
          <div className="text-sm text-white/80">Ausgezahlt</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark">Alle Affiliates</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <BaseTable
          columns={[
            {
              key: "user_email",
              header: "E-Mail",
              render: (affiliate: Affiliate) => (
                <span className="text-sm font-medium text-dark">
                  {affiliate.user_email}
                </span>
              ),
            },
            {
              key: "affiliate_code",
              header: "Code",
              render: (affiliate: Affiliate) => (
                <span className="font-mono text-sm text-gray-900">
                  {affiliate.affiliate_code}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (affiliate: Affiliate) => {
                if (affiliate.is_blocked) {
                  return <StatusBadge type="error" label="Gesperrt" />;
                }
                if (affiliate.status === "active") {
                  return <StatusBadge type="success" label="Aktiv" />;
                }
                return <StatusBadge type="neutral" label={affiliate.status} />;
              },
            },
            {
              key: "referrals",
              header: "Geworbene",
              render: (affiliate: Affiliate) => (
                <span className="text-sm text-gray-900">
                  {affiliate.total_referrals} ({affiliate.paying_referrals} zahlend)
                </span>
              ),
            },
            {
              key: "earned",
              header: "Verdient",
              render: (affiliate: Affiliate) => (
                <span className="font-semibold text-dark">
                  {affiliate.total_earned.toFixed(2)} EUR
                </span>
              ),
            },
            {
              key: "pending",
              header: "Verfügbar",
              render: (affiliate: Affiliate) => (
                <span className="text-sm text-gray-900">
                  {affiliate.total_pending.toFixed(2)} EUR
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (affiliate: Affiliate) => (
                <button
                  onClick={() => handleViewAffiliate(affiliate)}
                  className="text-primary-blue hover:underline flex items-center gap-1"
                >
                  Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={filteredAffiliates}
          loading={false}
          emptyMessage="Keine Affiliates gefunden"
        />
      </div>
    </div>
  );
}
