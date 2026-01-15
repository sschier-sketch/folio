import { useState, useEffect } from "react";
import {
  User,
  Globe,
  CreditCard,
  Building,
  FileText,
  Shield,
  MessageCircle,
  Send,
  Gift,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { stripeProducts } from "../stripe-config";
import { SubscriptionCard } from "./subscription/SubscriptionCard";
import { SubscriptionStatus } from "./subscription/SubscriptionStatus";
import { useSubscription } from "../hooks/useSubscription";
import ProfileManagement from "./profile/ProfileManagement";
interface UserSettings {
  role: string;
  can_invite_users: boolean;
  can_manage_properties: boolean;
  can_manage_tenants: boolean;
  can_manage_finances: boolean;
  can_view_analytics: boolean;
}
interface BillingInfo {
  company_name: string | null;
  vat_id: string | null;
  billing_address: string | null;
  billing_email: string | null;
  payment_method: string | null;
  subscription_plan: string;
  subscription_status: string;
}
interface Feedback {
  id: string;
  feedback_text: string;
  willing_to_pay: boolean;
  payment_amount: string | null;
  status: string;
  created_at: string;
}
interface SettingsViewProps {
  activeTab?: "profile" | "billing";
}
export default function SettingsView({
  activeTab: initialTab = "profile",
}: SettingsViewProps) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<
    "profile" | "billing"
  >(initialTab);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [willingToPay, setWillingToPay] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    loadUserSettings();
  }, [user]);
  useEffect(() => {
    if (activeTab === "billing") {
      loadBillingInfo();
    }
  }, [activeTab]);
  const loadUserSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "role, can_invite_users, can_manage_properties, can_manage_tenants, can_manage_finances, can_view_analytics",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setUserSettings(data);
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };
  const loadBillingInfo = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("billing_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setBillingInfo(data);
    } catch (error) {
      console.error("Error loading billing info:", error);
    }
  };
  const handleUpdateBillingInfo = async (updates: Partial<BillingInfo>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("billing_info")
        .update(updates)
        .eq("user_id", user.id);
      if (error) throw error;
      setSuccessMessage("Informationen erfolgreich aktualisiert");
      loadBillingInfo();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating billing info:", error);
      setErrorMessage("Fehler beim Aktualisieren der Informationen");
    }
  };
  const loadFeedback = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedback.trim()) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { error } = await supabase
        .from("user_feedback")
        .insert([
          {
            user_id: user.id,
            feedback_text: newFeedback.trim(),
            willing_to_pay: willingToPay,
            payment_amount: willingToPay ? paymentAmount.trim() : null,
          },
        ]);
      if (error) throw error;
      setSuccessMessage(t("settings.feedback.success"));
      setNewFeedback("");
      setWillingToPay(false);
      setPaymentAmount("");
      loadFeedback();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      setErrorMessage("Fehler beim Senden des Feedbacks.");
    } finally {
      setLoading(false);
    }
  };
  const getRoleBadge = (role: string) => {
    const roleMap = {
      owner: {
        label: t("settings.users.owner"),
        color: "bg-primary-blue/10 text-primary-blue",
      },
      admin: {
        label: t("settings.users.admin"),
        color: "bg-red-100 text-red-700",
      },
      member: {
        label: t("settings.users.member"),
        color: "bg-emerald-100 text-emerald-700",
      },
      viewer: {
        label: t("settings.users.viewer"),
        color: "bg-gray-50 text-gray-400",
      },
    };
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.owner;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 ${roleInfo.color} rounded-full text-xs font-medium`}
      >
        {" "}
        <Shield className="w-3 h-3" /> {roleInfo.label}{" "}
      </span>
    );
  };
  const getPlanBadge = (plan: string) => {
    const planMap = {
      free: {
        label: t("settings.plan.free"),
        color: "bg-gray-50 text-gray-400",
      },
      pro: {
        label: t("settings.plan.pro"),
        color: "bg-primary-blue/10 text-primary-blue",
      },
      enterprise: {
        label: t("settings.plan.enterprise"),
        color: "bg-purple-100 text-purple-700",
      },
    };
    const planInfo = planMap[plan as keyof typeof planMap] || planMap.free;
    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 ${planInfo.color} rounded-full text-sm font-semibold`}
      >
        {" "}
        {planInfo.label}{" "}
      </span>
    );
  };
  const getFeedbackStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        label: t("settings.feedback.status.pending"),
        color: "bg-amber-100 text-amber-700",
      },
      reviewed: {
        label: t("settings.feedback.status.reviewed"),
        color: "bg-primary-blue/10 text-primary-blue",
      },
      planned: {
        label: t("settings.feedback.status.planned"),
        color: "bg-purple-100 text-purple-700",
      },
      implemented: {
        label: t("settings.feedback.status.implemented"),
        color: "bg-emerald-100 text-emerald-700",
      },
    };
    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 ${statusInfo.color} rounded-full text-xs font-medium`}
      >
        {" "}
        {statusInfo.label}{" "}
      </span>
    );
  };
  const tabs = [
    { id: "profile" as const, label: t("settings.profile"), icon: User },
    { id: "billing" as const, label: t("settings.billing"), icon: CreditCard },
  ];
  return (
    <div>
      {" "}
      <div className="mb-8">
        {" "}
        <h1 className="text-3xl font-bold text-dark mb-2">
          {" "}
          Verwaltung{" "}
        </h1>{" "}
        <p className="text-gray-400">
          {" "}
          {language === "de"
            ? "Verwalten Sie Ihre Einstellungen und Präferenzen."
            : "Manage your settings and preferences."}{" "}
        </p>{" "}
      </div>{" "}
      <div className="bg-white rounded-lg mb-6">
        <div className="overflow-x-auto">
          <div className="flex">
            {tabs
              .filter((tab) => tab.show !== false)
              .map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-primary-blue"
                        : "text-gray-400 hover:text-dark"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
      {activeTab === "profile" && (
        <div className="bg-white rounded shadow-sm p-6">
          {" "}
          <h3 className="text-lg font-semibold text-dark mb-6">
            {t("settings.profile")}
          </h3>{" "}
          <div className="space-y-4 max-w-2xl">
            {" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {" "}
                {t("settings.email")}{" "}
              </label>{" "}
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-300"
              />{" "}
              <p className="text-sm text-gray-300 mt-1">
                {" "}
                {language === "de"
                  ? "Ihre E-Mail-Adresse kann derzeit nicht geändert werden."
                  : "Your email address cannot be changed currently."}{" "}
              </p>{" "}
            </div>{" "}
            {userSettings && (
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {" "}
                  {t("settings.users.role")}{" "}
                </label>{" "}
                <div> {getRoleBadge(userSettings.role)} </div>{" "}
              </div>
            )}{" "}
          </div>

          <div className="mt-8 pt-8 border-t">
            <ProfileManagement />
          </div>
        </div>
      )}{" "}
      {activeTab === "billing" && (
        <div className="space-y-6">
          {" "}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
            {" "}
            <div className="flex items-center gap-3 mb-4">
              {" "}
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                {" "}
                <Gift className="w-5 h-5 text-white" />{" "}
              </div>{" "}
              <h3 className="text-lg font-semibold text-dark">
                {" "}
                {language === "de"
                  ? "Empfehlungscode einlösen"
                  : "Redeem Referral Code"}{" "}
              </h3>{" "}
            </div>{" "}
            <p className="text-gray-400 text-sm mb-4">
              {" "}
              {language === "de"
                ? "Haben Sie einen Empfehlungscode? Lösen Sie ihn ein und erhalten Sie 20% Rabatt auf Ihr erstes Jahr!"
                : "Have a referral code? Redeem it and get 20% off your first year!"}{" "}
            </p>{" "}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const codeInput = form.elements.namedItem(
                  "referralCode",
                ) as HTMLInputElement;
                const code = codeInput.value.trim().toUpperCase();
                if (!code) return;
                try {
                  const { data: referrerSettings } = await supabase
                    .from("user_settings")
                    .select("user_id")
                    .eq("referral_code", code)
                    .maybeSingle();
                  if (!referrerSettings) {
                    setErrorMessage(
                      language === "de"
                        ? "Ungültiger Empfehlungscode"
                        : "Invalid referral code",
                    );
                    return;
                  }
                  const { error } = await supabase
                    .from("user_referrals")
                    .insert({
                      referrer_id: referrerSettings.user_id,
                      referred_user_id: user!.id,
                      referral_code: code,
                      status: "pending",
                    });
                  if (error) {
                    if (error.code === "23505") {
                      setErrorMessage(
                        language === "de"
                          ? "Sie haben bereits einen Empfehlungscode eingelöst"
                          : "You have already redeemed a referral code",
                      );
                    } else {
                      throw error;
                    }
                  } else {
                    setSuccessMessage(
                      language === "de"
                        ? "Empfehlungscode erfolgreich eingelöst!"
                        : "Referral code redeemed successfully!",
                    );
                    codeInput.value = "";
                    setTimeout(() => setSuccessMessage(""), 3000);
                  }
                } catch (error) {
                  console.error("Error redeeming referral code:", error);
                  setErrorMessage(
                    language === "de"
                      ? "Fehler beim Einlösen des Codes"
                      : "Error redeeming code",
                  );
                }
              }}
              className="flex gap-3"
            >
              {" "}
              <input
                name="referralCode"
                type="text"
                placeholder={language === "de" ? "CODE EINGEBEN" : "ENTER CODE"}
                className="flex-1 px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                maxLength={8}
              />{" "}
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors"
              >
                {" "}
                {language === "de" ? "Einlösen" : "Redeem"}{" "}
              </button>{" "}
            </form>{" "}
          </div>{" "}
          <div className="bg-white rounded shadow-sm p-6">
            <h3 className="text-lg font-semibold text-dark mb-6">
              {t("settings.plan")}
            </h3>

            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-lg mb-6 border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-blue/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary-blue" />
                </div>
                <div>
                  <div className="font-bold text-dark text-lg">
                    {subscription?.status === "active" ? "Pro" : "Basic"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {subscription?.status === "active"
                      ? "Alle Premium-Funktionen freigeschaltet"
                      : "Kostenlose Basis-Funktionen"}
                  </div>
                </div>
              </div>
              {subscription?.status !== "active" && (
                <button
                  onClick={() => {
                    const plansSection = document.getElementById("available-plans");
                    plansSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-2.5 bg-primary-blue text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Jetzt upgraden
                </button>
              )}
            </div>

            {subscription?.status !== "active" && (
              <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  Mit Pro erhalten Sie:
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-dark"><strong>Unbegrenzte Immobilien</strong> - Verwalten Sie beliebig viele Objekte</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-dark"><strong>Erweiterte Finanzverwaltung</strong> - Cashflow, Analysen und Berichte</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-dark"><strong>Professionelles Mieterportal</strong> - Digitale Kommunikation mit Mietern</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-dark"><strong>Automatische Nebenkostenabrechnung</strong> - Zählerstände & Abrechnungen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-dark"><strong>Dokumentenverwaltung</strong> - Zentrale Ablage aller Dokumente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-dark"><strong>Prioritärer Support</strong> - Schnelle Hilfe bei Fragen</span>
                  </li>
                </ul>
              </div>
            )}

            <div id="available-plans">
              <h4 className="text-md font-semibold text-dark mb-4">
                {language === "de"
                  ? "Verfügbare Tarife"
                  : "Available Plans"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stripeProducts.map((product) => (
                  <SubscriptionCard
                    key={product.priceId}
                    product={product}
                    isCurrentPlan={subscription?.price_id === product.priceId}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}{" "}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          {" "}
          <div className="bg-white rounded shadow-sm p-6">
            {" "}
            <div className="mb-6">
              {" "}
              <h3 className="text-lg font-semibold text-dark mb-2">
                {t("settings.feedback.title")}
              </h3>{" "}
              <p className="text-gray-400 text-sm">
                {t("settings.feedback.description")}
              </p>{" "}
            </div>{" "}
            {successMessage && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                {" "}
                {successMessage}{" "}
              </div>
            )}{" "}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {" "}
                {errorMessage}{" "}
              </div>
            )}{" "}
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {" "}
                  {t("settings.feedback.idea")}{" "}
                </label>{" "}
                <textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder={t("settings.feedback.idea.placeholder")}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  required
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {" "}
                  {t("settings.feedback.willing_to_pay")}{" "}
                </label>{" "}
                <div className="flex gap-4">
                  {" "}
                  <label className="flex items-center gap-2 cursor-pointer">
                    {" "}
                    <input
                      type="radio"
                      name="willingToPay"
                      checked={willingToPay === true}
                      onChange={() => setWillingToPay(true)}
                      className="w-4 h-4 text-primary-blue focus:ring-blue-500"
                    />{" "}
                    <span className="text-sm text-gray-400">
                      {t("settings.feedback.willing_to_pay.yes")}
                    </span>{" "}
                  </label>{" "}
                  <label className="flex items-center gap-2 cursor-pointer">
                    {" "}
                    <input
                      type="radio"
                      name="willingToPay"
                      checked={willingToPay === false}
                      onChange={() => setWillingToPay(false)}
                      className="w-4 h-4 text-primary-blue focus:ring-blue-500"
                    />{" "}
                    <span className="text-sm text-gray-400">
                      {t("settings.feedback.willing_to_pay.no")}
                    </span>{" "}
                  </label>{" "}
                </div>{" "}
              </div>{" "}
              {willingToPay && (
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    {t("settings.feedback.amount")}{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={t("settings.feedback.amount.placeholder")}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />{" "}
                </div>
              )}{" "}
              <div className="flex justify-end">
                {" "}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
                >
                  {" "}
                  <Send className="w-4 h-4" />{" "}
                  {loading
                    ? language === "de"
                      ? "Senden..."
                      : "Sending..."
                    : t("settings.feedback.submit")}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            {" "}
            <div className="px-6 py-4 border-b">
              {" "}
              <h3 className="text-lg font-semibold text-dark">
                {t("settings.feedback.history")}
              </h3>{" "}
            </div>{" "}
            {feedbackList.length === 0 ? (
              <div className="p-12 text-center">
                {" "}
                <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />{" "}
                <p className="text-gray-400 text-lg mb-2">
                  {" "}
                  {language === "de"
                    ? "Noch kein Feedback eingereicht"
                    : "No feedback submitted yet"}{" "}
                </p>{" "}
                <p className="text-gray-300 text-sm">
                  {" "}
                  {language === "de"
                    ? "Teilen Sie uns Ihre Ideen und Vorschläge mit."
                    : "Share your ideas and suggestions with us."}{" "}
                </p>{" "}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {" "}
                {feedbackList.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    {" "}
                    <div className="flex items-start justify-between mb-3">
                      {" "}
                      <div className="flex-1">
                        {" "}
                        <p className="text-dark whitespace-pre-wrap">
                          {feedback.feedback_text}
                        </p>{" "}
                      </div>{" "}
                      <div className="ml-4">
                        {" "}
                        {getFeedbackStatusBadge(feedback.status)}{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      {" "}
                      <span>
                        {new Date(feedback.created_at).toLocaleDateString(
                          language === "de" ? "de-DE" : "en-US",
                        )}
                      </span>{" "}
                      {feedback.willing_to_pay && feedback.payment_amount && (
                        <span className="flex items-center gap-1">
                          {" "}
                          <CreditCard className="w-3 h-3" />{" "}
                          {feedback.payment_amount}{" "}
                        </span>
                      )}{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
