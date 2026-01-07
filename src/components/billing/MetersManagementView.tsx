import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, X, Gauge, Building2, User, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Meter {
  id: string;
  meter_number: string;
  meter_type: string;
  meter_name: string | null;
  unit_of_measurement: string;
  location: string | null;
  supplier: string | null;
  contract_number: string | null;
  reading_interval: string | null;
  last_reading_value: number | null;
  last_reading_date: string | null;
  property: { id: string; name: string } | null;
  unit: { id: string; unit_number: string } | null;
  tenant: { id: string; first_name: string; last_name: string } | null;
}

interface MetersManagementViewProps {
  onAddMeter: () => void;
  onEditMeter: (meter: Meter) => void;
  onAddReading: (meter: Meter) => void;
  refreshTrigger?: number;
}

export default function MetersManagementView({
  onAddMeter,
  onEditMeter,
  onAddReading,
  refreshTrigger = 0
}: MetersManagementViewProps) {
  const { user } = useAuth();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const meterTypes = [
    { value: "strom", label: "Strom" },
    { value: "gas", label: "Gas" },
    { value: "heizung", label: "Heizung" },
    { value: "fernwaerme", label: "Fernwärme" },
    { value: "warmwasser", label: "Warmwasser" },
    { value: "kaltwasser", label: "Kaltwasser" },
    { value: "wasser_gesamt", label: "Wasser (Gesamt)" },
    { value: "sonstiges", label: "Sonstiges" }
  ];

  useEffect(() => {
    loadData();
  }, [user, refreshTrigger]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [metersRes, propertiesRes] = await Promise.all([
        supabase
          .from("meters")
          .select(`
            *,
            property:properties(id, name),
            unit:property_units(id, unit_number),
            tenant:tenants(id, first_name, last_name)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("properties")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name")
      ]);

      if (metersRes.error) throw metersRes.error;
      if (propertiesRes.error) throw propertiesRes.error;

      setMeters(metersRes.data || []);
      setProperties(propertiesRes.data || []);
    } catch (error) {
      console.error("Error loading meters:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeters = meters.filter(meter => {
    if (filterType !== "all" && meter.meter_type !== filterType) return false;
    if (filterProperty !== "all" && meter.property?.id !== filterProperty) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        meter.meter_number.toLowerCase().includes(query) ||
        meter.meter_name?.toLowerCase().includes(query) ||
        meter.meter_type.toLowerCase().includes(query) ||
        meter.location?.toLowerCase().includes(query) ||
        meter.property?.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getMeterTypeLabel = (type: string) => {
    const meterType = meterTypes.find(t => t.value === type);
    return meterType?.label || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const handleExport = () => {
    const headers = [
      "Objekt",
      "Einheit",
      "Zählertyp",
      "Zählernummer",
      "Zählername",
      "Maßeinheit",
      "Letzter Stand",
      "Datum letzter Stand",
      "Ableseintervall",
      "Versorger",
      "Vertrags-Nr.",
      "Lage",
      "Mieter"
    ];

    const rows = filteredMeters.map(meter => [
      meter.property?.name || "",
      meter.unit?.unit_number || "",
      getMeterTypeLabel(meter.meter_type),
      meter.meter_number,
      meter.meter_name || "",
      meter.unit_of_measurement,
      meter.last_reading_value?.toString() || "",
      formatDate(meter.last_reading_date),
      meter.reading_interval || "",
      meter.supplier || "",
      meter.contract_number || "",
      meter.location || "",
      meter.tenant ? `${meter.tenant.first_name} ${meter.tenant.last_name}` : ""
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zaehler_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Lade Zähler...</div>
      </div>
    );
  }

  if (meters.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <Gauge className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-dark mb-2">
          Keine Zähler vorhanden
        </h3>
        <p className="text-gray-400 mb-6">
          Legen Sie Ihren ersten Zähler an, um Verbrauchsdaten zu erfassen.
        </p>
        <button
          onClick={onAddMeter}
          className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Ersten Zähler hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zähler suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${
              showFilters ? "bg-gray-100" : "bg-white"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 bg-white"
          >
            <Download className="w-4 h-4" />
            Exportieren
          </button>

          <button
            onClick={onAddMeter}
            className="px-4 py-2.5 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neuen Zähler anlegen
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zählertyp
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="all">Alle Typen</option>
                {meterTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objekt
              </label>
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="all">Alle Objekte</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterProperty("all");
                  setSearchQuery("");
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        {filteredMeters.length} {filteredMeters.length === 1 ? "Zähler" : "Zähler"} gefunden
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zähler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objekt / Einheit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mieter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Letzter Stand
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMeters.map((meter) => (
                <tr
                  key={meter.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <Gauge className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-dark">
                          {meter.meter_name || meter.meter_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Nr: {meter.meter_number}
                        </div>
                        {meter.location && (
                          <div className="text-xs text-gray-400 mt-1">
                            {meter.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getMeterTypeLabel(meter.meter_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {meter.property ? (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-dark">
                            {meter.property.name}
                          </div>
                          {meter.unit && (
                            <div className="text-xs text-gray-500">
                              Einheit: {meter.unit.unit_number}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {meter.tenant ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-dark">
                          {meter.tenant.first_name} {meter.tenant.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {meter.last_reading_value !== null ? (
                      <div>
                        <div className="text-sm font-medium text-dark">
                          {meter.last_reading_value} {meter.unit_of_measurement}
                        </div>
                        {meter.last_reading_date && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(meter.last_reading_date)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">
                        Kein Stand erfasst
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onAddReading(meter)}
                        className="text-primary-blue hover:text-blue-700 font-medium transition-colors"
                      >
                        Stand erfassen
                      </button>
                      <button
                        onClick={() => onEditMeter(meter)}
                        className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
