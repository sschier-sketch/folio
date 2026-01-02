import { useState, useEffect } from "react";
import { Plus, Building2, Edit2, Trash2, TrendingUp, Euro, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import PropertyModal from "./PropertyModal";
import PropertyDetails from "./PropertyDetails";

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  rooms: number | null;
  parking_spot_number?: string;
  description: string;
  units?: {
    total: number;
    rented: number;
    vacant: number;
  };
}

export default function PropertiesView() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    property_type: "",
  });
  useEffect(() => {
    loadProperties();
  }, [user]);
  const loadProperties = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const propertiesWithUnits = await Promise.all(
        (data || []).map(async (property) => {
          const { data: units } = await supabase
            .from("property_units")
            .select("id, status")
            .eq("property_id", property.id);

          const total = units?.length || 0;
          const rented = units?.filter((u) => u.status === "rented").length || 0;
          const vacant = units?.filter((u) => u.status === "vacant").length || 0;

          return {
            ...property,
            units: { total, rented, vacant },
          };
        })
      );

      setProperties(propertiesWithUnits);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Immobilie wirklich löschen?")) return;
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
      loadProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        {" "}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>{" "}
      </div>
    );
  }
  if (showDetails && selectedProperty) {
    return (
      <PropertyDetails
        property={selectedProperty}
        onBack={() => {
          setShowDetails(false);
          setSelectedProperty(null);
          loadProperties();
        }}
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Filter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option value="apartment">Wohnung</option>
                  <option value="house">Haus</option>
                  <option value="commercial">Gewerbe</option>
                  <option value="parking">Stellplatz</option>
                  <option value="mixed">Gemischt</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: "", property_type: "" })}
                  className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const occupancyStatus = getOccupancyStatus(property.units);
              return (
              <div
                key={property.id}
                className="bg-white rounded shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary-blue" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
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
                  <p className="text-sm text-gray-400 mb-4">{property.address}</p>

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
                    {property.rooms && (
                      <div className="text-sm text-gray-400">
                        {property.rooms} Zimmer
                        {property.size_sqm && ` • ${property.size_sqm} m²`}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-gray-300" />
                      <span className="text-sm font-medium text-dark">
                        {formatCurrency(property.current_value)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowDetails(true);
                    }}
                    className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Details ansehen
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </>
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
      )}{" "}
    </div>
  );
}
