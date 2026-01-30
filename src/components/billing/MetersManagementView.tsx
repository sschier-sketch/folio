import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, Gauge, Edit2, Activity, ChevronDown, History } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import * as XLSX from "xlsx";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";

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
  onViewHistory: (meter: Meter) => void;
  refreshTrigger?: number;
}

export default function MetersManagementView({
  onAddMeter,
  onEditMeter,
  onAddReading,
  onViewHistory,
  refreshTrigger = 0
}: MetersManagementViewProps) {
  const { user } = useAuth();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterProperty, filterPeriod]);

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

    if (filterPeriod !== "all") {
      if (!meter.last_reading_date) return false;

      const now = new Date();
      const lastReading = new Date(meter.last_reading_date);
      const daysDiff = Math.floor((now.getTime() - lastReading.getTime()) / (1000 * 60 * 60 * 24));

      if (filterPeriod === "7days" && (daysDiff < 0 || daysDiff > 7)) return false;
      if (filterPeriod === "30days" && (daysDiff < 0 || daysDiff > 30)) return false;
      if (filterPeriod === "90days" && (daysDiff < 0 || daysDiff > 90)) return false;
      if (filterPeriod === "365days" && (daysDiff < 0 || daysDiff > 365)) return false;
    }

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

  const totalPages = Math.ceil(filteredMeters.length / itemsPerPage);
  const paginatedMeters = filteredMeters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const getExportData = () => {
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

    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zaehler_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Zähler");
    XLSX.writeFile(wb, `zaehler_${new Date().toISOString().split("T")[0]}.xlsx`);
    setShowExportMenu(false);
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
          className="px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
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

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 bg-white"
            >
              <Download className="w-4 h-4" />
              Exportieren
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  Als CSV exportieren
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  Als Excel exportieren
                </button>
              </div>
            )}
          </div>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zeitraum
              </label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="all">Alle Zeiträume</option>
                <option value="7days">Letzte 7 Tage</option>
                <option value="30days">Letzte 30 Tage</option>
                <option value="90days">Letzte 90 Tage</option>
                <option value="365days">Letztes Jahr</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterProperty("all");
                  setFilterPeriod("all");
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedMeters.map((meter) => (
                <tr
                  key={meter.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-dark">
                        {meter.meter_name || meter.meter_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Nr: {meter.meter_number}
                      </div>
                      {meter.location && (
                        <div className="text-xs text-gray-500 mt-1">
                          {meter.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getMeterTypeLabel(meter.meter_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {meter.property ? (
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
                    ) : (
                      <span className="text-gray-400 italic text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {meter.tenant ? (
                      <span className="text-sm text-dark">
                        {meter.tenant.first_name} {meter.tenant.last_name}
                      </span>
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
                          <div className="text-xs text-gray-500 mt-1">
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
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <TableActionsDropdown
                        actions={[
                          {
                            label: 'Stand erfassen',
                            onClick: () => onAddReading(meter)
                          },
                          {
                            label: 'Verlauf anzeigen',
                            onClick: () => onViewHistory(meter)
                          },
                          {
                            label: 'Bearbeiten',
                            onClick: () => onEditMeter(meter)
                          }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-6 py-4">
          <div className="text-sm text-gray-600">
            Seite {currentPage} von {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
