import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Calculator,
  Building2,
  CreditCard,
  BarChart3,
  PieChart,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { PremiumFeatureGuard } from "./PremiumFeatureGuard";
interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyRent: number;
  loanPayments: number;
  otherExpenses: number;
}
interface ProjectionData {
  year: number;
  revenue: number;
  expenses: number;
  netIncome: number;
  cumulativeIncome: number;
}
interface PropertyFinancials {
  id: string;
  name: string;
  address: string;
  monthlyRent: number;
  yearlyRent: number;
  contracts: number;
}
interface LoanFinancials {
  id: string;
  propertyName: string;
  lenderName: string;
  monthlyPayment: number;
  yearlyPayment: number;
  remainingBalance: number;
  interestRate: number;
}
export default function FinancialAnalysisView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    monthlyRent: 0,
    loanPayments: 0,
    otherExpenses: 0,
  });
  const [propertyFinancials, setPropertyFinancials] = useState<
    PropertyFinancials[]
  >([]);
  const [loanFinancials, setLoanFinancials] = useState<LoanFinancials[]>([]);
  const [projectionYears, setProjectionYears] = useState(5);
  const [rentIncrease, setRentIncrease] = useState(2);
  const [expenseIncrease, setExpenseIncrease] = useState(2);
  const [projections, setProjections] = useState<ProjectionData[]>([]);
  const [viewMode, setViewMode] = useState<"current" | "projection">("current");
  useEffect(() => {
    loadFinancialData();
  }, [user]);
  useEffect(() => {
    if (financialData.monthlyRent > 0) {
      calculateProjections();
    }
  }, [financialData, projectionYears, rentIncrease, expenseIncrease]);
  const loadFinancialData = async () => {
    if (!user) return;
    try {
      const [contractsRes, paymentsRes, loansRes, propertiesRes] =
        await Promise.all([
          supabase
            .from("rental_contracts")
            .select("property_id, base_rent, additional_costs")
            .eq("user_id", user.id),
          supabase
            .from("rent_payments")
            .select("amount, paid_date")
            .eq("user_id", user.id)
            .eq("paid", true),
          supabase
            .from("loans")
            .select(
              "id, property_id, lender_name, monthly_payment, remaining_balance, interest_rate",
            )
            .eq("user_id", user.id),
          supabase
            .from("properties")
            .select("id, name, street, city")
            .eq("user_id", user.id),
        ]);
      const properties = propertiesRes.data || [];
      const contracts = contractsRes.data || [];
      const loans = loansRes.data || [];
      const propertyMap = new Map(properties.map((p) => [p.id, p]));
      const propertyFinancialsData: PropertyFinancials[] = properties.map(
        (property) => {
          const propertyContracts = contracts.filter(
            (c) => c.property_id === property.id,
          );
          const monthlyRent = propertyContracts.reduce(
            (sum, c) =>
              sum + Number(c.base_rent) + Number(c.additional_costs || 0),
            0,
          );
          return {
            id: property.id,
            name: property.name,
            address: `${property.street}, ${property.city}`,
            monthlyRent,
            yearlyRent: monthlyRent * 12,
            contracts: propertyContracts.length,
          };
        },
      );
      const loanFinancialsData: LoanFinancials[] = loans.map((loan) => {
        const property = propertyMap.get(loan.property_id);
        return {
          id: loan.id,
          propertyName: property?.name || "Unbekannt",
          lenderName: loan.lender_name || "Unbekannt",
          monthlyPayment: Number(loan.monthly_payment),
          yearlyPayment: Number(loan.monthly_payment) * 12,
          remainingBalance: Number(loan.remaining_balance || 0),
          interestRate: Number(loan.interest_rate || 0),
        };
      });
      const monthlyRent = propertyFinancialsData.reduce(
        (sum, p) => sum + p.monthlyRent,
        0,
      );
      const totalRevenue =
        paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const loanPayments = loanFinancialsData.reduce(
        (sum, l) => sum + l.monthlyPayment,
        0,
      );
      const monthlyExpenses = loanPayments;
      const totalExpenses = monthlyExpenses * 12;
      const netIncome = monthlyRent * 12 - totalExpenses;
      setFinancialData({
        totalRevenue,
        totalExpenses,
        netIncome,
        monthlyRent,
        loanPayments,
        otherExpenses: 0,
      });
      setPropertyFinancials(propertyFinancialsData);
      setLoanFinancials(loanFinancialsData);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };
  const calculateProjections = () => {
    const projectionData: ProjectionData[] = [];
    let cumulativeIncome = 0;
    for (let year = 1; year <= projectionYears; year++) {
      const yearlyRentIncrease = Math.pow(1 + rentIncrease / 100, year);
      const yearlyExpenseIncrease = Math.pow(1 + expenseIncrease / 100, year);
      const revenue = financialData.monthlyRent * 12 * yearlyRentIncrease;
      const expenses =
        (financialData.loanPayments * 12 + financialData.otherExpenses) *
        yearlyExpenseIncrease;
      const netIncome = revenue - expenses;
      cumulativeIncome += netIncome;
      projectionData.push({
        year,
        revenue,
        expenses,
        netIncome,
        cumulativeIncome,
      });
    }
    setProjections(projectionData);
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
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
  return (
    <PremiumFeatureGuard featureName="Finanzanalyse & Prognosen">
      {" "}
      <div>
        {" "}
        <div className="mb-8">
          {" "}
          <h1 className="text-3xl font-bold text-dark mb-2">
            Finanzanalyse
          </h1>{" "}
          <p className="text-gray-400">
            Aktuelle Zahlen und Zukunftsprognosen
          </p>{" "}
        </div>{" "}
        <div className="flex gap-3 mb-6">
          {" "}
          <button
            onClick={() => setViewMode("current")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${viewMode === "current" ? "bg-primary-blue text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
          >
            {" "}
            IST-Stand{" "}
          </button>{" "}
          <button
            onClick={() => setViewMode("projection")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${viewMode === "projection" ? "bg-primary-blue text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
          >
            {" "}
            Prognose{" "}
          </button>{" "}
        </div>{" "}
        {viewMode === "current" && (
          <>
            {" "}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {" "}
              <div className="bg-white rounded shadow-sm p-6">
                {" "}
                <div className="flex items-center justify-between mb-4">
                  {" "}
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    {" "}
                    <TrendingUp className="w-6 h-6 text-emerald-600" />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-3xl font-bold text-dark mb-1">
                  {" "}
                  {formatCurrency(financialData.monthlyRent * 12)}{" "}
                </div>{" "}
                <div className="text-sm text-gray-400">
                  Jährliche Mieteinnahmen
                </div>{" "}
              </div>{" "}
              <div className="bg-white rounded shadow-sm p-6">
                {" "}
                <div className="flex items-center justify-between mb-4">
                  {" "}
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    {" "}
                    <TrendingDown className="w-6 h-6 text-red-600" />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-3xl font-bold text-dark mb-1">
                  {" "}
                  {formatCurrency(
                    financialData.loanPayments * 12 +
                      financialData.otherExpenses,
                  )}{" "}
                </div>{" "}
                <div className="text-sm text-gray-400">
                  Jährliche Ausgaben
                </div>{" "}
              </div>{" "}
              <div className="bg-white rounded shadow-sm p-6">
                {" "}
                <div className="flex items-center justify-between mb-4">
                  {" "}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${financialData.netIncome >= 0 ? "bg-primary-blue/10" : "bg-amber-100"}`}
                  >
                    {" "}
                    <DollarSign
                      className={`w-6 h-6 ${financialData.netIncome >= 0 ? "text-primary-blue" : "text-amber-600"}`}
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div
                  className={`text-3xl font-bold mb-1 ${financialData.netIncome >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {" "}
                  {formatCurrency(financialData.netIncome)}{" "}
                </div>{" "}
                <div className="text-sm text-gray-400">
                  Nettoeinkommen (Jahr)
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {" "}
              <div className="bg-white rounded shadow-sm p-6">
                {" "}
                <div className="flex items-center gap-3 mb-6">
                  {" "}
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    {" "}
                    <Building2 className="w-5 h-5 text-emerald-600" />{" "}
                  </div>{" "}
                  <h3 className="text-lg font-semibold text-dark">
                    Einnahmen nach Objekt
                  </h3>{" "}
                </div>{" "}
                {propertyFinancials.length === 0 ? (
                  <div className="text-center py-8 text-gray-300">
                    {" "}
                    Keine Objekte vorhanden{" "}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {" "}
                    {propertyFinancials.map((property) => (
                      <div
                        key={property.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {" "}
                        <div className="flex justify-between items-start mb-2">
                          {" "}
                          <div className="flex-1">
                            {" "}
                            <h4 className="font-semibold text-dark">
                              {property.name}
                            </h4>{" "}
                            <p className="text-sm text-gray-400">
                              {property.address}
                            </p>{" "}
                          </div>{" "}
                          <div className="text-right">
                            {" "}
                            <div className="text-lg font-bold text-emerald-600">
                              {" "}
                              {formatCurrency(property.monthlyRent)}{" "}
                            </div>{" "}
                            <div className="text-xs text-gray-300">
                              pro Monat
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex items-center justify-between text-sm text-gray-400 mt-2 pt-2 border-t ">
                          {" "}
                          <span>
                            {property.contracts} Vertrag
                            {property.contracts !== 1 ? "e" : ""}
                          </span>{" "}
                          <span className="font-semibold text-dark">
                            {" "}
                            {formatCurrency(property.yearlyRent)}/Jahr{" "}
                          </span>{" "}
                        </div>{" "}
                      </div>
                    ))}{" "}
                    <div className="mt-4 pt-4 border-t-2 flex justify-between items-center">
                      {" "}
                      <span className="font-bold text-dark">Gesamt</span>{" "}
                      <div className="text-right">
                        {" "}
                        <div className="text-xl font-bold text-emerald-600">
                          {" "}
                          {formatCurrency(financialData.monthlyRent)}{" "}
                        </div>{" "}
                        <div className="text-sm text-gray-400">
                          {" "}
                          {formatCurrency(financialData.monthlyRent * 12)}
                          /Jahr{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
              </div>{" "}
              <div className="bg-white rounded shadow-sm p-6">
                {" "}
                <div className="flex items-center gap-3 mb-6">
                  {" "}
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    {" "}
                    <CreditCard className="w-5 h-5 text-red-600" />{" "}
                  </div>{" "}
                  <h3 className="text-lg font-semibold text-dark">
                    Ausgaben nach Kredit
                  </h3>{" "}
                </div>{" "}
                {loanFinancials.length === 0 ? (
                  <div className="text-center py-8 text-gray-300">
                    {" "}
                    Keine Kredite vorhanden{" "}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {" "}
                    {loanFinancials.map((loan) => (
                      <div
                        key={loan.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {" "}
                        <div className="flex justify-between items-start mb-2">
                          {" "}
                          <div className="flex-1">
                            {" "}
                            <h4 className="font-semibold text-dark">
                              {loan.lenderName}
                            </h4>{" "}
                            <p className="text-sm text-gray-400">
                              {loan.propertyName}
                            </p>{" "}
                          </div>{" "}
                          <div className="text-right">
                            {" "}
                            <div className="text-lg font-bold text-red-600">
                              {" "}
                              {formatCurrency(loan.monthlyPayment)}{" "}
                            </div>{" "}
                            <div className="text-xs text-gray-300">
                              pro Monat
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex items-center justify-between text-sm text-gray-400 mt-2 pt-2 border-t ">
                          {" "}
                          <span>
                            Restsaldo: {formatCurrency(loan.remainingBalance)}
                          </span>{" "}
                          <span className="font-semibold text-dark">
                            {" "}
                            {loan.interestRate.toFixed(2)}% Zins{" "}
                          </span>{" "}
                        </div>{" "}
                      </div>
                    ))}{" "}
                    <div className="mt-4 pt-4 border-t-2 flex justify-between items-center">
                      {" "}
                      <span className="font-bold text-dark">Gesamt</span>{" "}
                      <div className="text-right">
                        {" "}
                        <div className="text-xl font-bold text-red-600">
                          {" "}
                          {formatCurrency(financialData.loanPayments)}{" "}
                        </div>{" "}
                        <div className="text-sm text-gray-400">
                          {" "}
                          {formatCurrency(financialData.loanPayments * 12)}
                          /Jahr{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      {" "}
                      <div className="flex items-center justify-between text-sm">
                        {" "}
                        <span className="text-amber-900 font-semibold">
                          Gesamte Restschuld:
                        </span>{" "}
                        <span className="text-lg font-bold text-amber-900">
                          {" "}
                          {formatCurrency(
                            loanFinancials.reduce(
                              (sum, l) => sum + l.remainingBalance,
                              0,
                            ),
                          )}{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white rounded shadow-sm p-6">
              {" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
                  {" "}
                  <BarChart3 className="w-5 h-5 text-primary-blue" />{" "}
                </div>{" "}
                <h3 className="text-lg font-semibold text-dark">
                  Übersicht
                </h3>{" "}
              </div>{" "}
              <div className="space-y-6">
                {" "}
                <div>
                  {" "}
                  <div className="flex justify-between items-center mb-2">
                    {" "}
                    <span className="text-sm font-medium text-gray-400">
                      Einnahmen vs. Ausgaben (Monatlich)
                    </span>{" "}
                    <span className="text-sm text-gray-400">
                      {" "}
                      {financialData.monthlyRent > 0
                        ? `${((financialData.loanPayments / financialData.monthlyRent) * 100).toFixed(1)}% Ausgabenquote`
                        : "Keine Daten"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="relative h-12 bg-gray-50 rounded-lg overflow-hidden">
                    {" "}
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm"
                      style={{
                        width: `${financialData.monthlyRent > 0 ? (financialData.monthlyRent / (financialData.monthlyRent + financialData.loanPayments)) * 100 : 0}%`,
                      }}
                    >
                      {" "}
                      {financialData.monthlyRent > 0 &&
                        formatCurrency(financialData.monthlyRent)}{" "}
                    </div>{" "}
                    <div
                      className="absolute top-0 h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm"
                      style={{
                        left: `${financialData.monthlyRent > 0 ? (financialData.monthlyRent / (financialData.monthlyRent + financialData.loanPayments)) * 100 : 0}%`,
                        width: `${financialData.monthlyRent > 0 ? (financialData.loanPayments / (financialData.monthlyRent + financialData.loanPayments)) * 100 : 0}%`,
                      }}
                    >
                      {" "}
                      {financialData.loanPayments > 0 &&
                        formatCurrency(financialData.loanPayments)}{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex justify-between mt-2 text-sm">
                    {" "}
                    <span className="text-emerald-600 font-semibold">
                      Einnahmen
                    </span>{" "}
                    <span className="text-red-600 font-semibold">
                      Ausgaben
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                {loanFinancials.length > 0 && (
                  <div>
                    {" "}
                    <div className="flex justify-between items-center mb-2">
                      {" "}
                      <span className="text-sm font-medium text-gray-400">
                        Restschuld nach Objekt
                      </span>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      {loanFinancials.map((loan) => (
                        <div key={loan.id}>
                          {" "}
                          <div className="flex justify-between items-center text-sm mb-1">
                            {" "}
                            <span className="text-gray-400">
                              {loan.propertyName}
                            </span>{" "}
                            <span className="font-semibold text-dark">
                              {formatCurrency(loan.remainingBalance)}
                            </span>{" "}
                          </div>{" "}
                          <div className="relative h-2 bg-gray-50 rounded-full overflow-hidden">
                            {" "}
                            <div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                              style={{
                                width: `${loanFinancials.length > 0 ? (loan.remainingBalance / Math.max(...loanFinancials.map((l) => l.remainingBalance))) * 100 : 0}%`,
                              }}
                            />{" "}
                          </div>{" "}
                        </div>
                      ))}{" "}
                    </div>{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>{" "}
          </>
        )}{" "}
        {viewMode === "projection" && (
          <>
            {" "}
            <div className="bg-white rounded shadow-sm p-6 mb-6">
              {" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
                  {" "}
                  <PieChart className="w-5 h-5 text-primary-blue" />{" "}
                </div>{" "}
                <h3 className="text-lg font-semibold text-dark">
                  Prognose-Einstellungen
                </h3>{" "}
              </div>{" "}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Prognosezeitraum{" "}
                  </label>{" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={projectionYears}
                      onChange={(e) =>
                        setProjectionYears(Number(e.target.value))
                      }
                      className="flex-1"
                    />{" "}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg min-w-[100px]">
                      {" "}
                      <Calendar className="w-4 h-4 text-gray-400" />{" "}
                      <span className="font-semibold text-dark">
                        {projectionYears} Jahre
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Mietsteigerung p.a.{" "}
                  </label>{" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={rentIncrease}
                      onChange={(e) => setRentIncrease(Number(e.target.value))}
                      className="flex-1"
                    />{" "}
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-lg min-w-[100px]">
                      {" "}
                      <TrendingUp className="w-4 h-4 text-emerald-600" />{" "}
                      <span className="font-semibold text-emerald-900">
                        {rentIncrease}%
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {" "}
                    Kostensteigerung p.a.{" "}
                  </label>{" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={expenseIncrease}
                      onChange={(e) =>
                        setExpenseIncrease(Number(e.target.value))
                      }
                      className="flex-1"
                    />{" "}
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg min-w-[100px]">
                      {" "}
                      <TrendingDown className="w-4 h-4 text-red-600" />{" "}
                      <span className="font-semibold text-red-900">
                        {expenseIncrease}%
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white rounded shadow-sm p-6 mb-6">
              {" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
                  {" "}
                  <BarChart3 className="w-5 h-5 text-primary-blue" />{" "}
                </div>{" "}
                <h3 className="text-lg font-semibold text-dark">
                  Prognose-Visualisierung
                </h3>{" "}
              </div>{" "}
              <div className="space-y-6">
                {" "}
                <div>
                  {" "}
                  <div className="mb-4">
                    {" "}
                    <span className="text-sm font-medium text-gray-400">
                      Nettoeinkommen über die Jahre
                    </span>{" "}
                  </div>{" "}
                  <div className="relative h-64 flex items-end gap-2">
                    {" "}
                    {projections.slice(0, 10).map((proj, idx) => {
                      const maxValue = Math.max(
                        ...projections.map((p) => Math.abs(p.netIncome)),
                      );
                      const height =
                        maxValue > 0
                          ? Math.abs((proj.netIncome / maxValue) * 100)
                          : 0;
                      const isPositive = proj.netIncome >= 0;
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          {" "}
                          <div
                            className="relative w-full"
                            style={{ height: "220px" }}
                          >
                            {" "}
                            <div className="absolute bottom-0 w-full flex flex-col items-center">
                              {" "}
                              <div
                                className={`w-full rounded-t-lg transition-all ${isPositive ? "bg-gradient-to-t from-emerald-500 to-emerald-400" : "bg-gradient-to-t from-red-500 to-red-400"}`}
                                style={{ height: `${height}%` }}
                              >
                                {" "}
                                {height > 15 && (
                                  <div className="text-white text-xs font-semibold text-center pt-2">
                                    {" "}
                                    {formatCurrency(proj.netIncome)}{" "}
                                  </div>
                                )}{" "}
                              </div>{" "}
                            </div>{" "}
                          </div>{" "}
                          <div className="text-xs font-medium text-gray-400">
                            Jahr {proj.year}
                          </div>{" "}
                        </div>
                      );
                    })}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {" "}
                  <div>
                    {" "}
                    <div className="mb-4">
                      {" "}
                      <span className="text-sm font-medium text-gray-400">
                        Kumuliertes Einkommen
                      </span>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      {projections
                        .slice(0, Math.min(10, projectionYears))
                        .map((proj, idx) => {
                          const maxCumulative = Math.max(
                            ...projections.map((p) =>
                              Math.abs(p.cumulativeIncome),
                            ),
                          );
                          const width =
                            maxCumulative > 0
                              ? (Math.abs(proj.cumulativeIncome) /
                                  maxCumulative) *
                                100
                              : 0;
                          const isPositive = proj.cumulativeIncome >= 0;
                          return (
                            <div key={idx}>
                              {" "}
                              <div className="flex justify-between items-center text-sm mb-1">
                                {" "}
                                <span className="text-gray-400 font-medium">
                                  Jahr {proj.year}
                                </span>{" "}
                                <span
                                  className={`font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}
                                >
                                  {" "}
                                  {formatCurrency(proj.cumulativeIncome)}{" "}
                                </span>{" "}
                              </div>{" "}
                              <div className="relative h-2 bg-gray-50 rounded-full overflow-hidden">
                                {" "}
                                <div
                                  className={`absolute top-0 left-0 h-full rounded-full ${isPositive ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-red-400 to-red-600"}`}
                                  style={{ width: `${width}%` }}
                                />{" "}
                              </div>{" "}
                            </div>
                          );
                        })}{" "}
                    </div>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <div className="mb-4">
                      {" "}
                      <span className="text-sm font-medium text-gray-400">
                        Restschuld-Entwicklung
                      </span>{" "}
                    </div>{" "}
                    {loanFinancials.length > 0 ? (
                      <div className="space-y-2">
                        {" "}
                        {projections
                          .slice(0, Math.min(10, projectionYears))
                          .map((proj, idx) => {
                            const totalDebt = loanFinancials.reduce(
                              (sum, l) => sum + l.remainingBalance,
                              0,
                            );
                            const yearlyPrincipal = loanFinancials.reduce(
                              (sum, l) => sum + l.monthlyPayment * 12 * 0.6,
                              0,
                            );
                            const estimatedDebt = Math.max(
                              0,
                              totalDebt - yearlyPrincipal * proj.year,
                            );
                            const width =
                              totalDebt > 0
                                ? (estimatedDebt / totalDebt) * 100
                                : 0;
                            return (
                              <div key={idx}>
                                {" "}
                                <div className="flex justify-between items-center text-sm mb-1">
                                  {" "}
                                  <span className="text-gray-400 font-medium">
                                    Jahr {proj.year}
                                  </span>{" "}
                                  <span className="font-bold text-amber-900">
                                    {" "}
                                    {formatCurrency(estimatedDebt)}{" "}
                                  </span>{" "}
                                </div>{" "}
                                <div className="relative h-2 bg-gray-50 rounded-full overflow-hidden">
                                  {" "}
                                  <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                    style={{ width: `${width}%` }}
                                  />{" "}
                                </div>{" "}
                              </div>
                            );
                          })}{" "}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-300">
                        {" "}
                        Keine Kredite vorhanden{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white rounded shadow-sm overflow-hidden">
              {" "}
              <div className="px-6 py-4 border-b ">
                {" "}
                <h3 className="text-lg font-semibold text-dark">
                  Detaillierte Prognose-Tabelle
                </h3>{" "}
              </div>{" "}
              <div className="overflow-x-auto">
                {" "}
                <table className="w-full">
                  {" "}
                  <thead className="bg-gray-50 border-b ">
                    {" "}
                    <tr>
                      {" "}
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark">
                        Jahr
                      </th>{" "}
                      <th className="px-6 py-4 text-right text-sm font-semibold text-dark">
                        Einnahmen
                      </th>{" "}
                      <th className="px-6 py-4 text-right text-sm font-semibold text-dark">
                        Ausgaben
                      </th>{" "}
                      <th className="px-6 py-4 text-right text-sm font-semibold text-dark">
                        Nettoeinkommen
                      </th>{" "}
                      <th className="px-6 py-4 text-right text-sm font-semibold text-dark">
                        Kumuliert
                      </th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-slate-200">
                    {" "}
                    {projections.map((proj) => (
                      <tr
                        key={proj.year}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {" "}
                        <td className="px-6 py-4 text-sm font-medium text-dark">
                          {" "}
                          Jahr {proj.year}{" "}
                        </td>{" "}
                        <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">
                          {" "}
                          {formatCurrency(proj.revenue)}{" "}
                        </td>{" "}
                        <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                          {" "}
                          {formatCurrency(proj.expenses)}{" "}
                        </td>{" "}
                        <td
                          className={`px-6 py-4 text-sm text-right font-semibold ${proj.netIncome >= 0 ? "text-primary-blue" : "text-amber-600"}`}
                        >
                          {" "}
                          {formatCurrency(proj.netIncome)}{" "}
                        </td>{" "}
                        <td
                          className={`px-6 py-4 text-sm text-right font-bold ${proj.cumulativeIncome >= 0 ? "text-dark" : "text-red-600"}`}
                        >
                          {" "}
                          {formatCurrency(proj.cumulativeIncome)}{" "}
                        </td>{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                  <tfoot className="bg-gray-50 border-t-2 ">
                    {" "}
                    <tr>
                      {" "}
                      <td className="px-6 py-4 text-sm font-bold text-dark">
                        Gesamt
                      </td>{" "}
                      <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600">
                        {" "}
                        {formatCurrency(
                          projections.reduce((sum, p) => sum + p.revenue, 0),
                        )}{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                        {" "}
                        {formatCurrency(
                          projections.reduce((sum, p) => sum + p.expenses, 0),
                        )}{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-sm text-right font-bold text-primary-blue">
                        {" "}
                        {formatCurrency(
                          projections.reduce((sum, p) => sum + p.netIncome, 0),
                        )}{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-sm text-right font-bold text-dark">
                        {" "}
                        {formatCurrency(
                          projections[projections.length - 1]
                            ?.cumulativeIncome || 0,
                        )}{" "}
                      </td>{" "}
                    </tr>{" "}
                  </tfoot>{" "}
                </table>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-6 bg-primary-blue/5 border border-blue-200 rounded-lg p-4">
              {" "}
              <div className="flex items-start gap-3">
                {" "}
                <Calculator className="w-5 h-5 text-primary-blue mt-0.5" />{" "}
                <div className="text-sm text-blue-900">
                  {" "}
                  <p className="font-semibold mb-1">
                    Hinweis zur Prognose:
                  </p>{" "}
                  <p>
                    {" "}
                    Diese Prognose basiert auf den aktuellen Daten und den
                    eingestellten jährlichen Steigerungsraten. Tatsächliche
                    Ergebnisse können aufgrund von Marktveränderungen,
                    Leerständen, Sonderausgaben und anderen Faktoren
                    abweichen.{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </>
        )}{" "}
      </div>{" "}
    </PremiumFeatureGuard>
  );
}
