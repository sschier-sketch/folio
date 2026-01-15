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
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className="min-h-screen bg-app-bg flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-divider fixed h-screen">
        <div className="p-6 border-b border-divider">
          <img src="/rentably-logo.svg" alt="Rentably" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all relative ${
                  isActive
                    ? "text-primary-500 bg-primary-100/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-500 rounded-r" />
                )}
                <Icon className="w-5 h-5" strokeWidth={1.75} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-divider">
          <button
            onClick={() => setCurrentView("referral")}
            className="w-full bg-primary-100 rounded-xl p-4 text-left hover:bg-primary-100/70 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-text-primary">{t("referral.title")}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("referral.description")}
            </p>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-divider sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-all"
            >
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>

            <div className="lg:hidden">
              <img src="/rentably-logo.svg" alt="Rentably" className="h-7 w-auto" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpdatesModal(true)}
                className="relative p-2 text-text-secondary hover:text-text-primary transition-all rounded-lg hover:bg-bg-subtle"
                title="Updates"
              >
                <Bell className="w-5 h-5" strokeWidth={1.75} />
                {hasNewUpdates && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
                )}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:text-text-primary transition-all rounded-lg hover:bg-bg-subtle"
                >
                  <User className="w-4 h-4" strokeWidth={1.75} />
                  <span className="hidden md:inline text-sm font-normal">Einstellungen</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showSettingsDropdown ? "rotate-180" : ""}`}
                    strokeWidth={1.75}
                  />
                </button>

                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card-hover py-2 border border-divider z-50">
                    <button
                      onClick={() => {
                        setCurrentView("settings-profile");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all"
                    >
                      <User className="w-4 h-4" strokeWidth={1.75} />
                      <span>{t("settings.profile")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView("settings-billing");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all"
                    >
                      <CreditCard className="w-4 h-4" strokeWidth={1.75} />
                      <span>{t("settings.billing")}</span>
                    </button>

                    <div className="border-t border-divider my-2" />

                    <button
                      onClick={() => {
                        setCurrentView("feedback");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all"
                    >
                      <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
                      <span>{t("feedback.menu")}</span>
                    </button>

                    {isAdmin && (
                      <>
                        <div className="border-t border-divider my-2" />
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-500 hover:bg-error-100 transition-all font-semibold"
                        >
                          <Shield className="w-4 h-4" strokeWidth={1.75} />
                          <span>Admin-Dashboard</span>
                        </button>
                      </>
                    )}

                    <div className="border-t border-divider my-2" />

                    <button
                      onClick={() => {
                        signOut();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-500 hover:bg-error-100 transition-all"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.75} />
                      <span>{t("nav.logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden overflow-y-auto border-r border-divider">
              <div className="p-6 border-b border-divider flex items-center justify-between">
                <img src="/rentably-logo.svg" alt="Rentably" className="h-7 w-auto" />
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all relative ${
                        isActive
                          ? "text-primary-500 bg-primary-100/30"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-500 rounded-r" />
                      )}
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4">
                <button
                  onClick={() => {
                    setCurrentView("referral");
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-primary-100 rounded-xl p-4 text-left hover:bg-primary-100/70 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                      <Gift className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{t("referral.title")}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t("referral.description")}
                  </p>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <main className="p-6 max-w-[1280px]">
          {showSuccessMessage && (
            <div className="mb-6 bg-success-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success-500" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {language === "de" ? "Zahlung erfolgreich!" : "Payment successful!"}
                </p>
                <p className="text-sm text-text-secondary">
                  {language === "de"
                    ? "Ihr Abonnement wurde erfolgreich aktiviert."
                    : "Your subscription has been activated successfully."}
                </p>
              </div>
            </div>
          )}

          {currentView === "home" && (
            <DashboardHome
              onNavigateToProperty={handleNavigateToProperty}
              onNavigateToTenant={handleNavigateToTenant}
            />
          )}
          {currentView === "properties" && (
            <PropertiesView
              selectedPropertyId={selectedPropertyId}
              selectedTab={selectedPropertyTab}
              onClearSelection={() => {
                setSelectedPropertyId(null);
                setSelectedPropertyTab(null);
              }}
            />
          )}
          {currentView === "tenants" && (
            <TenantsView
              selectedTenantId={selectedTenantId}
              onClearSelection={() => setSelectedTenantId(null)}
            />
          )}
          {currentView === "mieterportal" && <MieterportalView />}
          {currentView === "payments" && <RentPaymentsView />}
          {currentView === "financial" && <FinancesView />}
          {currentView === "documents" && <DocumentsView />}
          {currentView === "templates" && <TemplatesView />}
          {currentView === "billing" && <BillingView />}
          {currentView === "tickets" && (
            <TicketsView
              selectedTicketId={selectedTicketId}
              onClearSelection={() => setSelectedTicketId(null)}
            />
          )}
          {currentView === "settings-profile" && <ProfileSettingsView />}
          {currentView === "settings-billing" && <BillingSettingsView />}
          {currentView === "feedback" && <FeedbackListView />}
          {currentView === "referral" && <ReferralProgramView />}
        </main>

        <Footer />
      </div>

      {showUpdatesModal && (
        <SystemUpdatesModal onClose={() => setShowUpdatesModal(false)} />
      )}
    </div>
  );
}
