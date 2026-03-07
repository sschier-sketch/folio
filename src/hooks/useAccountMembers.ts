import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface AccountMember {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active_member: boolean;
  is_read_only: boolean;
  can_manage_billing: boolean;
  can_manage_users: boolean;
  can_manage_properties: boolean;
  can_manage_tenants: boolean;
  can_manage_finances: boolean;
  can_view_analytics: boolean;
  can_view_finances: boolean;
  can_view_statements: boolean;
  can_view_rent_payments: boolean;
  can_view_leases: boolean;
  can_view_messages: boolean;
  property_scope: string;
  property_access: string;
  removed_at: string | null;
  joined_at: string;
  last_sign_in: string | null;
  avatar_url: string | null;
}

export interface AccountInvitation {
  id: string;
  account_owner_id: string;
  invited_email: string;
  invited_by: string;
  token: string;
  status: string;
  expires_at: string;
  role: string;
  is_read_only: boolean;
  can_manage_billing: boolean;
  can_manage_users: boolean;
  can_manage_properties: boolean;
  can_manage_tenants: boolean;
  can_manage_finances: boolean;
  can_view_analytics: boolean;
  can_view_finances: boolean;
  can_view_statements: boolean;
  can_view_rent_payments: boolean;
  can_view_leases: boolean;
  can_view_messages: boolean;
  property_scope: string;
  property_access: string;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export function useAccountMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountOwnerId, setAccountOwnerId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("account_owner_id, role, can_manage_users")
        .eq("user_id", user.id)
        .maybeSingle();

      let ownerId: string;
      if (!settings?.account_owner_id && settings?.role === "owner") {
        ownerId = user.id;
      } else if (settings?.account_owner_id && settings.can_manage_users) {
        ownerId = settings.account_owner_id;
      } else {
        setLoading(false);
        return;
      }

      setAccountOwnerId(ownerId);

      const [membersResult, invitationsResult] = await Promise.all([
        supabase.rpc("get_account_members", { p_account_owner_id: ownerId }),
        supabase
          .from("account_invitations")
          .select("*")
          .eq("account_owner_id", ownerId)
          .order("created_at", { ascending: false }),
      ]);

      if (membersResult.data) {
        setMembers(membersResult.data);
      }

      if (invitationsResult.data) {
        setInvitations(invitationsResult.data);
      }
    } catch (err) {
      console.error("Error loading account members:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const inviteMember = async (payload: {
    email: string;
    role: string;
    is_read_only: boolean;
    can_manage_billing: boolean;
    can_manage_users: boolean;
    can_manage_properties: boolean;
    can_manage_tenants: boolean;
    can_manage_finances: boolean;
    can_view_analytics: boolean;
    can_view_finances: boolean;
    can_view_statements: boolean;
    can_view_rent_payments: boolean;
    can_view_leases: boolean;
    can_view_messages: boolean;
    property_scope: string;
    property_access: string;
    property_ids: string[];
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Nicht eingeloggt");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-account-member`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Einladung fehlgeschlagen");
    }

    await loadData();
    return result;
  };

  const resendInvitation = async (invitationId: string) => {
    const invitation = invitations.find((i) => i.id === invitationId);
    if (!invitation) throw new Error("Einladung nicht gefunden");

    await supabase
      .from("account_invitations")
      .update({ status: "revoked", revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", invitationId);

    await supabase.rpc("log_user_management_action", {
      p_actor_user_id: user!.id,
      p_event_type: "invitation_resent",
      p_description: "Einladung erneut gesendet",
      p_target_email: invitation.invited_email,
    }).catch(() => {});

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Nicht eingeloggt");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-account-member`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: invitation.invited_email,
          role: invitation.role,
          is_read_only: invitation.is_read_only,
          can_manage_billing: invitation.can_manage_billing,
          can_manage_users: invitation.can_manage_users,
          can_manage_properties: invitation.can_manage_properties,
          can_manage_tenants: invitation.can_manage_tenants,
          can_manage_finances: invitation.can_manage_finances,
          can_view_analytics: invitation.can_view_analytics,
          can_view_finances: invitation.can_view_finances,
          can_view_statements: invitation.can_view_statements,
          can_view_rent_payments: invitation.can_view_rent_payments,
          can_view_leases: invitation.can_view_leases,
          can_view_messages: invitation.can_view_messages,
          property_scope: invitation.property_scope,
          property_access: invitation.property_access,
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Einladung konnte nicht erneut gesendet werden");
    }

    await loadData();
    return result;
  };

  const revokeInvitation = async (invitationId: string) => {
    const inv = invitations.find((i) => i.id === invitationId);

    const { error } = await supabase
      .from("account_invitations")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (error) throw error;

    await supabase.rpc("log_user_management_action", {
      p_actor_user_id: user!.id,
      p_event_type: "invitation_revoked",
      p_description: "Einladung widerrufen",
      p_target_email: inv?.invited_email || null,
    }).catch(() => {});

    await loadData();
  };

  const deactivateMember = async (memberUserId: string) => {
    const { error } = await supabase.rpc("deactivate_account_member", {
      p_member_user_id: memberUserId,
    });
    if (error) throw error;
    await loadData();
  };

  const reactivateMember = async (memberUserId: string) => {
    const { error } = await supabase.rpc("reactivate_account_member", {
      p_member_user_id: memberUserId,
    });
    if (error) throw error;
    await loadData();
  };

  const removeMember = async (memberUserId: string) => {
    const { error } = await supabase.rpc("remove_account_member", {
      p_member_user_id: memberUserId,
    });
    if (error) throw error;
    await loadData();
  };

  const updateMemberPermissions = async (
    memberUserId: string,
    permissions: Record<string, unknown>
  ) => {
    const { error } = await supabase.rpc("update_account_member_permissions", {
      p_member_user_id: memberUserId,
      ...permissions,
    });
    if (error) throw error;
    await loadData();
  };

  const updateInvitationPermissions = async (
    invitationId: string,
    permissions: Record<string, unknown>
  ) => {
    const { error } = await supabase
      .from("account_invitations")
      .update({
        ...permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);
    if (error) throw error;
    await loadData();
  };

  return {
    members,
    invitations,
    loading,
    accountOwnerId,
    inviteMember,
    resendInvitation,
    revokeInvitation,
    deactivateMember,
    reactivateMember,
    removeMember,
    updateMemberPermissions,
    updateInvitationPermissions,
    refresh: loadData,
  };
}
