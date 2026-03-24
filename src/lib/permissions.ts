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
  canViewTasks: boolean;
  propertyScope: string;
  propertyAccess: string;
}

export type SectionKey =
  | "finances"
  | "statements"
  | "rent_payments"
  | "leases"
  | "messages"
  | "tasks"
  | "billing"
  | "users";

export const DEFAULT_OWNER_PERMISSIONS: UserPermissions = {
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
  canViewTasks: true,
  propertyScope: "all",
  propertyAccess: "write",
};

export const SECTION_PERMISSION_MAP: Record<SectionKey, keyof UserPermissions> = {
  finances: "canViewFinances",
  statements: "canViewStatements",
  rent_payments: "canViewRentPayments",
  leases: "canViewLeases",
  messages: "canViewMessages",
  tasks: "canViewTasks",
  billing: "canManageBilling",
  users: "canManageUsers",
};

export interface UserSettingsRow {
  role?: string | null;
  account_owner_id?: string | null;
  is_active_member?: boolean | null;
  is_read_only?: boolean | null;
  can_manage_billing?: boolean | null;
  can_manage_users?: boolean | null;
  can_manage_properties?: boolean | null;
  can_manage_tenants?: boolean | null;
  can_manage_finances?: boolean | null;
  can_view_analytics?: boolean | null;
  can_view_finances?: boolean | null;
  can_view_statements?: boolean | null;
  can_view_rent_payments?: boolean | null;
  can_view_leases?: boolean | null;
  can_view_messages?: boolean | null;
  can_view_tasks?: boolean | null;
  property_scope?: string | null;
  property_access?: string | null;
  removed_at?: string | null;
}

export function resolvePermissions(data: UserSettingsRow | null): UserPermissions {
  if (!data || !data.account_owner_id || data.removed_at) {
    return DEFAULT_OWNER_PERMISSIONS;
  }
  return {
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
    canViewTasks: data.can_view_tasks ?? true,
    propertyScope: data.property_scope || "all",
    propertyAccess: data.property_access || "write",
  };
}

export function computeCanWrite(permissions: UserPermissions): boolean {
  return !permissions.isReadOnly && permissions.propertyAccess === "write";
}

export function computeDataOwnerId(
  permissions: UserPermissions,
  userId: string | null
): string | null {
  return permissions.isMember && permissions.accountOwnerId
    ? permissions.accountOwnerId
    : userId || null;
}

export function canAccessSection(
  permissions: UserPermissions,
  section: SectionKey
): boolean {
  if (permissions.isOwner) return true;
  if (!permissions.isActiveMember) return false;
  if (section === "billing") return permissions.canManageBilling;
  if (section === "users") return permissions.canManageUsers;
  return permissions[SECTION_PERMISSION_MAP[section]] as boolean;
}

export function canAccessProperty(
  permissions: UserPermissions,
  propertyId: string,
  allowedPropertyIds: string[] | null
): boolean {
  if (permissions.isOwner) return true;
  if (!permissions.isActiveMember) return false;
  if (permissions.propertyScope === "all") return true;
  if (!allowedPropertyIds) return false;
  return allowedPropertyIds.includes(propertyId);
}

export function filterPropertiesByScope<T extends { id: string }>(
  permissions: UserPermissions,
  properties: T[],
  allowedPropertyIds: string[] | null
): T[] {
  if (permissions.isOwner || permissions.propertyScope === "all") return properties;
  if (!allowedPropertyIds) return [];
  return properties.filter((p) => allowedPropertyIds.includes(p.id));
}

export function filterByPropertyId<T extends { property_id: string }>(
  permissions: UserPermissions,
  items: T[],
  allowedPropertyIds: string[] | null
): T[] {
  if (permissions.isOwner || permissions.propertyScope === "all") return items;
  if (!allowedPropertyIds) return [];
  return items.filter((item) => allowedPropertyIds.includes(item.property_id));
}

export function canWriteProperty(
  permissions: UserPermissions,
  allowedPropertyIds: string[] | null,
  propertyId?: string
): boolean {
  if (permissions.isOwner) return true;
  if (!permissions.isActiveMember) return false;
  if (permissions.isReadOnly) return false;
  if (permissions.propertyAccess !== "write") return false;
  if (propertyId && permissions.propertyScope === "selected") {
    if (!allowedPropertyIds) return false;
    return allowedPropertyIds.includes(propertyId);
  }
  return true;
}

export function isNavHidden(
  permissions: UserPermissions & { loading?: boolean },
  id: string
): boolean {
  if (permissions.isOwner || permissions.loading) return false;
  if (!permissions.isActiveMember && permissions.isMember) return true;
  switch (id) {
    case "payments": return !permissions.canViewRentPayments;
    case "financial": return !permissions.canViewFinances;
    case "billing": return !permissions.canViewStatements;
    case "tenants": return !permissions.canViewLeases;
    case "messages": return !permissions.canViewMessages;
    case "tasks": return !permissions.canViewTasks;
    default: return false;
  }
}
