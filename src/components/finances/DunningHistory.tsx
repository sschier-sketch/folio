import { useState, useEffect } from "react";
import { Clock, Mail, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface ReminderHistory {
  id: string;
  dunning_level: number;
  sent_at: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: string;
  error_message: string | null;
  rent_payment: {
    due_date: string;
    amount: number;
    property: {
      name: string;
    } | null;
    rental_contract: {
      tenants: Array<{ first_name: string; last_name: string }>;
    } | null;
  } | null;
}

export default function DunningHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReminderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<ReminderHistory | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("rent_payment_reminders")
        .select(`
          *,
          rent_payment:rent_payments (
            due_date,
            amount,
            property:properties (name),
            rental_contract:rental_contracts (
              tenants (first_name, last_name)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          label: "Stufe 1",
          title: "Freundliche Erinnerung",
          color: "bg-blue-100 text-blue-700",
          borderColor: "border-l-blue-500"
        };
      case 2:
        return {
          label: "Stufe 2",
          title: "Zahlungsaufforderung",
          color: "bg-amber-100 text-amber-700",
          borderColor: "border-l-amber-500"
        };
      case 3:
        return {
          label: "Stufe 3",
          title: "Mahnung",
          color: "bg-red-100 text-red-700",
          borderColor: "border-l-red-500"
        };
      default:
        return {
          label: "Unbekannt",
          title: "Unbekannt",
          color: "bg-gray-100 text-gray-700",
          borderColor: "border-l-gray-500"
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "bounced":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Mail className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Versendet";
      case "delivered":
        return "Zugestellt";
      case "failed":
        return "Fehlgeschlagen";
      case "bounced":
        return "Zurückgewiesen";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt Historie...</div>;
  }

  return (
    <div className="space-y-6">
      {history.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Erinnerungen versendet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {history.map((reminder) => {
              const levelInfo = getLevelInfo(reminder.dunning_level);
              const tenant = reminder.rent_payment?.rental_contract?.tenants?.[0];
              const tenantName = tenant
                ? `${tenant.first_name} ${tenant.last_name}`
                : "Unbekannt";
              const propertyName = reminder.rent_payment?.property?.name || "Unbekannt";

              return (
                <div
                  key={reminder.id}
                  className={`border-l-4 ${levelInfo.borderColor} p-6 hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => setSelectedReminder(reminder)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${levelInfo.color}`}>
                          {levelInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(reminder.sent_at)}
                        </span>
                      </div>

                      <h4 className="font-semibold text-dark mb-1">
                        {propertyName} - {tenantName}
                      </h4>

                      <p className="text-sm text-gray-600 mb-2">
                        An: {reminder.recipient_email}
                      </p>

                      <p className="text-sm font-medium text-gray-700">
                        {reminder.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(reminder.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusLabel(reminder.status)}
                      </span>
                    </div>
                  </div>

                  {reminder.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Fehler:</strong> {reminder.error_message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedReminder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-t-lg border-b border-gray-200">
              <h3 className="text-xl font-bold text-dark">Email-Details</h3>
              <button
                onClick={() => setSelectedReminder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Stufe</label>
                  <p className="font-medium">
                    {getLevelInfo(selectedReminder.dunning_level).title}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium">
                    {getStatusLabel(selectedReminder.status)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Versendet am</label>
                  <p className="font-medium">
                    {formatDate(selectedReminder.sent_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Empfänger</label>
                  <p className="font-medium">{selectedReminder.recipient_email}</p>
                </div>
              </div>

              {selectedReminder.rent_payment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm text-gray-500 mb-2 block">
                    Zahlungsdetails
                  </label>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Betrag:</strong>{" "}
                      {formatCurrency(selectedReminder.rent_payment.amount)}
                    </p>
                    <p>
                      <strong>Fällig am:</strong>{" "}
                      {new Date(
                        selectedReminder.rent_payment.due_date
                      ).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Betreff</label>
                <p className="font-medium bg-gray-50 p-3 rounded-lg">
                  {selectedReminder.subject}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Nachricht</label>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                  {selectedReminder.message}
                </div>
              </div>

              {selectedReminder.error_message && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <label className="text-sm text-red-700 font-semibold mb-1 block">
                    Fehlermeldung
                  </label>
                  <p className="text-sm text-red-600">
                    {selectedReminder.error_message}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => setSelectedReminder(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
