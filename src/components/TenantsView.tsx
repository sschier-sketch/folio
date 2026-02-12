import { useState, useEffect } from "react";
import { Plus, Users, Building, Calendar, DollarSign, Eye } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import TenantContractDetails from "./TenantContractDetails";
import TenantModal from "./TenantModal";
import { exportToPDF, exportToCSV, exportToExcel } from "../lib/exportUtils";
import TableActionsDropdown from "./common/TableActionsDropdown";
import { Button } from './ui/Button';

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
  move_out_date: string | null;
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
  rent_increase_type?: string;
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
  const [showExportMenu, setShowExportMenu] = useState(false);
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
          .eq("is_active", true)
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
              .eq("status", "active")
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
      default:
        return status;
    }
  };

  const getStatusType = (status: string): "success" | "warning" | "error" | "neutral" => {
    switch (status) {
      case "active":
        return "success";
      case "ending_soon":
        return "warning";
      case "terminated":
        return "error";
      default:
        return "neutral";
    }
  };

  const getTenantStatus = (tenant: TenantWithDetails): string => {
    if (!tenant.move_out_date) {
      return "active";
    }

    const moveOutDate = new Date(tenant.move_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    moveOutDate.setHours(0, 0, 0, 0);

    if (moveOutDate < today) {
      return "terminated";
    }

    return "ending_soon";
  };

  const filteredTenants = tenants.filter((tenant) => {
    if (filters.property_id && tenant.property_id !== filters.property_id) {
      return false;
    }

    if (filters.status) {
      const tenantStatus = getTenantStatus(tenant);
      if (tenantStatus !== filters.status) {
        return false;
      }
    }

    return true;
  });

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (!user) return;

    try {
      setShowExportMenu(false);

      const exportData = await Promise.all(
        filteredTenants.map(async (tenant) => {
          const { data: contracts } = await supabase
            .from("rental_contracts")
            .select(`
              id,
              start_date,
              end_date,
              monthly_rent,
              total_rent,
              base_rent,
              additional_costs,
              deposit,
              status,
              rent_type,
              is_sublet,
              vat_applicable,
              property_units (
                unit_number
              )
            `)
            .eq("tenant_id", tenant.id)
            .order("start_date", { ascending: false });

          const { data: property } = await supabase
            .from("properties")
            .select("name, address")
            .eq("id", tenant.property_id)
            .maybeSingle();

          return {
            tenant: {
              name: tenant.name,
              email: tenant.email || "",
              phone: tenant.phone || "",
              property: property?.name || "",
              address: property?.address || "",
            },
            contracts: contracts?.map((c) => ({
              start_date: c.start_date,
              end_date: c.end_date || "Unbefristet",
              monthly_rent: c.monthly_rent || c.base_rent,
              total_rent: c.total_rent,
              deposit: c.deposit,
              status: c.status,
              rent_type: c.rent_type,
              unit_number: c.property_units?.unit_number || "",
              is_sublet: c.is_sublet,
              vat_applicable: c.vat_applicable,
            })) || [],
          };
        })
      );

      if (format === 'pdf') {
        await exportToPDF(exportData, 'tenants');
      } else if (format === 'csv') {
        exportToCSV(exportData, 'tenants');
      } else if (format === 'excel') {
        exportToExcel(exportData, 'tenants');
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Fehler beim Exportieren der Daten");
    }
  };

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
        <div className="flex items-center gap-3">
          {tenants.length > 0 && (
            <div className="relative">
              <Button
                onClick={() => setShowExportMenu(!showExportMenu)}
                variant="outlined"
              >
                Exportieren
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    PDF exportieren
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    CSV exportieren
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Excel exportieren
                  </button>
                </div>
              )}
            </div>
          )}
          <Button
            onClick={() => setShowTenantModal(true)}
            variant="primary"
          >
            Mietverhältnis anlegen
          </Button>
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Mietverhältnisse
          </h3>
          <p className="text-gray-400 mb-6">
            Fügen Sie Ihr erstes Mietverhältnis hinzu, um mit der Verwaltung zu
            beginnen.
          </p>
          <Button
            onClick={() => setShowTenantModal(true)}
            variant="primary"
          >
            Erstes Mietverhältnis hinzufügen
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-6 mb-6">
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
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setFilters({ property_id: "", status: "" })}
                  variant="cancel"
                  fullWidth
                >
                  Zurücksetzen
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark">
                Übersicht ({filteredTenants.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Einheit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mieter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mietbeginn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warmmiete
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mietart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredTenants.map((tenant) => {
                    const currentContract = tenant.contracts && tenant.contracts.length > 0 ? tenant.contracts[0] : null;
                    const tenantStatus = getTenantStatus(tenant);

                    return (
                      <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {tenant.properties?.name || "Unbekannt"}
                          </div>
                          {currentContract?.property_units && (
                            <div className="text-xs text-gray-500">
                              {currentContract.property_units.unit_number}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedTenantId(tenant.id)}
                            className="text-left group"
                          >
                            <div className="font-medium text-dark text-sm group-hover:text-primary-blue transition-colors">
                              {tenant.name}
                            </div>
                            {tenant.email && (
                              <div className="text-xs text-gray-400">{tenant.email}</div>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentContract ? (
                            <span className="text-sm text-gray-700">
                              {new Date(currentContract.start_date).toLocaleDateString("de-DE")}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentContract ? (
                            <span className="text-sm font-medium text-dark">
                              {(currentContract.total_rent || currentContract.monthly_rent || 0).toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentContract ? (
                            <span className="text-xs text-gray-700">
                              {currentContract.rent_increase_type === "index" ? "Indexmiete" : "Festmiete"}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            tenantStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            tenantStatus === 'ending_soon' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {getStatusLabel(tenantStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <TableActionsDropdown
                              actions={[
                                {
                                  label: 'Details anzeigen',
                                  onClick: () => setSelectedTenantId(tenant.id)
                                }
                              ]}
                            />
                          </div>
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
