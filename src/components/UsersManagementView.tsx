import { useState } from "react";
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
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  Pencil,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubscription } from "../hooks/useSubscription";
import { useAccountMembers, type AccountMember, type AccountInvitation } from "../hooks/useAccountMembers";
import { useAuth } from "../contexts/AuthContext";
import { PremiumFeatureGuard } from "./PremiumFeatureGuard";
import InviteMemberModal from "./InviteMemberModal";
import EditMemberModal from "./EditMemberModal";

export default function UsersManagementView() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { isPro } = useSubscription();
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

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<AccountMember | null>(null);
  const [showInvitations, setShowInvitations] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAction = async (action: () => Promise<void>, loadingId: string, successMsg: string) => {
    clearMessages();
    setActionLoading(loadingId);
    try {
      await action();
      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setActionLoading(null);
    }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, Record<string, string>> = {
      de: { owner: "Eigentümer", admin: "Administrator", member: "Mitglied", viewer: "Betrachter" },
      en: { owner: "Owner", admin: "Administrator", member: "Member", viewer: "Viewer" },
    };
    return labels[language]?.[role] || role;
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: "bg-blue-50 text-blue-700 border-blue-200",
      admin: "bg-red-50 text-red-700 border-red-200",
      member: "bg-emerald-50 text-emerald-700 border-emerald-200",
      viewer: "bg-gray-50 text-gray-500 border-gray-200",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${styles[role] || styles.member}`}>
        {role === "owner" && <Shield className="w-3 h-3" />}
        {role === "viewer" && <Eye className="w-3 h-3" />}
        {roleLabel(role)}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { icon: typeof Clock; label: string; className: string }> = {
      pending: { icon: Clock, label: language === "de" ? "Ausstehend" : "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
      accepted: { icon: CheckCircle2, label: language === "de" ? "Angenommen" : "Accepted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      expired: { icon: AlertCircle, label: language === "de" ? "Abgelaufen" : "Expired", className: "bg-gray-50 text-gray-500 border-gray-200" },
      revoked: { icon: XCircle, label: language === "de" ? "Widerrufen" : "Revoked", className: "bg-red-50 text-red-600 border-red-200" },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${c.className}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const activeMembers = members.filter((m) => !m.removed_at);
  const removedMembers = members.filter((m) => m.removed_at);
  const pendingInvitations = invitations.filter((i) => i.status === "pending");
  const pastInvitations = invitations.filter((i) => i.status !== "pending");

  const content = (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-400" />
            {t("settings.users")}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {language === "de"
              ? "Verwalten Sie Benutzer und Zugriffsrechte Ihres Accounts"
              : "Manage users and access permissions for your account"}
          </p>
        </div>
        <button
          onClick={() => { clearMessages(); setShowInviteModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          {t("settings.users.invite")}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Owner section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-900">
                {language === "de" ? "Account-Inhaber" : "Account Owner"}
              </h2>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500">
                    {language === "de" ? "Vollzugriff auf alle Funktionen" : "Full access to all features"}
                  </p>
                </div>
              </div>
              {roleBadge("owner")}
            </div>
          </div>

          {/* Active Members */}
          {activeMembers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-900">
                  {language === "de" ? `Aktive Benutzer (${activeMembers.length})` : `Active Users (${activeMembers.length})`}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {activeMembers.map((member) => (
                  <div key={member.user_id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.is_active_member ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <Users className={`w-5 h-5 ${member.is_active_member ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {[member.first_name, member.last_name].filter(Boolean).join(" ") || member.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!member.is_active_member && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          {language === "de" ? "Deaktiviert" : "Deactivated"}
                        </span>
                      )}
                      {member.is_read_only && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          {language === "de" ? "Nur Lesen" : "Read Only"}
                        </span>
                      )}
                      {roleBadge(member.role)}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title={language === "de" ? "Bearbeiten" : "Edit"}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {member.is_active_member ? (
                          <button
                            onClick={() => handleAction(
                              () => deactivateMember(member.user_id),
                              `deactivate-${member.user_id}`,
                              language === "de" ? "Benutzer deaktiviert" : "User deactivated"
                            )}
                            disabled={actionLoading === `deactivate-${member.user_id}`}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={language === "de" ? "Deaktivieren" : "Deactivate"}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(
                              () => reactivateMember(member.user_id),
                              `reactivate-${member.user_id}`,
                              language === "de" ? "Benutzer reaktiviert" : "User reactivated"
                            )}
                            disabled={actionLoading === `reactivate-${member.user_id}`}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={language === "de" ? "Reaktivieren" : "Reactivate"}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const msg = language === "de"
                              ? `Möchten Sie ${member.email} wirklich aus dem Account entfernen?`
                              : `Are you sure you want to remove ${member.email} from the account?`;
                            if (confirm(msg)) {
                              handleAction(
                                () => removeMember(member.user_id),
                                `remove-${member.user_id}`,
                                language === "de" ? "Benutzer entfernt" : "User removed"
                              );
                            }
                          }}
                          disabled={actionLoading === `remove-${member.user_id}`}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={language === "de" ? "Entfernen" : "Remove"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-900">
                  {language === "de" ? `Ausstehende Einladungen (${pendingInvitations.length})` : `Pending Invitations (${pendingInvitations.length})`}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingInvitations.map((inv) => {
                  const isExpired = new Date(inv.expires_at) <= new Date();
                  return (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{inv.invited_email}</p>
                          <p className="text-xs text-gray-500">
                            {language === "de" ? "Eingeladen am" : "Invited on"}{" "}
                            {new Date(inv.created_at).toLocaleDateString(language === "de" ? "de-DE" : "en-US")}
                            {isExpired && (
                              <span className="text-red-500 ml-2">
                                ({language === "de" ? "abgelaufen" : "expired"})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {roleBadge(inv.role)}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAction(
                              () => resendInvitation(inv.id),
                              `resend-${inv.id}`,
                              language === "de" ? "Einladung erneut gesendet" : "Invitation resent"
                            )}
                            disabled={actionLoading === `resend-${inv.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={language === "de" ? "Erneut senden" : "Resend"}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(
                              () => revokeInvitation(inv.id),
                              `revoke-${inv.id}`,
                              language === "de" ? "Einladung widerrufen" : "Invitation revoked"
                            )}
                            disabled={actionLoading === `revoke-${inv.id}`}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={language === "de" ? "Widerrufen" : "Revoke"}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Invitations */}
          {pastInvitations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowInvitations(!showInvitations)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  {language === "de" ? `Einladungsverlauf (${pastInvitations.length})` : `Invitation History (${pastInvitations.length})`}
                </h2>
                {showInvitations ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showInvitations && (
                <div className="divide-y divide-gray-100">
                  {pastInvitations.map((inv) => (
                    <div key={inv.id} className="px-6 py-3 flex items-center justify-between opacity-75">
                      <div className="flex items-center gap-3 min-w-0">
                        <p className="text-sm text-gray-600 truncate">{inv.invited_email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(inv.status)}
                        <span className="text-xs text-gray-400">
                          {new Date(inv.created_at).toLocaleDateString(language === "de" ? "de-DE" : "en-US")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Removed Members */}
          {removedMembers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-500">
                  {language === "de" ? `Entfernte Benutzer (${removedMembers.length})` : `Removed Users (${removedMembers.length})`}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {removedMembers.map((member) => (
                  <div key={member.user_id} className="px-6 py-3 flex items-center justify-between opacity-50">
                    <p className="text-sm text-gray-500 truncate">{member.email}</p>
                    <span className="text-xs text-gray-400">
                      {language === "de" ? "Entfernt am" : "Removed on"}{" "}
                      {member.removed_at ? new Date(member.removed_at).toLocaleDateString(language === "de" ? "de-DE" : "en-US") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeMembers.length === 0 && pendingInvitations.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === "de" ? "Noch keine Benutzer" : "No users yet"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                {language === "de"
                  ? "Laden Sie Teammitglieder ein, um gemeinsam Immobilien zu verwalten. Jeder Benutzer erhält individuelle Zugriffsrechte."
                  : "Invite team members to manage properties together. Each user gets individual access permissions."}
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                {t("settings.users.invite")}
              </button>
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
            setSuccess(language === "de" ? "Einladung erfolgreich versendet" : "Invitation sent successfully");
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
            setSuccess(language === "de" ? "Berechtigungen aktualisiert" : "Permissions updated");
            setTimeout(() => setSuccess(null), 4000);
          }}
        />
      )}
    </div>
  );

  if (!isPro) {
    return (
      <PremiumFeatureGuard featureName={language === "de" ? "Benutzerverwaltung" : "User Management"}>
        {content}
      </PremiumFeatureGuard>
    );
  }

  return content;
}
