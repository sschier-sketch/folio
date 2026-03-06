import { useState, useEffect } from "react";
import { X, UserPlus, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface Property {
  id: string;
  name: string;
  address: string;
}

interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (payload: {
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
  }) => Promise<void>;
}

export default function InviteMemberModal({ onClose, onInvite }: InviteMemberModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const de = language === "de";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageProperties, setCanManageProperties] = useState(true);
  const [canManageTenants, setCanManageTenants] = useState(true);
  const [canManageFinances, setCanManageFinances] = useState(true);
  const [canViewAnalytics, setCanViewAnalytics] = useState(true);
  const [canViewFinances, setCanViewFinances] = useState(true);
  const [canViewStatements, setCanViewStatements] = useState(true);
  const [canViewRentPayments, setCanViewRentPayments] = useState(true);
  const [canViewLeases, setCanViewLeases] = useState(true);
  const [canViewMessages, setCanViewMessages] = useState(true);
  const [propertyScope, setPropertyScope] = useState("all");
  const [propertyAccess, setPropertyAccess] = useState("write");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setCanManageProperties(true);
      setCanManageTenants(true);
      setCanManageFinances(true);
      setCanViewAnalytics(true);
      setCanViewFinances(true);
      setCanViewStatements(true);
      setCanViewRentPayments(true);
      setCanViewLeases(true);
      setCanViewMessages(true);
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(de ? "Bitte E-Mail-Adresse eingeben" : "Please enter an email address");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onInvite({
        email: email.trim().toLowerCase(),
        role,
        is_read_only: isReadOnly,
        can_manage_billing: canManageBilling,
        can_manage_users: canManageUsers,
        can_manage_properties: canManageProperties,
        can_manage_tenants: canManageTenants,
        can_manage_finances: canManageFinances,
        can_view_analytics: canViewAnalytics,
        can_view_finances: canViewFinances,
        can_view_statements: canViewStatements,
        can_view_rent_payments: canViewRentPayments,
        can_view_leases: canViewLeases,
        can_view_messages: canViewMessages,
        property_scope: propertyScope,
        property_access: propertyAccess,
        property_ids: selectedPropertyIds,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : de ? "Einladung fehlgeschlagen" : "Invitation failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gray-400" />
            {de ? "Benutzer einladen" : "Invite User"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {de ? "E-Mail-Adresse" : "Email Address"} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={de ? "benutzer@beispiel.de" : "user@example.com"}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {de ? "Rolle" : "Role"}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="admin">{de ? "Administrator" : "Administrator"}</option>
              <option value="member">{de ? "Mitglied" : "Member"}</option>
              <option value="viewer">{de ? "Betrachter (Nur Lesen)" : "Viewer (Read Only)"}</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {role === "admin" && (de ? "Voller Zugriff, kann auch Benutzer verwalten" : "Full access, can also manage users")}
              {role === "member" && (de ? "Kann Immobilien, Mieter und Finanzen verwalten" : "Can manage properties, tenants and finances")}
              {role === "viewer" && (de ? "Kann alle Daten einsehen, aber nichts ändern" : "Can view all data but cannot make changes")}
            </p>
          </div>

          {role !== "viewer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {de ? "Immobilienzugriff" : "Property Access"}
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scope" checked={propertyScope === "all"} onChange={() => setPropertyScope("all")} className="accent-blue-600" />
                  <span className="text-sm text-gray-700">{de ? "Alle Immobilien" : "All properties"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scope" checked={propertyScope === "selected"} onChange={() => setPropertyScope("selected")} className="accent-blue-600" />
                  <span className="text-sm text-gray-700">{de ? "Bestimmte Immobilien" : "Selected properties"}</span>
                </label>
              </div>
            </div>
          )}

          {propertyScope === "selected" && role !== "viewer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {de ? "Immobilien auswählen" : "Select Properties"}
              </label>
              {properties.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {de ? "Keine Immobilien vorhanden" : "No properties available"}
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {properties.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.includes(p.id)}
                        onChange={() => toggleProperty(p.id)}
                        className="accent-blue-600"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">{p.address}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {role === "member" && (
            <>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {de ? "Erweiterte Berechtigungen" : "Advanced Permissions"}
              </button>

              {showAdvanced && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{de ? "Nur Lesezugriff" : "Read Only"}</span>
                    <input type="checkbox" checked={isReadOnly} onChange={(e) => setIsReadOnly(e.target.checked)} className="accent-blue-600" />
                  </label>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">{de ? "Zugriff auf Bereiche" : "Section Access"}</p>
                    {[
                      { key: "finances", label: de ? "Finanzen anzeigen" : "View Finances", value: canViewFinances, setter: setCanViewFinances },
                      { key: "statements", label: de ? "Abrechnungen anzeigen" : "View Statements", value: canViewStatements, setter: setCanViewStatements },
                      { key: "rent", label: de ? "Mieteingänge anzeigen" : "View Rent Payments", value: canViewRentPayments, setter: setCanViewRentPayments },
                      { key: "leases", label: de ? "Mietverträge anzeigen" : "View Leases", value: canViewLeases, setter: setCanViewLeases },
                      { key: "messages", label: de ? "Nachrichten anzeigen" : "View Messages", value: canViewMessages, setter: setCanViewMessages },
                    ].map(({ key, label, value, setter }) => (
                      <label key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">{label}</span>
                        <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="accent-blue-600" />
                      </label>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">{de ? "Verwaltungsrechte" : "Management Rights"}</p>
                    {[
                      { key: "billing", label: de ? "Tarif verwalten" : "Manage Billing", value: canManageBilling, setter: setCanManageBilling },
                      { key: "users", label: de ? "Benutzer verwalten" : "Manage Users", value: canManageUsers, setter: setCanManageUsers },
                    ].map(({ key, label, value, setter }) => (
                      <label key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">{label}</span>
                        <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="accent-blue-600" />
                      </label>
                    ))}
                  </div>
                  {!isReadOnly && (
                    <div className="border-t border-gray-200 pt-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        {de ? "Schreibzugriff auf Immobilien" : "Write Access to Properties"}
                      </label>
                      <select
                        value={propertyAccess}
                        onChange={(e) => setPropertyAccess(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="write">{de ? "Lesen & Schreiben" : "Read & Write"}</option>
                        <option value="read">{de ? "Nur Lesen" : "Read Only"}</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {de ? "Abbrechen" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !email.trim()}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {de ? "Einladung senden" : "Send Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}
