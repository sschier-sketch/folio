import { useState, useEffect } from "react";
import { Users, Check, X, Send, ExternalLink, LogIn, Building2, Activity, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { BaseTable, StatusBadge, ActionButton, ActionsCell, TableColumn } from "./common/BaseTable";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  property_id: string;
  portal_activated_at: string | null;
  last_login: string | null;
  property: {
    name: string;
  };
  rental_contract: {
    id: string;
    portal_access_enabled: boolean;
  }[];
}

export default function MieterportalView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, [user]);

  const loadTenants = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(
          `
          *,
          property:properties(name),
          rental_contract:rental_contracts(id, portal_access_enabled)
        `
        )
        .eq("user_id", user.id)
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

      const impersonationUrl = `${window.location.origin}/tenant-portal/${user.id}?token=${token}`;
      window.open(impersonationUrl, "_blank");
    } catch (error) {
      console.error("Error creating impersonation token:", error);
      alert("Fehler beim Erstellen des Anmeldelinks");
    } finally {
      setImpersonating(null);
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

    if (!tenant.portal_activated_at) {
      return <StatusBadge type="warning" label="Einladung ausstehend" />;
    }

    return <StatusBadge type="success" label="Aktiv" />;
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Über das Mieterportal
            </h3>
            <p className="text-sm text-blue-800">
              Das Mieterportal ermöglicht Ihren Mietern einen sicheren Zugang
              zu Dokumenten, Tickets, Zählerständen und Nachrichten. Aktivieren
              Sie den Zugang pro Mietverhältnis und senden Sie eine
              Aktivierungseinladung.
            </p>
          </div>
        </div>
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
            align: "right",
            render: (tenant: Tenant) => {
              const contract = Array.isArray(tenant.rental_contract)
                ? tenant.rental_contract[0]
                : tenant.rental_contract;

              return (
                <ActionsCell>
                  {contract?.portal_access_enabled ? (
                    <>
                      <ActionButton
                        icon={<LogIn className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImpersonateTenant(tenant);
                        }}
                        title="Als Mieter anmelden"
                        disabled={impersonating === tenant.id}
                      />
                      {!tenant.portal_activated_at && (
                        <ActionButton
                          icon={<Send className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendActivationLink(tenant);
                          }}
                          title="Aktivierungslink per E-Mail senden"
                          disabled={sendingInvite}
                        />
                      )}
                      <ActionButton
                        icon={<X className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePortalAccess(tenant.id, contract.id, true);
                        }}
                        title="Zugang deaktivieren"
                      />
                    </>
                  ) : (
                    <ActionButton
                      icon={<Check className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePortalAccess(tenant.id, contract?.id || "", false);
                      }}
                      title="Zugang aktivieren"
                    />
                  )}
                </ActionsCell>
              );
            },
          },
        ]}
        data={tenants}
        loading={loading}
        emptyMessage="Keine Mieter mit E-Mail-Adresse"
      />

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <ExternalLink className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Portal-Link für Ihre Mieter
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              Teilen Sie diesen Link mit Ihren Mietern:
            </p>
            <div className="flex items-center gap-2 mb-3">
              <code className="text-sm bg-white px-3 py-2 rounded border border-amber-300 flex-1">
                {window.location.origin}/tenant-portal/{user?.id}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/tenant-portal/${user?.id}`
                  );
                  alert("Link kopiert!");
                }}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Kopieren
              </button>
            </div>
            <div className="text-xs text-amber-700 space-y-1">
              <p><strong>Tipp:</strong> Mit "Als Mieter anmelden" können Sie auch selbst das Portal als Mieter testen</p>
              <p><strong>Optional:</strong> Versenden Sie eine E-Mail-Einladung</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
