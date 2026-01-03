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
  Languages,
  CheckCircle,
  X,
  Menu,
  Shield,
  FileText,
  Calculator,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAdmin } from "../hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import PropertiesView from "./PropertiesView";
import TenantsView from "./TenantsView";
import TicketsView from "./TicketsView";
import DashboardHome from "./DashboardHome";
import RentPaymentsView from "./RentPaymentsView";
import FinancesView from "./FinancesView";
import SettingsView from "./SettingsView";
import ReferralProgramView from "./ReferralProgramView";
import FeedbackListView from "./FeedbackListView";
import DocumentsView from "./DocumentsView";
import BillingView from "./BillingView";
import Footer from "./Footer";
type View =
  | "home"
  | "properties"
  | "tenants"
  | "tickets"
  | "payments"
  | "financial"
  | "documents"
  | "billing"
  | "settings-profile"
  | "settings-users"
  | "settings-billing"
  | "feedback"
  | "referral";
export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleNavigateToTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setCurrentView("tenants");
  };
  const navigation = [
    { id: "home", labelKey: "nav.overview", icon: Home },
    { id: "properties", labelKey: "nav.properties", icon: Building2 },
    { id: "tenants", labelKey: "nav.tenants", icon: Users },
    { id: "payments", labelKey: "nav.payments", icon: Wallet },
    { id: "tickets", labelKey: "nav.tickets", icon: MessageSquare },
    { id: "financial", labelKey: "nav.financial", icon: TrendingUp },
    { id: "documents", labelKey: "nav.documents", icon: FileText },
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
  }, []);
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
                alt="Rentab.ly"
                className="h-8 w-auto"
              />{" "}
            </div>{" "}
            <div className="flex items-center gap-4">
              {" "}
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
                        setCurrentView("settings-users");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      {" "}
                      <UserCog className="w-4 h-4" />{" "}
                      <span className="text-sm">
                        {t("settings.users")}
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
                        setLanguage(language === "de" ? "en" : "de");
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      {" "}
                      <Languages className="w-4 h-4" />{" "}
                      <span className="text-sm">{t("nav.languages")}</span>{" "}
                    </button>{" "}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {" "}
        {showSuccessMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
            {" "}
            <div className="flex items-center gap-3">
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
            </div>{" "}
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-emerald-600 hover:text-emerald-700"
            >
              {" "}
              <X className="w-5 h-5" />{" "}
            </button>{" "}
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
                      setCurrentView(item.id as View);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-4 py-3 rounded transition-colors text-left ${currentView === item.id ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    {" "}
                    <span className="font-medium">{t(item.labelKey)}</span>{" "}
                  </button>
                );
              })}{" "}
            </nav>{" "}
            <div
              onClick={() => {
                setCurrentView("referral");
                setShowMobileMenu(false);
              }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-4 text-white cursor-pointer hover:transition-shadow"
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
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full px-4 py-3 rounded transition-colors text-left ${currentView === item.id ? "bg-primary-blue/5 text-primary-blue" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    {" "}
                    <span className="font-medium">{t(item.labelKey)}</span>{" "}
                  </button>
                );
              })}{" "}
            </nav>{" "}
            <div
              onClick={() => setCurrentView("referral")}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-4 text-white cursor-pointer hover:transition-shadow"
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
            {currentView === "home" && <DashboardHome />}{" "}
            {currentView === "properties" && <PropertiesView onNavigateToTenant={handleNavigateToTenant} />}{" "}
            {currentView === "tenants" && <TenantsView selectedTenantId={selectedTenantId} onClearSelection={() => setSelectedTenantId(null)} />}{" "}
            {currentView === "payments" && <RentPaymentsView />}{" "}
            {currentView === "tickets" && <TicketsView />}{" "}
            {currentView === "financial" && <FinancesView />}{" "}
            {currentView === "documents" && <DocumentsView />}{" "}
            {currentView === "billing" && <BillingView />}{" "}
            {currentView === "settings-profile" && (
              <SettingsView activeTab="profile" />
            )}{" "}
            {currentView === "settings-users" && (
              <SettingsView activeTab="users" />
            )}{" "}
            {currentView === "settings-billing" && (
              <SettingsView activeTab="billing" />
            )}{" "}
            {currentView === "feedback" && <FeedbackListView />}{" "}
            {currentView === "referral" && <ReferralProgramView />}{" "}
          </main>{" "}
        </div>{" "}
      </div>{" "}
      <Footer />{" "}
    </div>
  );
}
