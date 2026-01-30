import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Send, CheckCircle, TrendingUp, Mail, FileText, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import DunningTemplates from "./DunningTemplates";
import DunningHistory from "./DunningHistory";

interface RentPayment {
  id: string;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  days_overdue: number;
  dunning_level: number;
  last_reminder_sent: string | null;
  property: { name: string; address: string } | null;
  rental_contract: {
    tenants: Array<{ first_name: string; last_name: string; email: string }>;
    rent_due_day: number;
  } | null;
  property_units?: { unit_number: string } | null;
}

interface DunningViewProps {
  payments: RentPayment[];
  onReloadPayments: () => void;
}

interface DunningStats {
  openItems: number;
  remindersSent: number;
  successfullyCollected: number;
}

interface DunningReminderHistory {
  id: string;
  dunning_level: number;
  sent_at: string;
  status: string;
}

export default function DunningView({ payments, onReloadPayments }: DunningViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "templates" | "history">("overview");
  const [stats, setStats] = useState<DunningStats>({
    openItems: 0,
    remindersSent: 0,
    successfullyCollected: 0,
  });
  const [remindersHistory, setRemindersHistory] = useState<Record<string, DunningReminderHistory[]>>({});
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [dunningDaysLevel1, setDunningDaysLevel1] = useState(7);
  const [dunningDaysLevel2, setDunningDaysLevel2] = useState(14);
  const [dunningDaysLevel3, setDunningDaysLevel3] = useState(28);

  useEffect(() => {
    calculateStats();
    loadRemindersHistory();
  }, [payments]);

  const calculateStats = () => {
    const openItems = payments.filter(p => !p.paid && p.days_overdue > 0).length;
    const successfullyCollected = payments.filter(p => p.paid && p.dunning_level > 0).length;

    setStats({
      openItems,
      remindersSent: 0,
      successfullyCollected,
    });
  };

  const loadRemindersHistory = async () => {
    if (!user || payments.length === 0) return;

    const paymentIds = payments.map(p => p.id);
    const { data } = await supabase
      .from("rent_payment_reminders")
      .select("*")
      .in("rent_payment_id", paymentIds)
      .order("sent_at", { ascending: false });

    if (data) {
      const grouped = data.reduce((acc: Record<string, DunningReminderHistory[]>, reminder: any) => {
        if (!acc[reminder.rent_payment_id]) {
          acc[reminder.rent_payment_id] = [];
        }
        acc[reminder.rent_payment_id].push(reminder);
        return acc;
      }, {});
      setRemindersHistory(grouped);

      const totalSent = data.length;
      setStats(prev => ({ ...prev, remindersSent: totalSent }));
    }
  };

  const getDunningLevel = (payment: RentPayment): number => {
    if (payment.paid || payment.days_overdue <= 0) return 0;

    if (payment.days_overdue >= dunningDaysLevel1 && payment.days_overdue < dunningDaysLevel2) return 1;
    if (payment.days_overdue >= dunningDaysLevel2 && payment.days_overdue < dunningDaysLevel3) return 2;
    if (payment.days_overdue >= dunningDaysLevel3) return 3;

    return 0;
  };

  const getDunningLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          label: "Stufe 1",
          color: "bg-blue-100 text-blue-700",
          borderColor: "border-blue-500",
          bgColor: "bg-blue-50",
          title: "Freundliche Erinnerung",
          description: "Höflicher Ton, Hinweis auf möglicherweise vergessene Überweisung."
        };
      case 2:
        return {
          label: "Stufe 2",
          color: "bg-amber-100 text-amber-700",
          borderColor: "border-amber-500",
          bgColor: "bg-amber-50",
          title: "Formelle Zahlungsaufforderung",
          description: "Formeller Ton, Fristsetzung, Hinweis auf mögliche Konsequenzen."
        };
      case 3:
        return {
          label: "Stufe 3",
          color: "bg-red-100 text-red-700",
          borderColor: "border-red-500",
          bgColor: "bg-red-50",
          title: "Mahnung",
          description: "Offizielle Mahnung mit Mahngebühren und rechtlichen Hinweisen."
        };
      default:
        return {
          label: "Erledigt",
          color: "bg-emerald-100 text-emerald-700",
          borderColor: "border-emerald-500",
          bgColor: "bg-emerald-50",
          title: "Zahlung eingegangen",
          description: "Ausstehende Miete wurde vollständig bezahlt."
        };
    }
  };

  const handleSendReminder = async (payment: RentPayment, level: number) => {
    if (!user || !payment.rental_contract?.tenants[0]?.email) {
      alert("Keine E-Mail-Adresse für den Mieter hinterlegt");
      return;
    }

    setSendingReminder(payment.id);

    try {
      const { data: template } = await supabase
        .from("dunning_email_templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("dunning_level", level)
        .single();

      if (!template) {
        alert("Kein Template gefunden. Bitte konfigurieren Sie die Email-Templates.");
        setSendingReminder(null);
        return;
      }

      const tenant = payment.rental_contract.tenants[0];
      const tenantEmail = tenant.email;
      const tenantName = `${tenant.first_name} ${tenant.last_name}`;
      const propertyName = payment.property?.name || "Ihre Immobilie";
      const unitNumber = payment.property_units?.unit_number || "";
      const propertyNameFull = `${propertyName}${unitNumber ? ` (Einheit ${unitNumber})` : ""}`;

      const mahngebuehr = 5.00;
      const outstandingAmount = payment.amount - payment.paid_amount;
      const totalAmount = outstandingAmount + mahngebuehr;

      let subject = template.subject
        .replace(/\[TENANT_NAME\]/g, tenantName)
        .replace(/\[PROPERTY_NAME\]/g, propertyNameFull)
        .replace(/\[AMOUNT\]/g, formatCurrency(outstandingAmount))
        .replace(/\[DUE_DATE\]/g, formatDate(payment.due_date))
        .replace(/\[TOTAL_AMOUNT\]/g, formatCurrency(totalAmount));

      let message = template.message
        .replace(/\[TENANT_NAME\]/g, tenantName)
        .replace(/\[PROPERTY_NAME\]/g, propertyNameFull)
        .replace(/\[AMOUNT\]/g, formatCurrency(outstandingAmount))
        .replace(/\[DUE_DATE\]/g, formatDate(payment.due_date))
        .replace(/\[TOTAL_AMOUNT\]/g, formatCurrency(totalAmount));

      const htmlBody = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}</style>
</head>
<body>
<table width="100%" style="background:#fff">
<tr><td align="center" style="padding:20px 0">
<table width="600" style="background:#faf8f8;border-radius:8px">
<tr><td style="padding:30px">
<table width="100%">
<tr><td align="center" style="padding-bottom:30px">
<a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a>
</td></tr></table>
<table width="100%">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">${subject}</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;white-space:pre-wrap">
${message}
</div>
<table width="100%">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: tenantEmail,
          subject,
          html: htmlBody,
          text: message
        })
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(`Email konnte nicht versendet werden: ${errorData.error || 'Unbekannter Fehler'}`);
      }

      const { data: reminderData, error: reminderError } = await supabase
        .from("rent_payment_reminders")
        .insert({
          user_id: user.id,
          rent_payment_id: payment.id,
          dunning_level: level,
          recipient_email: tenantEmail,
          subject,
          message,
          status: 'sent'
        })
        .select()
        .single();

      if (reminderError) throw reminderError;

      await supabase
        .from("rent_payments")
        .update({
          dunning_level: level,
          last_reminder_sent: new Date().toISOString()
        })
        .eq("id", payment.id);

      alert(`${level === 3 ? 'Mahnung' : 'Erinnerung'} wurde erfolgreich versendet`);

      onReloadPayments();
      loadRemindersHistory();
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Fehler beim Versenden der Erinnerung");
    } finally {
      setSendingReminder(null);
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

  const overduePayments = payments
    .filter(p => !p.paid && p.days_overdue > 0)
    .map(p => ({
      ...p,
      suggestedLevel: getDunningLevel(p)
    }))
    .sort((a, b) => b.days_overdue - a.days_overdue);

  const recentlyPaidAfterReminder = payments
    .filter(p => p.paid && p.dunning_level > 0)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-primary-blue border-b-2 border-primary-blue"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Übersicht
              </div>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "templates"
                  ? "text-primary-blue border-b-2 border-primary-blue"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Email-Templates
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "text-primary-blue border-b-2 border-primary-blue"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historie
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="bg-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center border border-[#DDE7FF]">
            <Bell className="w-6 h-6 text-[#1e1e24]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark">
              Intelligentes Mahnwesen
            </h3>
            <p className="text-sm text-gray-400">
              Automatische Erkennung und Eskalation offener Posten
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-3 border border-[#DDE7FF]">
              <AlertTriangle className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <div className="text-2xl font-bold text-dark mb-1">{stats.openItems}</div>
            <div className="text-sm text-gray-600">Offene Posten</div>
          </div>

          <div style={{ backgroundColor: "#eff4fe" }} className="rounded-lg p-4">
            <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-3 border border-[#DDE7FF]">
              <Send className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <div className="text-2xl font-bold text-dark mb-1">{stats.remindersSent}</div>
            <div className="text-sm text-gray-600">
              Erinnerungen versendet
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-3 border border-[#DDE7FF]">
              <CheckCircle className="w-5 h-5 text-[#1e1e24]" />
            </div>
            <div className="text-2xl font-bold text-dark mb-1">{stats.successfullyCollected}</div>
            <div className="text-sm text-gray-600">
              Erfolgreich eingezogen
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-dark mb-4">Mahnstufen-Konfiguration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stufe 1 ab Tag
              </label>
              <input
                type="number"
                min="1"
                value={dunningDaysLevel1}
                onChange={(e) => setDunningDaysLevel1(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stufe 2 ab Tag
              </label>
              <input
                type="number"
                min="1"
                value={dunningDaysLevel2}
                onChange={(e) => setDunningDaysLevel2(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stufe 3 ab Tag
              </label>
              <input
                type="number"
                min="1"
                value={dunningDaysLevel3}
                onChange={(e) => setDunningDaysLevel3(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Automatische Erkennung
        </h3>

        {overduePayments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-600">Keine offenen Posten gefunden</p>
            <p className="text-sm text-gray-400 mt-1">Alle Mieten sind auf dem neuesten Stand</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overduePayments.map((payment) => {
              const levelInfo = getDunningLevelInfo(payment.suggestedLevel);
              const tenant = payment.rental_contract?.tenants[0];
              const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unbekannt";
              const unitInfo = payment.property_units?.unit_number
                ? `Einheit ${payment.property_units.unit_number}`
                : payment.property?.name || "Unbekannt";
              const outstandingAmount = payment.amount - payment.paid_amount;

              return (
                <div
                  key={payment.id}
                  className={`border-l-4 ${levelInfo.borderColor} ${levelInfo.bgColor} rounded-r-lg p-4`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${payment.suggestedLevel === 3 ? 'text-red-600' : payment.suggestedLevel === 2 ? 'text-amber-600' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-dark">
                          {unitInfo} - {tenantName}
                        </h4>
                        <span className={`text-xs ${levelInfo.color} px-3 py-1 rounded-full font-medium`}>
                          {levelInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {payment.payment_status === 'partial' ? (
                          <>Teilzahlung erkannt: {formatCurrency(payment.paid_amount)} von {formatCurrency(payment.amount)} eingegangen. Fehlbetrag: {formatCurrency(outstandingAmount)}</>
                        ) : payment.days_overdue >= 30 ? (
                          <>Zahlung seit {Math.floor(payment.days_overdue / 30)} Monat{Math.floor(payment.days_overdue / 30) > 1 ? 'en' : ''} ausstehend. Gesamtbetrag: {formatCurrency(outstandingAmount)}</>
                        ) : (
                          <>Zahlung seit {payment.days_overdue} Tag{payment.days_overdue > 1 ? 'en' : ''} überfällig. Betrag: {formatCurrency(outstandingAmount)}</>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span>Fällig: {formatDate(payment.due_date)}</span>
                        {payment.last_reminder_sent && (
                          <>
                            <span>•</span>
                            <span>Letzte Erinnerung: {formatDate(payment.last_reminder_sent)}</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleSendReminder(payment, payment.suggestedLevel)}
                        disabled={sendingReminder === payment.id}
                        className={`text-sm font-medium hover:underline flex items-center gap-2 ${
                          payment.suggestedLevel === 3 ? 'text-red-600' :
                          payment.suggestedLevel === 2 ? 'text-amber-600' :
                          'text-primary-blue'
                        } disabled:opacity-50`}
                      >
                        <Mail className="w-4 h-4" />
                        {sendingReminder === payment.id ? (
                          'Wird gesendet...'
                        ) : payment.suggestedLevel === 3 ? (
                          'Mahnung versenden'
                        ) : payment.suggestedLevel === 2 ? (
                          'Zahlungsaufforderung senden'
                        ) : (
                          'Freundliche Erinnerung senden'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {recentlyPaidAfterReminder.map((payment) => {
              const tenant = payment.rental_contract?.tenants[0];
              const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unbekannt";
              const unitInfo = payment.property_units?.unit_number
                ? `Einheit ${payment.property_units.unit_number}`
                : payment.property?.name || "Unbekannt";
              const levelInfo = getDunningLevelInfo(0);

              return (
                <div
                  key={payment.id}
                  className={`border-l-4 ${levelInfo.borderColor} ${levelInfo.bgColor} rounded-r-lg p-4`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-dark">
                          {unitInfo} - {tenantName}
                        </h4>
                        <span className={`text-xs ${levelInfo.color} px-3 py-1 rounded-full font-medium`}>
                          {levelInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Nach {payment.dunning_level === 1 ? 'freundlicher Erinnerung' : payment.dunning_level === 2 ? 'Zahlungsaufforderung' : 'Mahnung'} wurde die ausstehende Miete vollständig bezahlt.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Eskalationsstufen (Standardwerte)
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
              <span className="text-sm font-semibold text-[#1e1e24]">
                1
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-dark mb-1">
                Freundliche Erinnerung
              </h4>
              <p className="text-sm text-gray-600">
                Automatisch nach 7 Tagen Zahlungsverzug. Höflicher Ton,
                Hinweis auf möglicherweise vergessene Überweisung.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
              <span className="text-sm font-semibold text-[#1e1e24]">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-dark mb-1">
                Formelle Zahlungsaufforderung
              </h4>
              <p className="text-sm text-gray-600">
                Nach 14 Tagen ohne Reaktion. Formeller Ton, Fristsetzung,
                Hinweis auf mögliche Konsequenzen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
              <span className="text-sm font-semibold text-[#1e1e24]">3</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-dark mb-1">Mahnung</h4>
              <p className="text-sm text-gray-600">
                Nach 28 Tagen. Offizielle Mahnung mit Mahngebühren,
                rechtlichen Hinweisen und letzter Frist vor weiteren
                Schritten.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary-blue mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Erfolgsquote:</p>
            <p>
              Im Durchschnitt werden 85% der offenen Posten nach der ersten
              freundlichen Erinnerung beglichen. Nur 5% erreichen die dritte
              Eskalationsstufe.
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === "templates" && <DunningTemplates />}

      {activeTab === "history" && <DunningHistory />}
    </div>
  );
}
