import { useState, useEffect } from "react";
import { Plus, Search, Grid3x3, List, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { operatingCostService, OperatingCostStatement } from "../../lib/operatingCostService";
import { supabase } from "../../lib/supabase";
import Badge from "../common/Badge";

interface Property {
  id: string;
  name: string;
}

interface StatementWithProperty extends OperatingCostStatement {
  property?: Property;
}

export default function OperatingCostsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statements, setStatements] = useState<StatementWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (user) {
      loadProperties();
      loadStatements();
    }
  }, [user, selectedYear]);

  async function loadProperties() {
    const { data } = await supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", user?.id)
      .order("name");

    if (data) setProperties(data);
  }

  async function loadStatements() {
    if (!user) return;

    setLoading(true);
    const { data } = await operatingCostService.listStatements(user.id, {
      year: selectedYear,
    });

    if (data) {
      const statementsWithProperties = await Promise.all(
        data.map(async (statement) => {
          const { data: property } = await supabase
            .from("properties")
            .select("id, name")
            .eq("id", statement.property_id)
            .single();

          return { ...statement, property: property || undefined };
        })
      );

      setStatements(statementsWithProperties);
    }

    setLoading(false);
  }

  const filteredStatements = statements.filter((statement) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return statement.property?.name.toLowerCase().includes(query);
  });

  const availableYears = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="gray">Entwurf</Badge>;
      case "ready":
        return <Badge variant="blue">Bereit</Badge>;
      case "sent":
        return <Badge variant="green">Versendet</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const handleStatementClick = (statement: StatementWithProperty) => {
    if (statement.status === "draft") {
      navigate(`/abrechnungen/betriebskosten/${statement.id}/kosten`);
    } else {
      navigate(`/abrechnungen/betriebskosten/${statement.id}/versand`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              placeholder="Nach Immobilie suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-primary-blue text-white"
                  : "bg-gray-100 text-gray-400 hover:text-gray-700"
              }`}
              title="Listenansicht"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-primary-blue text-white"
                  : "bg-gray-100 text-gray-400 hover:text-gray-700"
              }`}
              title="Rasteransicht"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => navigate("/abrechnungen/betriebskosten/neu")}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Neue Abrechnung
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Lade Abrechnungen...</p>
          </div>
        ) : filteredStatements.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {searchQuery
                ? "Keine Abrechnungen gefunden"
                : statements.length === 0
                ? "Noch keine Betriebskostenabrechnungen"
                : "Keine Abrechnungen für dieses Jahr"}
            </p>
            {!searchQuery && statements.length === 0 && (
              <button
                onClick={() => navigate("/abrechnungen/betriebskosten/neu")}
                className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
              >
                Erste Abrechnung erstellen
              </button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Immobilie
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Jahr
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Gesamtkosten
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStatements.map((statement) => (
                  <tr
                    key={statement.id}
                    onClick={() => handleStatementClick(statement)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-dark">
                      {statement.property?.name || "Unbekannte Immobilie"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {statement.year}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-dark">
                      {Number(statement.total_costs).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(statement.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStatements.map((statement) => (
              <div
                key={statement.id}
                onClick={() => handleStatementClick(statement)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-blue hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark">
                        {statement.property?.name || "Unbekannt"}
                      </h3>
                      <p className="text-sm text-gray-400">{statement.year}</p>
                    </div>
                  </div>
                  {getStatusBadge(statement.status)}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-dark">
                    {Number(statement.total_costs).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400">€</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Gesamtkosten</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
