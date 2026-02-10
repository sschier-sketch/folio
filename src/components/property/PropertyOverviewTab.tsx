import { useState, useEffect } from "react";
import { Edit, Building2, Calendar, Euro, TrendingUp, Users, Edit2, Trash2, CreditCard, Info, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { getMonthlyHausgeldEur } from "../../lib/hausgeldUtils";
import { useSubscription } from "../../hooks/useSubscription";
import LoanModal from "../LoanModal";
import { Button } from '../ui/Button';

interface PropertyOverviewTabProps {
  property: {
    id: string;
    name: string;
    address: string;
    property_type: string;
    property_management_type?: string;
    ownership_type?: string;
    purchase_price: number;
    current_value: number;
    purchase_date: string | null;
    description: string;
  };
  onUpdate?: () => void;
  onNavigateToTenant?: (tenantId: string) => void;
}

interface PropertyStats {
  totalUnits: number;
  rentedUnits: number;
  vacantUnits: number;
  totalRent: number;
  occupancyRate: number;
}

interface Loan {
  id: string;
  lender_name: string;
  loan_amount: number;
  remaining_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  loan_type: string;
  fixed_interest_start_date?: string;
  fixed_interest_end_date?: string;
  fixed_interest_equals_loan_end?: boolean;
  special_repayment_allowed?: boolean;
  special_repayment_max_amount?: number;
  special_repayment_max_percent?: number;
  special_repayment_due_date?: string;
  special_repayment_annual_end?: boolean;
  special_repayment_used_amount?: number;
  loan_status?: string;
  responsible_person?: string;
}

interface RentalContract {
  id: string;
  property_id: string;
  unit_id?: string | null;
  base_rent: number;
  additional_costs: number;
  deposit: number;
  contract_start: string;
  contract_end: string | null;
  contract_type: string;
  notes: string;
  tenants?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
  property_units?: {
    id: string;
    unit_number: string;
  };
}

export default function PropertyOverviewTab({ property, onUpdate, onNavigateToTenant }: PropertyOverviewTabProps) {
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
  const [loans, setLoans] = useState<Loan[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showGrossYieldTooltip, setShowGrossYieldTooltip] = useState(false);
  const [showNetYieldTooltip, setShowNetYieldTooltip] = useState(false);
  const [isEditingMasterData, setIsEditingMasterData] = useState(false);
  const [aggregatedValues, setAggregatedValues] = useState({
    totalPurchasePrice: property.purchase_price,
    totalCurrentValue: property.current_value,
  });
  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [editData, setEditData] = useState({
    name: property.name,
    address: property.address,
    property_type: property.property_type,
    property_management_type: property.property_management_type || "self_management",
    purchase_date: property.purchase_date || "",
    purchase_price: property.purchase_price,
    current_value: property.current_value,
    description: property.description,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, property.id]);

  async function loadData() {
    try {
      setLoading(true);

      const [unitsRes, loansRes, contractsRes] = await Promise.all([
        supabase
          .from("property_units")
          .select("*")
          .eq("property_id", property.id),
        supabase
          .from("loans")
          .select("*")
          .eq("property_id", property.id)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("rental_contracts")
          .select(`
            *,
            property_units(id, unit_number)
          `)
          .eq("property_id", property.id)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const contractsWithTenants: RentalContract[] = [];
      if (contractsRes.data) {
        for (const contract of contractsRes.data) {
          const { data: tenants } = await supabase
            .from("tenants")
            .select("id, first_name, last_name")
            .eq("contract_id", contract.id);

          contractsWithTenants.push({ ...contract, tenants: tenants || [] });
        }
      }
      setContracts(contractsWithTenants);

      if (unitsRes.data) {
        setUnitsData(unitsRes.data);
        const totalUnits = unitsRes.data.length;
        const rentedUnits = unitsRes.data.filter((u) => u.status === "rented").length;
        const vacantUnits = unitsRes.data.filter((u) => u.status === "vacant").length;

        const today = new Date();
        const activeContracts = contractsWithTenants.filter(c => {
          const startDate = new Date(c.contract_start);
          const endDate = c.contract_end ? new Date(c.contract_end) : null;
          return startDate <= today && (!endDate || endDate >= today);
        });

        const totalRent = activeContracts.reduce((sum, c) => sum + (Number(c.base_rent) || 0), 0);
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        setStats({
          totalUnits,
          rentedUnits,
          vacantUnits,
          totalRent,
          occupancyRate,
        });

        if (property.ownership_type === 'units_only') {
          const unitPurchasePrice = unitsRes.data.reduce((sum, u) => sum + (Number(u.purchase_price) || 0), 0);
          const unitCurrentValue = unitsRes.data.reduce((sum, u) => sum + (Number(u.current_value) || 0), 0);
          setAggregatedValues({
            totalPurchasePrice: unitPurchasePrice > 0 ? unitPurchasePrice : (Number(property.purchase_price) || 0),
            totalCurrentValue: unitCurrentValue > 0 ? unitCurrentValue : (Number(property.current_value) || 0),
          });
        } else {
          setAggregatedValues({
            totalPurchasePrice: Number(property.purchase_price) || 0,
            totalCurrentValue: Number(property.current_value) || 0,
          });
        }
      }

      setLoans(loansRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLoan(id: string) {
    if (!confirm("Möchten Sie diesen Kredit wirklich löschen?")) return;

    try {
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Error deleting loan:", error);
    }
  }

  async function handleSaveMasterData() {
    if (!user) return;

    try {
      const changes: string[] = [];

      if (editData.name !== property.name) changes.push("Name");
      if (editData.address !== property.address) changes.push("Adresse");
      if (editData.property_type !== property.property_type) changes.push("Immobilientyp");
      if (editData.property_management_type !== (property.property_management_type || "self_management"))
        changes.push("Verwaltungsart");
      if (editData.purchase_date !== (property.purchase_date || "")) changes.push("Kaufdatum");
      if (Number(editData.purchase_price) !== Number(property.purchase_price)) changes.push("Kaufpreis");
      if (Number(editData.current_value) !== Number(property.current_value)) changes.push("Aktueller Wert");
      if (editData.description !== property.description) changes.push("Beschreibung");

      const { error } = await supabase
        .from("properties")
        .update({
          name: editData.name,
          address: editData.address,
          property_type: editData.property_type,
          property_management_type: editData.property_management_type,
          purchase_date: editData.purchase_date || null,
          purchase_price: Number(editData.purchase_price),
          current_value: Number(editData.current_value),
          description: editData.description,
        })
        .eq("id", property.id);

      if (error) throw error;

      if (changes.length > 0) {
        await supabase.from("property_history").insert([
          {
            property_id: property.id,
            user_id: user.id,
            event_type: "property_updated",
            event_description: `Überblick aktualisiert: ${changes.join(', ')}`,
          },
        ]);
      }

      setIsEditingMasterData(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Fehler beim Speichern der Daten");
    }
  }


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multi_family: "Mehrfamilienhaus",
      house: "Einfamilienhaus",
      commercial: "Gewerbeeinheit",
      parking: "Garage/Stellplatz",
      land: "Grundstück",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const getPropertyManagementTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      self_management: "Eigenverwaltung",
      property_management: "Hausverwaltung",
      rental_management: "Miet Verwaltung",
      weg_management: "WEG Verwaltung",
      rental_and_weg_management: "Miet und WEG Verwaltung",
    };
    return type ? labels[type] || type : "Nicht angegeben";
  };

  const calculateGrossYield = () => {
    const monthlyRent = stats.totalRent;
    const annualRent = monthlyRent * 12;
    if (aggregatedValues.totalCurrentValue === 0) return 0;
    return (annualRent / aggregatedValues.totalCurrentValue) * 100;
  };

  const monthlyHausgeld = getMonthlyHausgeldEur(
    unitsData.map((u: any) => ({
      id: u.id,
      unit_number: u.unit_number || '',
      property_id: property.id,
      housegeld_monthly_cents: Number(u.housegeld_monthly_cents) || 0,
    })),
    { propertyId: property.id }
  );

  const calculateNetYield = () => {
    const monthlyRent = stats.totalRent;
    const annualRent = monthlyRent * 12;
    const totalLoanPayments = loans.reduce(
      (sum, l) => sum + Number(l.monthly_payment) * 12,
      0
    );
    const netAnnualIncome = annualRent - totalLoanPayments - (monthlyHausgeld * 12);
    if (aggregatedValues.totalCurrentValue === 0) return 0;
    return (netAnnualIncome / aggregatedValues.totalCurrentValue) * 100;
  };

  const monthlyRent = stats.totalRent;
  const totalLoanPayments = loans.reduce(
    (sum, l) => sum + Number(l.monthly_payment),
    0
  );
  const netMonthlyIncome = monthlyRent - totalLoanPayments - monthlyHausgeld;

  const getDaysUntilDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getLoanStatus = (loan: Loan) => {
    if (loan.loan_status === "ended") return { label: "Beendet", color: "bg-gray-100 text-gray-700", icon: CheckCircle };
    if (loan.loan_status === "refinancing") return { label: "In Umschuldung", color: "bg-blue-100 text-blue-700", icon: AlertCircle };

    const fixedInterestEndDate = loan.fixed_interest_end_date;
    if (fixedInterestEndDate) {
      const daysUntil = getDaysUntilDate(fixedInterestEndDate);
      if (daysUntil !== null) {
        if (daysUntil < 0) return { label: "Zinsbindung abgelaufen", color: "bg-red-100 text-red-700", icon: AlertCircle };
        if (daysUntil <= 90) return { label: "Zinsbindung endet bald", color: "bg-red-100 text-red-700", icon: AlertCircle };
        if (daysUntil <= 180) return { label: "Zinsbindung endet bald", color: "bg-amber-100 text-amber-700", icon: Clock };
      }
    }

    return { label: "Aktiv", color: "bg-green-100 text-green-700", icon: CheckCircle };
  };

  const getNextEvent = (loan: Loan) => {
    const events: Array<{ date: string; label: string; days: number }> = [];

    if (loan.fixed_interest_end_date) {
      const days = getDaysUntilDate(loan.fixed_interest_end_date);
      if (days !== null && days >= 0) {
        events.push({
          date: loan.fixed_interest_end_date,
          label: "Zinsbindung endet",
          days,
        });
      }
    }

    if (loan.special_repayment_allowed && loan.special_repayment_due_date) {
      const days = getDaysUntilDate(loan.special_repayment_due_date);
      if (days !== null && days >= 0) {
        events.push({
          date: loan.special_repayment_due_date,
          label: "Sondertilgung möglich bis",
          days,
        });
      }
    }

    if (loan.end_date) {
      const days = getDaysUntilDate(loan.end_date);
      if (days !== null && days >= 0) {
        events.push({
          date: loan.end_date,
          label: "Kreditende",
          days,
        });
      }
    }

    if (events.length === 0) return null;

    events.sort((a, b) => a.days - b.days);
    const nextEvent = events[0];

    return {
      label: nextEvent.label,
      date: new Date(nextEvent.date).toLocaleDateString("de-DE"),
      days: nextEvent.days,
    };
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">Stammdaten</h3>
          {!isEditingMasterData ? (
            <Button onClick={() => setIsEditingMasterData(true)} variant="secondary">
              Bearbeiten
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsEditingMasterData(false);
                  setEditData({
                    name: property.name,
                    address: property.address,
                    property_type: property.property_type,
                    property_management_type: property.property_management_type || "self_management",
                    purchase_date: property.purchase_date || "",
                    purchase_price: property.purchase_price,
                    current_value: property.current_value,
                    description: property.description,
                  });
                }}
                variant="cancel"
              >
                Abbrechen
              </Button>
              <Button onClick={handleSaveMasterData} variant="primary">
                Speichern
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Immobilienname
            </label>
            {isEditingMasterData ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            ) : (
              <div className="text-dark font-medium">{property.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            {isEditingMasterData ? (
              <input
                type="text"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            ) : (
              <div className="text-dark font-medium">{property.address}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Immobilientyp
            </label>
            {isEditingMasterData ? (
              <select
                value={editData.property_type}
                onChange={(e) => setEditData({ ...editData, property_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="multi_family">Mehrfamilienhaus</option>
                <option value="house">Einfamilienhaus</option>
                <option value="commercial">Gewerbeeinheit</option>
                <option value="parking">Garage/Stellplatz</option>
                <option value="land">Grundstück</option>
                <option value="other">Sonstiges</option>
              </select>
            ) : (
              <div className="text-dark font-medium">
                {getPropertyTypeLabel(property.property_type)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Immobilienverwaltung
            </label>
            {isEditingMasterData ? (
              <select
                value={editData.property_management_type}
                onChange={(e) => setEditData({ ...editData, property_management_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="self_management">Eigenverwaltung</option>
                <option value="property_management">Hausverwaltung</option>
              </select>
            ) : (
              <div className="text-dark font-medium">
                {getPropertyManagementTypeLabel(property.property_management_type)}
              </div>
            )}
          </div>

          {property.ownership_type !== 'units_only' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kaufdatum
              </label>
              {isEditingMasterData ? (
                <input
                  type="date"
                  value={editData.purchase_date}
                  onChange={(e) => setEditData({ ...editData, purchase_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              ) : property.purchase_date ? (
                <div className="text-dark font-medium">
                  {new Date(property.purchase_date).toLocaleDateString("de-DE")}
                </div>
              ) : (
                <div className="text-gray-400 italic">Nicht angegeben</div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kaufpreis {property.ownership_type === 'units_only' ? '(Summe Einheiten)' : ''}
            </label>
            {isEditingMasterData && property.ownership_type !== 'units_only' ? (
              <input
                type="number"
                value={editData.purchase_price}
                onChange={(e) => setEditData({ ...editData, purchase_price: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            ) : (
              <div className="text-dark font-medium">
                {formatCurrency(aggregatedValues.totalPurchasePrice)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aktueller Wert {property.ownership_type === 'units_only' ? '(Summe Einheiten)' : ''}
            </label>
            {isEditingMasterData && property.ownership_type !== 'units_only' ? (
              <input
                type="number"
                value={editData.current_value}
                onChange={(e) => setEditData({ ...editData, current_value: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            ) : (
              <div className="text-dark font-medium">
                {formatCurrency(aggregatedValues.totalCurrentValue)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interne Notizen
          </label>
          {isEditingMasterData ? (
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          ) : property.description ? (
            <div className="text-dark whitespace-pre-wrap">{property.description}</div>
          ) : (
            <div className="text-gray-400 italic">Keine Notizen vorhanden</div>
          )}
        </div>
      </div>

      {property.ownership_type === 'units_only' && unitsData.length > 0 && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Kaufdaten der Einheiten</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Einheit</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kaufdatum</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Kaufpreis</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Aktueller Wert</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Wertentwicklung</th>
                </tr>
              </thead>
              <tbody>
                {unitsData.map((unit) => {
                  const purchasePrice = Number(unit.purchase_price) || 0;
                  const currentValue = Number(unit.current_value) || 0;
                  const valueChange = currentValue - purchasePrice;
                  const valueChangePercent = purchasePrice > 0 ? (valueChange / purchasePrice) * 100 : 0;
                  return (
                    <tr key={unit.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-medium text-dark">{unit.unit_number}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {unit.purchase_date
                          ? new Date(unit.purchase_date).toLocaleDateString("de-DE")
                          : <span className="text-gray-400 italic">Nicht angegeben</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">
                        {purchasePrice > 0
                          ? formatCurrency(purchasePrice)
                          : <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">
                        {currentValue > 0
                          ? formatCurrency(currentValue)
                          : <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {purchasePrice > 0 && currentValue > 0 ? (
                          <span className={valueChange >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            {valueChange >= 0 ? "+" : ""}{formatCurrency(valueChange)} ({valueChangePercent >= 0 ? "+" : ""}{valueChangePercent.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-3 px-4 text-sm font-semibold text-dark">Gesamt</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-sm font-semibold text-dark text-right">
                    {formatCurrency(aggregatedValues.totalPurchasePrice)}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-dark text-right">
                    {formatCurrency(aggregatedValues.totalCurrentValue)}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-right">
                    {aggregatedValues.totalPurchasePrice > 0 ? (
                      <span className={aggregatedValues.totalCurrentValue - aggregatedValues.totalPurchasePrice >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {aggregatedValues.totalCurrentValue - aggregatedValues.totalPurchasePrice >= 0 ? "+" : ""}
                        {formatCurrency(aggregatedValues.totalCurrentValue - aggregatedValues.totalPurchasePrice)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Bruttorendite</span>
              <button
                onMouseEnter={() => setShowGrossYieldTooltip(true)}
                onMouseLeave={() => setShowGrossYieldTooltip(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <TrendingUp className="w-5 h-5" style={{ color: '#3c8af7' }} strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {calculateGrossYield().toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">pro Jahr</div>

          {showGrossYieldTooltip && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-dark text-white text-sm rounded-lg p-4 z-10 shadow-lg">
              <div className="font-semibold mb-2">Berechnung Bruttorendite:</div>
              <div className="space-y-1 text-xs">
                <div>Formel: (Jahresmiete ÷ Aktueller Wert) × 100</div>
                <div className="border-t border-slate-700 my-2"></div>
                <div>Monatliche Kaltmiete: {formatCurrency(monthlyRent)}</div>
                <div>Jahresmiete: {formatCurrency(monthlyRent * 12)}</div>
                <div>Aktueller Wert: {formatCurrency(aggregatedValues.totalCurrentValue)}</div>
                <div className="border-t border-slate-700 my-2"></div>
                <div className="font-semibold">= {calculateGrossYield().toFixed(2)}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Nettorendite</span>
              <button
                onMouseEnter={() => setShowNetYieldTooltip(true)}
                onMouseLeave={() => setShowNetYieldTooltip(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <TrendingUp className="w-5 h-5" style={{ color: '#3c8af7' }} strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {calculateNetYield().toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">nach Kreditkosten</div>

          {showNetYieldTooltip && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-dark text-white text-sm rounded-lg p-4 z-10 shadow-lg">
              <div className="font-semibold mb-2">Berechnung Nettorendite:</div>
              <div className="space-y-1 text-xs">
                <div>Formel: (Netto-Jahreseinkommen ÷ Aktueller Wert) × 100</div>
                <div className="border-t border-slate-700 my-2"></div>
                <div>Jahresmiete: {formatCurrency(monthlyRent * 12)}</div>
                <div>
                  Jährliche Kreditkosten: {formatCurrency(totalLoanPayments * 12)}
                </div>
                <div>
                  Netto-Jahreseinkommen:{" "}
                  {formatCurrency(monthlyRent * 12 - totalLoanPayments * 12)}
                </div>
                <div>Aktueller Wert: {formatCurrency(aggregatedValues.totalCurrentValue)}</div>
                <div className="border-t border-slate-700 my-2"></div>
                <div className="font-semibold">= {calculateNetYield().toFixed(2)}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Netto-Cashflow</span>
            <Users className="w-5 h-5" style={{ color: '#3c8af7' }} strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {formatCurrency(netMonthlyIncome)}
          </div>
          <div className="text-xs text-gray-400">pro Monat</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark">
            Kredite & Finanzierungen
          </h2>
          <Button
            onClick={() => {
              setSelectedLoan(null);
              setShowLoanModal(true);
            }}
            variant="primary"
          >
            Kredit hinzufügen
          </Button>
        </div>

        {loans.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Noch keine Kredite hinterlegt
          </p>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const status = getLoanStatus(loan);
              const nextEvent = getNextEvent(loan);
              const StatusIcon = status.icon;

              return (
                <div
                  key={loan.id}
                  className="p-4 bg-gray-50 rounded-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-dark">
                            {loan.lender_name}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(loan.remaining_balance)} verbleibend •{" "}
                          {loan.interest_rate}% Zinsen
                        </div>
                        {loan.special_repayment_allowed && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                            <Info className="w-3.5 h-3.5" />
                            <span>
                              Sondertilgung möglich: bis{" "}
                              {loan.special_repayment_max_amount
                                ? formatCurrency(loan.special_repayment_max_amount)
                                : loan.special_repayment_max_percent
                                ? `${loan.special_repayment_max_percent}%`
                                : "–"}{" "}
                              / Jahr
                            </span>
                            {loan.special_repayment_used_amount && loan.special_repayment_used_amount > 0 && (
                              <span className="text-gray-500">
                                ({formatCurrency(loan.special_repayment_used_amount)} genutzt)
                              </span>
                            )}
                          </div>
                        )}
                        {nextEvent && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-gray-700">
                              <span className="font-medium">Nächstes Ereignis:</span>{" "}
                              {nextEvent.label} am {nextEvent.date}{" "}
                              <span className="text-gray-500">
                                (in {nextEvent.days} {nextEvent.days === 1 ? "Tag" : "Tagen"})
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 ml-4">
                      <div className="text-right">
                        <div className="font-semibold text-dark">
                          {formatCurrency(loan.monthly_payment)}
                        </div>
                        <div className="text-sm text-gray-400">monatlich</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowLoanModal(true);
                          }}
                          className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-semibold text-dark mb-6">Mietverhältnisse</h2>

        {contracts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Noch keine Mietverhältnisse vorhanden
          </p>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-dark">
                      {contract.tenants && contract.tenants.length > 0
                        ? contract.tenants.map((t, index) => (
                            <span key={t.id}>
                              {index > 0 && ", "}
                              <button
                                onClick={() => onNavigateToTenant && onNavigateToTenant(t.id)}
                                className="text-primary-blue hover:underline"
                              >
                                {t.first_name} {t.last_name}
                              </button>
                            </span>
                          ))
                        : "Keine Mieter"}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {contract.property_units && (
                        <span className="font-medium text-primary-blue">
                          Einheit {contract.property_units.unit_number}
                        </span>
                      )}
                      {!contract.property_units && (
                        <span className="font-medium text-gray-400 italic">
                          Keine Einheit zugeordnet
                        </span>
                      )}
                      <span className="mx-2">•</span>
                      <span className="font-medium">{formatCurrency(contract.base_rent)} Kaltmiete</span>
                      {contract.tenants && contract.tenants.length > 1 && (
                        <span className="ml-2">• {contract.tenants.length} Mieter</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLoanModal && (
        <LoanModal
          propertyId={property.id}
          loan={selectedLoan}
          onClose={() => {
            setShowLoanModal(false);
            setSelectedLoan(null);
          }}
          onSave={() => {
            setShowLoanModal(false);
            setSelectedLoan(null);
            loadData();
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}
