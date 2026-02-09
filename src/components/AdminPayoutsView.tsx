import { useState, useEffect } from "react";
import {
  DollarSign,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { BaseTable, StatusBadge } from "./common/BaseTable";
import { Button } from "./ui/Button";

interface PayoutRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  notes: string | null;
  transaction_id: string | null;
  processed_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  affiliate_code: string;
  affiliate_email: string;
  account_holder_name: string | null;
  iban: string | null;
}

export default function AdminPayoutsView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadPayoutRequests();
  }, []);

  const loadPayoutRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliate_payout_requests")
        .select(`
          *,
          affiliates!inner(
            affiliate_code,
            user_id
          ),
          affiliate_payout_methods(
            account_holder_name,
            iban
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = await Promise.all(
        (data || []).map(async (p: any) => {
          const { data: userData } = await supabase
            .from("auth.users")
            .select("email")
            .eq("id", p.affiliates.user_id)
            .maybeSingle();

          return {
            ...p,
            affiliate_code: p.affiliates.affiliate_code,
            affiliate_email: userData?.email || "Unknown",
            account_holder_name: p.affiliate_payout_methods?.[0]?.account_holder_name || null,
            iban: p.affiliate_payout_methods?.[0]?.iban || null,
          };
        })
      );

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
        .from("affiliate_payout_requests")
        .update({
          status: "paid",
          notes: notes || null,
          transaction_id: transactionId || null,
          processed_by: user!.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedPayout.id);

      if (error) throw error;

      const { data: commissions } = await supabase
        .from("affiliate_commissions")
        .select("id, commission_amount")
        .eq("affiliate_id", selectedPayout.affiliate_id)
        .eq("status", "available");

      if (commissions && commissions.length > 0) {
        const totalAmount = commissions.reduce((sum, c) => sum + c.commission_amount, 0);

        if (Math.abs(totalAmount - selectedPayout.amount) < 0.01) {
          await supabase
            .from("affiliate_commissions")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payout_request_id: selectedPayout.id,
            })
            .eq("affiliate_id", selectedPayout.affiliate_id)
            .eq("status", "available");
        }
      }

      alert("Auszahlung erfolgreich als bezahlt markiert");
      setShowProcessModal(false);
      setNotes("");
      setTransactionId("");
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
        .from("affiliate_payout_requests")
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
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payoutRequests
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

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
        <h1 className="text-3xl font-bold text-dark mb-2">Auszahlungs-Verwaltung</h1>
        <p className="text-gray-600">Verwalten Sie Affiliate-Auszahlungen</p>
      </div>

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
              key: "affiliate",
              header: "Affiliate",
              render: (payout: PayoutRequest) => (
                <div>
                  <div className="text-sm font-medium text-dark">
                    {payout.affiliate_email}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {payout.affiliate_code}
                  </div>
                </div>
              ),
            },
            {
              key: "amount",
              header: "Betrag",
              render: (payout: PayoutRequest) => (
                <span className="font-semibold text-dark text-lg">
                  {payout.amount.toFixed(2)} EUR
                </span>
              ),
            },
            {
              key: "banking",
              header: "Kontodaten",
              render: (payout: PayoutRequest) => (
                <div className="text-sm">
                  {payout.account_holder_name && (
                    <div className="text-gray-900">{payout.account_holder_name}</div>
                  )}
                  {payout.iban && (
                    <div className="text-gray-500 font-mono text-xs">{payout.iban}</div>
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
                if (payout.status === "processing") {
                  return <StatusBadge type="info" label="In Bearbeitung" />;
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
                {selectedPayout.amount.toFixed(2)} EUR
              </div>
              <div className="text-sm text-gray-600 mt-2">Affiliate</div>
              <div className="text-sm text-dark">{selectedPayout.affiliate_email}</div>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaktions-ID (optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="z.B. TXN-12345"
                />
              </div>
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
                  setTransactionId("");
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
