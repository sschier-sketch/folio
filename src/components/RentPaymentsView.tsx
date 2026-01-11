import { useState, useEffect } from "react";
import { Check, X, Filter, Lock, Building2, CheckCircle, XCircle, Coins, Bell } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import DunningView from "./finances/DunningView";
interface PartialPayment {
  amount: number;
  date: string;
  note?: string;
}

interface RentPayment {
  id: string;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  paid_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  partial_payments: PartialPayment[];
  notes: string;
  days_overdue?: number;
  dunning_level?: number;
  last_reminder_sent?: string | null;
  property: { name: string; address: string } | null;
  unit?: { unit_number: string } | null;
  rental_contract: {
    tenants: Array<{ first_name: string; last_name: string; email: string }>;
    rent_due_day: number;
  } | null;
}
export default function RentPaymentsView() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<"payments" | "dunning">("payments");
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "unpaid",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialDate, setPartialDate] = useState(new Date().toISOString().split('T')[0]);
  const [partialNote, setPartialNote] = useState("");
  useEffect(() => {
    loadData();
  }, [user]);
  useEffect(() => {
    if (properties.length > 0 && contracts.length > 0) {
      loadPayments();
    }
  }, [filterProperty, filterContract, filterStatus, startDate, endDate]);
  const loadData = async () => {
    if (!user) return;
    try {
      const [propertiesRes, contractsRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("user_id", user.id),
        supabase
          .from("rental_contracts")
          .select(
            ` id, property_id, properties(name), tenants!contract_id(first_name, last_name) `,
          )
          .eq("user_id", user.id)
          .order("contract_start", { ascending: false }),
      ]);
      setProperties(propertiesRes.data || []);
      setContracts(contractsRes.data || []);
      await loadPayments();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  const loadPayments = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("rent_payments")
        .select(
          `
          *,
          property:properties(name, address),
          unit:property_units(unit_number),
          rental_contract:rental_contracts(
            rent_due_day,
            tenants!contract_id(first_name, last_name, email)
          )
          `
        )
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });
      if (filterProperty !== "all") {
        query = query.eq("property_id", filterProperty);
      }
      if (filterContract !== "all") {
        query = query.eq("contract_id", filterContract);
      }
      if (filterStatus === "paid") {
        query = query.eq("payment_status", "paid");
      } else if (filterStatus === "unpaid") {
        query = query.in("payment_status", ["unpaid", "partial"]);
        if (!endDate) {
          const today = new Date().toISOString().split("T")[0];
          query = query.lte("due_date", today);
        }
      }
      if (startDate) {
        query = query.gte("due_date", startDate);
      }
      if (endDate) {
        query = query.lte("due_date", endDate);
      }
      const { data, error } = await query;
      if (error) throw error;

      const validPayments = (data || []).filter(payment =>
        payment.rental_contract?.tenants &&
        payment.rental_contract.tenants.length > 0
      );

      setPayments(validPayments);
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      const { error } = await supabase
        .from("rent_payments")
        .update({
          paid: true,
          paid_date: new Date().toISOString().split("T")[0],
          payment_status: 'paid',
          paid_amount: payment.amount
        })
        .eq("id", paymentId);
      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      alert("Fehler beim Markieren der Zahlung");
    }
  };
  const handleMarkAsUnpaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("rent_payments")
        .update({
          paid: false,
          paid_date: null,
          paid_amount: 0,
          payment_status: 'unpaid',
          partial_payments: []
        })
        .eq("id", paymentId);
      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error("Error marking payment as unpaid:", error);
      alert("Fehler beim Markieren der Zahlung");
    }
  };

  const handlePartialPayment = async () => {
    if (!selectedPayment || !partialAmount) return;

    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein");
      return;
    }

    const currentPaidAmount = selectedPayment.paid_amount || 0;
    const newPaidAmount = currentPaidAmount + amount;
    const remainingAmount = selectedPayment.amount;

    if (newPaidAmount > remainingAmount) {
      alert("Der Teilzahlungsbetrag überschreitet den ausstehenden Betrag");
      return;
    }

    try {
      const newPartialPayment: PartialPayment = {
        amount,
        date: partialDate,
        note: partialNote || undefined
      };

      const existingPartialPayments = selectedPayment.partial_payments || [];
      const updatedPartialPayments = [...existingPartialPayments, newPartialPayment];

      const newPaymentStatus = newPaidAmount >= remainingAmount ? 'paid' : 'partial';

      const { error } = await supabase
        .from("rent_payments")
        .update({
          paid_amount: newPaidAmount,
          payment_status: newPaymentStatus,
          paid: newPaymentStatus === 'paid',
          paid_date: newPaymentStatus === 'paid' ? partialDate : null,
          partial_payments: updatedPartialPayments
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      setShowPartialPaymentModal(false);
      setSelectedPayment(null);
      setPartialAmount("");
      setPartialDate(new Date().toISOString().split('T')[0]);
      setPartialNote("");
      loadPayments();
    } catch (error) {
      console.error("Error recording partial payment:", error);
      alert("Fehler beim Erfassen der Teilzahlung");
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const isOverdue = (payment: RentPayment) => {
    if (payment.paid) return false;
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 1;
  };

  const isPending = (payment: RentPayment) => {
    if (payment.paid) return false;
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= -1 && daysDiff <= 1;
  };

  const filteredPayments = payments;

  const totalPaid = filteredPayments
    .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

  const totalUnpaid = filteredPayments
    .filter((p) => isPending(p))
    .reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0);

  const totalOverdue = filteredPayments
    .filter((p) => isOverdue(p))
    .reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0);

  const totalAmount = filteredPayments
    .reduce((sum, p) => sum + Number(p.amount), 0);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        {" "}
        <div className="text-gray-400">Lade Mieteingänge...</div>{" "}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Mieteingänge</h1>
        <p className="text-gray-600">
          Verwalten Sie ausstehende und bezahlte Mieten
        </p>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "payments"
                  ? "text-primary-blue border-b-2 border-primary-blue"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Mieteingänge
              </div>
            </button>
            <button
              onClick={() => setActiveTab("dunning")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "dunning"
                  ? "text-primary-blue border-b-2 border-primary-blue"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Mahnwesen
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "payments" ? (
        <div className="space-y-6">{/* Existing content moved here */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Ausstehend</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalUnpaid)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Überfällig</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOverdue)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Bezahlt</div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalPaid)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Gesamt</div>
          <div className="text-2xl font-bold text-dark">
            {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-100">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-dark mb-2">
                Automatische Zahlungsüberwachung
              </h3>
              <p className="text-gray-600 mb-4">
                Mit dem Pro-Tarif können Sie Ihr Bankkonto verknüpfen und Mieteingänge automatisch überwachen.
                Sparen Sie Zeit und haben Sie Ihre Finanzen immer im Blick.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Automatische Zahlungsabgleich</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Echtzeit-Benachrichtigungen bei Zahlungseingang</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Mahnwesen für verspätete Zahlungen</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Detaillierte Zahlungshistorie und Berichte</span>
                </li>
              </ul>
              <a
                href="/subscription"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Jetzt auf Pro upgraden
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-dark">Filter</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Immobilie
            </label>
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mieter
            </label>
            <select
              value={filterContract}
              onChange={(e) => setFilterContract(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle</option>
              {contracts.map((contract: any) => (
                <option key={contract.id} value={contract.id}>
                  {contract.properties?.name} -{" "}
                  {contract.tenants
                    ?.map((t: any) => `${t.first_name} ${t.last_name}`)
                    .join(", ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "paid" | "unpaid")
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle</option>
              <option value="unpaid">Ausstehend</option>
              <option value="paid">Bezahlt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            Keine Mieteingänge gefunden. Mieteingänge werden automatisch
            generiert, wenn Sie Mietverträge anlegen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fälligkeitsdatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Immobilie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mieter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                      {formatDate(payment.due_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark">
                      {payment.property ? (
                        <>
                          <div className="font-medium">
                            {payment.property.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.property.address}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">
                          Keine Immobilie
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark">
                      {payment.rental_contract?.tenants &&
                      payment.rental_contract.tenants.length > 0 ? (
                        <div className="space-y-1">
                          {payment.rental_contract.tenants.map(
                            (tenant, idx) => (
                              <div key={idx}>
                                {tenant.first_name} {tenant.last_name}
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          Kein Mieter
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      {(payment.payment_status === 'partial' || payment.payment_status === 'paid') && payment.paid_amount > 0 && (
                        <div className="text-xs text-gray-500">
                          Bezahlt: {formatCurrency(payment.paid_amount || 0)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.payment_status === 'paid' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Bezahlt
                          </span>
                          {payment.paid_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(payment.paid_date)}
                            </div>
                          )}
                        </div>
                      ) : payment.payment_status === 'partial' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Check className="w-3 h-3" /> Teilzahlung
                        </span>
                      ) : isOverdue(payment) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <X className="w-3 h-3" /> Überfällig
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <X className="w-3 h-3" /> Ausstehend
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payment.payment_status === 'paid' ? (
                        <button
                          onClick={() => handleMarkAsUnpaid(payment.id)}
                          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
                          title="Als unbezahlt markieren"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Als unbezahlt markieren</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkAsPaid(payment.id)}
                            className="inline-flex items-center gap-1 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Als bezahlt markieren"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPartialPaymentModal(true);
                            }}
                            className="inline-flex items-center gap-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Teilzahlung erfassen"
                          >
                            <Coins className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPartialPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-xl font-bold text-dark">Teilzahlung erfassen</h3>
              <button
                onClick={() => {
                  setShowPartialPaymentModal(false);
                  setSelectedPayment(null);
                  setPartialAmount("");
                  setPartialNote("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fälligkeitsdatum:</span>
                  <span className="font-medium">{formatDate(selectedPayment.due_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gesamtbetrag:</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bereits gezahlt:</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.paid_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-600 font-medium">Noch offen:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(selectedPayment.amount - (selectedPayment.paid_amount || 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teilzahlungsbetrag *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsdatum *
                </label>
                <input
                  type="date"
                  value={partialDate}
                  onChange={(e) => setPartialDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notiz (optional)
                </label>
                <textarea
                  value={partialNote}
                  onChange={(e) => setPartialNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Optionale Notiz zur Teilzahlung..."
                />
              </div>

              {selectedPayment.partial_payments && selectedPayment.partial_payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bisherige Teilzahlungen</h4>
                  <div className="space-y-2">
                    {selectedPayment.partial_payments.map((pp, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">{formatDate(pp.date)}</span>
                        <span className="font-medium">{formatCurrency(pp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setShowPartialPaymentModal(false);
                  setSelectedPayment(null);
                  setPartialAmount("");
                  setPartialNote("");
                }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handlePartialPayment}
                disabled={!partialAmount || !partialDate}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Teilzahlung speichern
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      ) : (
        <DunningView payments={payments} onReloadPayments={loadPayments} />
      )}
    </div>
  );
}
