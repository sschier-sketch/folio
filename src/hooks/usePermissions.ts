import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import {
  DEFAULT_OWNER_PERMISSIONS,
  SECTION_PERMISSION_MAP,
  resolvePermissions,
  computeCanWrite,
  computeDataOwnerId,
  canAccessSection as canAccessSectionFn,
  canAccessProperty as canAccessPropertyFn,
  filterPropertiesByScope as filterPropertiesByScopeFn,
  filterByPropertyId as filterByPropertyIdFn,
  canWriteProperty as canWritePropertyFn,
} from "../lib/permissions";

export type { UserPermissions, SectionKey, UserSettingsRow } from "../lib/permissions";
export { DEFAULT_OWNER_PERMISSIONS, SECTION_PERMISSION_MAP };

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState(DEFAULT_OWNER_PERMISSIONS);
  const [allowedPropertyIds, setAllowedPropertyIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions(DEFAULT_OWNER_PERMISSIONS);
      setAllowedPropertyIds(null);
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

        const perms = resolvePermissions(data);
        setPermissions(perms);

        if (perms.isMember && perms.propertyScope === "selected") {
          const { data: propAssignments } = await supabase
            .from("account_member_properties")
            .select("property_id")
            .eq("member_user_id", user.id);
          setAllowedPropertyIds(
            (propAssignments || []).map((a) => a.property_id)
          );
        } else {
          setAllowedPropertyIds(null);
        }
      } catch (err) {
        console.error("Error loading permissions:", err);
        setPermissions(DEFAULT_OWNER_PERMISSIONS);
        setAllowedPropertyIds(null);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id]);

  const canWrite = computeCanWrite(permissions);

  const dataOwnerId = computeDataOwnerId(permissions, user?.id || null);

  const canAccessSection = useCallback(
    (section: SectionKey): boolean => canAccessSectionFn(permissions, section),
    [permissions]
  );

  const canAccessProperty = useCallback(
    (propertyId: string): boolean => canAccessPropertyFn(permissions, propertyId, allowedPropertyIds),
    [permissions, allowedPropertyIds]
  );

  const filterPropertiesByScope = useCallback(
    <T extends { id: string }>(properties: T[]): T[] =>
      filterPropertiesByScopeFn(permissions, properties, allowedPropertyIds),
    [permissions, allowedPropertyIds]
  );

  const filterByPropertyId = useCallback(
    <T extends { property_id: string }>(items: T[]): T[] =>
      filterByPropertyIdFn(permissions, items, allowedPropertyIds),
    [permissions, allowedPropertyIds]
  );

  const canWriteProperty = useCallback(
    (propertyId?: string): boolean =>
      canWritePropertyFn(permissions, allowedPropertyIds, propertyId),
    [permissions, allowedPropertyIds]
  );

  return {
    ...permissions,
    loading,
    canWrite,
    dataOwnerId,
    allowedPropertyIds,
    canAccessSection,
    canAccessProperty,
    filterPropertiesByScope,
    filterByPropertyId,
    canWriteProperty,
  };
}
