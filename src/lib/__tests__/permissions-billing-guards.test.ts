import { describe, it, expect } from "vitest";
import {
  resolvePermissions,
  canAccessSection,
  DEFAULT_OWNER_PERMISSIONS,
  type UserPermissions,
  type UserSettingsRow,
} from "../permissions";

function memberRow(overrides: Partial<UserSettingsRow> = {}): UserSettingsRow {
  return {
    role: "member",
    account_owner_id: "owner-uuid",
    is_active_member: true,
    is_read_only: false,
    can_manage_billing: false,
    can_manage_users: false,
    can_view_finances: false,
    can_view_statements: false,
    can_view_rent_payments: false,
    can_view_leases: false,
    can_view_messages: false,
    property_scope: "all",
    property_access: "write",
    ...overrides,
  };
}

function canBilling(perms: UserPermissions): boolean {
  return perms.isOwner || perms.canManageBilling;
}

describe("Billing/Upgrade button visibility (PremiumFeatureGuard, TrialBanner, PremiumUpgradePrompt)", () => {
  it("owner always sees upgrade button", () => {
    expect(canBilling(DEFAULT_OWNER_PERMISSIONS)).toBe(true);
  });

  it("member with canManageBilling sees upgrade button", () => {
    const perms = resolvePermissions(memberRow({ can_manage_billing: true }));
    expect(canBilling(perms)).toBe(true);
  });

  it("member without canManageBilling does NOT see upgrade button", () => {
    const perms = resolvePermissions(memberRow({ can_manage_billing: false }));
    expect(canBilling(perms)).toBe(false);
  });
});

describe("Settings dropdown visibility", () => {
  function canSeeSettingsBilling(perms: UserPermissions): boolean {
    return perms.isOwner || perms.canManageBilling;
  }

  function canSeeSettingsUsers(perms: UserPermissions): boolean {
    return perms.isOwner || perms.canManageUsers;
  }

  it("owner sees billing and users settings", () => {
    expect(canSeeSettingsBilling(DEFAULT_OWNER_PERMISSIONS)).toBe(true);
    expect(canSeeSettingsUsers(DEFAULT_OWNER_PERMISSIONS)).toBe(true);
  });

  it("member with billing permission sees billing settings", () => {
    const perms = resolvePermissions(memberRow({ can_manage_billing: true }));
    expect(canSeeSettingsBilling(perms)).toBe(true);
  });

  it("member with users permission sees users settings", () => {
    const perms = resolvePermissions(memberRow({ can_manage_users: true }));
    expect(canSeeSettingsUsers(perms)).toBe(true);
  });

  it("member without billing permission does NOT see billing settings", () => {
    const perms = resolvePermissions(memberRow({ can_manage_billing: false }));
    expect(canSeeSettingsBilling(perms)).toBe(false);
  });

  it("member without users permission does NOT see users settings", () => {
    const perms = resolvePermissions(memberRow({ can_manage_users: false }));
    expect(canSeeSettingsUsers(perms)).toBe(false);
  });

  it("member without either permission sees neither", () => {
    const perms = resolvePermissions(memberRow());
    expect(canSeeSettingsBilling(perms)).toBe(false);
    expect(canSeeSettingsUsers(perms)).toBe(false);
  });
});

describe("SectionGuard for billing view access", () => {
  it("owner can access billing section", () => {
    expect(canAccessSection(DEFAULT_OWNER_PERMISSIONS, "billing")).toBe(true);
  });

  it("member with canManageBilling can access billing section", () => {
    const perms = resolvePermissions(memberRow({ can_manage_billing: true }));
    expect(canAccessSection(perms, "billing")).toBe(true);
  });

  it("member without canManageBilling cannot access billing section", () => {
    const perms = resolvePermissions(memberRow({ can_manage_billing: false }));
    expect(canAccessSection(perms, "billing")).toBe(false);
  });
});

describe("Free-tier user: no permission side-effects", () => {
  it("free owner (no account_owner_id) gets full owner permissions", () => {
    const row: UserSettingsRow = {
      role: "owner",
      account_owner_id: null,
      is_active_member: true,
    };
    const perms = resolvePermissions(row);
    expect(perms.isOwner).toBe(true);
    expect(perms.canManageBilling).toBe(true);
    expect(perms.canManageUsers).toBe(true);
    expect(canBilling(perms)).toBe(true);
  });

  it("free owner is never blocked by section guards", () => {
    const perms = DEFAULT_OWNER_PERMISSIONS;
    const sections = ["finances", "statements", "rent_payments", "leases", "messages", "billing", "users"] as const;
    for (const s of sections) {
      expect(canAccessSection(perms, s)).toBe(true);
    }
  });
});
