import { useState, useEffect } from "react";
import { Wallet, Plus, Calendar, Edit, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";

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
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editData, setEditData] = useState({
    deposit_type: "none",
    deposit_amount: "",
    deposit_status: "open",
    deposit_payment_date: "",
  });
  const [transactionData, setTransactionData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: "",
    transaction_type: "payment",
    notes: "",
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
          deposit_status: contractData.deposit_status || "open",
          deposit_payment_date: contractData.deposit_due_date || "",
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
          deposit_status: editData.deposit_type === "none" ? "complete" : editData.deposit_status,
          deposit_due_date: editData.deposit_payment_date || null,
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

  async function handleSaveTransaction() {
    if (!contract || !user) return;

    if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein");
      return;
    }

    try {
      const transactionAmount = parseFloat(transactionData.amount);
      const agreedDepositAmount = contract.deposit_amount || 0;

      const currentPaid = totalPaid - totalReturned;
      let newPaid = currentPaid;
      let newDepositStatus = contract.deposit_status;

      if (transactionData.transaction_type === "payment") {
        newPaid = currentPaid + transactionAmount;
        if (newPaid >= agreedDepositAmount) {
          newDepositStatus = "complete";
        } else {
          newDepositStatus = "partial";
        }
      } else if (transactionData.transaction_type === "partial_return") {
        newPaid = currentPaid - transactionAmount;
        if (newPaid <= 0) {
          newPaid = 0;
          newDepositStatus = "returned";
        }
      } else if (transactionData.transaction_type === "full_return") {
        newPaid = 0;
        newDepositStatus = "returned";
      }

      const { error } = await supabase.from("deposit_history").insert([
        {
          contract_id: contract.id,
          user_id: user.id,
          transaction_date: transactionData.transaction_date,
          amount: transactionAmount,
          transaction_type: transactionData.transaction_type,
          notes: transactionData.notes || null,
        },
      ]);

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("rental_contracts")
        .update({
          deposit_status: newDepositStatus,
        })
        .eq("id", contract.id);

      if (updateError) throw updateError;

      setShowTransactionModal(false);
      setTransactionData({
        transaction_date: new Date().toISOString().split('T')[0],
        amount: "",
        transaction_type: "payment",
        notes: "",
      });
      await loadData();
      alert("Transaktion erfolgreich erfasst");
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Fehler beim Erfassen der Transaktion");
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
      <div className="bg-white rounded-lg p-12 text-center">
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

  const currentDepositBalance = totalPaid - totalReturned;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark">
            Kautionsinformationen
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
              className="px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
            >
              Bearbeiten
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadData();
                }}
                style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                className="px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveDeposit}
                className="px-4 py-2 bg-[#008CFF] text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
              >
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
                    Vereinbarter Kautionsbetrag *
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
                    Status *
                  </label>
                  <select
                    value={editData.deposit_status}
                    onChange={(e) =>
                      setEditData({ ...editData, deposit_status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="open">Offen</option>
                    <option value="partial">Teilweise bezahlt</option>
                    <option value="complete">Vollständig bezahlt</option>
                    <option value="returned">Zurückgezahlt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bezahldatum
                  </label>
                  <input
                    type="date"
                    value={editData.deposit_payment_date}
                    onChange={(e) =>
                      setEditData({ ...editData, deposit_payment_date: e.target.value })
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
                <div className="text-sm text-gray-400 mb-1">Vereinbarter Kautionsbetrag</div>
                <div className="text-2xl font-bold text-dark">
                  {contract.deposit_amount?.toFixed(2) || "0.00"} €
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    contract.deposit_status
                  )}`}
                >
                  {getStatusLabel(contract.deposit_status)}
                </span>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Aktuell vorhandener Betrag</div>
                <div className="text-2xl font-bold text-dark">
                  {currentDepositBalance.toFixed(2)} €
                </div>
              </div>
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
        <PremiumUpgradePrompt featureKey="tenant_details_deposit" />
      ) : (
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark">
              Kautionshistorie
            </h3>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
            >
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
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-blue-900 mb-2">
              Hinweis zur rechtssicheren Verwahrung der Mietkaution
            </h4>
            <div className="text-sm text-blue-800 space-y-3">
              <p>
                Die vom Mieter geleistete Mietkaution dient ausschließlich der Absicherung berechtigter Ansprüche aus dem Mietverhältnis. Nach § 551 BGB ist der Vermieter verpflichtet, die Kaution getrennt von seinem eigenen Vermögen anzulegen.
              </p>
              <p>
                Die Kaution muss insolvenzsicher und zu dem für Spareinlagen mit dreimonatiger Kündigungsfrist üblichen Zinssatz verwahrt werden. Üblicherweise erfolgt dies auf einem separaten Kautionskonto (z. B. Mietkautionssparbuch oder Treuhandkonto) auf den Namen des Mieters bzw. als offenes Treuhandkonto.
              </p>
              <p className="font-medium">
                Durch die getrennte Anlage wird sichergestellt, dass die Kaution:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>im Falle einer Insolvenz des Vermieters geschützt ist,</li>
                <li>ausschließlich für Ansprüche aus dem konkreten Mietverhältnis verwendet wird,</li>
                <li>dem Mieter nach Beendigung des Mietverhältnisses ordnungsgemäß und verzinst zurückgezahlt werden kann, sofern keine berechtigten Forderungen bestehen.</li>
              </ul>
              <p className="text-blue-900 font-medium mt-3">
                Eine nicht ordnungsgemäße Verwahrung kann dazu führen, dass der Mieter die sofortige Rückzahlung der Kaution verlangen oder diese mit laufenden Mietzahlungen verrechnen darf.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-dark">Transaktion erfassen</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-300 hover:text-gray-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Datum *
                </label>
                <input
                  type="date"
                  value={transactionData.transaction_date}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      transaction_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Transaktionsart *
                </label>
                <select
                  value={transactionData.transaction_type}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      transaction_type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="payment">Einzahlung</option>
                  <option value="partial_return">Teilrückzahlung</option>
                  <option value="full_return">Vollständige Rückzahlung</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Betrag (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Notizen
                </label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Optional..."
                />
              </div>
            </div>

            <div className="border-t px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowTransactionModal(false)}
                style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveTransaction}
                className="flex-1 px-4 py-2 bg-[#008CFF] text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
