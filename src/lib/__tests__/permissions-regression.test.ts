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
  type UserSettingsRow,
} from "../permissions";

const OWNER_ID = "owner-111";
const MEMBER_ID = "member-222";

const ALL_NAV_IDS = [
  "home", "properties", "tenants", "payments", "messages",
  "mieterportal", "financial", "documents", "templates", "billing",
];
const ALL_SECTIONS = [
  "finances", "statements", "rent_payments", "leases", "messages", "billing", "users",
] as const;

const TEST_PROPERTIES = [
  { id: "p1", name: "A" },
  { id: "p2", name: "B" },
  { id: "p3", name: "C" },
];
const TEST_ITEMS = [
  { property_id: "p1", val: 1 },
  { property_id: "p2", val: 2 },
  { property_id: "p3", val: 3 },
];

describe("REGRESSION: Owner standard flows never break", () => {
  const ownerRow: UserSettingsRow = { role: "owner", account_owner_id: null };
  const perms = resolvePermissions(ownerRow);

  it("owner row without account_owner_id resolves to full owner", () => {
    expect(perms).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("dataOwnerId equals owner's own user ID", () => {
    expect(computeDataOwnerId(perms, OWNER_ID)).toBe(OWNER_ID);
  });

  it("owner can write everywhere", () => {
    expect(computeCanWrite(perms)).toBe(true);
    expect(canWriteProperty(perms, null)).toBe(true);
    expect(canWriteProperty(perms, null, "p1")).toBe(true);
  });

  it("no navigation items are hidden for owner", () => {
    const navPerms = { ...perms, loading: false };
    for (const id of ALL_NAV_IDS) {
      expect(isNavHidden(navPerms, id)).toBe(false);
    }
  });

  it("all sections accessible for owner", () => {
    for (const section of ALL_SECTIONS) {
      expect(canAccessSection(perms, section)).toBe(true);
    }
  });

  it("all properties visible to owner", () => {
    expect(filterPropertiesByScope(perms, TEST_PROPERTIES, null)).toEqual(TEST_PROPERTIES);
    expect(filterByPropertyId(perms, TEST_ITEMS, null)).toEqual(TEST_ITEMS);
  });

  it("owner can access any property by ID", () => {
    expect(canAccessProperty(perms, "p1", null)).toBe(true);
    expect(canAccessProperty(perms, "nonexistent", null)).toBe(true);
  });
});

describe("REGRESSION: New user (empty user_settings) gets owner defaults", () => {
  it("null data returns owner defaults", () => {
    expect(resolvePermissions(null)).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("empty object with no account_owner_id returns owner defaults", () => {
    expect(resolvePermissions({})).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });

  it("row with only role=owner returns owner defaults", () => {
    expect(resolvePermissions({ role: "owner" })).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });
});

describe("REGRESSION: Loading state must not block owner", () => {
  it("isNavHidden returns false while loading even for restricted member", () => {
    const member = {
      ...resolvePermissions({
        role: "member",
        account_owner_id: OWNER_ID,
        can_view_finances: false,
        can_view_rent_payments: false,
      }),
      loading: true,
    };
    expect(isNavHidden(member, "financial")).toBe(false);
    expect(isNavHidden(member, "payments")).toBe(false);
  });
});

describe("REGRESSION: Error fallback returns owner defaults", () => {
  it("resolvePermissions with corrupt/unexpected data falls back safely", () => {
    const weirdRow: UserSettingsRow = {
      role: undefined as unknown as string,
      account_owner_id: null,
    };
    expect(resolvePermissions(weirdRow)).toEqual(DEFAULT_OWNER_PERMISSIONS);
  });
});

describe("REGRESSION: Property/Tenant/Rent flows use correct dataOwnerId", () => {
  it("owner dataOwnerId matches user.id for insert operations", () => {
    const perms = resolvePermissions({ role: "owner", account_owner_id: null });
    expect(computeDataOwnerId(perms, OWNER_ID)).toBe(OWNER_ID);
  });

  it("member dataOwnerId matches account owner for insert operations", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
    });
    expect(computeDataOwnerId(perms, MEMBER_ID)).toBe(OWNER_ID);
  });

  it("removed member dataOwnerId falls back to own user ID", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      removed_at: "2024-01-01",
    });
    expect(computeDataOwnerId(perms, MEMBER_ID)).toBe(MEMBER_ID);
  });
});

describe("REGRESSION: Section guards match nav hiding consistently", () => {
  it("if nav item is hidden, corresponding section guard also blocks", () => {
    const row: UserSettingsRow = {
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_view_finances: false,
      can_view_statements: false,
      can_view_rent_payments: false,
      can_view_leases: false,
      can_view_messages: false,
      can_manage_billing: false,
      can_manage_users: false,
    };
    const perms = resolvePermissions(row);
    const navPerms = { ...perms, loading: false };

    const navToSection: Record<string, typeof ALL_SECTIONS[number]> = {
      financial: "finances",
      billing: "statements",
      payments: "rent_payments",
      tenants: "leases",
      messages: "messages",
    };

    for (const [navId, section] of Object.entries(navToSection)) {
      const hidden = isNavHidden(navPerms, navId);
      const blocked = !canAccessSection(perms, section);
      expect(hidden).toBe(blocked);
    }
  });

  it("if nav item is visible, corresponding section guard allows", () => {
    const row: UserSettingsRow = {
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_view_finances: true,
      can_view_statements: true,
      can_view_rent_payments: true,
      can_view_leases: true,
      can_view_messages: true,
    };
    const perms = resolvePermissions(row);
    const navPerms = { ...perms, loading: false };

    expect(isNavHidden(navPerms, "financial")).toBe(false);
    expect(canAccessSection(perms, "finances")).toBe(true);

    expect(isNavHidden(navPerms, "billing")).toBe(false);
    expect(canAccessSection(perms, "statements")).toBe(true);

    expect(isNavHidden(navPerms, "payments")).toBe(false);
    expect(canAccessSection(perms, "rent_payments")).toBe(true);

    expect(isNavHidden(navPerms, "tenants")).toBe(false);
    expect(canAccessSection(perms, "leases")).toBe(true);

    expect(isNavHidden(navPerms, "messages")).toBe(false);
    expect(canAccessSection(perms, "messages")).toBe(true);
  });
});

describe("REGRESSION: Property scope filtering is idempotent", () => {
  it("filtering twice produces same result", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      property_scope: "selected",
      is_active_member: true,
    });
    const allowed = ["p2"];
    const first = filterPropertiesByScope(perms, TEST_PROPERTIES, allowed);
    const second = filterPropertiesByScope(perms, first, allowed);
    expect(second).toEqual(first);
  });
});

describe("REGRESSION: canWrite and canWriteProperty consistency", () => {
  it("if canWrite is false, canWriteProperty must also be false for any property", () => {
    const readOnlyPerms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      is_read_only: true,
      property_access: "read",
    });
    expect(computeCanWrite(readOnlyPerms)).toBe(false);
    expect(canWriteProperty(readOnlyPerms, null)).toBe(false);
    expect(canWriteProperty(readOnlyPerms, ["p1"], "p1")).toBe(false);
  });

  it("if canWrite is true, canWriteProperty may still be false for out-of-scope property", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      is_read_only: false,
      property_access: "write",
      property_scope: "selected",
    });
    expect(computeCanWrite(perms)).toBe(true);
    expect(canWriteProperty(perms, ["p1"], "p1")).toBe(true);
    expect(canWriteProperty(perms, ["p1"], "p2")).toBe(false);
  });
});

describe("REGRESSION: Settings dropdown visibility matches permission checks", () => {
  function canSeeSettingsBilling(perms: { isOwner: boolean; canManageBilling: boolean }): boolean {
    return perms.isOwner || perms.canManageBilling;
  }
  function canSeeSettingsUsers(perms: { isOwner: boolean; canManageUsers: boolean }): boolean {
    return perms.isOwner || perms.canManageUsers;
  }

  it("owner sees both settings entries", () => {
    const perms = resolvePermissions({ role: "owner", account_owner_id: null });
    expect(canSeeSettingsBilling(perms)).toBe(true);
    expect(canSeeSettingsUsers(perms)).toBe(true);
  });

  it("member without billing+users sees neither settings entry", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_billing: false,
      can_manage_users: false,
    });
    expect(canSeeSettingsBilling(perms)).toBe(false);
    expect(canSeeSettingsUsers(perms)).toBe(false);
  });

  it("member with billing sees billing, not users", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_billing: true,
      can_manage_users: false,
    });
    expect(canSeeSettingsBilling(perms)).toBe(true);
    expect(canSeeSettingsUsers(perms)).toBe(false);
  });

  it("member with users sees users, not billing", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_billing: false,
      can_manage_users: true,
    });
    expect(canSeeSettingsBilling(perms)).toBe(false);
    expect(canSeeSettingsUsers(perms)).toBe(true);
  });

  it("settings visibility and SectionGuard access are consistent for billing", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_billing: false,
    });
    expect(canSeeSettingsBilling(perms)).toBe(false);
    expect(canAccessSection(perms, "billing")).toBe(false);
  });

  it("settings visibility and SectionGuard access are consistent for users", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_users: false,
    });
    expect(canSeeSettingsUsers(perms)).toBe(false);
    expect(canAccessSection(perms, "users")).toBe(false);
  });
});

describe("REGRESSION: All 7 guarded views block all permission combinations consistently", () => {
  const PERMISSION_FLAGS = [
    { section: "finances" as const, flag: "can_view_finances" as const },
    { section: "statements" as const, flag: "can_view_statements" as const },
    { section: "rent_payments" as const, flag: "can_view_rent_payments" as const },
    { section: "leases" as const, flag: "can_view_leases" as const },
    { section: "messages" as const, flag: "can_view_messages" as const },
    { section: "billing" as const, flag: "can_manage_billing" as const },
    { section: "users" as const, flag: "can_manage_users" as const },
  ];

  for (const { section, flag } of PERMISSION_FLAGS) {
    it(`section "${section}" is blocked when ${flag}=false`, () => {
      const row: UserSettingsRow = {
        role: "member",
        account_owner_id: OWNER_ID,
        is_active_member: true,
        [flag]: false,
      };
      const perms = resolvePermissions(row);
      expect(canAccessSection(perms, section)).toBe(false);
    });

    it(`section "${section}" is allowed when ${flag}=true`, () => {
      const row: UserSettingsRow = {
        role: "member",
        account_owner_id: OWNER_ID,
        is_active_member: true,
        [flag]: true,
      };
      const perms = resolvePermissions(row);
      expect(canAccessSection(perms, section)).toBe(true);
    });
  }
});

describe("REGRESSION: Direct URL access to blocked sections", () => {
  it("member without finance permission is blocked by canAccessSection on all finance routes", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_view_finances: false,
    });
    expect(canAccessSection(perms, "finances")).toBe(false);
  });

  it("member without billing permission blocked from billing section", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_billing: false,
    });
    expect(canAccessSection(perms, "billing")).toBe(false);
  });

  it("member without users permission blocked from users section", () => {
    const perms = resolvePermissions({
      role: "member",
      account_owner_id: OWNER_ID,
      is_active_member: true,
      can_manage_users: false,
    });
    expect(canAccessSection(perms, "users")).toBe(false);
  });
});
