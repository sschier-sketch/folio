import { describe, it, expect } from "vitest";
import {
  resolvePermissions,
  computeCanWrite,
  computeDataOwnerId,
  canAccessSection,
  canAccessProperty,
  filterPropertiesByScope,
  filterByPropertyId,
  canWriteProperty,
  isNavHidden,
  DEFAULT_OWNER_PERMISSIONS,
  type UserPermissions,
  type UserSettingsRow,
} from "../permissions";

const OWNER_USER_ID = "owner-aaa-bbb-ccc";
const MEMBER_USER_ID = "member-xxx-yyy-zzz";

function memberRow(overrides: Partial<UserSettingsRow> = {}): UserSettingsRow {
  return {
    role: "member",
    account_owner_id: OWNER_USER_ID,
    is_active_member: true,
    is_read_only: false,
    can_manage_billing: false,
    can_manage_users: false,
    can_manage_properties: true,
    can_manage_tenants: true,
    can_manage_finances: true,
    can_view_analytics: true,
    can_view_finances: true,
    can_view_statements: true,
    can_view_rent_payments: true,
    can_view_leases: true,
    can_view_messages: true,
    property_scope: "all",
    property_access: "write",
    ...overrides,
  };
}

const PROPERTIES = [
  { id: "prop-1", name: "Berlin Apt" },
  { id: "prop-2", name: "Munich House" },
  { id: "prop-3", name: "Hamburg Flat" },
];

const RENT_ITEMS = [
  { property_id: "prop-1", amount: 800 },
  { property_id: "prop-2", amount: 1200 },
  { property_id: "prop-3", amount: 950 },
];

describe("Scenario A: Subuser with full access (no billing)", () => {
  const row = memberRow({
    can_manage_billing: false,
    can_manage_users: false,
    can_view_finances: true,
    can_view_statements: true,
    can_view_rent_payments: true,
    can_view_leases: true,
    can_view_messages: true,
  });
  const perms = resolvePermissions(row);

  it("resolves as member, not owner", () => {
    expect(perms.isOwner).toBe(false);
    expect(perms.isMember).toBe(true);
  });

  it("dataOwnerId resolves to account owner, not member", () => {
    expect(computeDataOwnerId(perms, MEMBER_USER_ID)).toBe(OWNER_USER_ID);
  });

  it("can write", () => {
    expect(computeCanWrite(perms)).toBe(true);
  });

  it("can access allowed sections", () => {
    expect(canAccessSection(perms, "finances")).toBe(true);
    expect(canAccessSection(perms, "statements")).toBe(true);
    expect(canAccessSection(perms, "rent_payments")).toBe(true);
    expect(canAccessSection(perms, "leases")).toBe(true);
    expect(canAccessSection(perms, "messages")).toBe(true);
  });

  it("cannot access billing and users sections", () => {
    expect(canAccessSection(perms, "billing")).toBe(false);
    expect(canAccessSection(perms, "users")).toBe(false);
  });

  it("nav hides billing tab (canViewStatements true but canManageBilling false does not affect billing nav)", () => {
    const navPerms = { ...perms, loading: false };
    expect(isNavHidden(navPerms, "billing")).toBe(false);
    expect(isNavHidden(navPerms, "payments")).toBe(false);
    expect(isNavHidden(navPerms, "financial")).toBe(false);
    expect(isNavHidden(navPerms, "tenants")).toBe(false);
    expect(isNavHidden(navPerms, "messages")).toBe(false);
  });

  it("sees all properties", () => {
    expect(filterPropertiesByScope(perms, PROPERTIES, null)).toEqual(PROPERTIES);
    expect(filterByPropertyId(perms, RENT_ITEMS, null)).toEqual(RENT_ITEMS);
  });
});

describe("Scenario B: Read-only subuser", () => {
  const row = memberRow({
    is_read_only: true,
    property_access: "read",
    can_view_finances: true,
    can_view_statements: true,
    can_view_rent_payments: true,
    can_view_leases: true,
    can_view_messages: true,
  });
  const perms = resolvePermissions(row);

  it("cannot write", () => {
    expect(computeCanWrite(perms)).toBe(false);
  });

  it("canWriteProperty returns false for any property", () => {
    expect(canWriteProperty(perms, null)).toBe(false);
    expect(canWriteProperty(perms, ["prop-1"], "prop-1")).toBe(false);
  });

  it("can still access view sections", () => {
    expect(canAccessSection(perms, "finances")).toBe(true);
    expect(canAccessSection(perms, "leases")).toBe(true);
  });

  it("sees all properties (read-only is about writing, not viewing)", () => {
    expect(filterPropertiesByScope(perms, PROPERTIES, null)).toEqual(PROPERTIES);
  });
});

describe("Scenario C: Subuser with access to 1 of 3 properties", () => {
  const row = memberRow({
    property_scope: "selected",
    can_view_finances: true,
    can_view_rent_payments: true,
    can_view_leases: true,
  });
  const perms = resolvePermissions(row);
  const allowed = ["prop-2"];

  it("sees only assigned property", () => {
    const visible = filterPropertiesByScope(perms, PROPERTIES, allowed);
    expect(visible).toEqual([{ id: "prop-2", name: "Munich House" }]);
  });

  it("sees only rent items for assigned property", () => {
    const visible = filterByPropertyId(perms, RENT_ITEMS, allowed);
    expect(visible).toEqual([{ property_id: "prop-2", amount: 1200 }]);
  });

  it("can access assigned property", () => {
    expect(canAccessProperty(perms, "prop-2", allowed)).toBe(true);
  });

  it("cannot access unassigned property", () => {
    expect(canAccessProperty(perms, "prop-1", allowed)).toBe(false);
    expect(canAccessProperty(perms, "prop-3", allowed)).toBe(false);
  });

  it("can write only to assigned property", () => {
    expect(canWriteProperty(perms, allowed, "prop-2")).toBe(true);
    expect(canWriteProperty(perms, allowed, "prop-1")).toBe(false);
  });
});

describe("Scenario D: Subuser without finance permission", () => {
  const row = memberRow({
    can_view_finances: false,
    can_view_statements: false,
    can_view_rent_payments: false,
    can_view_leases: true,
    can_view_messages: true,
  });
  const perms = resolvePermissions(row);

  it("cannot access finance sections", () => {
    expect(canAccessSection(perms, "finances")).toBe(false);
    expect(canAccessSection(perms, "statements")).toBe(false);
    expect(canAccessSection(perms, "rent_payments")).toBe(false);
  });

  it("can access other sections", () => {
    expect(canAccessSection(perms, "leases")).toBe(true);
    expect(canAccessSection(perms, "messages")).toBe(true);
  });

  it("hides financial nav items", () => {
    const navPerms = { ...perms, loading: false };
    expect(isNavHidden(navPerms, "financial")).toBe(true);
    expect(isNavHidden(navPerms, "payments")).toBe(true);
    expect(isNavHidden(navPerms, "billing")).toBe(true);
  });
});

describe("Scenario E: Subuser without user management permission", () => {
  const row = memberRow({
    can_manage_users: false,
    can_manage_billing: false,
  });
  const perms = resolvePermissions(row);

  it("cannot access users section", () => {
    expect(canAccessSection(perms, "users")).toBe(false);
  });

  it("cannot access billing section", () => {
    expect(canAccessSection(perms, "billing")).toBe(false);
  });
});

describe("Scenario F: Deactivated member", () => {
  const row = memberRow({ is_active_member: false });
  const perms = resolvePermissions(row);

  it("cannot access any section", () => {
    expect(canAccessSection(perms, "finances")).toBe(false);
    expect(canAccessSection(perms, "statements")).toBe(false);
    expect(canAccessSection(perms, "leases")).toBe(false);
    expect(canAccessSection(perms, "messages")).toBe(false);
    expect(canAccessSection(perms, "billing")).toBe(false);
    expect(canAccessSection(perms, "users")).toBe(false);
  });

  it("cannot access any property", () => {
    expect(canAccessProperty(perms, "prop-1", ["prop-1"])).toBe(false);
  });

  it("cannot write", () => {
    expect(canWriteProperty(perms, null)).toBe(false);
  });

  it("all nav items hidden", () => {
    const navPerms = { ...perms, loading: false };
    expect(isNavHidden(navPerms, "payments")).toBe(true);
    expect(isNavHidden(navPerms, "financial")).toBe(true);
    expect(isNavHidden(navPerms, "tenants")).toBe(true);
    expect(isNavHidden(navPerms, "messages")).toBe(true);
    expect(isNavHidden(navPerms, "billing")).toBe(true);
    expect(isNavHidden(navPerms, "home")).toBe(true);
    expect(isNavHidden(navPerms, "properties")).toBe(true);
  });
});

describe("Scenario G: Removed member (removed_at set)", () => {
  const row = memberRow({ removed_at: "2024-06-01T00:00:00Z" });
  const perms = resolvePermissions(row);

  it("falls back to owner permissions (treated as fresh user)", () => {
    expect(perms.isOwner).toBe(true);
    expect(perms.isMember).toBe(false);
  });

  it("dataOwnerId is user's own ID, not account owner", () => {
    expect(computeDataOwnerId(perms, MEMBER_USER_ID)).toBe(MEMBER_USER_ID);
  });
});

describe("Scenario H: Owner regression - permissions never block owner", () => {
  const ownerRow: UserSettingsRow = {
    role: "owner",
    account_owner_id: null,
    is_active_member: true,
  };
  const perms = resolvePermissions(ownerRow);

  it("resolves as owner with full permissions", () => {
    expect(perms).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("dataOwnerId is owner's own user ID", () => {
    expect(computeDataOwnerId(perms, OWNER_USER_ID)).toBe(OWNER_USER_ID);
  });

  it("can write", () => {
    expect(computeCanWrite(perms)).toBe(true);
  });

  it("can access all sections", () => {
    const sections = ["finances", "statements", "rent_payments", "leases", "messages", "billing", "users"] as const;
    for (const s of sections) {
      expect(canAccessSection(perms, s)).toBe(true);
    }
  });

  it("no nav items hidden", () => {
    const navPerms = { ...perms, loading: false };
    const ids = ["home", "properties", "tenants", "payments", "messages", "financial", "billing", "documents", "templates"];
    for (const id of ids) {
      expect(isNavHidden(navPerms, id)).toBe(false);
    }
  });

  it("can access and write all properties", () => {
    expect(canAccessProperty(perms, "any-id", null)).toBe(true);
    expect(canWriteProperty(perms, null, "any-id")).toBe(true);
  });

  it("sees all properties and items unfiltered", () => {
    expect(filterPropertiesByScope(perms, PROPERTIES, null)).toEqual(PROPERTIES);
    expect(filterByPropertyId(perms, RENT_ITEMS, null)).toEqual(RENT_ITEMS);
  });
});

describe("Edge cases", () => {
  it("member with accountOwnerId but empty string role defaults to 'member'", () => {
    const row = memberRow({ role: "" });
    const perms = resolvePermissions(row);
    expect(perms.role).toBe("member");
  });

  it("empty property list returns empty after filtering", () => {
    const perms = resolvePermissions(memberRow({ property_scope: "selected" }));
    expect(filterPropertiesByScope(perms, [], ["prop-1"])).toEqual([]);
  });

  it("empty items list returns empty after filtering", () => {
    const perms = resolvePermissions(memberRow({ property_scope: "selected" }));
    expect(filterByPropertyId(perms, [], ["prop-1"])).toEqual([]);
  });

  it("property scope 'all' with empty string defaults correctly", () => {
    const row = memberRow({ property_scope: "" });
    const perms = resolvePermissions(row);
    expect(perms.propertyScope).toBe("all");
  });
});
