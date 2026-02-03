import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import {
  Users,
  Mail,
  DollarSign,
  TrendingUp,
  Shield,
  UserCheck,
  Settings,
  Activity,
  Eye,
  XCircle,
  ArrowLeft,
  MessageSquare,
  FileText,
  Bell,
  ArrowUpDown,
  Ban,
  UserCog,
  ShieldCheck,
  Globe,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { AdminTicketsView } from "../components/AdminTicketsView";
import { AdminEmailTemplatesView } from "../components/AdminEmailTemplatesView";
import { AdminTemplatesView } from "../components/AdminTemplatesView";
import AdminSystemUpdatesView from "../components/AdminSystemUpdatesView";
import { AdminFeedbackView } from "../components/AdminFeedbackView";
import AdminSystemSettingsView from "../components/AdminSystemSettingsView";
import AdminSeoView from "../components/AdminSeoView";
import AdminProFeaturesView from "../components/AdminProFeaturesView";
import AdminAffiliatesView from "../components/AdminAffiliatesView";
import AdminPayoutsView from "../components/AdminPayoutsView";
import AdminEmailLogsView from "../components/AdminEmailLogsView";
import AdminMagazineView from "../components/admin/AdminMagazineView";
import { BaseTable, StatusBadge, ActionButton, ActionsCell, TableColumn } from "../components/common/BaseTable";
interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  subscription_plan?: string;
  subscription_status?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  properties_count?: number;
  tenants_count?: number;
  is_admin?: boolean;
  banned?: boolean;
  ban_reason?: string;
}
interface Stats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  monthlyRevenue: number;
}
export function Admin() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "tickets" | "templates" | "document_templates" | "system_updates" | "feedback" | "system_settings" | "seo" | "affiliates" | "payouts" | "pro_features" | "email_logs" | "magazine"
  >("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    monthlyRevenue: 0,
  });
  const [loadingData, setLoadingData] = useState(true);
  const [sortField, setSortField] = useState<keyof UserData>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  console.log(
    "Admin Component - isAdmin:",
    isAdmin,
    "adminLoading:",
    adminLoading,
  );
  useEffect(() => {
    if (!isAdmin) return;
    async function loadData() {
      try {
        const { data: usersData, error: usersError } =
          await supabase.rpc("admin_get_users");
        if (usersError) {
          console.error("Error loading users:", usersError);
          setLoadingData(false);
          return;
        }
        setUsers(usersData as UserData[]);
        const proCount = (usersData || []).filter(
          (u) => u.subscription_plan === "pro",
        ).length;
        const freeCount = (usersData || []).length - proCount;
        setStats({
          totalUsers: (usersData || []).length,
          freeUsers: freeCount,
          premiumUsers: proCount,
          monthlyRevenue: proCount * 9,
        });
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [isAdmin]);
  if (adminLoading) {
    console.log(
      "Admin Component - Still loading admin status, showing spinner",
    );
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />{" "}
      </div>
    );
  }
  if (!isAdmin) {
    console.log(
      "Admin Component - User is not admin, redirecting to /dashboard",
    );
    return <Navigate to="/dashboard" replace />;
  }
  console.log("Admin Component - User is admin, rendering admin interface");

  function handleSort(field: keyof UserData) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });

  async function handleCancelSubscription(userId: string) {
    if (!confirm("Möchten Sie das Abonnement dieses Nutzers wirklich beenden?"))
      return;
    try {
      const { data: customer } = await supabase
        .from("stripe_customers")
        .select("customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (customer) {
        const { error: subError } = await supabase
          .from("stripe_subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq("customer_id", customer.customer_id);

        if (subError) throw subError;
      }

      const { error: billingError } = await supabase
        .from("billing_info")
        .update({ subscription_plan: "free", subscription_status: "canceled" })
        .eq("user_id", userId);

      if (billingError) console.error("Billing info update error:", billingError);

      await supabase
        .from("admin_activity_log")
        .insert({
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          action: "cancel_subscription",
          target_user_id: userId,
          details: { timestamp: new Date().toISOString() },
        });
      alert("Abonnement wurde beendet");
      window.location.reload();
    } catch (err) {
      console.error("Error canceling subscription:", err);
      alert("Fehler beim Beenden des Abonnements");
    }
  }
  async function handleImpersonate(userId: string, userEmail: string) {
    if (!confirm(`Möchten Sie sich als ${userEmail} anmelden?`)) return;
    try {
      await supabase
        .from("admin_activity_log")
        .insert({
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          action: "impersonate_user",
          target_user_id: userId,
          details: { timestamp: new Date().toISOString() },
        });
      alert(
        "Impersonation-Feature wird in einer späteren Version implementiert",
      );
    } catch (err) {
      console.error("Error logging impersonation:", err);
    }
  }

  async function handleBanUser(userId: string, userEmail: string) {
    if (!confirm(`Möchten Sie ${userEmail} wirklich sperren?`)) return;

    try {
      const { error } = await supabase.rpc("admin_ban_user", {
        target_user_id: userId,
        reason: "Gesperrt durch Administrator",
      });

      if (error) throw error;

      alert("Benutzer wurde gesperrt");
      window.location.reload();
    } catch (err) {
      console.error("Error banning user:", err);
      alert("Fehler beim Sperren des Benutzers");
    }
  }

  async function handleUnbanUser(userId: string, userEmail: string) {
    if (!confirm(`Möchten Sie die Sperre von ${userEmail} aufheben?`)) return;

    try {
      const { error } = await supabase.rpc("admin_unban_user", {
        target_user_id: userId,
      });

      if (error) throw error;

      alert("Sperre wurde aufgehoben");
      window.location.reload();
    } catch (err) {
      console.error("Error unbanning user:", err);
      alert("Fehler beim Aufheben der Sperre");
    }
  }

  async function handleGrantAdmin(userId: string, userEmail: string) {
    if (
      !confirm(
        `Möchten Sie ${userEmail} wirklich Admin-Rechte erteilen?`,
      )
    )
      return;

    try {
      const { error } = await supabase.rpc("admin_grant_admin_access", {
        target_user_id: userId,
      });

      if (error) throw error;

      alert("Admin-Rechte wurden erteilt");
      window.location.reload();
    } catch (err) {
      console.error("Error granting admin access:", err);
      alert("Fehler beim Erteilen der Admin-Rechte");
    }
  }

  async function handleRevokeAdmin(userId: string, userEmail: string) {
    if (
      !confirm(
        `Möchten Sie ${userEmail} wirklich die Admin-Rechte entziehen?`,
      )
    )
      return;

    try {
      const { error } = await supabase.rpc("admin_revoke_admin_access", {
        target_user_id: userId,
      });

      if (error) throw error;

      alert("Admin-Rechte wurden entzogen");
      window.location.reload();
    } catch (err) {
      console.error("Error revoking admin access:", err);
      alert("Fehler beim Entziehen der Admin-Rechte");
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {" "}
        <div className="mb-8">
          {" "}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-dark transition-colors mb-4"
          >
            {" "}
            <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard{" "}
          </button>{" "}
          <div className="flex items-center gap-3 mb-2">
            {" "}
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
              {" "}
              <Shield className="w-6 h-6 text-white" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h1 className="text-3xl font-bold text-dark">
                Admin-Dashboard
              </h1>{" "}
              <p className="text-gray-400">
                System-Verwaltung & Übersicht
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex gap-2 mb-6 border-b ">
          {" "}
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "overview" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Activity className="w-4 h-4 inline mr-2" /> Übersicht{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "users" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Users className="w-4 h-4 inline mr-2" /> Benutzer{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "tickets" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <MessageSquare className="w-4 h-4 inline mr-2" /> Tickets{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "templates" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Mail className="w-4 h-4 inline mr-2" /> E-Mail Templates{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("email_logs")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "email_logs" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Activity className="w-4 h-4 inline mr-2" /> E-Mail Logs{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("document_templates")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "document_templates" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <FileText className="w-4 h-4 inline mr-2" /> Dokument-Vorlagen{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("system_updates")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "system_updates" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Bell className="w-4 h-4 inline mr-2" /> System-Updates{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "feedback" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <MessageSquare className="w-4 h-4 inline mr-2" /> Feedback{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("system_settings")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "system_settings" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Settings className="w-4 h-4 inline mr-2" /> System{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("seo")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "seo" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Globe className="w-4 h-4 inline mr-2" /> SEO{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("affiliates")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "affiliates" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <TrendingUp className="w-4 h-4 inline mr-2" /> Affiliates{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("payouts")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "payouts" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <DollarSign className="w-4 h-4 inline mr-2" /> Auszahlungen{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("pro_features")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "pro_features" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <Sparkles className="w-4 h-4 inline mr-2" /> Pro-Features{" "}
          </button>{" "}
          <button
            onClick={() => setActiveTab("magazine")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === "magazine" ? "border-primary-blue text-primary-blue" : "border-transparent text-gray-400 hover:text-dark"}`}
          >
            {" "}
            <BookOpen className="w-4 h-4 inline mr-2" /> Magazin{" "}
          </button>{" "}
        </div>{" "}
        {activeTab === "overview" && (
          <div>
            {" "}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {" "}
              <div className="bg-white rounded p-6 ">
                {" "}
                <div className="flex items-center justify-between mb-2">
                  {" "}
                  <Users className="w-8 h-8 text-primary-blue" />{" "}
                  <span className="text-3xl font-bold text-dark">
                    {stats.totalUsers}
                  </span>{" "}
                </div>{" "}
                <p className="text-gray-400 font-medium">Gesamt Nutzer</p>{" "}
              </div>{" "}
              <div className="bg-white rounded p-6 ">
                {" "}
                <div className="flex items-center justify-between mb-2">
                  {" "}
                  <UserCheck className="w-8 h-8 text-emerald-600" />{" "}
                  <span className="text-3xl font-bold text-dark">
                    {stats.freeUsers}
                  </span>{" "}
                </div>{" "}
                <p className="text-gray-400 font-medium">Gratis Nutzer</p>{" "}
              </div>{" "}
              <div className="bg-white rounded p-6 ">
                {" "}
                <div className="flex items-center justify-between mb-2">
                  {" "}
                  <TrendingUp className="w-8 h-8 text-amber-600" />{" "}
                  <span className="text-3xl font-bold text-dark">
                    {stats.premiumUsers}
                  </span>{" "}
                </div>{" "}
                <p className="text-gray-400 font-medium">Pro Nutzer</p>{" "}
              </div>{" "}
              <div className="bg-white rounded p-6 ">
                {" "}
                <div className="flex items-center justify-between mb-2">
                  {" "}
                  <DollarSign className="w-8 h-8 text-green-600" />{" "}
                  <span className="text-3xl font-bold text-dark">
                    {stats.monthlyRevenue}€
                  </span>{" "}
                </div>{" "}
                <p className="text-gray-400 font-medium">Monatl. Umsatz</p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white rounded p-6 ">
              {" "}
              <h2 className="text-xl font-bold text-dark mb-4">
                Schnellzugriff
              </h2>{" "}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {" "}
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-4 border-2 rounded-full hover:border-primary-blue hover:bg-primary-blue/5 transition-all text-left"
                >
                  {" "}
                  <Users className="w-6 h-6 text-primary-blue mb-2" />{" "}
                  <p className="font-semibold text-dark">Benutzer verwalten</p>{" "}
                  <p className="text-sm text-gray-400">
                    Alle Nutzer anzeigen & verwalten
                  </p>{" "}
                </button>{" "}
                <button
                  onClick={() => setActiveTab("templates")}
                  className="p-4 border-2 rounded-full hover:border-primary-blue hover:bg-primary-blue/5 transition-all text-left"
                >
                  {" "}
                  <Mail className="w-6 h-6 text-primary-blue mb-2" />{" "}
                  <p className="font-semibold text-dark">E-Mail Templates</p>{" "}
                  <p className="text-sm text-gray-400">
                    Templates bearbeiten
                  </p>{" "}
                </button>{" "}
                <button
                  onClick={() => setActiveTab("system_settings")}
                  className="p-4 border-2 rounded-full hover:border-primary-blue hover:bg-primary-blue/5 transition-all text-left"
                >
                  {" "}
                  <Settings className="w-6 h-6 text-primary-blue mb-2" />{" "}
                  <p className="font-semibold text-dark">
                    System-Einstellungen
                  </p>{" "}
                  <p className="text-sm text-gray-400">GTM & Konfiguration</p>{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {activeTab === "users" && (
          <div className="bg-white rounded overflow-hidden">
            {" "}
            <div className="p-6 border-b ">
              {" "}
              <h2 className="text-xl font-bold text-dark">
                Alle Benutzer
              </h2>{" "}
            </div>{" "}
            <BaseTable
              columns={[
                {
                  key: "status",
                  header: "Status",
                  render: (user: UserData) => (
                    <div className="flex items-center gap-2">
                      {user.is_admin ? (
                        <StatusBadge type="error" label="Admin" icon={<ShieldCheck className="w-3 h-3" />} />
                      ) : (
                        <StatusBadge type="info" label="Eigentümer" icon={<UserCheck className="w-3 h-3" />} />
                      )}
                      {user.banned && (
                        <StatusBadge type="neutral" label="Gesperrt" icon={<Ban className="w-3 h-3" />} />
                      )}
                    </div>
                  )
                },
                {
                  key: "email",
                  header: "E-Mail",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-sm text-dark">{user.email}</span>
                  )
                },
                {
                  key: "first_name",
                  header: "Vorname",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-sm text-gray-400">{user.first_name || "-"}</span>
                  )
                },
                {
                  key: "last_name",
                  header: "Nachname",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-sm text-gray-400">{user.last_name || "-"}</span>
                  )
                },
                {
                  key: "company_name",
                  header: "Firma",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-sm text-gray-400">{user.company_name || "-"}</span>
                  )
                },
                {
                  key: "created_at",
                  header: "Registriert",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString("de-DE")}
                    </span>
                  )
                },
                {
                  key: "last_sign_in_at",
                  header: "Letzter Login",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-sm text-gray-400">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("de-DE") : "-"}
                    </span>
                  )
                },
                {
                  key: "subscription_plan",
                  header: "Tarif",
                  sortable: true,
                  render: (user: UserData) => (
                    user.subscription_plan === "pro" ? (
                      <StatusBadge type="warning" label="Pro" />
                    ) : (
                      <StatusBadge type="neutral" label="Gratis" />
                    )
                  )
                },
                {
                  key: "actions",
                  header: "Aktionen",
                  align: "center" as const,
                  render: (user: UserData) => (
                    <ActionsCell>
                      <ActionButton
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => handleImpersonate(user.id, user.email)}
                        title="Als Nutzer anmelden"
                      />
                      {user.subscription_plan === "pro" && (
                        <ActionButton
                          icon={<XCircle className="w-4 h-4" />}
                          onClick={() => handleCancelSubscription(user.id)}
                          title="Abo beenden"
                        />
                      )}
                      {user.is_admin ? (
                        <ActionButton
                          icon={<ShieldCheck className="w-4 h-4" />}
                          onClick={() => handleRevokeAdmin(user.id, user.email)}
                          title="Admin-Rechte entziehen"
                        />
                      ) : (
                        <ActionButton
                          icon={<UserCog className="w-4 h-4" />}
                          onClick={() => handleGrantAdmin(user.id, user.email)}
                          title="Zum Admin machen"
                        />
                      )}
                      {user.banned ? (
                        <ActionButton
                          icon={<UserCheck className="w-4 h-4" />}
                          onClick={() => handleUnbanUser(user.id, user.email)}
                          title="Sperre aufheben"
                        />
                      ) : (
                        <ActionButton
                          icon={<Ban className="w-4 h-4" />}
                          onClick={() => handleBanUser(user.id, user.email)}
                          title="Benutzer sperren"
                        />
                      )}
                    </ActionsCell>
                  )
                }
              ]}
              data={sortedUsers}
              loading={loadingData}
              emptyMessage="Keine Benutzer gefunden"
            />
          </div>
        )}{" "}
        {activeTab === "tickets" && <AdminTicketsView />}{" "}
        {activeTab === "templates" && <AdminEmailTemplatesView />}{" "}
        {activeTab === "document_templates" && <AdminTemplatesView />}{" "}
        {activeTab === "system_updates" && <AdminSystemUpdatesView />}{" "}
        {activeTab === "feedback" && <AdminFeedbackView />}{" "}
        {activeTab === "system_settings" && <AdminSystemSettingsView />}{" "}
        {activeTab === "seo" && <AdminSeoView />}{" "}
        {activeTab === "affiliates" && <AdminAffiliatesView />}{" "}
        {activeTab === "payouts" && <AdminPayoutsView />}{" "}
        {activeTab === "pro_features" && <AdminProFeaturesView />}{" "}
        {activeTab === "email_logs" && <AdminEmailLogsView />}{" "}
        {activeTab === "magazine" && <AdminMagazineView />}{" "}
      </div>{" "}
    </div>
  );
}
