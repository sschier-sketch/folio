import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  CreditCard,
  Users,
  Edit2,
  Trash2,
  Info,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import LoanModal from "./LoanModal";
import RentalContractModal from "./RentalContractModal";
import PropertyStatistics from "./PropertyStatistics";
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
interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
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
  tenants?: Tenant[];
}
interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
}
export default function PropertyDetails({
  property,
  onBack,
}: PropertyDetailsProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"overview" | "statistics">(
    "overview",
  );
  const [loans, setLoans] = useState<Loan[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<RentalContract | null>(null);
  const [showGrossYieldTooltip, setShowGrossYieldTooltip] = useState(false);
  const [showNetYieldTooltip, setShowNetYieldTooltip] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, [property]);
  const loadData = async () => {
    if (!user) return;
    try {
      const [loansRes, contractsRes] = await Promise.all([
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
      const contractsWithTenants: RentalContract[] = [];
      if (contractsRes.data) {
        for (const contract of contractsRes.data) {
          const { data: tenants } = await supabase
            .from("tenants")
            .select("*")
            .eq("contract_id", contract.id);
          contractsWithTenants.push({ ...contract, tenants: tenants || [] });
        }
      }
      setLoans(loansRes.data || []);
      setContracts(contractsWithTenants);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteLoan = async (id: string) => {
    if (!confirm("Möchten Sie diesen Kredit wirklich löschen?")) return;
    try {
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Error deleting loan:", error);
    }
  };
  const handleDeleteContract = async (id: string) => {
    if (
      !confirm(
        "Möchten Sie dieses Mietverhältnis wirklich löschen? Alle zugehörigen Mieter werden ebenfalls gelöscht.",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("rental_contracts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Error deleting contract:", error);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };
  const calculateYield = () => {
    const monthlyRent = contracts.reduce(
      (sum, c) => sum + Number(c.base_rent),
      0,
    );
    const annualRent = monthlyRent * 12;
    const totalLoanPayments = loans.reduce(
      (sum, l) => sum + Number(l.monthly_payment) * 12,
      0,
    );
    const netAnnualIncome = annualRent - totalLoanPayments;
    if (property.current_value === 0) return 0;
    return (netAnnualIncome / property.current_value) * 100;
  };
  const calculateGrossYield = () => {
    const monthlyRent = contracts.reduce(
      (sum, c) => sum + Number(c.base_rent),
      0,
    );
    const annualRent = monthlyRent * 12;
    if (property.current_value === 0) return 0;
    return (annualRent / property.current_value) * 100;
  };
  const monthlyRent = contracts.reduce(
    (sum, c) => sum + Number(c.base_rent),
    0,
  );
  const totalLoanPayments = loans.reduce(
    (sum, l) => sum + Number(l.monthly_payment),
    0,
  );
  const netMonthlyIncome = monthlyRent - totalLoanPayments;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        {" "}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>{" "}
      </div>
    );
  }
  return (
    <div>
      {" "}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-dark mb-6 transition-colors"
      >
        {" "}
        <ArrowLeft className="w-5 h-5" /> Zurück zur Übersicht{" "}
      </button>{" "}
      <div className="bg-white rounded shadow-sm p-6 mb-6">
        {" "}
        <div className="flex justify-between items-start mb-6">
          {" "}
          <div>
            {" "}
            <h1 className="text-3xl font-bold text-dark mb-2">
              {property.name}
            </h1>{" "}
            <p className="text-gray-400">{property.address}</p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex gap-3 border-b ">
          {" "}
          <button
            onClick={() => setCurrentView("overview")}
            className={`px-6 py-3 font-medium transition-colors relative ${currentView === "overview" ? "text-primary-blue" : "text-gray-400 hover:text-dark"}`}
          >
            {" "}
            Übersicht{" "}
            {currentView === "overview" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
            )}{" "}
          </button>{" "}
          <button
            onClick={() => setCurrentView("statistics")}
            className={`px-6 py-3 font-medium transition-colors relative ${currentView === "statistics" ? "text-primary-blue" : "text-gray-400 hover:text-dark"}`}
          >
            {" "}
            Finanzanalyse{" "}
            {currentView === "statistics" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
            )}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {currentView === "overview" && (
        <>
          {" "}
          <div className="bg-white rounded shadow-sm p-6 mb-6">
            {" "}
            <div className="mb-4">
              {" "}
              <h2 className="text-xl font-semibold text-dark">
                Objektdetails
              </h2>{" "}
            </div>{" "}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {" "}
              {property.rooms && (
                <div>
                  {" "}
                  <div className="text-sm text-gray-300">Zimmer</div>{" "}
                  <div className="text-lg font-semibold text-dark">
                    {property.rooms}
                  </div>{" "}
                </div>
              )}{" "}
              {property.size_sqm && (
                <div>
                  {" "}
                  <div className="text-sm text-gray-300">Wohnfläche</div>{" "}
                  <div className="text-lg font-semibold text-dark">
                    {property.size_sqm} m²
                  </div>{" "}
                </div>
              )}{" "}
              {property.parking_spot_number && (
                <div>
                  {" "}
                  <div className="text-sm text-gray-300">
                    Stellplatznummer
                  </div>{" "}
                  <div className="text-lg font-semibold text-dark">
                    {property.parking_spot_number}
                  </div>{" "}
                </div>
              )}{" "}
              <div>
                {" "}
                <div className="text-sm text-gray-300">Kaufpreis</div>{" "}
                <div className="text-lg font-semibold text-dark">
                  {formatCurrency(property.purchase_price)}
                </div>{" "}
              </div>{" "}
              <div>
                {" "}
                <div className="text-sm text-gray-300">Aktueller Wert</div>{" "}
                <div className="text-lg font-semibold text-dark">
                  {formatCurrency(property.current_value)}
                </div>{" "}
              </div>{" "}
              {property.size_sqm && property.size_sqm > 0 && (
                <div>
                  {" "}
                  <div className="text-sm text-gray-300">Preis pro m²</div>{" "}
                  <div className="text-lg font-semibold text-dark">
                    {" "}
                    {formatCurrency(
                      property.purchase_price / property.size_sqm,
                    )}{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {" "}
            <div className="bg-white rounded shadow-sm p-6 relative">
              {" "}
              <div className="flex items-center justify-between mb-2">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <span className="text-sm text-gray-300">
                    Bruttorendite
                  </span>{" "}
                  <button
                    onMouseEnter={() => setShowGrossYieldTooltip(true)}
                    onMouseLeave={() => setShowGrossYieldTooltip(false)}
                    className="text-gray-300 hover:text-gray-400 transition-colors"
                  >
                    {" "}
                    <Info className="w-4 h-4" />{" "}
                  </button>{" "}
                </div>{" "}
                <TrendingUp className="w-5 h-5 text-emerald-600" />{" "}
              </div>{" "}
              <div className="text-3xl font-bold text-dark mb-1">
                {" "}
                {calculateGrossYield().toFixed(2)}%{" "}
              </div>{" "}
              <div className="text-xs text-gray-300">pro Jahr</div>{" "}
              {showGrossYieldTooltip && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-dark text-white text-sm rounded-lg p-4 z-10">
                  {" "}
                  <div className="font-semibold mb-2">
                    Berechnung Bruttorendite:
                  </div>{" "}
                  <div className="space-y-1 text-xs">
                    {" "}
                    <div>Formel: (Jahresmiete ÷ Aktueller Wert) × 100</div>{" "}
                    <div className="border-t border-slate-700 my-2"></div>{" "}
                    <div>
                      Monatliche Kaltmiete:{" "}
                      {formatCurrency(
                        contracts.reduce(
                          (sum, c) => sum + Number(c.base_rent),
                          0,
                        ),
                      )}
                    </div>{" "}
                    <div>
                      Jahresmiete:{" "}
                      {formatCurrency(
                        contracts.reduce(
                          (sum, c) => sum + Number(c.base_rent),
                          0,
                        ) * 12,
                      )}
                    </div>{" "}
                    <div>
                      Aktueller Wert: {formatCurrency(property.current_value)}
                    </div>{" "}
                    <div className="border-t border-slate-700 my-2"></div>{" "}
                    <div className="font-semibold">
                      = {calculateGrossYield().toFixed(2)}%
                    </div>{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="bg-white rounded shadow-sm p-6 relative">
              {" "}
              <div className="flex items-center justify-between mb-2">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <span className="text-sm text-gray-300">
                    Nettorendite
                  </span>{" "}
                  <button
                    onMouseEnter={() => setShowNetYieldTooltip(true)}
                    onMouseLeave={() => setShowNetYieldTooltip(false)}
                    className="text-gray-300 hover:text-gray-400 transition-colors"
                  >
                    {" "}
                    <Info className="w-4 h-4" />{" "}
                  </button>{" "}
                </div>{" "}
                <TrendingUp className="w-5 h-5 text-primary-blue" />{" "}
              </div>{" "}
              <div className="text-3xl font-bold text-dark mb-1">
                {" "}
                {calculateYield().toFixed(2)}%{" "}
              </div>{" "}
              <div className="text-xs text-gray-300">nach Kreditkosten</div>{" "}
              {showNetYieldTooltip && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-dark text-white text-sm rounded-lg p-4 z-10">
                  {" "}
                  <div className="font-semibold mb-2">
                    Berechnung Nettorendite:
                  </div>{" "}
                  <div className="space-y-1 text-xs">
                    {" "}
                    <div>
                      Formel: (Netto-Jahreseinkommen ÷ Aktueller Wert) × 100
                    </div>{" "}
                    <div className="border-t border-slate-700 my-2"></div>{" "}
                    <div>
                      Jahresmiete:{" "}
                      {formatCurrency(
                        contracts.reduce(
                          (sum, c) => sum + Number(c.base_rent),
                          0,
                        ) * 12,
                      )}
                    </div>{" "}
                    <div>
                      Jährliche Kreditkosten:{" "}
                      {formatCurrency(
                        loans.reduce(
                          (sum, l) => sum + Number(l.monthly_payment) * 12,
                          0,
                        ),
                      )}
                    </div>{" "}
                    <div>
                      Netto-Jahreseinkommen:{" "}
                      {formatCurrency(
                        contracts.reduce(
                          (sum, c) => sum + Number(c.base_rent),
                          0,
                        ) *
                          12 -
                          loans.reduce(
                            (sum, l) => sum + Number(l.monthly_payment) * 12,
                            0,
                          ),
                      )}
                    </div>{" "}
                    <div>
                      Aktueller Wert: {formatCurrency(property.current_value)}
                    </div>{" "}
                    <div className="border-t border-slate-700 my-2"></div>{" "}
                    <div className="font-semibold">
                      = {calculateYield().toFixed(2)}%
                    </div>{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="bg-white rounded shadow-sm p-6">
              {" "}
              <div className="flex items-center justify-between mb-2">
                {" "}
                <span className="text-sm text-gray-300">
                  Netto-Cashflow
                </span>{" "}
                <Users className="w-5 h-5 text-amber-600" />{" "}
              </div>{" "}
              <div className="text-3xl font-bold text-dark mb-1">
                {" "}
                {formatCurrency(netMonthlyIncome)}{" "}
              </div>{" "}
              <div className="text-xs text-gray-300">pro Monat</div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-white rounded shadow-sm p-6 mb-6">
            {" "}
            <div className="flex justify-between items-center mb-4">
              {" "}
              <h2 className="text-xl font-semibold text-dark">
                Kredite & Finanzierungen
              </h2>{" "}
              <button
                onClick={() => {
                  setSelectedLoan(null);
                  setShowLoanModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-primary-blue text-white text-sm rounded-full font-medium hover:bg-primary-blue transition-colors"
              >
                {" "}
                <Plus className="w-4 h-4" /> Kredit hinzufügen{" "}
              </button>{" "}
            </div>{" "}
            {loans.length === 0 ? (
              <p className="text-gray-300 text-center py-8">
                Noch keine Kredite hinterlegt
              </p>
            ) : (
              <div className="space-y-3">
                {" "}
                {loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    {" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <CreditCard className="w-5 h-5 text-gray-300" />{" "}
                      <div>
                        {" "}
                        <div className="font-semibold text-dark">
                          {loan.lender_name}
                        </div>{" "}
                        <div className="text-sm text-gray-400">
                          {" "}
                          {formatCurrency(loan.remaining_balance)} verbleibend •{" "}
                          {loan.interest_rate}% Zinsen{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <div className="text-right">
                        {" "}
                        <div className="font-semibold text-dark">
                          {formatCurrency(loan.monthly_payment)}
                        </div>{" "}
                        <div className="text-sm text-gray-300">
                          monatlich
                        </div>{" "}
                      </div>{" "}
                      <div className="flex gap-2">
                        {" "}
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowLoanModal(true);
                          }}
                          className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                        >
                          {" "}
                          <Edit2 className="w-4 h-4" />{" "}
                        </button>{" "}
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          {" "}
                          <Trash2 className="w-4 h-4" />{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          </div>{" "}
          <div className="bg-white rounded shadow-sm p-6">
            {" "}
            <div className="flex justify-between items-center mb-4">
              {" "}
              <h2 className="text-xl font-semibold text-dark">
                Mietverhältnisse
              </h2>{" "}
              <button
                onClick={() => {
                  setSelectedContract(null);
                  setShowContractModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                {" "}
                <Plus className="w-4 h-4" /> Mietverhältnis hinzufügen{" "}
              </button>{" "}
            </div>{" "}
            {contracts.length === 0 ? (
              <p className="text-gray-300 text-center py-8">
                {" "}
                Noch keine Mietverhältnisse vorhanden{" "}
              </p>
            ) : (
              <div className="space-y-3">
                {" "}
                {contracts.map((contract) => (
                  <div key={contract.id} className="p-4 bg-gray-50 rounded-lg">
                    {" "}
                    <div className="flex items-center justify-between mb-2">
                      {" "}
                      <div className="flex items-center gap-4">
                        {" "}
                        <Users className="w-5 h-5 text-gray-300" />{" "}
                        <div>
                          {" "}
                          <div className="font-semibold text-dark">
                            {" "}
                            {contract.tenants && contract.tenants.length > 0
                              ? contract.tenants
                                  .map((t) => `${t.first_name} ${t.last_name}`)
                                  .join(", ")
                              : "Keine Mieter"}{" "}
                          </div>{" "}
                          <div className="text-sm text-gray-400">
                            {" "}
                            {formatCurrency(contract.base_rent)} Kaltmiete{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="flex gap-2">
                        {" "}
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowContractModal(true);
                          }}
                          className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                        >
                          {" "}
                          <Edit2 className="w-4 h-4" />{" "}
                        </button>{" "}
                        <button
                          onClick={() => handleDeleteContract(contract.id)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          {" "}
                          <Trash2 className="w-4 h-4" />{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    {contract.tenants && contract.tenants.length > 1 && (
                      <div className="mt-2 pt-2 border-t ">
                        {" "}
                        <div className="text-xs text-gray-300">
                          {" "}
                          {contract.tenants.length} Mieter im
                          Mietverhältnis{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          </div>{" "}
        </>
      )}{" "}
      {currentView === "statistics" && (
        <PropertyStatistics
          property={property}
          onClose={() => setCurrentView("overview")}
        />
      )}{" "}
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
          }}
        />
      )}{" "}
      {showContractModal && (
        <RentalContractModal
          contract={selectedContract}
          properties={[{ id: property.id, name: property.name }]}
          onClose={() => {
            setShowContractModal(false);
            setSelectedContract(null);
          }}
          onSave={() => {
            setShowContractModal(false);
            setSelectedContract(null);
            loadData();
          }}
        />
      )}{" "}
    </div>
  );
}
