import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import {
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  Eye,
  XCircle,
  Ban,
  UserCog,
  ShieldCheck,
  Trash2,
  Mail,
  Settings,
  Clock,
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
import AdminEmailSettingsView from "../components/admin/AdminEmailSettingsView";
import DeleteUserModal from "../components/admin/DeleteUserModal";
import AdminLayout from "../components/admin/AdminLayout";
import { BaseTable, StatusBadge, ActionButton, ActionsCell } from "../components/common/BaseTable";
import type { AdminTabKey } from "../config/adminMenu";

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
  customer_number?: string;
  trial_ends_at?: string;
}

interface Stats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  monthlyRevenue: number;
}

export function Admin() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTabKey>("overview");
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

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
    if (!confirm("Moechten Sie das Abonnement dieses Nutzers wirklich beenden?"))
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
    if (!confirm(`Moechten Sie sich als ${userEmail} anmelden?`)) return;
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
        "Impersonation-Feature wird in einer spaeteren Version implementiert",
      );
    } catch (err) {
      console.error("Error logging impersonation:", err);
    }
  }

  async function handleBanUser(userId: string, userEmail: string) {
    if (!confirm(`Moechten Sie ${userEmail} wirklich sperren?`)) return;
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
    if (!confirm(`Moechten Sie die Sperre von ${userEmail} aufheben?`)) return;
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
        `Moechten Sie ${userEmail} wirklich Admin-Rechte erteilen?`,
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
        `Moechten Sie ${userEmail} wirklich die Admin-Rechte entziehen?`,
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
    <>
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Users className="w-5 h-5 text-primary-blue" />}
                value={stats.totalUsers}
                label="Gesamt Nutzer"
                bg="bg-blue-50"
              />
              <StatCard
                icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
                value={stats.freeUsers}
                label="Gratis Nutzer"
                bg="bg-emerald-50"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                value={stats.premiumUsers}
                label="Pro Nutzer"
                bg="bg-amber-50"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5 text-green-600" />}
                value={`${stats.monthlyRevenue}\u20AC`}
                label="Monatl. Umsatz"
                bg="bg-green-50"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Schnellzugriff
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QuickAction
                  icon={<Users className="w-5 h-5 text-primary-blue" />}
                  title="Benutzer verwalten"
                  subtitle="Alle Nutzer anzeigen & verwalten"
                  onClick={() => setActiveTab("users")}
                />
                <QuickAction
                  icon={<Mail className="w-5 h-5 text-primary-blue" />}
                  title="E-Mail Templates"
                  subtitle="Templates bearbeiten"
                  onClick={() => setActiveTab("templates")}
                />
                <QuickAction
                  icon={<Settings className="w-5 h-5 text-primary-blue" />}
                  title="System-Einstellungen"
                  subtitle="GTM & Konfiguration"
                  onClick={() => setActiveTab("system_settings")}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                Alle Benutzer
              </h2>
            </div>
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
                        <StatusBadge type="info" label="Eigentuemer" icon={<UserCheck className="w-3 h-3" />} />
                      )}
                      {user.banned && (
                        <StatusBadge type="neutral" label="Gesperrt" icon={<Ban className="w-3 h-3" />} />
                      )}
                    </div>
                  )
                },
                {
                  key: "customer_number",
                  header: "Kundennr.",
                  sortable: true,
                  render: (user: UserData) => (
                    <span className="text-xs font-mono text-gray-500">{user.customer_number || "-"}</span>
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
                  render: (user: UserData) => {
                    if (user.subscription_plan === "pro") {
                      return <StatusBadge type="warning" label="Pro" />;
                    }
                    if (user.trial_ends_at) {
                      const trialEnd = new Date(user.trial_ends_at);
                      const now = new Date();
                      const diffMs = trialEnd.getTime() - now.getTime();
                      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      if (daysLeft > 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                            <Clock className="w-3 h-3" />
                            Trial ({daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'})
                          </span>
                        );
                      }
                    }
                    return <StatusBadge type="neutral" label="Gratis" />;
                  }
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
                      <ActionButton
                        icon={<Trash2 className="w-4 h-4 text-red-500" />}
                        onClick={() => setDeleteTarget({ id: user.id, email: user.email })}
                        title="User komplett loeschen"
                      />
                    </ActionsCell>
                  )
                }
              ]}
              data={sortedUsers}
              loading={loadingData}
              emptyMessage="Keine Benutzer gefunden"
            />
          </div>
        )}

        {activeTab === "tickets" && <AdminTicketsView />}
        {activeTab === "templates" && <AdminEmailTemplatesView />}
        {activeTab === "document_templates" && <AdminTemplatesView />}
        {activeTab === "system_updates" && <AdminSystemUpdatesView />}
        {activeTab === "feedback" && <AdminFeedbackView />}
        {activeTab === "system_settings" && <AdminSystemSettingsView />}
        {activeTab === "seo" && <AdminSeoView />}
        {activeTab === "affiliates" && <AdminAffiliatesView />}
        {activeTab === "payouts" && <AdminPayoutsView />}
        {activeTab === "pro_features" && <AdminProFeaturesView />}
        {activeTab === "email_logs" && <AdminEmailLogsView />}
        {activeTab === "magazine" && <AdminMagazineView />}
        {activeTab === "email_settings" && <AdminEmailSettingsView />}
      </AdminLayout>

      {deleteTarget && (
        <DeleteUserModal
          userId={deleteTarget.id}
          userEmail={deleteTarget.email}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            const remaining = users.filter((u) => u.id !== deleteTarget.id);
            const proCount = remaining.filter((u) => u.subscription_plan === "pro").length;
            setStats({
              totalUsers: remaining.length,
              freeUsers: remaining.length - proCount,
              premiumUsers: proCount,
              monthlyRevenue: proCount * 9,
            });
          }}
        />
      )}
    </>
  );
}

function StatCard({ icon, value, label, bg }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-blue/30 hover:bg-blue-50/30 transition-all text-left group"
    >
      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
