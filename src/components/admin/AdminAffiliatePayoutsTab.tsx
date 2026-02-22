import { useState, useEffect } from "react";
import {
  DollarSign,
  Check,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { BaseTable, StatusBadge } from "../common/BaseTable";
import { Button } from "../ui/Button";

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  iban: string | null;
  account_holder: string | null;
  notes: string | null;
  processed_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  user_email: string;
  affiliate_code: string | null;
}

export default function AdminAffiliatePayoutsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadPayoutRequests();
  }, []);

  const loadPayoutRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("referral_payout_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const uniqueUserIds = [...new Set((data || []).map((p: any) => p.user_id))];

      const profileMap: Record<string, { email?: string; affiliate_code?: string }> = {};
      for (const uid of uniqueUserIds) {
        const [profileRes, affiliateRes] = await Promise.all([
          supabase
            .from("account_profiles")
            .select("email")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase
            .from("affiliates")
            .select("affiliate_code")
            .eq("user_id", uid)
            .maybeSingle(),
        ]);
        profileMap[uid] = {
          email: profileRes.data?.email || undefined,
          affiliate_code: affiliateRes.data?.affiliate_code || undefined,
        };
      }

      const formatted = (data || []).map((p: any) => ({
        ...p,
        user_email: profileMap[p.user_id]?.email || p.user_id,
        affiliate_code: profileMap[p.user_id]?.affiliate_code || null,
      }));

      setPayoutRequests(formatted);
    } catch (error) {
      console.error("Error loading payout requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("referral_payout_requests")
        .update({
          status: "paid",
          notes: notes || null,
          processed_by: user!.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedPayout.id);

      if (error) throw error;

      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", selectedPayout.user_id)
        .maybeSingle();

      if (affiliate) {
        const { data: commissions } = await supabase
          .from("affiliate_commissions")
          .select("id, commission_amount")
          .eq("affiliate_id", affiliate.id)
          .eq("status", "available");

        if (commissions && commissions.length > 0) {
          let remaining = selectedPayout.amount;
          const idsToMark: string[] = [];
          for (const c of commissions) {
            if (remaining <= 0) break;
            idsToMark.push(c.id);
            remaining -= c.commission_amount;
          }
          if (idsToMark.length > 0) {
            await supabase
              .from("affiliate_commissions")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
              })
              .in("id", idsToMark);
          }
        }
      }

      alert("Auszahlung erfolgreich als bezahlt markiert");
      setShowProcessModal(false);
      setNotes("");
      setSelectedPayout(null);
      loadPayoutRequests();
    } catch (error) {
      console.error("Error processing payout:", error);
      alert("Fehler beim Bearbeiten der Auszahlung");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayout = async () => {
    if (!selectedPayout || !rejectReason.trim()) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("referral_payout_requests")
        .update({
          status: "rejected",
          rejected_reason: rejectReason,
          processed_by: user!.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedPayout.id);

      if (error) throw error;

      alert("Auszahlung erfolgreich abgelehnt");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedPayout(null);
      loadPayoutRequests();
    } catch (error) {
      console.error("Error rejecting payout:", error);
      alert("Fehler beim Ablehnen der Auszahlung");
    } finally {
      setProcessing(false);
    }
  };

  const pendingPayouts = payoutRequests.filter((p) => p.status === "pending");
  const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaid = payoutRequests
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{pendingPayouts.length}</div>
          <div className="text-sm text-white/80 mb-2">Ausstehende Anfragen</div>
          <div className="text-sm font-semibold">{totalPending.toFixed(2)} EUR</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {payoutRequests.filter((p) => p.status === "paid").length}
          </div>
          <div className="text-sm text-white/80 mb-2">Ausgezahlt</div>
          <div className="text-sm font-semibold">{totalPaid.toFixed(2)} EUR</div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{payoutRequests.length}</div>
          <div className="text-sm text-white/80">Gesamt Anfragen</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-dark">Auszahlungsanfragen</h3>
        </div>
        <BaseTable
          columns={[
            {
              key: "user",
              header: "Benutzer",
              render: (payout: PayoutRequest) => (
                <div>
                  <div className="text-sm font-medium text-dark">
                    {payout.user_email}
                  </div>
                  {payout.affiliate_code && (
                    <div className="text-xs text-gray-500 font-mono">
                      {payout.affiliate_code}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "amount",
              header: "Betrag",
              render: (payout: PayoutRequest) => (
                <span className="font-semibold text-dark text-lg">
                  {Number(payout.amount).toFixed(2)} EUR
                </span>
              ),
            },
            {
              key: "banking",
              header: "Kontodaten",
              render: (payout: PayoutRequest) => (
                <div className="text-sm">
                  {payout.account_holder && (
                    <div className="text-gray-900">{payout.account_holder}</div>
                  )}
                  {payout.iban && (
                    <div className="text-gray-500 font-mono text-xs">{payout.iban}</div>
                  )}
                  {!payout.account_holder && !payout.iban && (
                    <span className="text-gray-400 text-xs">Keine Kontodaten</span>
                  )}
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (payout: PayoutRequest) => {
                if (payout.status === "pending") {
                  return <StatusBadge type="warning" label="Ausstehend" />;
                }
                if (payout.status === "paid") {
                  return (
                    <StatusBadge
                      type="success"
                      label="Ausgezahlt"
                      icon={<Check className="w-3 h-3" />}
                    />
                  );
                }
                if (payout.status === "rejected") {
                  return <StatusBadge type="error" label="Abgelehnt" />;
                }
                return null;
              },
            },
            {
              key: "created_at",
              header: "Angefordert",
              render: (payout: PayoutRequest) => (
                <span className="text-sm text-gray-600">
                  {new Date(payout.created_at).toLocaleDateString("de-DE")}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "center" as const,
              render: (payout: PayoutRequest) =>
                payout.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedPayout(payout);
                        setShowProcessModal(true);
                      }}
                      variant="primary"
                    >
                      Bezahlt
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedPayout(payout);
                        setShowRejectModal(true);
                      }}
                      variant="danger"
                    >
                      Ablehnen
                    </Button>
                  </div>
                ),
            },
          ]}
          data={payoutRequests}
          loading={false}
          emptyMessage="Keine Auszahlungsanfragen vorhanden"
        />
      </div>

      {showProcessModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-dark mb-4">
              Auszahlung als bezahlt markieren
            </h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Betrag</div>
              <div className="text-2xl font-bold text-dark">
                {Number(selectedPayout.amount).toFixed(2)} EUR
              </div>
              <div className="text-sm text-gray-600 mt-2">Benutzer</div>
              <div className="text-sm text-dark">{selectedPayout.user_email}</div>
              {selectedPayout.iban && (
                <>
                  <div className="text-sm text-gray-600 mt-2">IBAN</div>
                  <div className="text-sm text-dark font-mono">{selectedPayout.iban}</div>
                </>
              )}
              {selectedPayout.account_holder && (
                <>
                  <div className="text-sm text-gray-600 mt-2">Kontoinhaber</div>
                  <div className="text-sm text-dark">{selectedPayout.account_holder}</div>
                </>
              )}
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
                  placeholder="Interne Notizen..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowProcessModal(false);
                  setNotes("");
                  setSelectedPayout(null);
                }}
                variant="cancel"
                fullWidth
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleProcessPayout}
                disabled={processing}
                variant="primary"
                fullWidth
              >
                {processing ? "Wird bearbeitet..." : "Als bezahlt markieren"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-dark mb-4">Auszahlung ablehnen</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund für Ablehnung *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
                placeholder="Bitte geben Sie einen Grund an..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedPayout(null);
                }}
                variant="cancel"
                fullWidth
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleRejectPayout}
                disabled={processing || !rejectReason.trim()}
                variant="danger"
                fullWidth
              >
                {processing ? "Wird abgelehnt..." : "Ablehnen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
