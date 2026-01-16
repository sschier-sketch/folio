import { useState, useRef, useEffect } from "react";
import {
  Building2,
  Users,
  MessageSquare,
  LogOut,
  Home,
  Wallet,
  ChevronDown,
  User,
  TrendingUp,
  Gift,
  CreditCard,
  UserCog,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  X,
  Menu,
  Shield,
  FileText,
  Calculator,
  Files,
  Bell,
  KeyRound,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAdmin } from "../hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSubscription } from "../hooks/useSubscription";
import PropertiesView from "./PropertiesView";
import TenantsView from "./TenantsView";
import MieterportalView from "./MieterportalView";
import DashboardHome from "./DashboardHome";
import RentPaymentsView from "./RentPaymentsView";
import FinancesView from "./FinancesView";
import SettingsView from "./SettingsView";
import ProfileSettingsView from "./ProfileSettingsView";
import BillingSettingsView from "./BillingSettingsView";
import ReferralProgramView from "./ReferralProgramView";
import FeedbackListView from "./FeedbackListView";
import DocumentsView from "./DocumentsView";
import TemplatesView from "./TemplatesView";
import BillingView from "./BillingView";
import TicketsView from "./TicketsView";
import Footer from "./Footer";
import SystemUpdatesModal from "./SystemUpdatesModal";
type View =
  | "home"
  | "properties"
  | "tenants"
  | "mieterportal"
  | "payments"
  | "financial"
  | "documents"
  | "templates"
  | "billing"
  | "tickets"
  | "settings-profile"
  | "settings-billing"
  | "feedback"
  | "referral";
export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertyTab, setSelectedPropertyTab] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isAdmin } = useAdmin();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleNavigateToTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setCurrentView("tenants");
  };

  const handleNavigateToProperty = (propertyId: string, tab?: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedPropertyTab(tab || null);
    setCurrentView("properties");
  };

  const handleCopyPortalUrl = () => {
    const portalUrl = `${window.location.origin}/mieterportal`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortalUrl(true);
    setTimeout(() => setCopiedPortalUrl(false), 2000);
  };

  const handleOpenPortal = () => {
    window.open("/mieterportal", "_blank");
  };

  const navigation = [
    { id: "home", labelKey: "nav.overview", icon: Home },
    { id: "properties", labelKey: "nav.properties", icon: Building2 },
    { id: "tenants", labelKey: "nav.tenants", icon: Users },
    { id: "payments", labelKey: "nav.payments", icon: Wallet },
    { id: "mieterportal", labelKey: "nav.mieterportal", icon: MessageSquare },
    { id: "financial", labelKey: "nav.financial", icon: TrendingUp },
    { id: "documents", labelKey: "nav.documents", icon: FileText },
    { id: "templates", labelKey: "nav.templates", icon: Files },
    { id: "billing", labelKey: "nav.billing", icon: Calculator },
  ];
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "success") {
      setShowSuccessMessage(true);
      setCurrentView("settings-billing");
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }

    const view = urlParams.get("view");
    const ticketId = urlParams.get("ticketId");
    const tenantId = urlParams.get("tenantId");
    const tab = urlParams.get("tab");

    if (view === "tickets" && ticketId) {
      setCurrentView("tickets");
      setSelectedTicketId(ticketId);
      window.history.replaceState({}, "", "/dashboard");
    } else if (view === "tenants" && tenantId) {
      setCurrentView("tenants");
      setSelectedTenantId(tenantId);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  useEffect(() => {
    async function checkForNewUpdates() {
      if (!user) return;

      try {
        const { data: viewedUpdates } = await supabase
          .from("user_update_views")
          .select("update_id")
          .eq("user_id", user.id);

        const viewedIds = viewedUpdates?.map((v) => v.update_id) || [];

        const { data: updatesData } = await supabase
          .from("system_updates")
          .select("id, update_type")
          .eq("is_published", true);

        const relevantUpdates = (updatesData || []).filter(
          (update) =>
            update.update_type === "free" ||
            (update.update_type === "premium" && isPremium)
        );

        const hasNew = relevantUpdates.some(
          (update) => !viewedIds.includes(update.id)
        );

        setHasNewUpdates(hasNew);
      } catch (error) {
        console.error("Error checking for new updates:", error);
      }
    }

    checkForNewUpdates();
  }, [user, isPremium]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {" "}
      <nav className="bg-white border-b sticky top-0 z-40">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="flex justify-between items-center h-16">
            {" "}
            <div className="flex items-center gap-3">
              {" "}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-400 hover:text-dark hover:bg-gray-50 rounded-lg transition-colors"
              >
                {" "}
                <Menu className="w-6 h-6" />{" "}
              </button>{" "}
              <img
                src="/rentably-logo.svg"
                alt="Rentably"
                className="h-8 w-auto"
              />{" "}
            </div>{" "}
            <div className="flex items-center gap-4">
              {" "}
              <button
                onClick={() => setShowUpdatesModal(true)}
                className="relative p-2 text-gray-400 hover:text-dark transition-colors rounded-lg hover:bg-gray-50"
                title="Updates"
              >
                <Bell className="w-5 h-5" />
                {hasNewUpdates && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <div className="relative" ref={dropdownRef}>
                {" "}
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-dark transition-colors rounded-lg hover:bg-gray-50"
                >
                  {" "}
                  <User className="w-4 h-4" />{" "}
                  <span className="text-sm font-medium"> Einstellungen </span>{" "}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showSettingsDropdown ? "rotate-180" : ""}`}
                  />{" "}
                </button>{" "}
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg py-2 z-50">
                    {" "}
                    <button
                      onClick={() => {
                        setCurrentView("settings-profile");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      {" "}
                      <User className="w-4 h-4" />{" "}
                      <span className="text-sm">
                        {t("settings.profile")}
                      </span>{" "}
                    </button>{" "}
                    <button
                      onClick={() => {
                        setCurrentView("settings-billing");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      {" "}
                      <CreditCard className="w-4 h-4" />{" "}
                      <span className="text-sm">
                        {t("settings.billing")}
                      </span>{" "}
                    </button>{" "}
                    <div className="border-t my-2"></div>{" "}
                    <button
                      onClick={() => {
                        setCurrentView("feedback");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      {" "}
                      <Lightbulb className="w-4 h-4" />{" "}
                      <span className="text-sm">{t("feedback.menu")}</span>{" "}
                    </button>{" "}
                    {isAdmin && (
                      <>
                        {" "}
                        <div className="border-t my-2"></div>{" "}
                        <button
                          onClick={() => {
                            console.log(
                              "Admin button clicked, navigating to /admin",
                            );
                            navigate("/admin");
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-semibold"
                        >
                          {" "}
                          <Shield className="w-4 h-4" />{" "}
                          <span className="text-sm">Admin-Dashboard</span>{" "}
                        </button>{" "}
                      </>
                    )}{" "}
                    <div className="border-t my-2"></div>{" "}
                    <button
                      onClick={() => {
                        signOut();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {" "}
                      <LogOut className="w-4 h-4" />{" "}
                      <span className="text-sm">{t("nav.logout")}</span>{" "}
                    </button>{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </nav>{" "}
      <div className="py-8 flex-1">
        {" "}
        {showSuccessMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
            {" "}
            <CheckCircle className="w-5 h-5 text-emerald-600" />{" "}
            <div>
              {" "}
              <p className="text-emerald-900 font-medium">
                {" "}
                {language === "de"
                  ? "Zahlung erfolgreich!"
                  : "Payment successful!"}{" "}
              </p>{" "}
              <p className="text-emerald-700 text-sm">
                {" "}
                {language === "de"
                  ? "Ihr Abonnement wurde erfolgreich aktiviert."
                  : "Your subscription has been activated successfully."}{" "}
              </p>{" "}
            </div>{" "}
          </div>
          </div>
        )}{" "}
        {/* Mobile Menu Overlay */}{" "}
        {showMobileMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}{" "}
        {/* Mobile Menu */}{" "}
        <div
          className={`fixed top-16 left-0 bottom-0 w-72 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${showMobileMenu ? "translate-x-0" : "-translate-x-full"} overflow-y-auto `}
        >
          {" "}
          <div className="p-4 space-y-4">
            {" "}
            <nav className="bg-white rounded p-2">
              {" "}
              {navigation.map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "properties") {
                        setSelectedPropertyId(null);
                        setSelectedPropertyTab(null);
                      }
                      if (item.id === "tenants") {
                        setSelectedTenantId(null);
                      }
                      setCurrentView(item.id as View);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-4 py-3 rounded transition-colors text-left ${currentView === item.id ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    {" "}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t(item.labelKey)}</span>
                      {item.comingSoon && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          Demnächst
                        </span>
                      )}
                    </div>{" "}
                  </button>
                );
              })}{" "}
            </nav>{" "}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              {" "}
              <div className="flex items-center gap-3 mb-3">
                {" "}
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {" "}
                  <KeyRound className="w-5 h-5" />{" "}
                </div>{" "}
                <h3 className="font-semibold">Mieterportal</h3>{" "}
              </div>{" "}
              <p className="text-blue-50 text-sm mb-3">
                Kommunizieren Sie mit Ihren Mietern
              </p>{" "}
              <div>
                <button
                  onClick={() => {
                    setCurrentView("mieterportal");
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-white/20 hover:bg-white/30 rounded px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center"
                >
                  Zur Verwaltung
                </button>
              </div>{" "}
            </div>{" "}
            <div
              onClick={() => {
                setCurrentView("referral");
                setShowMobileMenu(false);
              }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white cursor-pointer hover:transition-shadow"
            >
              {" "}
              <div className="flex items-center gap-3 mb-3">
                {" "}
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {" "}
                  <Gift className="w-5 h-5" />{" "}
                </div>{" "}
                <h3 className="font-semibold">{t("referral.title")}</h3>{" "}
              </div>{" "}
              <p className="text-emerald-100 text-sm mb-3">
                {" "}
                {t("referral.description")}{" "}
              </p>{" "}
              <div className="flex items-center gap-2 text-sm font-medium">
                {" "}
                <span>{t("referral.learn_more")}</span>{" "}
                <ChevronDown className="w-4 h-4 -rotate-90" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex gap-6 items-start">
          {" "}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4 sticky top-24">
            {" "}
            <nav className="bg-white rounded p-2">
              {" "}
              {navigation.map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "properties") {
                        setSelectedPropertyId(null);
                        setSelectedPropertyTab(null);
                      }
                      if (item.id === "tenants") {
                        setSelectedTenantId(null);
                      }
                      setCurrentView(item.id as View);
                    }}
                    className={`w-full px-4 py-3 rounded transition-colors text-left ${currentView === item.id ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    {" "}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t(item.labelKey)}</span>
                      {item.comingSoon && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          Demnächst
                        </span>
                      )}
                    </div>{" "}
                  </button>
                );
              })}{" "}
            </nav>{" "}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              {" "}
              <div className="flex items-center gap-3 mb-3">
                {" "}
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {" "}
                  <KeyRound className="w-5 h-5" />{" "}
                </div>{" "}
                <h3 className="font-semibold">Mieterportal</h3>{" "}
              </div>{" "}
              <p className="text-blue-50 text-sm mb-3">
                Kommunizieren Sie mit Ihren Mietern
              </p>{" "}
              <div>
                <button
                  onClick={() => {
                    setCurrentView("mieterportal");
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-white/20 hover:bg-white/30 rounded px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center"
                >
                  Zur Verwaltung
                </button>
              </div>{" "}
            </div>{" "}
            <div
              onClick={() => setCurrentView("referral")}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white cursor-pointer hover:transition-shadow"
            >
              {" "}
              <div className="flex items-center gap-3 mb-3">
                {" "}
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {" "}
                  <Gift className="w-5 h-5" />{" "}
                </div>{" "}
                <h3 className="font-semibold">{t("referral.title")}</h3>{" "}
              </div>{" "}
              <p className="text-emerald-100 text-sm mb-3">
                {" "}
                {t("referral.description")}{" "}
              </p>{" "}
              <div className="flex items-center gap-2 text-sm font-medium">
                {" "}
                <span>{t("referral.learn_more")}</span>{" "}
                <ChevronDown className="w-4 h-4 -rotate-90" />{" "}
              </div>{" "}
            </div>{" "}
          </aside>{" "}
          <main className="flex-1 min-w-0">
            {" "}
            {currentView === "home" && <DashboardHome onNavigateToTenant={handleNavigateToTenant} onNavigateToProperty={handleNavigateToProperty} onChangeView={(view) => setCurrentView(view as View)} />}{" "}
              {currentView === "properties" && <PropertiesView selectedPropertyId={selectedPropertyId} selectedPropertyTab={selectedPropertyTab} onClearSelection={() => { setSelectedPropertyId(null); setSelectedPropertyTab(null); }} onNavigateToTenant={handleNavigateToTenant} />}{" "}
              {currentView === "tenants" && <TenantsView selectedTenantId={selectedTenantId} onClearSelection={() => setSelectedTenantId(null)} />}{" "}
              {currentView === "payments" && <RentPaymentsView />}{" "}
              {currentView === "mieterportal" && <MieterportalView />}{" "}
              {currentView === "financial" && <FinancesView />}{" "}
              {currentView === "documents" && <DocumentsView />}{" "}
              {currentView === "templates" && <TemplatesView />}{" "}
              {currentView === "billing" && <BillingView />}{" "}
              {currentView === "tickets" && <TicketsView initialTicketId={selectedTicketId} />}{" "}
              {currentView === "settings-profile" && <ProfileSettingsView />}{" "}
              {currentView === "settings-billing" && <BillingSettingsView />}{" "}
              {currentView === "feedback" && <FeedbackListView />}{" "}
              {currentView === "referral" && <ReferralProgramView />}{" "}
          </main>{" "}
        </div>{" "}
      </div>{" "}
      <Footer />{" "}
      <SystemUpdatesModal
        isOpen={showUpdatesModal}
        onClose={() => {
          setShowUpdatesModal(false);
          setHasNewUpdates(false);
        }}
      />
    </div>
  );
}
