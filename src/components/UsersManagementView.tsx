import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Shield,
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
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";
import { Button } from "./ui/Button";
import Badge from "./common/Badge";
import TableActionsDropdown from "./common/TableActionsDropdown";
import type { ActionItem } from "./common/TableActionsDropdown";
import InviteMemberModal from "./InviteMemberModal";
import EditMemberModal from "./EditMemberModal";
import type { EditTarget } from "./EditMemberModal";

function getRoleBadgeVariant(role: string): "info" | "danger" | "success" | "gray" {
  const map: Record<string, "info" | "danger" | "success" | "gray"> = {
    owner: "info",
    admin: "danger",
    member: "success",
    viewer: "gray",
  };
  return map[role] || "gray";
}

function hasFullAccess(m: AccountMember | AccountInvitation): boolean {
  if ("is_read_only" in m && m.is_read_only) return false;
  if (!m.can_manage_billing) return false;
  if (!m.can_manage_users) return false;
  const hasFinances = "can_view_finances" in m ? m.can_view_finances : true;
  const hasMessages = "can_view_messages" in m ? m.can_view_messages : true;
  if (!hasFinances || !hasMessages) return false;
  return true;
}

function propertyScopeLabel(scope: string, de: boolean): string {
  if (scope === "all") return de ? "Alle Immobilien" : "All properties";
  return de ? "Ausgewählte" : "Selected";
}

function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/profile-avatars/${avatarPath}`;
}

function UserAvatar({ name, email, avatarPath, size = "md" }: {
  name: string | null;
  email: string;
  avatarPath?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const url = getAvatarUrl(avatarPath);
  const initials = name
    ? name.split(" ").map(p => p.charAt(0).toUpperCase()).slice(0, 2).join("")
    : (email || "?").charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name || email}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white`}
      style={{ backgroundColor: "#3c8af7" }}
    >
      {initials}
    </div>
  );
}

interface OwnerProfile {
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
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
    deleteMember,
    updateMemberPermissions,
    updateInvitationPermissions,
  } = useAccountMembers();

  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ target: EditTarget; type: "member" | "invitation" } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("account_profiles")
      .select("first_name, last_name, company_name, avatar_url")
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

  const memberCreatedAt = user?.created_at
    ? formatDate(user.created_at)
    : null;

  const totalTeamSize = 1 + activeMembers.length + pendingInvitations.length;

  function getMemberActions(m: AccountMember): ActionItem[] {
    return [
      {
        label: de ? "Rechte bearbeiten" : "Edit permissions",
        onClick: () => setEditingTarget({ target: m, type: "member" }),
      },
      {
        label: de ? "Deaktivieren" : "Deactivate",
        onClick: () =>
          handleAction(
            () => deactivateMember(m.user_id),
            `deact-${m.user_id}`,
            de ? "Benutzer deaktiviert" : "User deactivated"
          ),
        hidden: !m.is_active_member,
      },
      {
        label: de ? "Reaktivieren" : "Reactivate",
        onClick: () =>
          handleAction(
            () => reactivateMember(m.user_id),
            `react-${m.user_id}`,
            de ? "Benutzer reaktiviert" : "User reactivated"
          ),
        hidden: m.is_active_member,
      },
      {
        label: de ? "Löschen" : "Delete",
        variant: "danger",
        onClick: () => {
          const msg = de
            ? `Möchten Sie ${m.email} wirklich dauerhaft löschen? Alle Daten dieses Benutzers werden unwiderruflich entfernt.`
            : `Are you sure you want to permanently delete ${m.email}? All data for this user will be irreversibly removed.`;
          if (confirm(msg)) {
            handleAction(
              () => deleteMember(m.user_id),
              `del-${m.user_id}`,
              de ? "Benutzer gelöscht" : "User deleted"
            );
          }
        },
      },
    ];
  }

  function getInvitationActions(inv: AccountInvitation): ActionItem[] {
    return [
      {
        label: de ? "Rechte bearbeiten" : "Edit permissions",
        onClick: () => setEditingTarget({ target: inv, type: "invitation" }),
      },
      {
        label: de ? "Erneut senden" : "Resend invitation",
        onClick: () =>
          handleAction(
            () => resendInvitation(inv.id),
            `resend-${inv.id}`,
            de ? "Einladung erneut gesendet" : "Invitation resent"
          ),
      },
      {
        label: de ? "Widerrufen" : "Revoke",
        variant: "danger",
        onClick: () =>
          handleAction(
            () => revokeInvitation(inv.id),
            `revoke-${inv.id}`,
            de ? "Einladung widerrufen" : "Invitation revoked"
          ),
      },
    ];
  }

  const handleEditSave = async (permissions: Record<string, unknown>) => {
    if (!editingTarget) return;

    if (editingTarget.type === "member") {
      const m = editingTarget.target as AccountMember;
      await updateMemberPermissions(m.user_id, permissions);
    } else {
      const inv = editingTarget.target as AccountInvitation;
      const mapped: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(permissions)) {
        mapped[key.replace(/^p_/, "")] = value;
      }
      await updateInvitationPermissions(inv.id, mapped);
    }

    setEditingTarget(null);
    setSuccess(de ? "Berechtigungen aktualisiert" : "Permissions updated");
    setTimeout(() => setSuccess(null), 4000);
  };

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
          <div className="bg-white rounded-lg">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}
                  >
                    <Crown className="w-6 h-6" style={{ color: '#1E1E24' }} strokeWidth={1.5} />
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
                  <UserAvatar
                    name={ownerName}
                    email={user?.email || ""}
                    avatarPath={ownerProfile?.avatar_url}
                    size="lg"
                  />
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

          <div className="bg-white rounded-lg">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}
                >
                  <UserPlus className="w-5 h-5" style={{ color: '#1E1E24' }} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-dark">
                    {de ? "Teammitglied einladen" : "Invite Team Member"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {de
                      ? "Laden Sie weitere Personen ein, um Immobilien gemeinsam zu verwalten"
                      : "Invite others to manage properties together"}
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
                {t("settings.users.invite")}
              </Button>
            </div>
          </div>

          {allRows.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-semibold text-dark">
                  {de ? "Benutzer & Einladungen" : "Users & Invitations"}{" "}
                  <span className="text-gray-300 font-normal">({allRows.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: '720px' }}>
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '30%' }}>
                        {de ? "E-Mail" : "Email"}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>
                        {t("settings.users.status")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>
                        {t("settings.users.role")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '13%' }}>
                        {de ? "Rechte" : "Permissions"}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '13%' }}>
                        {de ? "Immobilien" : "Properties"}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>
                        {de ? "Erstellt" : "Created"}
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '8%' }}>
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
                            <td className="px-4 py-4">
                              <div className="min-w-0">
                                {name && (
                                  <p className="text-sm font-medium text-dark truncate" title={name}>{name}</p>
                                )}
                                <p className="text-sm text-gray-400 truncate" title={m.email}>
                                  {m.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              {m.is_active_member ? (
                                <Badge variant="success" size="sm">{t("settings.users.accepted")}</Badge>
                              ) : (
                                <Badge variant="gray" size="sm">{de ? "Deaktiviert" : "Deactivated"}</Badge>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <Badge variant={getRoleBadgeVariant(m.role)} size="sm">
                                {m.role === "admin"
                                  ? t("settings.users.admin")
                                  : m.role === "viewer"
                                    ? t("settings.users.viewer")
                                    : t("settings.users.member")}
                              </Badge>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              {hasFullAccess(m) ? (
                                <Badge variant="success" size="sm">{de ? "Vollzugriff" : "Full access"}</Badge>
                              ) : (
                                <Badge variant="gray" size="sm">{de ? "Teilzugriff" : "Partial access"}</Badge>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{propertyScopeLabel(m.property_scope, de)}</span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{m.joined_at ? formatDate(m.joined_at) : "-"}</span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end">
                                <TableActionsDropdown actions={getMemberActions(m)} />
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const inv = row.data;
                      const isExpired = new Date(inv.expires_at) <= new Date();
                      return (
                        <tr key={`inv-${inv.id}`} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-400 truncate min-w-0" title={inv.invited_email}>{inv.invited_email}</p>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {isExpired ? (
                              <Badge variant="gray" size="sm">{de ? "Abgelaufen" : "Expired"}</Badge>
                            ) : (
                              <Badge variant="warning" size="sm">{t("settings.users.pending")}</Badge>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <Badge variant={getRoleBadgeVariant(inv.role)} size="sm">
                              {inv.role === "admin"
                                ? t("settings.users.admin")
                                : inv.role === "viewer"
                                  ? t("settings.users.viewer")
                                  : t("settings.users.member")}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {hasFullAccess(inv) ? (
                              <Badge variant="success" size="sm">{de ? "Vollzugriff" : "Full access"}</Badge>
                            ) : (
                              <Badge variant="gray" size="sm">{de ? "Teilzugriff" : "Partial access"}</Badge>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-400">{propertyScopeLabel(inv.property_scope, de)}</span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-400">{formatDate(inv.created_at)}</span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end">
                              <TableActionsDropdown actions={getInvitationActions(inv)} />
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

          {pastInvitations.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden">
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

          {removedMembers.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden">
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

      {editingTarget && (
        <EditMemberModal
          member={editingTarget.target}
          onClose={() => setEditingTarget(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );

  if (!isPro) {
    return <PremiumUpgradePrompt featureKey="users_management" />;
  }

  return content;
}
