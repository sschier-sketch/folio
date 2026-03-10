import { useState, useEffect } from "react";
import { Users, Check, X, Send, ExternalLink, LogIn, Building2, Activity, Clock, Settings, Gauge } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { usePermissions } from "../hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { BaseTable, StatusBadge, ActionButton, ActionsCell, TableColumn } from "./common/BaseTable";
import TableActionsDropdown, { ActionItem } from "./common/TableActionsDropdown";
import { Button } from './ui/Button';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  property_id: string;
  portal_invited_at: string | null;
  portal_activated_at: string | null;
  last_login: string | null;
  property: {
    name: string;
  };
  rental_contract: {
    id: string;
    portal_access_enabled: boolean;
    portal_meter_readings_enabled: boolean;
  }[];
}

export default function MieterportalView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { dataOwnerId, loading: permLoading } = usePermissions();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [settingsTenant, setSettingsTenant] = useState<Tenant | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!permLoading && dataOwnerId) loadTenants();
  }, [user, permLoading, dataOwnerId]);

  const loadTenants = async () => {
    if (!user || !dataOwnerId) return;

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(
          `
          *,
          property:properties(name),
          rental_contract:rental_contracts!tenants_contract_id_fkey(id, portal_access_enabled, portal_meter_readings_enabled)
        `
        )
        .eq("user_id", dataOwnerId)
        .not("email", "is", null)
        .order("last_name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortalAccess = async (
    tenantId: string,
    contractId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("rental_contracts")
        .update({ portal_access_enabled: !currentStatus })
        .eq("id", contractId);

      if (error) throw error;

      loadTenants();
    } catch (error) {
      console.error("Error toggling portal access:", error);
      alert("Fehler beim Ändern des Portalzugangs");
    }
  };

  const handleSendActivationLink = async (tenant: Tenant) => {
    if (!user) return;

    setSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-tenant-activation",
        {
          body: {
            tenantId: tenant.id,
            userId: user.id,
          },
        }
      );

      if (error) {
        console.error("Function invoke error:", error);
        throw error;
      }

      if (data?.success) {
        loadTenants();
        alert(
          `Aktivierungslink wurde erfolgreich an ${tenant.email} gesendet!`
        );
      } else if (data?.error) {
        const errorMsg = data.details
          ? `${data.error}\n\nDetails: ${data.details}${data.instructions ? `\n\n${data.instructions}` : ''}`
          : data.error;
        throw new Error(errorMsg);
      } else {
        throw new Error("Fehler beim Senden der E-Mail");
      }
    } catch (error) {
      console.error("Error sending activation link:", error);
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      alert(
        `Fehler beim Senden des Aktivierungslinks:\n\n${errorMessage}\n\nBitte überprüfen Sie die Konsole für weitere Details.`
      );
    } finally {
      setSendingInvite(false);
    }
  };

  const handleImpersonateTenant = async (tenant: Tenant) => {
    if (!user) return;

    setImpersonating(tenant.id);
    try {
      const token = crypto.randomUUID();

      const { error } = await supabase
        .from("tenant_impersonation_tokens")
        .insert({
          tenant_id: tenant.id,
          created_by: user.id,
          token: token,
        });

      if (error) throw error;

      const impersonationUrl = `${window.location.origin}/tenant-portal?token=${token}`;
      window.open(impersonationUrl, "_blank");
    } catch (error) {
      console.error("Error creating impersonation token:", error);
      alert("Fehler beim Erstellen des Anmeldelinks");
    } finally {
      setImpersonating(null);
    }
  };

  const handleToggleMeterReadings = async (contractId: string, currentValue: boolean) => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("rental_contracts")
        .update({ portal_meter_readings_enabled: !currentValue })
        .eq("id", contractId);

      if (error) throw error;

      loadTenants();
      setSettingsTenant((prev) => {
        if (!prev) return null;
        const updatedContracts = (Array.isArray(prev.rental_contract) ? prev.rental_contract : [prev.rental_contract]).map((c) =>
          c.id === contractId ? { ...c, portal_meter_readings_enabled: !currentValue } : c
        );
        return { ...prev, rental_contract: updatedContracts };
      });
    } catch (error) {
      console.error("Error toggling meter readings:", error);
      alert("Fehler beim Speichern der Einstellung");
    } finally {
      setSavingSettings(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (tenant: Tenant) => {
    const contract = Array.isArray(tenant.rental_contract)
      ? tenant.rental_contract[0]
      : tenant.rental_contract;

    if (!contract?.portal_access_enabled) {
      return <StatusBadge type="neutral" label="Deaktiviert" />;
    }

    if (tenant.portal_activated_at) {
      return <StatusBadge type="success" label="Aktiv" />;
    }

    if (tenant.portal_invited_at) {
      return <StatusBadge type="info" label="Einladung versendet" />;
    }

    return <StatusBadge type="warning" label="Einladung ausstehend" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Mieterportal</h1>
          <p className="text-gray-400">
            Verwalten Sie den Portalzugang für Ihre Mieter
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          Das Mieterportal ermöglicht Ihren Mietern einen sicheren Zugang
          zu Dokumenten, Tickets, Zählerständen und Nachrichten. Aktivieren
          Sie den Zugang pro Mietverhältnis und senden Sie eine
          Aktivierungseinladung.
        </p>
      </div>

      <BaseTable
        columns={[
          {
            key: "tenant",
            header: "Mieter",
            render: (tenant: Tenant) => (
              <div>
                <div className="font-semibold text-dark text-sm">
                  {tenant.first_name} {tenant.last_name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {tenant.email}
                </div>
              </div>
            ),
          },
          {
            key: "property",
            header: "Immobilie",
            render: (tenant: Tenant) => (
              <span className="text-sm font-medium text-dark">
                {tenant.property?.name}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (tenant: Tenant) => getStatusBadge(tenant),
          },
          {
            key: "last_login",
            header: "Letzter Login",
            render: (tenant: Tenant) => (
              <span className="text-sm text-gray-600">
                {formatDate(tenant.last_login)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Aktionen",
            align: "center" as const,
            render: (tenant: Tenant) => {
              const contract = Array.isArray(tenant.rental_contract)
                ? tenant.rental_contract[0]
                : tenant.rental_contract;

              return (
                <TableActionsDropdown
                  actions={[
                    {
                      label: 'Als Mieter anmelden',
                      onClick: () => handleImpersonateTenant(tenant),
                      hidden: !contract?.portal_access_enabled
                    },
                    {
                      label: tenant.portal_invited_at && !tenant.portal_activated_at
                        ? 'Einladungslink erneut senden'
                        : 'Aktivierungslink senden',
                      onClick: () => handleSendActivationLink(tenant),
                      hidden: !contract?.portal_access_enabled || !!tenant.portal_activated_at
                    },
                    {
                      label: 'Zugang deaktivieren',
                      onClick: () => handleTogglePortalAccess(tenant.id, contract.id, true),
                      variant: 'danger',
                      hidden: !contract?.portal_access_enabled
                    },
                    {
                      label: 'Zugang aktivieren',
                      onClick: () => handleTogglePortalAccess(tenant.id, contract?.id || "", false),
                      hidden: contract?.portal_access_enabled
                    },
                    {
                      label: 'Einstellungen',
                      onClick: () => setSettingsTenant(tenant),
                      hidden: !contract?.portal_access_enabled
                    }
                  ]}
                />
              );
            },
          },
        ]}
        data={tenants}
        loading={loading}
        emptyMessage="Keine Mieter mit E-Mail-Adresse"
      />

      <div className="mt-6 bg-amber-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-amber-900 mb-1">
          Portal-Link für Ihre Mieter
        </h3>
        <p className="text-sm text-amber-800 mb-3">
          Teilen Sie diesen Link mit Ihren Mietern:
        </p>
        <div className="flex items-center gap-2 mb-3">
          <code className="text-sm bg-white px-3 py-2 rounded border border-amber-300 flex-1">
            {window.location.origin}/tenant-portal
          </code>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/tenant-portal`
              );
              alert("Link kopiert!");
            }}
            variant="warning"
          >
            Kopieren
          </Button>
        </div>
        <div className="text-xs text-amber-700 space-y-1">
          <p><strong>Tipp:</strong> Mit "Als Mieter anmelden" können Sie auch selbst das Portal als Mieter testen</p>
          <p><strong>Optional:</strong> Versenden Sie eine E-Mail-Einladung</p>
        </div>
      </div>

      {settingsTenant && (() => {
        const contract = Array.isArray(settingsTenant.rental_contract)
          ? settingsTenant.rental_contract[0]
          : settingsTenant.rental_contract;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center border border-[#DDE7FF]">
                    <Settings className="w-5 h-5 text-[#1e1e24]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark">
                      Portal-Einstellungen
                    </h3>
                    <p className="text-sm text-gray-500">
                      {settingsTenant.first_name} {settingsTenant.last_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSettingsTenant(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <Gauge className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-dark block">
                        Zählerstandsmeldung
                      </span>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        Mieter kann Zählerstände über das Portal melden
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => contract && handleToggleMeterReadings(contract.id, contract.portal_meter_readings_enabled)}
                    disabled={savingSettings || !contract}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      contract?.portal_meter_readings_enabled
                        ? 'bg-primary-blue'
                        : 'bg-gray-300'
                    } ${savingSettings ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        contract?.portal_meter_readings_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                <Button
                  onClick={() => setSettingsTenant(null)}
                  variant="outlined"
                >
                  Schliessen
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
