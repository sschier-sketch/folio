import { useState, useEffect } from "react";
import { Edit, Building2, Calendar, Euro, TrendingUp, Users, Plus, Edit2, Trash2, CreditCard, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import LoanModal from "../LoanModal";

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
  onUpdate?: () => void;
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
}

interface RentalContract {
  id: string;
  property_id: string;
  base_rent: number;
  additional_costs: number;
  deposit: number;
  contract_start: string;
  contract_end: string | null;
  contract_type: string;
  notes: string;
  tenants?: Array<{
    first_name: string;
    last_name: string;
  }>;
}

export default function PropertyOverviewTab({ property, onUpdate }: PropertyOverviewTabProps) {
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
          .order("created_at", { ascending: false }),
        supabase
          .from("rental_contracts")
          .select("*")
          .eq("property_id", property.id)
          .order("created_at", { ascending: false }),
      ]);

      if (unitsRes.data) {
        const totalUnits = unitsRes.data.length;
        const rentedUnits = unitsRes.data.filter((u) => u.status === "rented").length;
        const vacantUnits = unitsRes.data.filter((u) => u.status === "vacant").length;
        const totalRent = unitsRes.data.reduce((sum, u) => sum + (Number(u.rent_amount) || 0), 0);
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        setStats({
          totalUnits,
          rentedUnits,
          vacantUnits,
          totalRent,
          occupancyRate,
        });
      }

      setLoans(loansRes.data || []);

      const contractsWithTenants: RentalContract[] = [];
      if (contractsRes.data) {
        for (const contract of contractsRes.data) {
          const { data: tenants } = await supabase
            .from("tenants")
            .select("first_name, last_name")
            .eq("contract_id", contract.id);

          contractsWithTenants.push({ ...contract, tenants: tenants || [] });
        }
      }
      setContracts(contractsWithTenants);
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


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
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

  const calculateGrossYield = () => {
    const monthlyRent = stats.totalRent;
    const annualRent = monthlyRent * 12;
    if (property.current_value === 0) return 0;
    return (annualRent / property.current_value) * 100;
  };

  const calculateNetYield = () => {
    const monthlyRent = stats.totalRent;
    const annualRent = monthlyRent * 12;
    const totalLoanPayments = loans.reduce(
      (sum, l) => sum + Number(l.monthly_payment) * 12,
      0
    );
    const netAnnualIncome = annualRent - totalLoanPayments;
    if (property.current_value === 0) return 0;
    return (netAnnualIncome / property.current_value) * 100;
  };

  const monthlyRent = stats.totalRent;
  const totalLoanPayments = loans.reduce(
    (sum, l) => sum + Number(l.monthly_payment),
    0
  );
  const netMonthlyIncome = monthlyRent - totalLoanPayments;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 relative">
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
            <TrendingUp className="w-5 h-5 text-emerald-600" />
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
                <div>Aktueller Wert: {formatCurrency(property.current_value)}</div>
                <div className="border-t border-slate-700 my-2"></div>
                <div className="font-semibold">= {calculateGrossYield().toFixed(2)}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 relative">
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
            <TrendingUp className="w-5 h-5 text-primary-blue" />
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
                <div>Aktueller Wert: {formatCurrency(property.current_value)}</div>
                <div className="border-t border-slate-700 my-2"></div>
                <div className="font-semibold">= {calculateNetYield().toFixed(2)}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Netto-Cashflow</span>
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-dark mb-1">
            {formatCurrency(netMonthlyIncome)}
          </div>
          <div className="text-xs text-gray-400">pro Monat</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark">
            Kredite & Finanzierungen
          </h2>
          <button
            onClick={() => {
              setSelectedLoan(null);
              setShowLoanModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" /> Kredit hinzufügen
          </button>
        </div>

        {loans.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Noch keine Kredite hinterlegt
          </p>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-semibold text-dark">
                      {loan.lender_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(loan.remaining_balance)} verbleibend •{" "}
                      {loan.interest_rate}% Zinsen
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
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
                        ? contract.tenants
                            .map((t) => `${t.first_name} ${t.last_name}`)
                            .join(", ")
                        : "Keine Mieter"}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(contract.base_rent)} Kaltmiete
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
