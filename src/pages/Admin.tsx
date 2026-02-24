import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import {
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  Ban,
  ShieldCheck,
  Mail,
  Settings,
  Clock,
  Check,
  X,
  Pencil,
  Loader2,
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

import AdminEmailLogsView from "../components/AdminEmailLogsView";
import AdminMagazineView from "../components/admin/AdminMagazineView";
import AdminEmailSettingsView from "../components/admin/AdminEmailSettingsView";
import AdminCronJobsView from "../components/admin/AdminCronJobsView";
import AdminFaqsView from "../components/admin/AdminFaqsView";
import AdminCmsView from "../components/admin/AdminCmsView";
import AdminSystemInfoView from "../components/admin/AdminSystemInfoView";
import AdminAnalyticsChart from "../components/admin/AdminAnalyticsChart";
import DeleteUserModal from "../components/admin/DeleteUserModal";
import RefundWizard from "../components/admin/RefundWizard";
import AdminLayout from "../components/admin/AdminLayout";
import UserActionsDropdown from "../components/admin/UserActionsDropdown";
import { BaseTable, StatusBadge } from "../components/common/BaseTable";
import type { AdminTabKey } from "../config/adminMenu";
import { Button } from "../components/ui/Button";

type UserFilter = 'all' | 'pro' | 'cancelling' | 'trial' | 'free';

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
  subscription_ends_at?: string;
  newsletter_opt_in?: boolean;
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
  const [refundTarget, setRefundTarget] = useState<{ id: string; email: string } | null>(null);
  const [editEmailTarget, setEditEmailTarget] = useState<{ id: string; email: string } | null>(null);
  const [userFilter, setUserFilter] = useState<UserFilter>('all');

  async function reloadUsers() {
    try {
      const { data: usersData, error: usersError } =
        await supabase.rpc("admin_get_users");
      if (usersError) {
        console.error("Error loading users:", usersError);
        return;
      }
      const enriched = (usersData as UserData[] || []).map((u) => {
        if (u.subscription_plan === 'pro') return u;
        if (u.subscription_ends_at && new Date(u.subscription_ends_at) > new Date()) {
          return { ...u, subscription_plan: 'pro', subscription_status: 'active' };
        }
        return u;
      });
      setUsers(enriched);
      const proCount = enriched.filter(
        (u) => u.subscription_plan === "pro",
      ).length;
      const freeCount = enriched.length - proCount;
      setStats({
        totalUsers: enriched.length,
        freeUsers: freeCount,
        premiumUsers: proCount,
        monthlyRevenue: proCount * 9,
      });
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingData(true);
    reloadUsers().finally(() => setLoadingData(false));
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

  function isUserCancelling(user: UserData) {
    return user.subscription_plan === 'pro' && !!user.subscription_ends_at;
  }

  function isUserTrial(user: UserData) {
    if (!user.trial_ends_at) return false;
    return new Date(user.trial_ends_at) > new Date();
  }

  const filteredUsers = users.filter((user) => {
    switch (userFilter) {
      case 'pro': return user.subscription_plan === 'pro' && !isUserCancelling(user);
      case 'cancelling': return isUserCancelling(user);
      case 'trial': return isUserTrial(user);
      case 'free': return user.subscription_plan !== 'pro' && !isUserTrial(user);
      default: return true;
    }
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
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

  const filterCounts = {
    all: users.length,
    pro: users.filter(u => u.subscription_plan === 'pro' && !isUserCancelling(u)).length,
    cancelling: users.filter(u => isUserCancelling(u)).length,
    trial: users.filter(u => isUserTrial(u)).length,
    free: users.filter(u => u.subscription_plan !== 'pro' && !isUserTrial(u)).length,
  };

  async function handleCancelSubscription(userId: string) {
    if (!confirm("Möchten Sie das Abonnement dieses Nutzers wirklich zum Ende der Laufzeit kündigen?"))
      return;
    try {
      const { data: customer } = await supabase
        .from("stripe_customers")
        .select("customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (customer) {
        const { data: sub } = await supabase
          .from("stripe_subscriptions")
          .select("current_period_end")
          .eq("customer_id", customer.customer_id)
          .maybeSingle();

        const periodEndDate = sub?.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await supabase
          .from("stripe_subscriptions")
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq("customer_id", customer.customer_id);

        if (periodEndDate) {
          await supabase
            .from("billing_info")
            .update({
              subscription_ends_at: periodEndDate,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
      }

      await supabase
        .from("admin_activity_log")
        .insert({
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          action: "cancel_subscription",
          target_user_id: userId,
          details: { timestamp: new Date().toISOString() },
        });
      alert("Abonnement wird zum Ende der Laufzeit gekündigt.");
      await reloadUsers();
    } catch (err) {
      console.error("Error canceling subscription:", err);
      alert("Fehler beim Beenden des Abonnements");
    }
  }

  function handleRefund(userId: string, userEmail: string) {
    setRefundTarget({ id: userId, email: userEmail });
  }

  async function handleImpersonate(userId: string, userEmail: string) {
    if (!confirm(`Möchten Sie sich als ${userEmail} anmelden? Es öffnet sich ein neuer Tab.`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Keine aktive Sitzung gefunden");
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-impersonate`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Fehler beim Anmelden als Nutzer");
        return;
      }

      if (result.actionLink) {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const url = new URL(result.actionLink);
        url.searchParams.set('redirect_to', redirectUrl);
        window.open(url.toString(), "_blank");
      }
    } catch (err) {
      console.error("Error impersonating user:", err);
      alert("Fehler beim Anmelden als Nutzer");
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
      await reloadUsers();
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
      await reloadUsers();
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
      await reloadUsers();
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
      await reloadUsers();
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
            <AdminAnalyticsChart />

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
                value={`${stats.monthlyRevenue}€`}
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
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Benutzer
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  { key: 'all', label: 'Alle' },
                  { key: 'pro', label: 'Pro' },
                  { key: 'cancelling', label: 'In Kündigung' },
                  { key: 'trial', label: 'Trial' },
                  { key: 'free', label: 'Gratis' },
                ] as { key: UserFilter; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setUserFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      userFilter === key
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                    <span className={`ml-1.5 text-xs ${
                      userFilter === key ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      {filterCounts[key]}
                    </span>
                  </button>
                ))}
              </div>
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
                      {new Date(user.created_at).toLocaleDateString("de-DE")}{" "}
                      <span className="text-gray-300">{new Date(user.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
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
                  key: "newsletter_opt_in",
                  header: "Marketing",
                  sortable: true,
                  align: "center" as const,
                  render: (user: UserData) => user.newsletter_opt_in ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3" /> Ja
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                      <X className="w-3 h-3" /> Nein
                    </span>
                  )
                },
                {
                  key: "subscription_plan",
                  header: "Tarif",
                  sortable: true,
                  render: (user: UserData) => {
                    if (user.subscription_plan === "pro" && isUserCancelling(user)) {
                      const endDate = new Date(user.subscription_ends_at!).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: '2-digit' });
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          Pro (bis {endDate})
                        </span>
                      );
                    }
                    if (user.subscription_plan === "pro") {
                      return <StatusBadge type="warning" label="Pro" />;
                    }
                    if (isUserTrial(user)) {
                      const daysLeft = Math.ceil((new Date(user.trial_ends_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3 h-3" />
                          Trial ({daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'})
                        </span>
                      );
                    }
                    return <StatusBadge type="neutral" label="Gratis" />;
                  }
                },
                {
                  key: "actions",
                  header: "",
                  align: "center" as const,
                  render: (user: UserData) => (
                    <UserActionsDropdown
                      userId={user.id}
                      userEmail={user.email}
                      isPro={user.subscription_plan === "pro"}
                      isCancelling={isUserCancelling(user)}
                      isAdmin={!!user.is_admin}
                      isBanned={!!user.banned}
                      onImpersonate={handleImpersonate}
                      onCancelSubscription={handleCancelSubscription}
                      onRefund={handleRefund}
                      onGrantAdmin={handleGrantAdmin}
                      onRevokeAdmin={handleRevokeAdmin}
                      onBan={handleBanUser}
                      onUnban={handleUnbanUser}
                      onDelete={(id, email) => setDeleteTarget({ id, email })}
                      onEditEmail={(id, email) => setEditEmailTarget({ id, email })}
                    />
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
        {activeTab === "system_info" && <AdminSystemInfoView />}
        {activeTab === "seo" && <AdminSeoView />}
        {activeTab === "affiliates" && <AdminAffiliatesView />}
        {activeTab === "pro_features" && <AdminProFeaturesView />}
        {activeTab === "email_logs" && <AdminEmailLogsView />}
        {activeTab === "magazine" && <AdminMagazineView />}
        {activeTab === "email_settings" && <AdminEmailSettingsView />}
        {activeTab === "cron_jobs" && <AdminCronJobsView />}
        {activeTab === "faqs" && <AdminFaqsView />}
        {activeTab === "cms" && <AdminCmsView />}
      </AdminLayout>

      {refundTarget && (
        <RefundWizard
          userId={refundTarget.id}
          userEmail={refundTarget.email}
          onClose={() => setRefundTarget(null)}
          onComplete={() => reloadUsers()}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          userId={deleteTarget.id}
          userEmail={deleteTarget.email}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            reloadUsers();
          }}
        />
      )}

      {editEmailTarget && (
        <EditEmailModal
          userId={editEmailTarget.id}
          currentEmail={editEmailTarget.email}
          onClose={() => setEditEmailTarget(null)}
          onSaved={() => {
            setEditEmailTarget(null);
            reloadUsers();
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

function EditEmailModal({ userId, currentEmail, onClose, onSaved }: {
  userId: string;
  currentEmail: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 50);
  }, []);

  async function handleSave() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || trimmed === currentEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Ungueltige E-Mail-Adresse");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Keine aktive Sitzung");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, newEmail: trimmed }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Fehler beim Aktualisieren");

      onSaved();
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-dark">E-Mail ändern</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aktuelle E-Mail</label>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">{currentEmail}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Neue E-Mail</label>
            <input
              ref={inputRef}
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="neue@email.de"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button onClick={onClose} variant="secondary">Abbrechen</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !newEmail.trim() || newEmail.trim().toLowerCase() === currentEmail}
            variant="primary"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Speichern...</> : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}
