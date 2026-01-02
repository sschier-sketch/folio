import { useState, useEffect } from "react";
import {
  Home,
  User,
  Calendar,
  DollarSign,
  Wallet,
  CheckCircle,
  Edit,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface TenantOverviewTabProps {
  tenantId: string;
}

interface Contract {
  id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  utilities_advance: number;
  deposit_amount: number;
  deposit_status: string;
  status: string;
}

interface Tenant {
  id: string;
  name: string;
  property_id: string;
}

interface Property {
  name: string;
  address: string;
}

export default function TenantOverviewTab({
  tenantId,
}: TenantOverviewTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [showEditStatus, setShowEditStatus] = useState(false);

  useEffect(() => {
    if (user && tenantId) {
      loadData();
    }
  }, [user, tenantId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (tenantData) {
        setTenant(tenantData);

        const { data: propertyData } = await supabase
          .from("properties")
          .select("name, address")
          .eq("id", tenantData.property_id)
          .single();

        if (propertyData) setProperty(propertyData);

        const { data: contractData } = await supabase
          .from("rental_contracts")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractData) setContract(contractData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!contract) return;

    try {
      const { error } = await supabase
        .from("rental_contracts")
        .update({ status: newStatus })
        .eq("id", contract.id);

      if (!error) {
        setContract({ ...contract, status: newStatus });
        setShowEditStatus(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "ending_soon":
        return "bg-amber-100 text-amber-700";
      case "terminated":
        return "bg-red-100 text-red-700";
      case "vacant":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "ending_soon":
        return "Endet bald";
      case "terminated":
        return "Gekündigt";
      case "vacant":
        return "Leer";
      default:
        return status;
    }
  };

  const getDepositStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Offen";
      case "partial":
        return "Teilweise";
      case "complete":
        return "Vollständig";
      case "returned":
        return "Zurückgezahlt";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-400 mb-4">Kein Mietvertrag vorhanden</p>
        <p className="text-sm text-gray-400">
          Erstellen Sie einen Mietvertrag für diesen Mieter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">
            Mietverhältnis-Übersicht
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4" />
            Bearbeiten
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Einheit</div>
                <div className="font-semibold text-dark">
                  {property?.name || "Unbekannt"}
                </div>
                <div className="text-sm text-gray-600">
                  {property?.address || ""}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mieter</div>
                <div className="font-semibold text-dark">
                  {tenant?.name || "Unbekannt"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">
                  Vertragsstatus
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      contract.status
                    )}`}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                  <button
                    onClick={() => setShowEditStatus(true)}
                    className="text-xs text-primary-blue hover:underline"
                  >
                    Ändern
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mietbeginn</div>
                <div className="font-semibold text-dark">
                  {new Date(contract.start_date).toLocaleDateString("de-DE")}
                </div>
                {contract.end_date && (
                  <div className="text-sm text-gray-600 mt-1">
                    Ende: {new Date(contract.end_date).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Kaltmiete</div>
                <div className="font-semibold text-dark">
                  {contract.monthly_rent.toFixed(2)} € / Monat
                </div>
                {contract.utilities_advance > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Nebenkosten: +{contract.utilities_advance.toFixed(2)} €
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Kaution</div>
                <div className="font-semibold text-dark">
                  {contract.deposit_amount?.toFixed(2) || "0.00"} €
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Status: {getDepositStatusLabel(contract.deposit_status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Status ändern
            </h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleStatusChange("active")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Aktiv</div>
                <div className="text-sm text-gray-400">
                  Mietverhältnis läuft normal
                </div>
              </button>

              <button
                onClick={() => handleStatusChange("ending_soon")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Endet bald</div>
                <div className="text-sm text-gray-400">
                  Mietvertrag läuft demnächst aus
                </div>
              </button>

              <button
                onClick={() => handleStatusChange("terminated")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Gekündigt</div>
                <div className="text-sm text-gray-400">
                  Mietvertrag wurde gekündigt
                </div>
              </button>

              <button
                onClick={() => handleStatusChange("vacant")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Leer</div>
                <div className="text-sm text-gray-400">
                  Einheit ist nicht vermietet
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowEditStatus(false)}
              className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
