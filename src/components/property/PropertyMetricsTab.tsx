import { useState, useEffect } from "react";
import { Lock, BarChart3, TrendingUp, TrendingDown, Euro, Home, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyMetricsTabProps {
  propertyId: string;
}

interface PropertyData {
  id: string;
  name: string;
  size_sqm: number | null;
  current_value: number;
  purchase_price: number;
}

interface Metrics {
  rentPerSqm: number;
  vacancyRate: number;
  costRatio: number;
  monthlyRent: number;
  monthlyExpenses: number;
  roi: number;
  totalUnits: number;
  vacantUnits: number;
}

interface Comparison {
  lastMonth: Metrics | null;
  lastYear: Metrics | null;
}

export default function PropertyMetricsTab({ propertyId }: PropertyMetricsTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    rentPerSqm: 0,
    vacancyRate: 0,
    costRatio: 0,
    monthlyRent: 0,
    monthlyExpenses: 0,
    roi: 0,
    totalUnits: 0,
    vacantUnits: 0,
  });

  useEffect(() => {
    if (user && isPremium) {
      loadMetrics();
    }
  }, [user, propertyId, isPremium]);

  async function loadMetrics() {
    try {
      setLoading(true);

      const [propertyRes, unitsRes, contractsRes, expensesRes, loansRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).single(),
        supabase.from("property_units").select("id, status").eq("property_id", propertyId),
        supabase.from("rental_contracts").select("base_rent, status").eq("property_id", propertyId),
        supabase
          .from("expenses")
          .select("amount")
          .eq("property_id", propertyId)
          .gte("expense_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("loans").select("monthly_payment").eq("property_id", propertyId),
      ]);

      if (propertyRes.data) {
        setProperty(propertyRes.data);

        const totalUnits = unitsRes.data?.length || 1;
        const vacantUnits = unitsRes.data?.filter((u) => u.status === "vacant").length || 0;
        const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0;

        const monthlyRent =
          contractsRes.data
            ?.filter((c) => c.status === "active")
            .reduce((sum, c) => sum + Number(c.base_rent || 0), 0) || 0;

        const monthlyExpensesFromData =
          expensesRes.data?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

        const monthlyLoanPayments =
          loansRes.data?.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0) || 0;

        const monthlyExpenses = monthlyExpensesFromData + monthlyLoanPayments;

        const costRatio = monthlyRent > 0 ? (monthlyExpenses / monthlyRent) * 100 : 0;

        const rentPerSqm =
          propertyRes.data.size_sqm && propertyRes.data.size_sqm > 0
            ? monthlyRent / propertyRes.data.size_sqm
            : 0;

        const annualRent = monthlyRent * 12;
        const annualExpenses = monthlyExpenses * 12;
        const netAnnualIncome = annualRent - annualExpenses;
        const roi =
          propertyRes.data.purchase_price > 0
            ? (netAnnualIncome / propertyRes.data.purchase_price) * 100
            : 0;

        setMetrics({
          rentPerSqm,
          vacancyRate,
          costRatio,
          monthlyRent,
          monthlyExpenses,
          roi,
          totalUnits,
          vacantUnits,
        });
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!isPremium) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">Pro-Funktion</h3>
          <p className="text-gray-600 mb-6">
            Erweiterte Kennzahlen und Analysen sind im Pro-Tarif verfügbar. Upgrade jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Miete pro m² und Leerstandsquote</span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Kostenquote und ROI-Berechnung</span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Vergleich Vormonat und Vorjahr</span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Visuelle Auswertungen und Diagramme</span>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            Jetzt auf Pro upgraden
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark">Kennzahlen</h3>
        <p className="text-sm text-gray-500 mt-1">Übersicht der wichtigsten Kennzahlen für diese Immobilie</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Miete pro m²</p>
              <p className="text-2xl font-bold text-dark">{formatCurrency(metrics.rentPerSqm)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Basierend auf {property?.size_sqm || 0} m² Gesamtfläche
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Leerstandsquote</p>
              <p className="text-2xl font-bold text-dark">{formatPercent(metrics.vacancyRate)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.vacantUnits} von {metrics.totalUnits} Einheit{metrics.totalUnits !== 1 ? "en" : ""} leer
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metrics.costRatio > 80 ? "bg-red-100" : metrics.costRatio > 50 ? "bg-amber-100" : "bg-emerald-100"}`}>
              <BarChart3 className={`w-6 h-6 ${metrics.costRatio > 80 ? "text-red-600" : metrics.costRatio > 50 ? "text-amber-600" : "text-emerald-600"}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kostenquote</p>
              <p className="text-2xl font-bold text-dark">{formatPercent(metrics.costRatio)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(metrics.monthlyExpenses)} von {formatCurrency(metrics.monthlyRent)} Miete
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ROI (Return on Investment)</p>
              <p className="text-2xl font-bold text-dark">{formatPercent(metrics.roi)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Jährliche Nettorendite auf Kaufpreis
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monatliche Mieteinnahmen</p>
              <p className="text-2xl font-bold text-dark">{formatCurrency(metrics.monthlyRent)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(metrics.monthlyRent * 12)} pro Jahr
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monatliche Kosten</p>
              <p className="text-2xl font-bold text-dark">{formatCurrency(metrics.monthlyExpenses)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(metrics.monthlyExpenses * 12)} pro Jahr
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-dark mb-4">Cashflow-Übersicht</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">Monatliche Mieteinnahmen</span>
            <span className="font-semibold text-green-600">{formatCurrency(metrics.monthlyRent)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">Monatliche Kosten</span>
            <span className="font-semibold text-red-600">- {formatCurrency(metrics.monthlyExpenses)}</span>
          </div>
          <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-4">
            <span className="text-dark font-semibold">Monatlicher Überschuss</span>
            <span className={`font-bold text-lg ${metrics.monthlyRent - metrics.monthlyExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(metrics.monthlyRent - metrics.monthlyExpenses)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Hinweis zu Kennzahlen</p>
            <p className="text-xs text-blue-700">
              Die Kennzahlen werden basierend auf den aktuellen Daten berechnet. Kostenquote und ROI berücksichtigen
              Ausgaben der letzten 30 Tage sowie laufende Kreditraten. Für genauere Analysen können Sie im
              Finanzbereich detaillierte Auswertungen vornehmen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
