import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Property {
  id: string;
  name: string;
  current_value: number;
  purchase_price: number;
  purchase_date: string;
}

interface Loan {
  loan_amount: number;
  remaining_balance: number;
  interest_rate: number;
  monthly_payment: number;
  monthly_principal: number;
  start_date: string;
  end_date: string;
}

interface RentPayment {
  amount: number;
  paid: boolean;
  due_date: string;
  paid_date: string | null;
}

interface RentalContract {
  base_rent: number;
  additional_costs: number;
}

interface PropertyStatisticsProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyStatistics({ property, onClose }: PropertyStatisticsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);

  useEffect(() => {
    loadData();
  }, [property.id, user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [loansRes, paymentsRes, contractsRes] = await Promise.all([
        supabase
          .from('loans')
          .select('*')
          .eq('property_id', property.id)
          .eq('user_id', user.id),
        supabase
          .from('rent_payments')
          .select('*')
          .eq('property_id', property.id)
          .eq('user_id', user.id)
          .eq('paid', true),
        supabase
          .from('rental_contracts')
          .select('base_rent, additional_costs')
          .eq('property_id', property.id)
          .eq('user_id', user.id),
      ]);

      setLoans(loansRes.data || []);
      setRentPayments(paymentsRes.data || []);
      setContracts(contractsRes.data || []);
    } catch (error) {
      console.error('Error loading statistics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const totalLoanAmount = loans.reduce((sum, loan) => sum + Number(loan.loan_amount), 0);
  const totalRemainingBalance = loans.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0);
  const totalPaidOff = totalLoanAmount - totalRemainingBalance;
  const monthlyLoanPayment = loans.reduce((sum, loan) => sum + Number(loan.monthly_payment), 0);
  const monthlyPrincipal = loans.reduce((sum, loan) => sum + Number(loan.monthly_principal), 0);
  const monthlyInterest = monthlyLoanPayment - monthlyPrincipal;

  const totalRentReceived = rentPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const monthlyRent = contracts.reduce((sum, c) => sum + Number(c.base_rent), 0);

  const netEquity = Number(property.current_value) - totalRemainingBalance + totalRentReceived;
  const totalInvested = Number(property.purchase_price) - totalLoanAmount;
  const roi = totalInvested > 0 ? ((netEquity - totalInvested) / totalInvested) * 100 : 0;

  const rentCoverageRatio = monthlyLoanPayment > 0 ? (monthlyRent / monthlyLoanPayment) * 100 : 0;
  const principalCoverage = monthlyPrincipal > 0 ? (monthlyRent / monthlyPrincipal) * 100 : 0;

  const loan = loans[0];
  let monthsToBreakEven = 0;
  let profitAtLoanEnd = 0;
  let totalInterestPaid = 0;

  if (loan) {
    const loanStartDate = new Date(loan.start_date);
    const loanEndDate = new Date(loan.end_date);
    const now = new Date();

    const monthsSinceLoanStart = Math.max(
      0,
      (now.getFullYear() - loanStartDate.getFullYear()) * 12 +
      (now.getMonth() - loanStartDate.getMonth())
    );

    const totalLoanMonths =
      (loanEndDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
      (loanEndDate.getMonth() - loanStartDate.getMonth());

    totalInterestPaid = monthsSinceLoanStart * monthlyInterest;

    const futureInterest = (totalLoanMonths - monthsSinceLoanStart) * monthlyInterest;
    const totalInterestOverLoan = totalInterestPaid + futureInterest;

    const monthlyCashflow = monthlyRent - monthlyLoanPayment;

    if (monthlyCashflow > 0) {
      monthsToBreakEven = Math.ceil(totalInvested / monthlyCashflow);
    }

    const remainingMonths = totalLoanMonths - monthsSinceLoanStart;
    const futureRentIncome = remainingMonths * monthlyRent;

    profitAtLoanEnd = netEquity + futureRentIncome - (Number(property.purchase_price) - totalLoanAmount) - totalInterestOverLoan;
  }

  const calculateLoanProgress = () => {
    if (totalLoanAmount === 0) return 0;
    return (totalPaidOff / totalLoanAmount) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loans.length === 0 ? (
        <div className="bg-white rounded shadow-sm border border-gray-100 p-12 text-center text-gray-300">
          <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium">Keine Kredite vorhanden</p>
          <p className="text-sm mt-2">Fügen Sie einen Kredit hinzu, um detaillierte Finanzanalysen zu sehen.</p>
        </div>
      ) : (
        <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-primary-blue" />
                    <div className="text-sm font-medium text-blue-900">Eigenkapital</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(netEquity)}</div>
                  <div className="text-xs text-primary-blue mt-1">Immobilienwert - Kredit + Mieten</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <div className="text-sm font-medium text-emerald-900">ROI</div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-900">{formatPercent(roi)}</div>
                  <div className="text-xs text-emerald-700 mt-1">Return on Investment</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-full p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div className="text-sm font-medium text-orange-900">Break-Even</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {monthsToBreakEven > 0 ? `${Math.floor(monthsToBreakEven / 12)}J ${monthsToBreakEven % 12}M` : 'N/A'}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Bis zur Amortisation</div>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-full p-4 border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-5 h-5 text-violet-600" />
                    <div className="text-sm font-medium text-violet-900">Gewinn bei Kreditende</div>
                  </div>
                  <div className="text-2xl font-bold text-violet-900">{formatCurrency(profitAtLoanEnd)}</div>
                  <div className="text-xs text-violet-700 mt-1">Erwarteter Gesamtgewinn</div>
                </div>
              </div>

              <div className="bg-white rounded border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Kreditabbau</h3>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Fortschritt</span>
                    <span className="font-semibold text-dark">{calculateLoanProgress().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-primary-blue h-full rounded-full transition-all duration-500"
                      style={{ width: `${calculateLoanProgress()}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Ursprünglicher Kredit</div>
                    <div className="text-lg font-bold text-dark">{formatCurrency(totalLoanAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Restschuld</div>
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(totalRemainingBalance)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Bereits getilgt</div>
                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaidOff)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Zinsen gezahlt</div>
                    <div className="text-lg font-bold text-red-600">{formatCurrency(totalInterestPaid)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Monatliche Cashflow-Analyse</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                      <div className="text-sm text-emerald-600 font-medium">Mieteinnahmen</div>
                      <div className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(monthlyRent)}</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <div className="text-sm text-red-600 font-medium">Kreditrate</div>
                      <div className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(monthlyLoanPayment)}</div>
                      <div className="text-xs text-red-700 mt-2">
                        Davon Tilgung: {formatCurrency(monthlyPrincipal)} | Zinsen: {formatCurrency(monthlyInterest)}
                      </div>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    monthlyRent >= monthlyLoanPayment
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div>
                      <div className={`text-sm font-medium ${
                        monthlyRent >= monthlyLoanPayment ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                        Monatlicher Cashflow
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${
                        monthlyRent >= monthlyLoanPayment ? 'text-emerald-900' : 'text-orange-900'
                      }`}>
                        {formatCurrency(monthlyRent - monthlyLoanPayment)}
                      </div>
                    </div>
                    <DollarSign className={`w-8 h-8 ${
                      monthlyRent >= monthlyLoanPayment ? 'text-emerald-600' : 'text-orange-600'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Finanzieren die Mieter die Immobilie?</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Deckung der Gesamtrate</span>
                      <span className={`text-lg font-bold ${
                        rentCoverageRatio >= 100 ? 'text-emerald-600' :
                        rentCoverageRatio >= 80 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {formatPercent(rentCoverageRatio)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rentCoverageRatio >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                          rentCoverageRatio >= 80 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(rentCoverageRatio, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {rentCoverageRatio >= 100
                        ? '✓ Die Miete deckt die komplette Rate inkl. Zinsen und Tilgung'
                        : rentCoverageRatio >= 80
                        ? '⚠ Die Miete deckt den Großteil der Rate'
                        : '✗ Die Miete deckt die Rate nicht vollständig'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Deckung der Tilgung</span>
                      <span className={`text-lg font-bold ${
                        principalCoverage >= 100 ? 'text-emerald-600' :
                        principalCoverage >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {formatPercent(principalCoverage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          principalCoverage >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                          principalCoverage >= 50 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(principalCoverage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {principalCoverage >= 100
                        ? '✓ Die Mieter finanzieren die komplette Tilgung + tragen zu den Zinsen bei'
                        : principalCoverage >= 50
                        ? '⚠ Die Mieter finanzieren über die Hälfte der Tilgung'
                        : monthlyRent > monthlyInterest
                        ? '⚠ Die Mieter zahlen mehr als nur die Zinsen'
                        : '✗ Die Mieter zahlen nicht einmal die vollen Zinsen'}
                    </p>
                  </div>

                  <div className="p-4 bg-primary-blue/5 rounded-full border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Zusammenfassung</h4>
                    <ul className="space-y-1 text-sm text-primary-blue">
                      <li>• Monatliche Mieteinnahmen: {formatCurrency(monthlyRent)}</li>
                      <li>• Monatliche Zinskosten: {formatCurrency(monthlyInterest)}</li>
                      <li>• Monatliche Tilgung: {formatCurrency(monthlyPrincipal)}</li>
                      <li className="font-semibold pt-2">
                        • Die Mieter zahlen {rentCoverageRatio >= 100 ? 'die gesamte Rate' :
                          `${formatPercent(rentCoverageRatio)} der Rate`} und finanzieren somit {
                          principalCoverage >= 100 ? 'die komplette Tilgung' :
                          `${formatPercent(principalCoverage)} der Tilgung`}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Weitere Kennzahlen</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Gesamte Mieteinnahmen (bisher)</div>
                    <div className="text-xl font-bold text-dark">{formatCurrency(totalRentReceived)}</div>
                    <div className="text-xs text-gray-300 mt-1">Aus {rentPayments.length} bezahlten Mieten</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Wertsteigerung der Immobilie</div>
                    <div className="text-xl font-bold text-dark">
                      {formatCurrency(Number(property.current_value) - Number(property.purchase_price))}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      Von {formatCurrency(Number(property.purchase_price))} auf {formatCurrency(Number(property.current_value))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Eigenkapitaleinsatz</div>
                    <div className="text-xl font-bold text-dark">{formatCurrency(totalInvested)}</div>
                    <div className="text-xs text-gray-300 mt-1">Kaufpreis - Kreditsumme</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Kreditlaufzeit</div>
                    <div className="text-xl font-bold text-dark">
                      {loan ? `${Math.round((new Date(loan.end_date).getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} Jahre` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {loan ? `Von ${new Date(loan.start_date).toLocaleDateString('de-DE')} bis ${new Date(loan.end_date).toLocaleDateString('de-DE')}` : ''}
                    </div>
                  </div>
                </div>
              </div>
        </>
      )}
    </div>
  );
}
