import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export interface UserPermissions {
  role: string;
  isOwner: boolean;
  isMember: boolean;
  accountOwnerId: string | null;
  isActiveMember: boolean;
  isReadOnly: boolean;
  canManageBilling: boolean;
  canManageUsers: boolean;
  canManageProperties: boolean;
  canManageTenants: boolean;
  canManageFinances: boolean;
  canViewAnalytics: boolean;
  canViewFinances: boolean;
  canViewStatements: boolean;
  canViewRentPayments: boolean;
  canViewLeases: boolean;
  canViewMessages: boolean;
  propertyScope: string;
  propertyAccess: string;
}

const DEFAULT_OWNER_PERMISSIONS: UserPermissions = {
  role: "owner",
  isOwner: true,
  isMember: false,
  accountOwnerId: null,
  isActiveMember: true,
  isReadOnly: false,
  canManageBilling: true,
  canManageUsers: true,
  canManageProperties: true,
  canManageTenants: true,
  canManageFinances: true,
  canViewAnalytics: true,
  canViewFinances: true,
  canViewStatements: true,
  canViewRentPayments: true,
  canViewLeases: true,
  canViewMessages: true,
  propertyScope: "all",
  propertyAccess: "write",
};

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_OWNER_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions(DEFAULT_OWNER_PERMISSIONS);
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select(
            "role, account_owner_id, is_active_member, is_read_only, " +
            "can_manage_billing, can_manage_users, can_manage_properties, " +
            "can_manage_tenants, can_manage_finances, can_view_analytics, " +
            "can_view_finances, can_view_statements, can_view_rent_payments, " +
            "can_view_leases, can_view_messages, property_scope, property_access, removed_at"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (!data || !data.account_owner_id) {
          setPermissions(DEFAULT_OWNER_PERMISSIONS);
        } else {
          setPermissions({
            role: data.role || "member",
            isOwner: false,
            isMember: true,
            accountOwnerId: data.account_owner_id,
            isActiveMember: data.is_active_member ?? true,
            isReadOnly: data.is_read_only ?? false,
            canManageBilling: data.can_manage_billing ?? false,
            canManageUsers: data.can_manage_users ?? false,
            canManageProperties: data.can_manage_properties ?? true,
            canManageTenants: data.can_manage_tenants ?? true,
            canManageFinances: data.can_manage_finances ?? true,
            canViewAnalytics: data.can_view_analytics ?? true,
            canViewFinances: data.can_view_finances ?? false,
            canViewStatements: data.can_view_statements ?? false,
            canViewRentPayments: data.can_view_rent_payments ?? false,
            canViewLeases: data.can_view_leases ?? false,
            canViewMessages: data.can_view_messages ?? false,
            propertyScope: data.property_scope || "all",
            propertyAccess: data.property_access || "write",
          });
        }
      } catch (err) {
        console.error("Error loading permissions:", err);
        setPermissions(DEFAULT_OWNER_PERMISSIONS);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id]);

  const canWrite = !permissions.isReadOnly && permissions.propertyAccess === "write";

  return {
    ...permissions,
    loading,
    canWrite,
  };
}
