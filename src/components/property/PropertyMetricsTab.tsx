import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, Euro, Home, AlertCircle, Info, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { getMonthlyHausgeldEur } from "../../lib/hausgeldUtils";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";
import { Button } from '../ui/Button';

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
  futureContracts: Array<{ contract_start: string; base_rent: number }>;
  effectiveArea: number;
  roiBase: 'purchase' | 'value' | 'none';
}

interface RentDetail {
  unitNumber: string;
  rent: number;
}

interface CostDetails {
  hausgeldByUnit: Array<{ unitNumber: string; hausgeld: number }>;
  loanPayments: number;
  avgExpenses: number;
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
    futureContracts: [],
    effectiveArea: 0,
    roiBase: 'none',
  });

  const [expandedRent, setExpandedRent] = useState(false);
  const [expandedCosts, setExpandedCosts] = useState(false);
  const [rentDetails, setRentDetails] = useState<RentDetail[]>([]);
  const [costDetails, setCostDetails] = useState<CostDetails>({ hausgeldByUnit: [], loanPayments: 0, avgExpenses: 0 });

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo] = useState(`${currentYear}-12-31`);

  useEffect(() => {
    if (user && isPremium) {
      loadMetrics();
    }
  }, [user, propertyId, isPremium, dateFrom, dateTo]);

  async function loadMetrics() {
    try {
      setLoading(true);

      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      const daysInPeriod = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsInPeriod = daysInPeriod / 30;

      const [propertyRes, unitsRes, contractsRes, expensesRes, loansRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).eq("user_id", user.id).single(),
        supabase.from("property_units").select("id, unit_number, status, area_sqm, purchase_price, current_value, housegeld_monthly_cents").eq("property_id", propertyId),
        supabase.from("rental_contracts").select("base_rent, contract_start, contract_end, property_id, unit_id").eq("user_id", user.id),
        supabase
          .from("expenses")
          .select("amount")
          .eq("property_id", propertyId)
          .eq("user_id", user.id)
          .gte("expense_date", dateFrom)
          .lte("expense_date", dateTo),
        supabase.from("loans").select("monthly_payment").eq("property_id", propertyId).eq("user_id", user.id),
      ]);

      if (propertyRes.data) {
        setProperty(propertyRes.data);

        const units = unitsRes.data || [];
        const totalUnits = units.length;
        const unitIds = new Set(units.map(u => u.id));

        const today = new Date();
        const allContracts = (contractsRes.data || []).filter(c =>
          c.property_id === propertyId ||
          (c.unit_id && unitIds.has(c.unit_id))
        );
        const activeStartedContracts = allContracts.filter(c => {
          const startDate = new Date(c.contract_start);
          const endDate = c.contract_end ? new Date(c.contract_end) : null;
          return startDate <= today && (!endDate || endDate >= today);
        });
        const futureContracts = allContracts.filter(c => {
          const startDate = new Date(c.contract_start);
          return startDate > today;
        });

        let vacantUnits = 0;
        let vacancyRate = 0;
        if (totalUnits > 0) {
          const occupiedByStatus = units.filter(u =>
            u.status === 'rented' || u.status === 'occupied' || u.status === 'self_occupied'
          ).length;
          const occupiedByContracts = Math.min(activeStartedContracts.length, totalUnits);
          const occupiedCount = Math.max(occupiedByStatus, occupiedByContracts);
          vacantUnits = Math.max(0, totalUnits - occupiedCount);
          vacancyRate = (vacantUnits / totalUnits) * 100;
        } else if (activeStartedContracts.length === 0) {
          vacancyRate = 100;
        }

        const monthlyRent = activeStartedContracts.reduce((sum, c) => sum + Number(c.base_rent || 0), 0);

        const totalExpensesInPeriod =
          expensesRes.data?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

        const monthlyLoanPayments =
          loansRes.data?.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0) || 0;

        const monthlyHausgeld = getMonthlyHausgeldEur(
          units.map(u => ({
            id: u.id,
            unit_number: u.unit_number || '',
            property_id: propertyId,
            housegeld_monthly_cents: Number(u.housegeld_monthly_cents) || 0,
          })),
          { propertyId }
        );

        const monthlyExpensesFromData = monthsInPeriod > 0 ? totalExpensesInPeriod / monthsInPeriod : 0;
        const monthlyExpenses = monthlyExpensesFromData + monthlyLoanPayments + monthlyHausgeld;

        const costRatio = monthlyRent > 0 ? (monthlyExpenses / monthlyRent) * 100 : 0;

        const unitsTotalArea = unitsRes.data?.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0) || 0;
        const effectiveSqm = (propertyRes.data.size_sqm && propertyRes.data.size_sqm > 0)
          ? propertyRes.data.size_sqm
          : unitsTotalArea;

        const rentPerSqm = effectiveSqm > 0
          ? monthlyRent / effectiveSqm
          : 0;

        const annualRent = monthlyRent * 12;
        const annualExpenses = monthlyExpenses * 12;
        const netAnnualIncome = annualRent - annualExpenses;

        const unitsTotalPurchasePrice = unitsRes.data?.reduce((sum, u) => sum + Number(u.purchase_price || 0), 0) || 0;
        const unitsTotalCurrentValue = unitsRes.data?.reduce((sum, u) => sum + Number(u.current_value || 0), 0) || 0;

        const effectivePurchasePrice = propertyRes.data.purchase_price > 0
          ? propertyRes.data.purchase_price
          : unitsTotalPurchasePrice;
        const effectiveCurrentValue = propertyRes.data.current_value > 0
          ? propertyRes.data.current_value
          : unitsTotalCurrentValue;

        const investmentBase = effectivePurchasePrice > 0
          ? effectivePurchasePrice
          : effectiveCurrentValue;

        const roi = investmentBase > 0
          ? (netAnnualIncome / investmentBase) * 100
          : 0;

        const roiBase = effectivePurchasePrice > 0 ? 'purchase' as const
          : effectiveCurrentValue > 0 ? 'value' as const
          : 'none' as const;

        const unitMap = new Map(units.map(u => [u.id, u.unit_number || u.id.slice(0, 6)]));
        const rentByUnit: RentDetail[] = activeStartedContracts.map(c => ({
          unitNumber: c.unit_id ? (unitMap.get(c.unit_id) || 'Unbekannt') : 'Gesamtobjekt',
          rent: Number(c.base_rent || 0),
        }));
        setRentDetails(rentByUnit);

        const hausgeldByUnit = units
          .filter(u => Number(u.housegeld_monthly_cents) > 0)
          .map(u => ({
            unitNumber: u.unit_number || u.id.slice(0, 6),
            hausgeld: Number(u.housegeld_monthly_cents) / 100,
          }));
        setCostDetails({
          hausgeldByUnit,
          loanPayments: monthlyLoanPayments,
          avgExpenses: monthlyExpensesFromData,
        });

        setMetrics({
          rentPerSqm,
          vacancyRate,
          costRatio,
          monthlyRent,
          monthlyExpenses,
          roi,
          totalUnits,
          vacantUnits,
          futureContracts: futureContracts.map(c => ({ contract_start: c.contract_start, base_rent: c.base_rent })),
          effectiveArea: effectiveSqm,
          roiBase,
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

  const InfoTooltip = ({ text }: { text: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <div className="relative inline-block ml-2">
        <button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
        {showTooltip && (
          <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg -top-2 left-6 transform">
            <div className="absolute -left-1 top-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            {text}
          </div>
        )}
      </div>
    );
  };

  if (!isPremium) {
    return <PremiumUpgradePrompt featureKey="property_metrics" />;
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

      <div className="bg-white rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Euro className="w-6 h-6" style={{ color: '#1E1E24' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">Miete pro m²</p>
                <InfoTooltip text="Berechnung: Gesamte monatliche Kaltmiete aller aktiven Mietverträge geteilt durch die Gesamtfläche der Immobilie in m²" />
              </div>
              <p className="text-2xl font-bold text-dark">{formatCurrency(metrics.rentPerSqm)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Basierend auf {metrics.effectiveArea.toFixed(1)} m² Gesamtfläche
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Home className="w-6 h-6" style={{ color: '#1E1E24' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">Leerstandsquote</p>
                <InfoTooltip text="Berechnung: Anzahl leerstehender Einheiten geteilt durch Gesamtanzahl der Einheiten × 100. Bei Immobilien ohne definierte Einheiten wird 100% angezeigt wenn keine aktiven Mietverträge vorhanden sind." />
              </div>
              <p className="text-2xl font-bold text-dark">{formatPercent(metrics.vacancyRate)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.vacantUnits} von {metrics.totalUnits} Einheit{metrics.totalUnits !== 1 ? "en" : ""} leer
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <BarChart3 className="w-6 h-6" style={{ color: '#1E1E24' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">Kostenquote</p>
                <InfoTooltip text="Berechnung: Monatliche Gesamtkosten (Ausgaben im gewählten Zeitraum + Kreditraten) geteilt durch monatliche Mieteinnahmen × 100. Zeigt an, welcher Anteil der Mieteinnahmen für Kosten aufgewendet wird." />
              </div>
              <p className="text-2xl font-bold text-dark">{formatPercent(metrics.costRatio)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(metrics.monthlyExpenses)} von {formatCurrency(metrics.monthlyRent)} Miete
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#1E1E24' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">ROI (Return on Investment)</p>
                <InfoTooltip text="Berechnung: (Jährliche Mieteinnahmen - Jährliche Kosten) geteilt durch Kaufpreis (oder aktuellen Wert falls kein Kaufpreis vorhanden) × 100. Zeigt die jährliche Rendite auf das investierte Kapital." />
              </div>
              <p className="text-2xl font-bold text-dark">{formatPercent(metrics.roi)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.roiBase === 'purchase' ? 'Jährliche Nettorendite auf Kaufpreis' : metrics.roiBase === 'value' ? 'Jährliche Nettorendite auf aktuellen Wert' : 'Kein Kaufpreis oder Wert hinterlegt'}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Euro className="w-6 h-6" style={{ color: '#1E1E24' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">Monatliche Mieteinnahmen</p>
                <InfoTooltip text="Berechnung: Summe der Kaltmieten aller aktiven und bereits begonnenen Mietverträge. Zukünftige Mietverträge werden separat angezeigt und fließen nicht in diese Berechnung ein." />
              </div>
              <p className="text-2xl font-bold text-dark">{formatCurrency(metrics.monthlyRent)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(metrics.monthlyRent * 12)} pro Jahr
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
              <Euro className="w-6 h-6" style={{ color: '#1E1E24' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">Monatliche Kosten</p>
                <InfoTooltip text="Berechnung: Durchschnittliche monatliche Ausgaben im gewählten Zeitraum (alle erfassten Ausgaben geteilt durch Anzahl Monate) plus monatliche Kreditraten aller Kredite für diese Immobilie." />
              </div>
              <p className="text-2xl font-bold text-dark">{formatCurrency(metrics.monthlyExpenses)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(metrics.monthlyExpenses * 12)} pro Jahr
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h4 className="text-lg font-semibold text-dark mb-4">Cashflow-Übersicht</h4>
        <div className="space-y-0">
          <button
            onClick={() => setExpandedRent(!expandedRent)}
            className="w-full flex items-center justify-between py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors rounded-t-lg px-2 -mx-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {expandedRent ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <span className="text-gray-600">Monatliche Mieteinnahmen</span>
            </div>
            <span className="font-semibold text-green-600">{formatCurrency(metrics.monthlyRent)}</span>
          </button>
          {expandedRent && (
            <div className="border-b border-gray-200 bg-gray-50/50">
              {rentDetails.length > 0 ? rentDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 px-8 text-sm border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-500">Einheit {detail.unitNumber}</span>
                  <span className="text-gray-700">{formatCurrency(detail.rent)}</span>
                </div>
              )) : (
                <div className="py-3 px-8 text-sm text-gray-400">Keine aktiven Mietverträge</div>
              )}
            </div>
          )}

          <button
            onClick={() => setExpandedCosts(!expandedCosts)}
            className="w-full flex items-center justify-between py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors px-2 -mx-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {expandedCosts ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <span className="text-gray-600">Monatliche Kosten</span>
            </div>
            <span className="font-semibold text-red-600">- {formatCurrency(metrics.monthlyExpenses)}</span>
          </button>
          {expandedCosts && (
            <div className="border-b border-gray-200 bg-gray-50/50">
              {costDetails.hausgeldByUnit.length > 0 && costDetails.hausgeldByUnit.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 px-8 text-sm border-b border-gray-100">
                  <span className="text-gray-500">Hausgeld Einheit {detail.unitNumber}</span>
                  <span className="text-gray-700">{formatCurrency(detail.hausgeld)}</span>
                </div>
              ))}
              {costDetails.loanPayments > 0 && (
                <div className="flex items-center justify-between py-2.5 px-8 text-sm border-b border-gray-100">
                  <span className="text-gray-500">Kreditraten</span>
                  <span className="text-gray-700">{formatCurrency(costDetails.loanPayments)}</span>
                </div>
              )}
              {costDetails.avgExpenses > 0 && (
                <div className="flex items-center justify-between py-2.5 px-8 text-sm border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-500">Durchschn. Ausgaben</span>
                  <span className="text-gray-700">{formatCurrency(costDetails.avgExpenses)}</span>
                </div>
              )}
              {costDetails.hausgeldByUnit.length === 0 && costDetails.loanPayments === 0 && costDetails.avgExpenses === 0 && (
                <div className="py-3 px-8 text-sm text-gray-400">Keine Kosten erfasst</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-4 mt-4">
            <span className="text-dark font-semibold">Monatlicher Überschuss</span>
            <span className={`font-bold text-lg ${metrics.monthlyRent - metrics.monthlyExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(metrics.monthlyRent - metrics.monthlyExpenses)}
            </span>
          </div>
        </div>
      </div>

      {metrics.futureContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">Zukünftige Mietverträge</p>
              <p className="text-xs text-amber-700 mb-2">
                Es gibt {metrics.futureContracts.length} Mietvertrag{metrics.futureContracts.length > 1 ? 'e' : ''}, der/die noch nicht begonnen hat/haben und daher nicht in die Berechnung einfließt/einfließen:
              </p>
              <div className="space-y-1">
                {metrics.futureContracts.map((contract, idx) => (
                  <div key={idx} className="text-xs text-amber-700">
                    • Kaltmiete {formatCurrency(contract.base_rent)}/Monat ab {new Date(contract.contract_start).toLocaleDateString('de-DE')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
        <p className="text-sm text-blue-900">
          Die Kennzahlen werden basierend auf bereits begonnenen Mietverträgen berechnet. Kostenquote und ROI berücksichtigen
          Ausgaben im gewählten Zeitraum sowie laufende Kreditraten. Für genauere Analysen können Sie im
          Finanzbereich detaillierte Auswertungen vornehmen.
        </p>
      </div>
    </div>
  );
}
