import { describe, it, expect } from "vitest";
import {
  DEFAULT_OWNER_PERMISSIONS,
  resolvePermissions,
  computeCanWrite,
  computeDataOwnerId,
  canAccessSection,
  canAccessProperty,
  filterPropertiesByScope,
  filterByPropertyId,
  canWriteProperty,
  isNavHidden,
  type UserPermissions,
  type UserSettingsRow,
} from "../permissions";

function makeMember(overrides: Partial<UserPermissions> = {}): UserPermissions {
  return {
    role: "member",
    isOwner: false,
    isMember: true,
    accountOwnerId: "owner-uuid",
    isActiveMember: true,
    isReadOnly: false,
    canManageBilling: false,
    canManageUsers: false,
    canManageProperties: true,
    canManageTenants: true,
    canManageFinances: true,
    canViewAnalytics: true,
    canViewFinances: false,
    canViewStatements: false,
    canViewRentPayments: false,
    canViewLeases: false,
    canViewMessages: false,
    propertyScope: "all",
    propertyAccess: "write",
    ...overrides,
  };
}

describe("resolvePermissions", () => {
  it("returns owner defaults when data is null", () => {
    expect(resolvePermissions(null)).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("returns owner defaults when account_owner_id is null (owner user)", () => {
    const row: UserSettingsRow = {
      role: "owner",
      account_owner_id: null,
      is_active_member: true,
    };
    expect(resolvePermissions(row)).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("returns owner defaults when removed_at is set (removed member)", () => {
    const row: UserSettingsRow = {
      role: "member",
      account_owner_id: "owner-uuid",
      is_active_member: true,
      removed_at: "2024-01-01T00:00:00Z",
    };
    expect(resolvePermissions(row)).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("returns member permissions when account_owner_id is present", () => {
    const row: UserSettingsRow = {
      role: "editor",
      account_owner_id: "owner-uuid",
      is_active_member: true,
      is_read_only: false,
      can_manage_billing: true,
      can_manage_users: false,
      can_view_finances: true,
      can_view_statements: true,
      can_view_rent_payments: true,
      can_view_leases: true,
      can_view_messages: true,
      property_scope: "all",
      property_access: "write",
    };
    const result = resolvePermissions(row);
    expect(result.isOwner).toBe(false);
    expect(result.isMember).toBe(true);
    expect(result.role).toBe("editor");
    expect(result.accountOwnerId).toBe("owner-uuid");
    expect(result.canManageBilling).toBe(true);
    expect(result.canManageUsers).toBe(false);
    expect(result.canViewFinances).toBe(true);
  });

  it("applies correct defaults for null permission fields", () => {
    const row: UserSettingsRow = {
      role: null,
      account_owner_id: "owner-uuid",
      is_active_member: null,
      is_read_only: null,
      can_manage_billing: null,
      can_manage_users: null,
      can_manage_properties: null,
      can_manage_tenants: null,
      can_manage_finances: null,
      can_view_analytics: null,
      can_view_finances: null,
      can_view_statements: null,
      can_view_rent_payments: null,
      can_view_leases: null,
      can_view_messages: null,
      property_scope: null,
      property_access: null,
    };
    const result = resolvePermissions(row);
    expect(result.role).toBe("member");
    expect(result.isActiveMember).toBe(true);
    expect(result.isReadOnly).toBe(false);
    expect(result.canManageBilling).toBe(false);
    expect(result.canManageUsers).toBe(false);
    expect(result.canManageProperties).toBe(true);
    expect(result.canManageTenants).toBe(true);
    expect(result.canManageFinances).toBe(true);
    expect(result.canViewAnalytics).toBe(true);
    expect(result.canViewFinances).toBe(false);
    expect(result.canViewStatements).toBe(false);
    expect(result.canViewRentPayments).toBe(false);
    expect(result.canViewLeases).toBe(false);
    expect(result.canViewMessages).toBe(false);
    expect(result.propertyScope).toBe("all");
    expect(result.propertyAccess).toBe("write");
  });
});

describe("computeCanWrite", () => {
  it("returns true for owner", () => {
    expect(computeCanWrite(DEFAULT_OWNER_PERMISSIONS)).toBe(true);
  });

  it("returns false for read-only member", () => {
    expect(computeCanWrite(makeMember({ isReadOnly: true }))).toBe(false);
  });

  it("returns false for member with read-only property access", () => {
    expect(computeCanWrite(makeMember({ propertyAccess: "read" }))).toBe(false);
  });

  it("returns true for writable member", () => {
    expect(computeCanWrite(makeMember({ isReadOnly: false, propertyAccess: "write" }))).toBe(true);
  });
});

describe("computeDataOwnerId", () => {
  it("returns user's own ID for owner", () => {
    expect(computeDataOwnerId(DEFAULT_OWNER_PERMISSIONS, "my-user-id")).toBe("my-user-id");
  });

  it("returns account owner ID for member", () => {
    expect(computeDataOwnerId(makeMember({ accountOwnerId: "owner-uuid" }), "member-uuid")).toBe("owner-uuid");
  });

  it("returns null when no user and no owner", () => {
    expect(computeDataOwnerId(DEFAULT_OWNER_PERMISSIONS, null)).toBe(null);
  });

  it("returns member's own account owner ID even when member userId is null", () => {
    expect(computeDataOwnerId(makeMember({ accountOwnerId: "owner-uuid" }), null)).toBe("owner-uuid");
  });
});

describe("canAccessSection", () => {
  it("owner can access all sections", () => {
    const sections = ["finances", "statements", "rent_payments", "leases", "messages", "billing", "users"] as const;
    for (const section of sections) {
      expect(canAccessSection(DEFAULT_OWNER_PERMISSIONS, section)).toBe(true);
    }
  });

  it("inactive member cannot access any section", () => {
    const member = makeMember({ isActiveMember: false });
    expect(canAccessSection(member, "finances")).toBe(false);
    expect(canAccessSection(member, "billing")).toBe(false);
    expect(canAccessSection(member, "users")).toBe(false);
  });

  it("active member can only access sections they have permission for", () => {
    const member = makeMember({
      canViewFinances: true,
      canViewStatements: false,
      canViewRentPayments: true,
      canViewLeases: false,
      canViewMessages: true,
      canManageBilling: false,
      canManageUsers: false,
    });
    expect(canAccessSection(member, "finances")).toBe(true);
    expect(canAccessSection(member, "statements")).toBe(false);
    expect(canAccessSection(member, "rent_payments")).toBe(true);
    expect(canAccessSection(member, "leases")).toBe(false);
    expect(canAccessSection(member, "messages")).toBe(true);
    expect(canAccessSection(member, "billing")).toBe(false);
    expect(canAccessSection(member, "users")).toBe(false);
  });

  it("member with billing permission can access billing section", () => {
    const member = makeMember({ canManageBilling: true });
    expect(canAccessSection(member, "billing")).toBe(true);
  });

  it("member with users permission can access users section", () => {
    const member = makeMember({ canManageUsers: true });
    expect(canAccessSection(member, "users")).toBe(true);
  });
});

describe("canAccessProperty", () => {
  it("owner can access any property", () => {
    expect(canAccessProperty(DEFAULT_OWNER_PERMISSIONS, "any-prop-id", null)).toBe(true);
  });

  it("inactive member cannot access any property", () => {
    const member = makeMember({ isActiveMember: false });
    expect(canAccessProperty(member, "any-prop-id", null)).toBe(false);
  });

  it("member with all scope can access any property", () => {
    const member = makeMember({ propertyScope: "all" });
    expect(canAccessProperty(member, "any-prop-id", null)).toBe(true);
  });

  it("member with selected scope can only access assigned properties", () => {
    const member = makeMember({ propertyScope: "selected" });
    const allowed = ["prop-1", "prop-2"];
    expect(canAccessProperty(member, "prop-1", allowed)).toBe(true);
    expect(canAccessProperty(member, "prop-3", allowed)).toBe(false);
  });

  it("member with selected scope and null allowed list cannot access any property", () => {
    const member = makeMember({ propertyScope: "selected" });
    expect(canAccessProperty(member, "prop-1", null)).toBe(false);
  });
});

describe("filterPropertiesByScope", () => {
  const properties = [
    { id: "p1", name: "Haus A" },
    { id: "p2", name: "Haus B" },
    { id: "p3", name: "Haus C" },
  ];

  it("owner sees all properties", () => {
    expect(filterPropertiesByScope(DEFAULT_OWNER_PERMISSIONS, properties, null)).toEqual(properties);
  });

  it("member with all scope sees all properties", () => {
    const member = makeMember({ propertyScope: "all" });
    expect(filterPropertiesByScope(member, properties, null)).toEqual(properties);
  });

  it("member with selected scope sees only assigned properties", () => {
    const member = makeMember({ propertyScope: "selected" });
    const result = filterPropertiesByScope(member, properties, ["p1", "p3"]);
    expect(result).toEqual([{ id: "p1", name: "Haus A" }, { id: "p3", name: "Haus C" }]);
  });

  it("member with selected scope and empty allowed list sees nothing", () => {
    const member = makeMember({ propertyScope: "selected" });
    expect(filterPropertiesByScope(member, properties, [])).toEqual([]);
  });

  it("member with selected scope and null allowed list sees nothing", () => {
    const member = makeMember({ propertyScope: "selected" });
    expect(filterPropertiesByScope(member, properties, null)).toEqual([]);
  });
});

describe("filterByPropertyId", () => {
  const items = [
    { property_id: "p1", amount: 100 },
    { property_id: "p2", amount: 200 },
    { property_id: "p3", amount: 300 },
  ];

  it("owner sees all items", () => {
    expect(filterByPropertyId(DEFAULT_OWNER_PERMISSIONS, items, null)).toEqual(items);
  });

  it("member with all scope sees all items", () => {
    const member = makeMember({ propertyScope: "all" });
    expect(filterByPropertyId(member, items, null)).toEqual(items);
  });

  it("member with selected scope sees only items for assigned properties", () => {
    const member = makeMember({ propertyScope: "selected" });
    const result = filterByPropertyId(member, items, ["p2"]);
    expect(result).toEqual([{ property_id: "p2", amount: 200 }]);
  });

  it("member with selected scope and empty allowed list sees nothing", () => {
    const member = makeMember({ propertyScope: "selected" });
    expect(filterByPropertyId(member, items, [])).toEqual([]);
  });
});

describe("canWriteProperty", () => {
  it("owner can write any property", () => {
    expect(canWriteProperty(DEFAULT_OWNER_PERMISSIONS, null, "any-prop")).toBe(true);
  });

  it("inactive member cannot write", () => {
    const member = makeMember({ isActiveMember: false });
    expect(canWriteProperty(member, null)).toBe(false);
  });

  it("read-only member cannot write", () => {
    const member = makeMember({ isReadOnly: true });
    expect(canWriteProperty(member, null)).toBe(false);
  });

  it("member with read property access cannot write", () => {
    const member = makeMember({ propertyAccess: "read" });
    expect(canWriteProperty(member, null)).toBe(false);
  });

  it("writable member with all scope can write any property", () => {
    const member = makeMember({ propertyAccess: "write", propertyScope: "all" });
    expect(canWriteProperty(member, null, "any-prop")).toBe(true);
  });

  it("writable member with selected scope can write assigned property", () => {
    const member = makeMember({ propertyAccess: "write", propertyScope: "selected" });
    expect(canWriteProperty(member, ["p1", "p2"], "p1")).toBe(true);
  });

  it("writable member with selected scope cannot write unassigned property", () => {
    const member = makeMember({ propertyAccess: "write", propertyScope: "selected" });
    expect(canWriteProperty(member, ["p1", "p2"], "p3")).toBe(false);
  });

  it("writable member with selected scope and no allowed list cannot write specific property", () => {
    const member = makeMember({ propertyAccess: "write", propertyScope: "selected" });
    expect(canWriteProperty(member, null, "p1")).toBe(false);
  });

  it("writable member with selected scope can write when no propertyId specified", () => {
    const member = makeMember({ propertyAccess: "write", propertyScope: "selected" });
    expect(canWriteProperty(member, ["p1"])).toBe(true);
  });
});

describe("isNavHidden", () => {
  it("never hides nav items for owner", () => {
    const owner = { ...DEFAULT_OWNER_PERMISSIONS, loading: false };
    expect(isNavHidden(owner, "payments")).toBe(false);
    expect(isNavHidden(owner, "financial")).toBe(false);
    expect(isNavHidden(owner, "billing")).toBe(false);
    expect(isNavHidden(owner, "tenants")).toBe(false);
    expect(isNavHidden(owner, "messages")).toBe(false);
    expect(isNavHidden(owner, "home")).toBe(false);
    expect(isNavHidden(owner, "properties")).toBe(false);
  });

  it("never hides nav items while loading", () => {
    const member = { ...makeMember({ canViewRentPayments: false }), loading: true };
    expect(isNavHidden(member, "payments")).toBe(false);
  });

  it("hides all items for inactive member", () => {
    const member = { ...makeMember({ isActiveMember: false }), loading: false };
    expect(isNavHidden(member, "payments")).toBe(true);
    expect(isNavHidden(member, "financial")).toBe(true);
    expect(isNavHidden(member, "billing")).toBe(true);
    expect(isNavHidden(member, "tenants")).toBe(true);
    expect(isNavHidden(member, "messages")).toBe(true);
    expect(isNavHidden(member, "home")).toBe(true);
  });

  it("hides payments for member without canViewRentPayments", () => {
    const member = { ...makeMember({ canViewRentPayments: false }), loading: false };
    expect(isNavHidden(member, "payments")).toBe(true);
  });

  it("shows payments for member with canViewRentPayments", () => {
    const member = { ...makeMember({ canViewRentPayments: true }), loading: false };
    expect(isNavHidden(member, "payments")).toBe(false);
  });

  it("hides financial for member without canViewFinances", () => {
    const member = { ...makeMember({ canViewFinances: false }), loading: false };
    expect(isNavHidden(member, "financial")).toBe(true);
  });

  it("hides billing for member without canViewStatements", () => {
    const member = { ...makeMember({ canViewStatements: false }), loading: false };
    expect(isNavHidden(member, "billing")).toBe(true);
  });

  it("hides tenants for member without canViewLeases", () => {
    const member = { ...makeMember({ canViewLeases: false }), loading: false };
    expect(isNavHidden(member, "tenants")).toBe(true);
  });

  it("hides messages for member without canViewMessages", () => {
    const member = { ...makeMember({ canViewMessages: false }), loading: false };
    expect(isNavHidden(member, "messages")).toBe(true);
  });

  it("does not hide unguarded nav items (home, properties, documents, templates, mieterportal)", () => {
    const member = { ...makeMember(), loading: false };
    expect(isNavHidden(member, "home")).toBe(false);
    expect(isNavHidden(member, "properties")).toBe(false);
    expect(isNavHidden(member, "documents")).toBe(false);
    expect(isNavHidden(member, "templates")).toBe(false);
    expect(isNavHidden(member, "mieterportal")).toBe(false);
  });
});
