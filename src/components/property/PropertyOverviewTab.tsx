import { useState, useEffect } from "react";
import { Edit, Building2, Calendar, Euro, TrendingUp, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyOverviewTabProps {
  property: {
    id: string;
    name: string;
    address: string;
    property_type: string;
    purchase_price: number;
    current_value: number;
    purchase_date: string | null;
    size_sqm: number | null;
    rooms: number | null;
    description: string;
  };
}

interface PropertyStats {
  totalUnits: number;
  rentedUnits: number;
  vacantUnits: number;
  totalRent: number;
  occupancyRate: number;
}

export default function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PropertyStats>({
    totalUnits: 0,
    rentedUnits: 0,
    vacantUnits: 0,
    totalRent: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, property.id]);

  async function loadStats() {
    try {
      setLoading(true);

      const { data: units } = await supabase
        .from("property_units")
        .select("*")
        .eq("property_id", property.id);

      if (units) {
        const totalUnits = units.length;
        const rentedUnits = units.filter((u) => u.status === "rented").length;
        const vacantUnits = units.filter((u) => u.status === "vacant").length;
        const totalRent = units.reduce((sum, u) => sum + (Number(u.rent_amount) || 0), 0);
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        setStats({
          totalUnits,
          rentedUnits,
          vacantUnits,
          totalRent,
          occupancyRate,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "Wohnung",
      house: "Haus",
      commercial: "Gewerbe",
      parking: "Stellplatz",
      mixed: "Gemischt",
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">Stammdaten</h3>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4" />
            Bearbeiten
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Immobilienname
            </label>
            <div className="text-dark font-medium">{property.name}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Adresse
            </label>
            <div className="text-dark font-medium">{property.address}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Immobilientyp
            </label>
            <div className="text-dark font-medium">
              {getPropertyTypeLabel(property.property_type)}
            </div>
          </div>

          {property.purchase_date && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kaufdatum
              </label>
              <div className="text-dark font-medium">
                {new Date(property.purchase_date).toLocaleDateString("de-DE")}
              </div>
            </div>
          )}

          {property.rooms && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Zimmer
              </label>
              <div className="text-dark font-medium">{property.rooms}</div>
            </div>
          )}

          {property.size_sqm && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Wohnfläche
              </label>
              <div className="text-dark font-medium">{property.size_sqm} m²</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Kaufpreis
            </label>
            <div className="text-dark font-medium">
              {formatCurrency(property.purchase_price)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Aktueller Wert
            </label>
            <div className="text-dark font-medium">
              {formatCurrency(property.current_value)}
            </div>
          </div>
        </div>

        {property.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Interne Notizen
            </label>
            <div className="text-dark whitespace-pre-wrap">{property.description}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Übersicht</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-primary-blue" />
              <span className="text-sm text-gray-600">Einheiten</span>
            </div>
            <div className="text-2xl font-bold text-dark">{stats.totalUnits}</div>
            <div className="text-xs text-gray-500 mt-1">Gesamt</div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-gray-600">Vermietet</span>
            </div>
            <div className="text-2xl font-bold text-dark">{stats.rentedUnits}</div>
            <div className="text-xs text-gray-500 mt-1">Einheiten</div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-gray-600">Leer</span>
            </div>
            <div className="text-2xl font-bold text-dark">{stats.vacantUnits}</div>
            <div className="text-xs text-gray-500 mt-1">Einheiten</div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Euro className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Soll-Miete</span>
            </div>
            <div className="text-2xl font-bold text-dark">
              {formatCurrency(stats.totalRent)}
            </div>
            <div className="text-xs text-gray-500 mt-1">pro Monat</div>
          </div>
        </div>
      </div>

      {isPremium && stats.totalUnits > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Mini-Kennzahlen</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-blue" />
                <span className="text-sm text-gray-600">Auslastung</span>
              </div>
              <div className="text-2xl font-bold text-dark">
                {stats.occupancyRate.toFixed(1)}%
              </div>
            </div>

            {property.size_sqm && property.size_sqm > 0 && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Euro className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Miete pro m²</span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {formatCurrency(stats.totalRent / property.size_sqm)}
                </div>
              </div>
            )}

            {stats.totalRent > 0 && property.current_value > 0 && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-gray-600">Ist-Rendite</span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {((stats.totalRent * 12) / property.current_value * 100).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
