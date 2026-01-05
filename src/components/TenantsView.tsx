import { useState, useEffect } from "react";
import { Plus, Users, Building, Calendar, DollarSign, Eye } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import TenantContractDetails from "./TenantContractDetails";
import TenantModal from "./TenantModal";

interface Property {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  property_id: string;
}

interface Contract {
  id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  total_rent: number;
  status: string;
  tenant_id: string;
  unit_id?: string | null;
  property_units?: {
    id: string;
    unit_number: string;
  };
}

interface TenantWithDetails extends Tenant {
  contracts?: Contract[];
  properties?: Property;
}

interface TenantsViewProps {
  selectedTenantId?: string | null;
  onClearSelection?: () => void;
}

export default function TenantsView({ selectedTenantId: externalSelectedTenantId, onClearSelection }: TenantsViewProps = {}) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [filters, setFilters] = useState({
    property_id: "",
    status: "",
  });

  useEffect(() => {
    if (externalSelectedTenantId) {
      setSelectedTenantId(externalSelectedTenantId);
    }
  }, [externalSelectedTenantId]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);

      const [tenantsRes, propertiesRes] = await Promise.all([
        supabase
          .from("tenants")
          .select(`
            *,
            properties(id, name)
          `)
          .order("name"),
        supabase.from("properties").select("id, name").order("name"),
      ]);

      if (tenantsRes.data) {
        const tenantsWithContracts = await Promise.all(
          tenantsRes.data.map(async (tenant) => {
            const { data: contracts } = await supabase
              .from("rental_contracts")
              .select(`
                *,
                property_units(id, unit_number)
              `)
              .eq("tenant_id", tenant.id)
              .order("start_date", { ascending: false })
              .limit(1);

            return {
              ...tenant,
              contracts: contracts || [],
            };
          })
        );

        setTenants(tenantsWithContracts);
      }

      if (propertiesRes.data) setProperties(propertiesRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

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

  const filteredTenants = tenants.filter((tenant) => {
    if (filters.property_id && tenant.property_id !== filters.property_id) {
      return false;
    }

    if (filters.status && tenant.contracts && tenant.contracts.length > 0) {
      const currentContract = tenant.contracts[0];
      if (currentContract.status !== filters.status) {
        return false;
      }
    }

    return true;
  });

  if (selectedTenantId) {
    return (
      <TenantContractDetails
        tenantId={selectedTenantId}
        onBack={() => {
          setSelectedTenantId(null);
          if (onClearSelection) {
            onClearSelection();
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">
            Mietverhältnisse
          </h1>
          <p className="text-gray-400">
            Verwalten Sie Ihre Mietverhältnisse und Mieter
          </p>
        </div>
        <button
          onClick={() => setShowTenantModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          Mietverhältnis anlegen
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Mietverhältnisse
          </h3>
          <p className="text-gray-400 mb-6">
            Fügen Sie Ihr erstes Mietverhältnis hinzu, um mit der Verwaltung zu
            beginnen.
          </p>
          <button
            onClick={() => setShowTenantModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-5 h-5" />
            Erstes Mietverhältnis hinzufügen
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Filter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objekt
                </label>
                <select
                  value={filters.property_id}
                  onChange={(e) =>
                    setFilters({ ...filters, property_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Alle Objekte</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Alle Status</option>
                  <option value="active">Aktiv</option>
                  <option value="ending_soon">Endet bald</option>
                  <option value="terminated">Gekündigt</option>
                  <option value="vacant">Leer</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ property_id: "", status: "" })}
                  className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark">
                Übersicht ({filteredTenants.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Einheit
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Mieter
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Mietbeginn
                    </th>
                    <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                      Warmmiete
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => {
                    const currentContract =
                      tenant.contracts && tenant.contracts.length > 0
                        ? tenant.contracts[0]
                        : null;

                    return (
                      <tr
                        key={tenant.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTenantId(tenant.id)}
                      >
                        <td className="py-4 px-6 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <div>
                              <div>{tenant.properties?.name || "Unbekannt"}</div>
                              {currentContract?.property_units && (
                                <div className="text-xs text-gray-500">
                                  {currentContract.property_units.unit_number}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div className="font-medium text-dark">
                            {tenant.name}
                          </div>
                          {tenant.email && (
                            <div className="text-xs text-gray-400">
                              {tenant.email}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {currentContract ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(
                                currentContract.start_date
                              ).toLocaleDateString("de-DE")}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-right font-medium text-dark">
                          {currentContract ? (
                            <span>{(currentContract.total_rent || currentContract.monthly_rent || 0).toFixed(2)} €</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {currentContract ? (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                currentContract.status
                              )}`}
                            >
                              {getStatusLabel(currentContract.status)}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              Kein Vertrag
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenantId(tenant.id);
                            }}
                            className="text-primary-blue hover:text-primary-blue transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showTenantModal && (
        <TenantModal
          tenant={null}
          properties={properties}
          onClose={() => setShowTenantModal(false)}
          onSave={() => {
            setShowTenantModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
