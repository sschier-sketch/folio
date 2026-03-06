import { useState } from "react";
import { X, Save } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import type { AccountMember } from "../hooks/useAccountMembers";

interface EditMemberModalProps {
  member: AccountMember;
  onClose: () => void;
  onSave: (permissions: Record<string, unknown>) => Promise<void>;
}

export default function EditMemberModal({ member, onClose, onSave }: EditMemberModalProps) {
  const { language } = useLanguage();
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
  const [propertyScope, setPropertyScope] = useState(member.property_scope);
  const [propertyAccess, setPropertyAccess] = useState(member.property_access);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        p_role: role,
        p_is_read_only: isReadOnly,
        p_can_manage_billing: canManageBilling,
        p_can_manage_users: canManageUsers,
        p_can_manage_properties: canManageProperties,
        p_can_manage_tenants: canManageTenants,
        p_can_manage_finances: canManageFinances,
        p_can_view_analytics: canViewAnalytics,
        p_can_view_finances: canViewFinances,
        p_can_view_statements: canViewStatements,
        p_can_view_rent_payments: canViewRentPayments,
        p_can_view_leases: canViewLeases,
        p_can_view_messages: canViewMessages,
        p_property_scope: propertyScope,
        p_property_access: propertyAccess,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : de ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const displayName = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {de ? "Berechtigungen bearbeiten" : "Edit Permissions"}
            </h2>
            <p className="text-sm text-gray-500">{displayName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{de ? "Rolle" : "Role"}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="admin">{de ? "Administrator" : "Administrator"}</option>
              <option value="member">{de ? "Mitglied" : "Member"}</option>
              <option value="viewer">{de ? "Betrachter" : "Viewer"}</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{de ? "Nur Lesezugriff" : "Read Only"}</span>
              <input type="checkbox" checked={isReadOnly} onChange={(e) => setIsReadOnly(e.target.checked)} className="accent-blue-600" />
            </label>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500">{de ? "Zugriff auf Bereiche" : "Section Access"}</p>
            {[
              { label: de ? "Finanzen anzeigen" : "View Finances", value: canViewFinances, setter: setCanViewFinances },
              { label: de ? "Abrechnungen anzeigen" : "View Statements", value: canViewStatements, setter: setCanViewStatements },
              { label: de ? "Mieteingänge anzeigen" : "View Rent Payments", value: canViewRentPayments, setter: setCanViewRentPayments },
              { label: de ? "Mietverträge anzeigen" : "View Leases", value: canViewLeases, setter: setCanViewLeases },
              { label: de ? "Nachrichten anzeigen" : "View Messages", value: canViewMessages, setter: setCanViewMessages },
              { label: de ? "Analyse anzeigen" : "View Analytics", value: canViewAnalytics, setter: setCanViewAnalytics },
            ].map(({ label, value, setter }) => (
              <label key={label} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{label}</span>
                <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="accent-blue-600" />
              </label>
            ))}
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500">{de ? "Verwaltungsrechte" : "Management Rights"}</p>
            {[
              { label: de ? "Immobilien verwalten" : "Manage Properties", value: canManageProperties, setter: setCanManageProperties },
              { label: de ? "Mieter verwalten" : "Manage Tenants", value: canManageTenants, setter: setCanManageTenants },
              { label: de ? "Finanzen verwalten" : "Manage Finances", value: canManageFinances, setter: setCanManageFinances },
              { label: de ? "Tarif verwalten" : "Manage Billing", value: canManageBilling, setter: setCanManageBilling },
              { label: de ? "Benutzer verwalten" : "Manage Users", value: canManageUsers, setter: setCanManageUsers },
            ].map(({ label, value, setter }) => (
              <label key={label} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{label}</span>
                <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="accent-blue-600" />
              </label>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {de ? "Immobilienzugriff" : "Property Access Scope"}
              </label>
              <select
                value={propertyScope}
                onChange={(e) => setPropertyScope(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">{de ? "Alle Immobilien" : "All Properties"}</option>
                <option value="selected">{de ? "Ausgewählte Immobilien" : "Selected Properties"}</option>
              </select>
            </div>
            {!isReadOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {de ? "Schreibzugriff" : "Write Access"}
                </label>
                <select
                  value={propertyAccess}
                  onChange={(e) => setPropertyAccess(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="write">{de ? "Lesen & Schreiben" : "Read & Write"}</option>
                  <option value="read">{de ? "Nur Lesen" : "Read Only"}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {de ? "Abbrechen" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {de ? "Speichern" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
