import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  RotateCcw,
  XCircle,
  UserX,
  UserCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  Shield,
  Pencil,
  Building2,
  Crown,
  Calendar,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubscription } from "../hooks/useSubscription";
import {
  useAccountMembers,
  type AccountMember,
  type AccountInvitation,
} from "../hooks/useAccountMembers";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { PremiumFeatureGuard } from "./PremiumFeatureGuard";
import { Button } from "./ui/Button";
import Badge from "./common/Badge";
import InviteMemberModal from "./InviteMemberModal";
import EditMemberModal from "./EditMemberModal";

function getRoleBadgeVariant(role: string): "info" | "danger" | "success" | "gray" {
  const map: Record<string, "info" | "danger" | "success" | "gray"> = {
    owner: "info",
    admin: "danger",
    member: "success",
    viewer: "gray",
  };
  return map[role] || "gray";
}

function permissionSummary(
  m: AccountMember | AccountInvitation,
  de: boolean
): string {
  const parts: string[] = [];
  if ("is_read_only" in m && m.is_read_only) {
    return de ? "Nur Lesen" : "Read Only";
  }
  if (m.can_manage_billing) parts.push(de ? "Billing" : "Billing");
  if (m.can_manage_users) parts.push(de ? "Benutzer" : "Users");
  if ("can_view_finances" in m && m.can_view_finances) parts.push(de ? "Finanzen" : "Finances");
  if ("can_view_messages" in m && m.can_view_messages) parts.push(de ? "Nachrichten" : "Messages");
  if (parts.length === 0) return de ? "Standard" : "Standard";
  return parts.join(", ");
}

function propertyScopeLabel(scope: string, de: boolean): string {
  if (scope === "all") return de ? "Alle Immobilien" : "All properties";
  return de ? "Ausgewählte" : "Selected";
}

interface OwnerProfile {
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}

export default function UsersManagementView() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const de = language === "de";
  const {
    members,
    invitations,
    loading,
    inviteMember,
    resendInvitation,
    revokeInvitation,
    deactivateMember,
    reactivateMember,
    removeMember,
    updateMemberPermissions,
  } = useAccountMembers();

  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<AccountMember | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("account_profiles")
      .select("first_name, last_name, company_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOwnerProfile(data);
      });
  }, [user?.id]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAction = async (
    action: () => Promise<void>,
    loadingId: string,
    successMsg: string
  ) => {
    clearMessages();
    setActionLoading(loadingId);
    try {
      await action();
      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : de ? "Ein Fehler ist aufgetreten" : "An error occurred"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const activeMembers = members.filter((m) => !m.removed_at);
  const removedMembers = members.filter((m) => m.removed_at);
  const pendingInvitations = invitations.filter((i) => i.status === "pending");
  const pastInvitations = invitations.filter((i) => i.status !== "pending");

  const allRows: Array<
    | { type: "member"; data: AccountMember }
    | { type: "invitation"; data: AccountInvitation }
  > = [
    ...activeMembers.map((m) => ({ type: "member" as const, data: m })),
    ...pendingInvitations.map((i) => ({ type: "invitation" as const, data: i })),
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(de ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const ownerName = ownerProfile
    ? [ownerProfile.first_name, ownerProfile.last_name].filter(Boolean).join(" ") || null
    : null;

  const ownerDisplayName = ownerName || ownerProfile?.company_name || user?.email || "";

  const memberCreatedAt = user?.created_at
    ? formatDate(user.created_at)
    : null;

  const totalTeamSize = 1 + activeMembers.length + pendingInvitations.length;

  const content = (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">
            {t("settings.users")}
          </h1>
          <p className="text-gray-400">
            {de
              ? "Verwalten Sie Benutzer und Zugriffsrechte Ihres Accounts."
              : "Manage users and access permissions for your account."}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Account Owner Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark">
                      {de ? "Account-Inhaber" : "Account Owner"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {de
                        ? "Vollzugriff auf alle Funktionen und Einstellungen"
                        : "Full access to all features and settings"}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  {de ? `${totalTeamSize} Benutzer gesamt` : `${totalTeamSize} users total`}
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-blue flex items-center justify-center text-white font-semibold text-lg">
                    {(ownerName || user?.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {ownerName && (
                      <p className="text-base font-semibold text-dark">{ownerName}</p>
                    )}
                    <p className={`text-sm ${ownerName ? "text-gray-400" : "font-semibold text-dark"}`}>
                      {user?.email}
                    </p>
                    {ownerProfile?.company_name && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ownerProfile.company_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {memberCreatedAt && (
                    <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-300">
                      <Calendar className="w-3.5 h-3.5" />
                      {de ? `Seit ${memberCreatedAt}` : `Since ${memberCreatedAt}`}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-blue/10 text-primary-blue rounded-full text-xs font-semibold">
                    <Shield className="w-3 h-3" />
                    {t("settings.users.owner")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invite Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-dark">
                    {de ? "Teammitglied einladen" : "Invite Team Member"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {de
                      ? "Laden Sie Mitarbeiter ein, um Immobilien gemeinsam zu verwalten"
                      : "Invite colleagues to manage properties together"}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  clearMessages();
                  setShowInviteModal(true);
                }}
              >
                <UserPlus className="w-4 h-4" />
                {t("settings.users.invite")}
              </Button>
            </div>
          </div>

          {/* Members & Invitations Table */}
          {allRows.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-semibold text-dark">
                  {de ? "Benutzer & Einladungen" : "Users & Invitations"}{" "}
                  <span className="text-gray-300 font-normal">({allRows.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {de ? "Name / E-Mail" : "Name / Email"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("settings.users.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("settings.users.role")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {de ? "Rechte" : "Permissions"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 inline mr-1" />
                        {de ? "Immobilien" : "Properties"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {de ? "Erstellt" : "Created"}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("settings.users.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {allRows.map((row) => {
                      if (row.type === "member") {
                        const m = row.data;
                        const name =
                          [m.first_name, m.last_name].filter(Boolean).join(" ") || null;
                        return (
                          <tr key={`m-${m.user_id}`} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
                                  {(name || m.email).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  {name && (
                                    <p className="text-sm font-medium text-dark">{name}</p>
                                  )}
                                  <p className={`text-sm ${name ? "text-gray-400" : "font-medium text-dark"}`}>
                                    {m.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {m.is_active_member ? (
                                <Badge variant="success" size="sm">{t("settings.users.accepted")}</Badge>
                              ) : (
                                <Badge variant="gray" size="sm">{de ? "Deaktiviert" : "Deactivated"}</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getRoleBadgeVariant(m.role)} size="sm">
                                {m.role === "admin"
                                  ? t("settings.users.admin")
                                  : m.role === "viewer"
                                    ? t("settings.users.viewer")
                                    : t("settings.users.member")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{permissionSummary(m, de)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{propertyScopeLabel(m.property_scope, de)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{m.joined_at ? formatDate(m.joined_at) : "-"}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingMember(m)}
                                  className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-gray-50 rounded-lg transition-colors"
                                  title={de ? "Bearbeiten" : "Edit"}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {m.is_active_member ? (
                                  <button
                                    onClick={() =>
                                      handleAction(
                                        () => deactivateMember(m.user_id),
                                        `deact-${m.user_id}`,
                                        de ? "Benutzer deaktiviert" : "User deactivated"
                                      )
                                    }
                                    disabled={actionLoading === `deact-${m.user_id}`}
                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                    title={de ? "Deaktivieren" : "Deactivate"}
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleAction(
                                        () => reactivateMember(m.user_id),
                                        `react-${m.user_id}`,
                                        de ? "Benutzer reaktiviert" : "User reactivated"
                                      )
                                    }
                                    disabled={actionLoading === `react-${m.user_id}`}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                    title={de ? "Reaktivieren" : "Reactivate"}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const msg = de
                                      ? `Möchten Sie ${m.email} wirklich aus dem Account entfernen?`
                                      : `Are you sure you want to remove ${m.email}?`;
                                    if (confirm(msg)) {
                                      handleAction(
                                        () => removeMember(m.user_id),
                                        `rm-${m.user_id}`,
                                        de ? "Benutzer entfernt" : "User removed"
                                      );
                                    }
                                  }}
                                  disabled={actionLoading === `rm-${m.user_id}`}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title={de ? "Entfernen" : "Remove"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const inv = row.data;
                      const isExpired = new Date(inv.expires_at) <= new Date();
                      return (
                        <tr key={`inv-${inv.id}`} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-amber-500" />
                              </div>
                              <span className="text-sm font-medium text-dark">{inv.invited_email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isExpired ? (
                              <Badge variant="gray" size="sm">{de ? "Abgelaufen" : "Expired"}</Badge>
                            ) : (
                              <Badge variant="warning" size="sm">{t("settings.users.pending")}</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getRoleBadgeVariant(inv.role)} size="sm">
                              {inv.role === "admin"
                                ? t("settings.users.admin")
                                : inv.role === "viewer"
                                  ? t("settings.users.viewer")
                                  : t("settings.users.member")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-400">{permissionSummary(inv, de)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-400">{propertyScopeLabel(inv.property_scope, de)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-400">{formatDate(inv.created_at)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  handleAction(
                                    () => resendInvitation(inv.id),
                                    `resend-${inv.id}`,
                                    de ? "Einladung erneut gesendet" : "Invitation resent"
                                  )
                                }
                                disabled={actionLoading === `resend-${inv.id}`}
                                className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title={de ? "Erneut senden" : "Resend"}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(
                                    () => revokeInvitation(inv.id),
                                    `revoke-${inv.id}`,
                                    de ? "Einladung widerrufen" : "Invitation revoked"
                                  )
                                }
                                disabled={actionLoading === `revoke-${inv.id}`}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title={de ? "Widerrufen" : "Revoke"}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invitation History */}
          {pastInvitations.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-dark">
                  {de
                    ? `Einladungsverlauf (${pastInvitations.length})`
                    : `Invitation History (${pastInvitations.length})`}
                </h3>
                {showHistory ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {showHistory && (
                <div className="border-t border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {de ? "E-Mail" : "Email"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("settings.users.status")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("settings.users.role")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {de ? "Datum" : "Date"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {pastInvitations.map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{inv.invited_email}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {inv.status === "accepted" && (
                                <Badge variant="success" size="sm">{de ? "Angenommen" : "Accepted"}</Badge>
                              )}
                              {inv.status === "expired" && (
                                <Badge variant="gray" size="sm">{de ? "Abgelaufen" : "Expired"}</Badge>
                              )}
                              {inv.status === "revoked" && (
                                <Badge variant="danger" size="sm">{de ? "Widerrufen" : "Revoked"}</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getRoleBadgeVariant(inv.role)} size="sm">
                                {inv.role === "admin"
                                  ? t("settings.users.admin")
                                  : inv.role === "viewer"
                                    ? t("settings.users.viewer")
                                    : t("settings.users.member")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{formatDate(inv.created_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Removed Members */}
          {removedMembers.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-400">
                  {de
                    ? `Entfernte Benutzer (${removedMembers.length})`
                    : `Removed Users (${removedMembers.length})`}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="bg-white divide-y divide-gray-100">
                    {removedMembers.map((m) => (
                      <tr key={m.user_id} className="opacity-60">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">{m.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-xs text-gray-400">
                            {de ? "Entfernt am" : "Removed on"}{" "}
                            {m.removed_at ? formatDate(m.removed_at) : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={async (payload) => {
            await inviteMember(payload);
            setShowInviteModal(false);
            setSuccess(t("settings.users.invite.success"));
            setTimeout(() => setSuccess(null), 4000);
          }}
        />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={async (permissions) => {
            await updateMemberPermissions(editingMember.user_id, permissions);
            setEditingMember(null);
            setSuccess(de ? "Berechtigungen aktualisiert" : "Permissions updated");
            setTimeout(() => setSuccess(null), 4000);
          }}
        />
      )}
    </div>
  );

  if (!isPro) {
    return (
      <PremiumFeatureGuard featureName={t("settings.users")}>
        {content}
      </PremiumFeatureGuard>
    );
  }

  return content;
}
