import { useState, useEffect } from "react";
import { Wallet, Plus, Lock, Calendar, Edit, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

interface TenantDepositTabProps {
  tenantId: string;
}

interface DepositHistory {
  id: string;
  transaction_date: string;
  amount: number;
  transaction_type: string;
  notes: string;
}

interface Contract {
  id: string;
  deposit_type: string;
  deposit_amount: number;
  deposit_status: string;
  deposit_notes: string;
  deposit_payment_type: string;
  deposit_due_date: string;
}

export default function TenantDepositTab({
  tenantId,
}: TenantDepositTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<DepositHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    deposit_type: "none",
    deposit_amount: "",
    deposit_payment_type: "transfer",
    deposit_due_date: "",
  });

  useEffect(() => {
    if (user && tenantId) {
      loadData();
    }
  }, [user, tenantId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: contractData } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractData) {
        setContract(contractData);
        setEditData({
          deposit_type: contractData.deposit_type || "none",
          deposit_amount: contractData.deposit_amount?.toString() || "0",
          deposit_payment_type: contractData.deposit_payment_type || "transfer",
          deposit_due_date: contractData.deposit_due_date || "",
        });

        const { data: historyData } = await supabase
          .from("deposit_history")
          .select("*")
          .eq("contract_id", contractData.id)
          .order("transaction_date", { ascending: false });

        if (historyData) setHistory(historyData);
      }
    } catch (error) {
      console.error("Error loading deposit data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDeposit() {
    if (!contract || !user) return;

    try {
      const { error } = await supabase
        .from("rental_contracts")
        .update({
          deposit_type: editData.deposit_type,
          deposit_amount: parseFloat(editData.deposit_amount) || 0,
          deposit: parseFloat(editData.deposit_amount) || 0,
          deposit_payment_type: editData.deposit_payment_type,
          deposit_due_date: editData.deposit_due_date || null,
          deposit_status: editData.deposit_type === "none" ? "complete" : (parseFloat(editData.deposit_amount) > 0 ? "open" : "complete"),
        })
        .eq("id", contract.id);

      if (error) throw error;

      setIsEditing(false);
      await loadData();
      alert("Kautionsdaten erfolgreich aktualisiert");
    } catch (error) {
      console.error("Error updating deposit:", error);
      alert("Fehler beim Aktualisieren der Kautionsdaten");
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Offen";
      case "partial":
        return "Teilweise";
      case "complete":
        return "Vollständig";
      case "returned":
        return "Zurückgezahlt";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-emerald-100 text-emerald-700";
      case "partial":
        return "bg-amber-100 text-amber-700";
      case "returned":
        return "bg-blue-100 text-blue-700";
      case "open":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "payment":
        return "Einzahlung";
      case "partial_return":
        return "Teilrückzahlung";
      case "full_return":
        return "Vollständige Rückzahlung";
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-400">Kein Mietvertrag vorhanden</p>
      </div>
    );
  }

  const totalPaid = history
    .filter((h) => h.transaction_type === "payment")
    .reduce((sum, h) => sum + h.amount, 0);

  const totalReturned = history
    .filter((h) =>
      ["partial_return", "full_return"].includes(h.transaction_type)
    )
    .reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark">
            Kautionsinformationen
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Bearbeiten
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadData();
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Abbrechen
              </button>
              <button
                onClick={handleSaveDeposit}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kautionsart *
              </label>
              <select
                value={editData.deposit_type}
                onChange={(e) =>
                  setEditData({ ...editData, deposit_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="none">Keine Kaution</option>
                <option value="cash">Bar</option>
                <option value="bank_transfer">Banküberweisung</option>
                <option value="pledged_savings">Verpfändetes Sparguthaben</option>
                <option value="bank_guarantee">Bankbürgschaft</option>
              </select>
            </div>

            {editData.deposit_type !== "none" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kautionsbetrag *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.deposit_amount}
                    onChange={(e) =>
                      setEditData({ ...editData, deposit_amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zahlungsart
                  </label>
                  <select
                    value={editData.deposit_payment_type}
                    onChange={(e) =>
                      setEditData({ ...editData, deposit_payment_type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="transfer">Überweisung</option>
                    <option value="cash">Bar</option>
                    <option value="guarantee">Bürgschaft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fälligkeitsdatum
                  </label>
                  <input
                    type="date"
                    value={editData.deposit_due_date}
                    onChange={(e) =>
                      setEditData({ ...editData, deposit_due_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Kautionsbetrag</div>
                <div className="text-2xl font-bold text-dark">
                  {contract.deposit_amount?.toFixed(2) || "0.00"} €
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                    contract.deposit_status
                  )}`}
                >
                  {getStatusLabel(contract.deposit_status)}
                </span>
              </div>

              {isPremium && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Eingegangen</div>
                  <div className="text-2xl font-bold text-dark">
                    {totalPaid.toFixed(2)} €
                  </div>
                </div>
              )}
            </div>

            {contract.deposit_notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-400 mb-1">Notizen</div>
                <div className="text-sm text-gray-700">{contract.deposit_notes}</div>
              </div>
            )}
          </>
        )}
      </div>

      {!isPremium ? (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-dark mb-2">
              Premium-Funktion
            </h3>
            <p className="text-gray-600 mb-6">
              Die detaillierte Kautionshistorie ist im Pro-Tarif verfügbar.
              Upgrade jetzt für:
            </p>
            <div className="text-left space-y-2 mb-6">
              <div className="flex items-start gap-2">
                <Wallet className="w-5 h-5 text-primary-blue mt-0.5" />
                <span className="text-sm text-gray-600">
                  Vollständige Historie aller Transaktionen
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Wallet className="w-5 h-5 text-primary-blue mt-0.5" />
                <span className="text-sm text-gray-600">
                  Nachverfolgung von Teilzahlungen
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Wallet className="w-5 h-5 text-primary-blue mt-0.5" />
                <span className="text-sm text-gray-600">
                  Rückzahlungs-Workflow
                </span>
              </div>
            </div>
            <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              Jetzt upgraden
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark">
              Kautionshistorie
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              <Plus className="w-4 h-4" />
              Transaktion erfassen
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Keine Transaktionen vorhanden</p>
              <p className="text-sm text-gray-400">
                Erfassen Sie Zahlungen und Rückzahlungen der Kaution
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0"
                  >
                    <div
                      className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                        item.transaction_type === "payment"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(item.transaction_date).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.transaction_type === "payment"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {getTransactionLabel(item.transaction_type)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Betrag: {item.amount.toFixed(2)} €
                        </div>
                        {item.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          item.transaction_type === "payment"
                            ? "text-emerald-600"
                            : "text-blue-600"
                        }`}
                      >
                        {item.transaction_type === "payment" ? "+" : "-"}
                        {item.amount.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPaid > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">
                        Gesamt eingegangen
                      </div>
                      <div className="text-xl font-bold text-dark">
                        {totalPaid.toFixed(2)} €
                      </div>
                    </div>
                    {totalReturned > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-400">
                          Gesamt zurückgezahlt
                        </div>
                        <div className="text-xl font-bold text-dark">
                          {totalReturned.toFixed(2)} €
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
