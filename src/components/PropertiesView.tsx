import { useState, useEffect } from "react";
import { Plus, Building2, Pencil, Trash2, TrendingUp, AlertCircle, CheckCircle, X, Tag, Download, FileDown, FileSpreadsheet, FileText, Grid3x3, List, Eye } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import PropertyModal from "./PropertyModal";
import PropertyDetails from "./PropertyDetails";
import { exportToPDF, exportToCSV, exportToExcel } from "../lib/exportUtils";
import { BaseTable, StatusBadge, ActionButton, ActionsCell, TableColumn } from "./common/BaseTable";

interface PropertyLabel {
  id: string;
  label: string;
  color: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  property_management_type?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  parking_spot_number?: string;
  description: string;
  photo_url?: string | null;
  labels?: PropertyLabel[];
  units?: {
    total: number;
    rented: number;
    vacant: number;
  };
}

interface PropertiesViewProps {
  selectedPropertyId?: string | null;
  selectedPropertyTab?: string | null;
  onClearSelection?: () => void;
  onNavigateToTenant?: (tenantId: string) => void;
}

const PREDEFINED_LABELS = [
  { label: "Hochrentabel", color: "green" },
  { label: "Sanierungsbedarf", color: "amber" },
  { label: "Verkauf geplant", color: "red" },
  { label: "Neukauf", color: "blue" },
  { label: "Top Lage", color: "purple" },
];

const LABEL_COLORS = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", hover: "hover:bg-blue-200" },
  green: { bg: "bg-green-100", text: "text-green-700", hover: "hover:bg-green-200" },
  red: { bg: "bg-red-100", text: "text-red-700", hover: "hover:bg-red-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", hover: "hover:bg-amber-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", hover: "hover:bg-purple-200" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", hover: "hover:bg-pink-200" },
};

export default function PropertiesView({ selectedPropertyId: externalSelectedPropertyId, selectedPropertyTab, onClearSelection, onNavigateToTenant }: PropertiesViewProps = {}) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState<string | null>(null);
  const [newLabelText, setNewLabelText] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState({
    status: "",
    property_type: "",
    label: "",
  });

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    if (externalSelectedPropertyId && properties.length > 0) {
      const property = properties.find(p => p.id === externalSelectedPropertyId);
      if (property) {
        setSelectedProperty(property);
        setShowDetails(true);
      }
    }
  }, [externalSelectedPropertyId, properties]);

  const loadProperties = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const propertiesWithUnitsAndLabels = await Promise.all(
        (data || []).map(async (property) => {
          const { data: units } = await supabase
            .from("property_units")
            .select("id")
            .eq("property_id", property.id);

          const total = units?.length || 0;
          let rented = 0;

          if (units && units.length > 0) {
            for (const unit of units) {
              const { data: tenantData } = await supabase
                .from("tenants")
                .select("id")
                .eq("unit_id", unit.id)
                .eq("is_active", true)
                .maybeSingle();

              if (tenantData) {
                rented++;
              }
            }
          }

          const vacant = total - rented;

          const { data: labels } = await supabase
            .from("property_labels")
            .select("id, label, color")
            .eq("property_id", property.id);

          return {
            ...property,
            units: { total, rented, vacant },
            labels: labels || [],
          };
        })
      );

      setProperties(propertiesWithUnitsAndLabels);

      // Extract all unique labels for the filter
      const uniqueLabels = Array.from(
        new Set(
          propertiesWithUnitsAndLabels.flatMap((p) =>
            p.labels?.map((l) => l.label) || []
          )
        )
      );
      setAllLabels(uniqueLabels);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = async (propertyId: string, labelText: string, color: string) => {
    if (!user || !labelText.trim()) return;

    try {
      const { error } = await supabase.from("property_labels").insert({
        property_id: propertyId,
        user_id: user.id,
        label: labelText.trim(),
        color: color,
      });

      if (error) throw error;

      await loadProperties();
      setShowLabelModal(null);
      setNewLabelText("");
      setSelectedColor("blue");
    } catch (error) {
      console.error("Error adding label:", error);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const { error } = await supabase
        .from("property_labels")
        .delete()
        .eq("id", labelId);

      if (error) throw error;

      await loadProperties();
    } catch (error) {
      console.error("Error removing label:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Immobilie wirklich löschen?")) return;
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
      loadProperties();
    } catch (error: any) {
      console.error("Error deleting property:", error);
      const errorMessage = error?.message || "Unbekannter Fehler";
      alert(`Fehler beim Löschen der Immobilie:\n\n${errorMessage}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multi_family: "Mehrfamilienhaus",
      house: "Einfamilienhaus",
      apartment: "Wohnung",
      commercial: "Gewerbeeinheit",
      parking: "Garage/Stellplatz",
      land: "Grundstück",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (!user) return;

    try {
      setShowExportMenu(false);

      const exportData = await Promise.all(
        properties.map(async (property) => {
          const [unitsRes, equipmentRes] = await Promise.all([
            supabase
              .from("property_units")
              .select("id, unit_number, status, size_sqm, rooms, floor_number, cold_rent, total_rent")
              .eq("property_id", property.id)
              .order("unit_number"),
            supabase
              .from("property_equipment")
              .select("*")
              .eq("property_id", property.id)
              .maybeSingle()
          ]);

          const units = unitsRes.data;
          const equipment = equipmentRes.data;

          const unitsWithTenants = await Promise.all(
            (units || []).map(async (unit) => {
              const { data: contract } = await supabase
                .from("rental_contracts")
                .select(`
                  monthly_rent,
                  total_rent,
                  tenants (
                    name,
                    email,
                    phone
                  )
                `)
                .eq("unit_id", unit.id)
                .eq("status", "active")
                .maybeSingle();

              return {
                unit: {
                  unit_number: unit.unit_number,
                  status: unit.status,
                  size_sqm: unit.size_sqm,
                  rooms: unit.rooms,
                  floor_number: unit.floor_number,
                  cold_rent: unit.cold_rent,
                  total_rent: unit.total_rent,
                  monthly_rent: contract?.total_rent || contract?.monthly_rent || unit.total_rent,
                },
                tenant: contract?.tenants ? {
                  name: (contract.tenants as any).name,
                  email: (contract.tenants as any).email,
                  phone: (contract.tenants as any).phone,
                } : undefined,
              };
            })
          );

          return {
            property: {
              id: property.id,
              name: property.name,
              address: property.address,
              property_type: property.property_type,
              property_management_type: property.property_management_type,
              purchase_price: property.purchase_price,
              current_value: property.current_value,
              purchase_date: property.purchase_date,
              size_sqm: property.size_sqm,
              description: property.description,
            },
            units: unitsWithTenants,
            equipment: equipment ? {
              heating_type: equipment.heating_type,
              energy_source: equipment.energy_source,
              construction_type: equipment.construction_type,
              roof_type: equipment.roof_type,
              parking_spots: equipment.parking_spots,
              elevator: equipment.elevator,
              balcony_terrace: equipment.balcony_terrace,
              garden: equipment.garden,
              basement: equipment.basement,
              fitted_kitchen: equipment.fitted_kitchen,
              wg_suitable: equipment.wg_suitable,
              guest_wc: equipment.guest_wc,
              housing_permit: equipment.housing_permit,
              parking_type: equipment.parking_type,
              equipment_notes: equipment.equipment_notes,
              special_features: equipment.special_features,
            } : undefined,
          };
        })
      );

      if (format === 'pdf') {
        await exportToPDF(exportData);
      } else if (format === 'csv') {
        exportToCSV(exportData);
      } else if (format === 'excel') {
        exportToExcel(exportData);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Fehler beim Exportieren der Daten");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (showDetails && selectedProperty) {
    return (
      <PropertyDetails
        property={selectedProperty}
        initialTab={selectedPropertyTab as any}
        onBack={() => {
          setShowDetails(false);
          setSelectedProperty(null);
          loadProperties();
          if (onClearSelection) {
            onClearSelection();
          }
        }}
        onNavigateToTenant={onNavigateToTenant}
        onUpdate={loadProperties}
      />
    );
  }

  const getOccupancyStatus = (units?: { total: number; rented: number; vacant: number }) => {
    if (!units || units.total === 0) return { label: "Keine Einheiten", color: "text-gray-400" };
    if (units.vacant === 0) return { label: "Voll vermietet", color: "text-emerald-600" };
    if (units.rented === 0) return { label: "Leer", color: "text-amber-600" };
    return { label: "Teilvermietet", color: "text-blue-600" };
  };

  const filteredProperties = properties.filter((property) => {
    if (filters.status) {
      const status = getOccupancyStatus(property.units);
      if (filters.status === "full" && status.label !== "Voll vermietet") return false;
      if (filters.status === "partial" && status.label !== "Teilvermietet") return false;
      if (filters.status === "vacant" && status.label !== "Leer") return false;
    }
    if (filters.property_type && property.property_type !== filters.property_type) {
      return false;
    }
    if (filters.label) {
      const hasLabel = property.labels?.some((l) => l.label === filters.label);
      if (!hasLabel) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Immobilien</h1>
          <p className="text-gray-400">
            Verwalten Sie Ihre Immobilien und deren Details
          </p>
        </div>
        <div className="flex items-center gap-3">
          {properties.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5" /> Exportieren
                </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    PDF exportieren
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    CSV exportieren
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel exportieren
                  </button>
                </div>
              )}
              </div>
            </>
          )}
          <button
            onClick={() => {
              setSelectedProperty(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-5 h-5" /> Immobilie hinzufügen
          </button>
        </div>
      </div>
      {properties.length === 0 ? (
        <div className="bg-white rounded shadow-sm p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Immobilien
          </h3>
          <p className="text-gray-400 mb-6">
            Fügen Sie Ihre erste Immobilie hinzu, um mit der Verwaltung zu beginnen.
          </p>
          <button
            onClick={() => {
              setSelectedProperty(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-5 h-5" /> Erste Immobilie hinzufügen
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark">Filter</h3>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-primary-blue shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Kachelansicht"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-primary-blue shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Tabellenansicht"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Alle Status</option>
                  <option value="full">Voll vermietet</option>
                  <option value="partial">Teilvermietet</option>
                  <option value="vacant">Leer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ
                </label>
                <select
                  value={filters.property_type}
                  onChange={(e) =>
                    setFilters({ ...filters, property_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Alle Typen</option>
                  <option value="multi_family">Mehrfamilienhaus</option>
                  <option value="house">Einfamilienhaus</option>
                  <option value="apartment">Wohnung</option>
                  <option value="commercial">Gewerbeeinheit</option>
                  <option value="parking">Garage/Stellplatz</option>
                  <option value="land">Grundstück</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label
                </label>
                <select
                  value={filters.label}
                  onChange={(e) =>
                    setFilters({ ...filters, label: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Alle Labels</option>
                  {allLabels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: "", property_type: "", label: "" })}
                  style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                  className="w-full px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => {
              const occupancyStatus = getOccupancyStatus(property.units);
              return (
                <div
                  key={property.id}
                  className="bg-white rounded overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: property.photo_url ? 'transparent' : '#EEF4FF', border: property.photo_url ? 'none' : '1px solid #DDE7FF' }}>
                        {property.photo_url ? (
                          <img
                            src={property.photo_url}
                            alt={property.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6" style={{ color: '#1E1E24' }} />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProperty(property);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-dark mb-1">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{property.address}</p>

                    {/* Labels Section */}
                    <div className="mb-4 min-h-[32px]">
                      <div className="flex flex-wrap gap-2 items-center">
                        {property.labels?.map((label) => {
                          const colorClasses = LABEL_COLORS[label.color as keyof typeof LABEL_COLORS] || LABEL_COLORS.blue;
                          return (
                            <span
                              key={label.id}
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${colorClasses.bg} ${colorClasses.text}`}
                            >
                              {label.label}
                              <button
                                onClick={() => handleRemoveLabel(label.id)}
                                className="hover:opacity-70"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                        <button
                          onClick={() => setShowLabelModal(property.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          Label
                        </button>
                      </div>
                    </div>

                    {property.units && property.units.total > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">Einheiten:</span>
                          <span className="font-medium text-dark">
                            {property.units.total}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {occupancyStatus.label === "Voll vermietet" ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : occupancyStatus.label === "Leer" ? (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          ) : null}
                          <span className={`text-sm font-medium ${occupancyStatus.color}`}>
                            {occupancyStatus.label}
                          </span>
                        </div>
                        {isPremium && property.units.vacant > 0 && (
                          <div className="mt-2 text-xs text-amber-600">
                            {property.units.vacant} Einheit{property.units.vacant > 1 ? "en" : ""}{" "}
                            leer
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-400">
                        {getPropertyTypeLabel(property.property_type)}
                        {property.size_sqm && ` • ${property.size_sqm} m²`}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 font-medium">Aktueller Wert:</span>{" "}
                        <span className="font-medium text-dark">
                          {formatCurrency(property.current_value)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowDetails(true);
                      }}
                      className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition-colors"
                    >
                      Details ansehen
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <BaseTable
              columns={[
                {
                  key: "property",
                  header: "Immobilie",
                  render: (property: Property) => (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: property.photo_url ? 'transparent' : '#EEF4FF', border: property.photo_url ? 'none' : '1px solid #DDE7FF' }}>
                        {property.photo_url ? (
                          <img
                            src={property.photo_url}
                            alt={property.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5" style={{ color: '#3c8af7' }} />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-dark text-sm">{property.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {property.labels?.slice(0, 2).map((label) => {
                            const colorClasses = LABEL_COLORS[label.color as keyof typeof LABEL_COLORS] || LABEL_COLORS.blue;
                            return (
                              <span
                                key={label.id}
                                className={`inline-block px-1.5 py-0.5 text-xs rounded ${colorClasses.bg} ${colorClasses.text}`}
                              >
                                {label.label}
                              </span>
                            );
                          })}
                          {property.labels && property.labels.length > 2 && (
                            <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                              +{property.labels.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "type",
                  header: "Typ",
                  render: (property: Property) => (
                    <span className="text-sm text-gray-600">
                      {getPropertyTypeLabel(property.property_type)}
                    </span>
                  ),
                },
                {
                  key: "address",
                  header: "Adresse",
                  render: (property: Property) => (
                    <span className="text-sm text-gray-600">{property.address}</span>
                  ),
                },
                {
                  key: "size",
                  header: "Fläche",
                  render: (property: Property) => (
                    <span className="text-sm text-gray-600">
                      {property.size_sqm ? `${property.size_sqm} m²` : '-'}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (property: Property) => {
                    const occupancyStatus = getOccupancyStatus(property.units);
                    return (
                      <div>
                        <div className="flex items-center gap-2">
                          {occupancyStatus.label === "Voll vermietet" ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : occupancyStatus.label === "Leer" ? (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          ) : null}
                          <span className={`text-sm font-medium ${occupancyStatus.color}`}>
                            {occupancyStatus.label}
                          </span>
                        </div>
                        {property.units && property.units.total > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {property.units.rented}/{property.units.total} vermietet
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "value",
                  header: "Wert",
                  render: (property: Property) => (
                    <span className="text-sm font-medium text-dark">
                      {formatCurrency(property.current_value)}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "Aktionen",
                  align: "right",
                  render: (property: Property) => (
                    <ActionsCell>
                      <ActionButton
                        icon={<Eye className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProperty(property);
                          setShowDetails(true);
                        }}
                        title="Details anzeigen"
                      />
                      <ActionButton
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProperty(property);
                          setShowModal(true);
                        }}
                        title="Bearbeiten"
                      />
                      <ActionButton
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(property.id);
                        }}
                        title="Löschen"
                        variant="danger"
                      />
                    </ActionsCell>
                  ),
                },
              ]}
              data={filteredProperties}
              loading={false}
            />
          )}
        </>
      )}

      {/* Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Label hinzufügen</h3>

            {/* Predefined Labels */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vordefinierte Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_LABELS.map((preLabel) => {
                  const colorClasses = LABEL_COLORS[preLabel.color as keyof typeof LABEL_COLORS];
                  return (
                    <button
                      key={preLabel.label}
                      onClick={() => {
                        handleAddLabel(showLabelModal, preLabel.label, preLabel.color);
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full font-medium ${colorClasses.bg} ${colorClasses.text} ${colorClasses.hover} transition-colors`}
                    >
                      {preLabel.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eigenes Label
              </label>
              <input
                type="text"
                value={newLabelText}
                onChange={(e) => setNewLabelText(e.target.value)}
                placeholder="Label-Text eingeben"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue mb-3"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newLabelText.trim()) {
                    handleAddLabel(showLabelModal, newLabelText, selectedColor);
                  }
                }}
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farbe wählen
              </label>
              <div className="flex gap-2">
                {Object.entries(LABEL_COLORS).map(([colorName, colorClasses]) => (
                  <button
                    key={colorName}
                    onClick={() => setSelectedColor(colorName)}
                    className={`w-8 h-8 rounded-full ${colorClasses.bg} ${
                      selectedColor === colorName ? "ring-2 ring-primary-blue ring-offset-2" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLabelModal(null);
                  setNewLabelText("");
                  setSelectedColor("blue");
                }}
                style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (newLabelText.trim()) {
                    handleAddLabel(showLabelModal, newLabelText, selectedColor);
                  }
                }}
                disabled={!newLabelText.trim()}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => {
            setShowModal(false);
            setSelectedProperty(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedProperty(null);
            loadProperties();
          }}
        />
      )}
    </div>
  );
}
