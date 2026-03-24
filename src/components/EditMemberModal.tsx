import { useState, useEffect } from "react";
import { X, Save, Building2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/Button";
import type { AccountMember, AccountInvitation } from "../hooks/useAccountMembers";

interface Property {
  id: string;
  name: string;
  address: string;
}

export type EditTarget = AccountMember | AccountInvitation;

interface EditMemberModalProps {
  member: EditTarget;
  onClose: () => void;
  onSave: (permissions: Record<string, unknown>) => Promise<void>;
}

export default function EditMemberModal({ member, onClose, onSave }: EditMemberModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const de = language === "de";

  const [role, setRole] = useState(member.role);
  const [isReadOnly, setIsReadOnly] = useState(member.is_read_only);
  const [canManageBilling, setCanManageBilling] = useState(member.can_manage_billing);
  const [canManageUsers, setCanManageUsers] = useState(member.can_manage_users);
  const [canManageProperties, setCanManageProperties] = useState(member.can_manage_properties);
  const [canManageTenants, setCanManageTenants] = useState(member.can_manage_tenants);
  const [canManageFinances, setCanManageFinances] = useState(member.can_manage_finances);
  const [canViewAnalytics, setCanViewAnalytics] = useState(member.can_view_analytics);
  const [canViewFinances, setCanViewFinances] = useState(member.can_view_finances);
  const [canViewStatements, setCanViewStatements] = useState(member.can_view_statements);
  const [canViewRentPayments, setCanViewRentPayments] = useState(member.can_view_rent_payments);
  const [canViewLeases, setCanViewLeases] = useState(member.can_view_leases);
  const [canViewMessages, setCanViewMessages] = useState(member.can_view_messages);
  const [canViewTasks, setCanViewTasks] = useState(member.can_view_tasks);
  const [propertyScope, setPropertyScope] = useState(member.property_scope);
  const [propertyAccess, setPropertyAccess] = useState(member.property_access);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMember = "first_name" in member;
  const displayName = isMember
    ? ([member.first_name, member.last_name].filter(Boolean).join(" ") || member.email)
    : member.invited_email;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("properties")
      .select("id, name, address")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }) => {
        if (data) setProperties(data);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    if (member.property_scope !== "selected") return;

    if (isMember) {
      const m = member as AccountMember;
      supabase
        .from("account_member_properties")
        .select("property_id")
        .eq("member_user_id", m.user_id)
        .then(({ data }) => {
          if (data) setSelectedPropertyIds(data.map((r) => r.property_id));
        });
    } else {
      const inv = member as AccountInvitation;
      supabase
        .from("account_invitations")
        .select("property_ids")
        .eq("id", inv.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.property_ids) setSelectedPropertyIds(data.property_ids);
        });
    }
  }, [user?.id, member]);

  useEffect(() => {
    if (role === "viewer") {
      setIsReadOnly(true);
      setCanManageBilling(false);
      setCanManageUsers(false);
      setPropertyAccess("read");
    } else if (role === "admin") {
      setIsReadOnly(false);
      setCanManageUsers(true);
      setCanManageBilling(false);
      setPropertyAccess("write");
      setPropertyScope("all");
      setCanViewFinances(true);
      setCanViewStatements(true);
      setCanViewRentPayments(true);
      setCanViewLeases(true);
      setCanViewMessages(true);
    } else {
      setIsReadOnly(false);
    }
  }, [role]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        p_role: role,
        p_is_read_only: isReadOnly,
        p_can_manage_billing: canManageBilling,
        p_can_manage_users: canManageUsers,
        p_can_manage_properties: isReadOnly ? false : canManageProperties,
        p_can_manage_tenants: isReadOnly ? false : canManageTenants,
        p_can_manage_finances: isReadOnly ? false : canManageFinances,
        p_can_view_analytics: canViewAnalytics,
        p_can_view_finances: canViewFinances,
        p_can_view_statements: canViewStatements,
        p_can_view_rent_payments: canViewRentPayments,
        p_can_view_leases: canViewLeases,
        p_can_view_messages: canViewMessages,
        p_can_view_tasks: canViewTasks,
        p_property_scope: propertyScope,
        p_property_access: isReadOnly ? "read" : propertyAccess,
        p_property_ids: propertyScope === "selected" ? selectedPropertyIds : [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : de ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleClass =
    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2";
  const toggleKnob =
    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out";

  const Toggle = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`${toggleClass} ${checked ? "bg-[#3c8af7]" : "bg-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`${toggleKnob} ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-dark">
              {de ? "Berechtigungen bearbeiten" : "Edit Permissions"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{displayName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {de ? "Rolle" : "Role"}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="admin">{de ? "Administrator" : "Administrator"}</option>
              <option value="member">{de ? "Mitglied" : "Member"}</option>
              <option value="viewer">{de ? "Betrachter (Nur Lesen)" : "Viewer (Read Only)"}</option>
            </select>
            <p className="text-sm text-gray-300 mt-1">
              {role === "admin" && (de ? "Voller Zugriff, kann auch Benutzer verwalten" : "Full access, can also manage users")}
              {role === "member" && (de ? "Kann Immobilien, Mieter und Finanzen verwalten" : "Can manage properties, tenants and finances")}
              {role === "viewer" && (de ? "Kann alle Daten einsehen, aber nichts ändern" : "Can view all data but cannot make changes")}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-dark mb-4">
              {de ? "Rechte" : "Permissions"}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {de ? "Nur Leserechte für gesamten Account" : "Read-only access for entire account"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {de ? "Benutzer kann alle Daten sehen, aber nichts ändern" : "User can view all data but cannot make changes"}
                  </p>
                </div>
                <Toggle
                  checked={isReadOnly}
                  onChange={setIsReadOnly}
                  disabled={role === "viewer"}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {de ? "Tarif/Billing verwalten" : "Manage Billing"}
                  </p>
                </div>
                <Toggle
                  checked={canManageBilling}
                  onChange={setCanManageBilling}
                  disabled={role === "viewer"}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {de ? "Benutzer verwalten" : "Manage Users"}
                  </p>
                </div>
                <Toggle
                  checked={canManageUsers}
                  onChange={setCanManageUsers}
                  disabled={role === "viewer"}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-dark mb-4">
              {de ? "Zugriff auf Bereiche" : "Section Access"}
            </h3>

            <div className="space-y-4">
              {[
                { label: de ? "Bereich Finanzen sehen" : "View Finances", value: canViewFinances, setter: setCanViewFinances },
                { label: de ? "Bereich Abrechnungen sehen" : "View Statements", value: canViewStatements, setter: setCanViewStatements },
                { label: de ? "Bereich Mieteingänge sehen" : "View Rent Payments", value: canViewRentPayments, setter: setCanViewRentPayments },
                { label: de ? "Bereich Mietverhältnisse sehen" : "View Leases", value: canViewLeases, setter: setCanViewLeases },
                { label: de ? "Bereich Nachrichten sehen" : "View Messages", value: canViewMessages, setter: setCanViewMessages },
                { label: de ? "Bereich Aufgaben sehen" : "View Tasks", value: canViewTasks, setter: setCanViewTasks },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <Toggle checked={value} onChange={setter} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-dark mb-4">
              {de ? "Immobilienfreigabe" : "Property Access"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {de ? "Zugriff auf Immobilien" : "Property Scope"}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={propertyScope === "all"}
                      onChange={() => setPropertyScope("all")}
                      className="w-4 h-4 text-primary-blue focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {de ? "Alle Immobilien" : "All properties"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={propertyScope === "selected"}
                      onChange={() => setPropertyScope("selected")}
                      className="w-4 h-4 text-primary-blue focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {de ? "Bestimmte Immobilien" : "Selected properties"}
                    </span>
                  </label>
                </div>
              </div>

              {propertyScope === "selected" && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {de ? "Immobilien auswählen" : "Select Properties"}
                  </label>
                  {properties.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      {de ? "Keine Immobilien vorhanden" : "No properties available"}
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {properties.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPropertyIds.includes(p.id)}
                            onChange={() => toggleProperty(p.id)}
                            className="w-4 h-4 text-[#3c8af7] border-gray-300 rounded focus:ring-2 focus:ring-[#3c8af7]"
                          />
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-gray-700 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400 truncate">{p.address}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isReadOnly && role !== "viewer" && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {de ? "Rechte innerhalb der Immobilien" : "Access Level within Properties"}
                  </label>
                  <select
                    value={propertyAccess}
                    onChange={(e) => setPropertyAccess(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="write">{de ? "Lesen & Schreiben" : "Read & Write"}</option>
                    <option value="read">{de ? "Nur Lesen" : "Read Only"}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {isReadOnly && role !== "viewer" && (
            <div
              style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }}
              className="border rounded-lg p-4"
            >
              <p className="text-sm text-blue-900">
                {de
                  ? "Hinweis: Bei aktiviertem Nur-Lesen-Modus kann der Benutzer keine Daten anlegen, bearbeiten oder löschen."
                  : "Note: With read-only mode enabled, the user cannot create, edit or delete any data."}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button variant="cancel" onClick={onClose} fullWidth>
              {de ? "Abbrechen" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              fullWidth
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {de ? "Wird gespeichert..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {de ? "Speichern" : "Save"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
