import { useState } from "react";
import {
  Banknote,
  ArrowRight,
  Check,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { StatusBadge } from "../common/BaseTable";

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  rejected_reason: string | null;
}

interface ReferralPayoutSectionProps {
  balance: number;
  payoutRequests: PayoutRequest[];
  onPayoutRequested: () => void;
}

export default function ReferralPayoutSection({
  balance,
  payoutRequests,
  onPayoutRequested,
}: ReferralPayoutSectionProps) {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [error, setError] = useState("");

  const canRequestPayout = balance >= 25;
  const hasPendingPayout = payoutRequests.some((p) => p.status === "pending");

  const handleRequestPayout = async () => {
    if (!user || !canRequestPayout || hasPendingPayout) return;

    if (!iban.trim() || !accountHolder.trim()) {
      setError("Bitte IBAN und Kontoinhaber angeben");
      return;
    }

    setRequesting(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("referral_payout_requests")
        .insert({
          user_id: user.id,
          amount: balance,
          iban: iban.replace(/\s/g, "").toUpperCase(),
          account_holder: accountHolder.trim(),
        });

      if (insertError) throw insertError;

      setShowForm(false);
      setIban("");
      setAccountHolder("");
      onPayoutRequested();
    } catch (err: any) {
      console.error("Error requesting payout:", err);
      setError(err.message || "Fehler bei der Auszahlungsanfrage");
    } finally {
      setRequesting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <StatusBadge type="warning" label="Ausstehend" icon={<Clock className="w-3 h-3" />} />;
      case "approved":
        return <StatusBadge type="info" label="Genehmigt" icon={<Check className="w-3 h-3" />} />;
      case "paid":
        return <StatusBadge type="success" label="Ausgezahlt" icon={<Check className="w-3 h-3" />} />;
      case "rejected":
        return <StatusBadge type="error" label="Abgelehnt" icon={<XCircle className="w-3 h-3" />} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EEF4FF] border border-[#DDE7FF] rounded-full flex items-center justify-center">
            <Banknote className="w-5 h-5 text-[#1e1e24]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark">Auszahlung</h3>
            <p className="text-xs text-gray-500">
              Auszahlung ab 25,00 EUR Guthaben moeglich
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-dark">{balance.toFixed(2)} EUR</p>
          <p className="text-xs text-gray-500">Verfuegbares Guthaben</p>
        </div>
      </div>

      {!showForm ? (
        <div className="flex items-center gap-4">
          {hasPendingPayout ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <Clock className="w-4 h-4" />
              Eine Auszahlungsanfrage wird aktuell bearbeitet
            </div>
          ) : canRequestPayout ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-primary-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <Banknote className="w-4 h-4" />
              Auszahlung anfordern
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
              <AlertTriangle className="w-4 h-4" />
              Mindestguthaben von 25,00 EUR fuer Auszahlung erforderlich
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-lg">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontoinhaber *
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Max Mustermann"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IBAN *
            </label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Auszahlungsbetrag: <strong>{balance.toFixed(2)} EUR</strong> (gesamtes verfuegbares Guthaben)
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRequestPayout}
              disabled={requesting}
              className="px-5 py-2.5 bg-primary-blue hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            >
              {requesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Auszahlung anfordern
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {payoutRequests.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Auszahlungshistorie</h4>
          <div className="space-y-2">
            {payoutRequests.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  {statusBadge(p.status)}
                  <span className="text-sm text-gray-600">
                    {new Date(p.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {p.rejected_reason && (
                    <span className="text-xs text-red-500">{p.rejected_reason}</span>
                  )}
                  <span className="text-sm font-semibold text-dark">{p.amount.toFixed(2)} EUR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
