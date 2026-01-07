import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  TrendingUp,
  Euro,
  ExternalLink,
  Copy,
  Check,
  Wrench,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface Stats {
  propertiesCount: number;
  tenantsCount: number;
  totalMonthlyRent: number;
  totalPropertyValue: number;
  averageYield: number;
  totalMonthlyExpenses: number;
  monthlySurplus: number;
  unpaidRent: number;
  overdueRent: number;
}

interface MaintenanceTask {
  id: string;
  title: string;
  priority: string;
  due_date: string;
  property_id: string;
  unit_id: string | null;
  properties: {
    name: string;
  };
  property_units?: {
    unit_number: string;
  };
}

interface RentIncrease {
  tenant_id: string;
  tenant_name: string;
  increase_date: string;
  old_rent: number;
  new_rent: number;
  increase_type: string;
}

interface DashboardHomeProps {
  onNavigateToTenant?: (tenantId: string) => void;
}

export default function DashboardHome({ onNavigateToTenant }: DashboardHomeProps = {}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    propertiesCount: 0,
    tenantsCount: 0,
    totalMonthlyRent: 0,
    totalPropertyValue: 0,
    averageYield: 0,
    totalMonthlyExpenses: 0,
    monthlySurplus: 0,
    unpaidRent: 0,
    overdueRent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState<MaintenanceTask[]>([]);
  const [rentIncreases, setRentIncreases] = useState<RentIncrease[]>([]);
  const [showTasksCard, setShowTasksCard] = useState(true);
  const [showRentIncreasesCard, setShowRentIncreasesCard] = useState(true);

  useEffect(() => {
    loadStats();
    loadUpcomingTasks();
    loadUpcomingRentIncreases();
  }, [user]);
  const loadStats = async () => {
    if (!user) return;
    try {
      const [propertiesRes, tenantsRes, contractsRes, loansRes, paymentsRes] =
        await Promise.all([
          supabase
            .from("properties")
            .select("current_value")
            .eq("user_id", user.id),
          supabase
            .from("tenants")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true),
          supabase
            .from("rental_contracts")
            .select("base_rent, property_id")
            .eq("user_id", user.id),
          supabase
            .from("loans")
            .select("monthly_payment")
            .eq("user_id", user.id),
          supabase
            .from("rent_payments")
            .select("amount, paid, due_date")
            .eq("user_id", user.id)
            .eq("paid", false),
        ]);
      const propertiesCount = propertiesRes.data?.length || 0;
      const tenantsCount = tenantsRes.data?.length || 0;
      const totalMonthlyRent =
        contractsRes.data?.reduce((sum, c) => sum + Number(c.base_rent), 0) ||
        0;
      const totalPropertyValue =
        propertiesRes.data?.reduce(
          (sum, p) => sum + Number(p.current_value),
          0,
        ) || 0;
      const totalMonthlyExpenses =
        loansRes.data?.reduce((sum, l) => sum + Number(l.monthly_payment), 0) ||
        0;
      const annualRent = totalMonthlyRent * 12;
      const averageYield =
        totalPropertyValue > 0 ? (annualRent / totalPropertyValue) * 100 : 0;
      const monthlySurplus = totalMonthlyRent - totalMonthlyExpenses;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      let unpaidRent = 0;
      let overdueRent = 0;

      paymentsRes.data?.forEach((payment) => {
        const dueDate = new Date(payment.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dueDate < twoYearsAgo) {
          return;
        }

        if (dueDate > today) {
          return;
        }

        if (daysDiff > 1) {
          overdueRent += Number(payment.amount);
        } else {
          unpaidRent += Number(payment.amount);
        }
      });

      setStats({
        propertiesCount,
        tenantsCount,
        totalMonthlyRent,
        totalPropertyValue,
        averageYield,
        totalMonthlyExpenses,
        monthlySurplus,
        unpaidRent,
        overdueRent,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };
  const loadUpcomingTasks = async () => {
    if (!user) return;

    try {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          id,
          title,
          priority,
          due_date,
          property_id,
          unit_id,
          properties (
            name
          ),
          property_units (
            unit_number
          )
        `)
        .eq("user_id", user.id)
        .in("status", ["open", "in_progress"])
        .not("due_date", "is", null)
        .lte("due_date", ninetyDaysFromNow.toISOString().split("T")[0])
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingTasks(data || []);
    } catch (error) {
      console.error("Error loading upcoming tasks:", error);
    }
  };

  const loadUpcomingRentIncreases = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const { data: contracts, error } = await supabase
        .from("rental_contracts")
        .select(`
          id,
          base_rent,
          rent_type,
          graduated_rent_schedule,
          index_base_rent,
          index_base_date,
          tenants (
            id,
            first_name,
            last_name
          )
        `)
        .eq("user_id", user.id)
        .in("rent_type", ["graduated", "indexed"]);

      if (error) throw error;

      const increases: RentIncrease[] = [];

      contracts?.forEach((contract: any) => {
        if (contract.rent_type === "graduated" && contract.graduated_rent_schedule) {
          const schedule = contract.graduated_rent_schedule as any[];
          const upcomingStep = schedule.find((step: any) => {
            const stepDate = new Date(step.effective_date);
            return stepDate >= today && stepDate <= sixtyDaysFromNow;
          });

          if (upcomingStep && contract.tenants) {
            increases.push({
              tenant_id: contract.tenants.id,
              tenant_name: `${contract.tenants.first_name} ${contract.tenants.last_name}`,
              increase_date: upcomingStep.effective_date,
              old_rent: contract.base_rent,
              new_rent: upcomingStep.new_rent,
              increase_type: "Staffelmiete",
            });
          }
        } else if (contract.rent_type === "indexed" && contract.index_base_date) {
          const baseDate = new Date(contract.index_base_date);
          const nextReviewDate = new Date(baseDate);
          nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);

          while (nextReviewDate < today) {
            nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
          }

          if (nextReviewDate >= today && nextReviewDate <= sixtyDaysFromNow && contract.tenants) {
            increases.push({
              tenant_id: contract.tenants.id,
              tenant_name: `${contract.tenants.first_name} ${contract.tenants.last_name}`,
              increase_date: nextReviewDate.toISOString().split('T')[0],
              old_rent: contract.base_rent,
              new_rent: 0,
              increase_type: "Indexmiete",
            });
          }
        }
      });

      setRentIncreases(increases.sort((a, b) =>
        new Date(a.increase_date).getTime() - new Date(b.increase_date).getTime()
      ));
    } catch (error) {
      console.error("Error loading rent increases:", error);
    }
  };

  const handleCopyPortalLink = () => {
    const portalUrl = `${window.location.origin}/portal/${user?.id}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "low":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-amber-600 bg-amber-50";
    }
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
    <div>
      {" "}
      <div className="mb-8">
        {" "}
        <h1 className="text-3xl font-bold text-dark mb-2">
          {t("dashboard.overview")}
        </h1>{" "}
        <p className="text-gray-400">{t("dashboard.welcome")}</p>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {" "}
        <div className="bg-white rounded-lg p-6">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
              {" "}
              <Building2 className="w-6 h-6 text-primary-blue" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="text-3xl font-bold text-dark mb-1">
            {stats.propertiesCount}
          </div>{" "}
          <div className="text-sm text-gray-400">
            {t("dashboard.properties")}
          </div>{" "}
        </div>{" "}
        <div className="bg-white rounded-lg p-6">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              {" "}
              <Users className="w-6 h-6 text-emerald-600" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="text-3xl font-bold text-dark mb-1">
            {stats.tenantsCount}
          </div>{" "}
          <div className="text-sm text-gray-400">
            {t("dashboard.tenants.active")}
          </div>{" "}
        </div>{" "}
        <div className="bg-white rounded-lg p-6">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              {" "}
              <Euro className="w-6 h-6 text-amber-600" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="text-3xl font-bold text-dark mb-1">
            {" "}
            {formatCurrency(stats.totalMonthlyRent)}{" "}
          </div>{" "}
          <div className="text-sm text-gray-400">
            {t("dashboard.rent.monthly")}
          </div>
          {(stats.unpaidRent > 0 || stats.overdueRent > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              {stats.unpaidRent > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-600 font-medium">Offen</span>
                  <span className="text-xs text-gray-700 font-semibold">{formatCurrency(stats.unpaidRent)}</span>
                </div>
              )}
              {stats.overdueRent > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-600 font-medium">Überfällig</span>
                  <span className="text-xs text-gray-700 font-semibold">{formatCurrency(stats.overdueRent)}</span>
                </div>
              )}
            </div>
          )}{" "}
        </div>{" "}
        <div className="bg-white rounded-lg p-6">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              {" "}
              <TrendingUp className="w-6 h-6 text-indigo-600" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="text-3xl font-bold text-dark mb-1">
            {" "}
            {stats.averageYield.toFixed(2)}%{" "}
          </div>{" "}
          <div className="text-sm text-gray-400">
            {t("dashboard.yield.average")}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {" "}
        <div className="bg-white rounded-lg p-6">
          {" "}
          <h3 className="text-lg font-semibold text-dark mb-4">
            {t("dashboard.portfolio.total")}
          </h3>{" "}
          <div className="space-y-4">
            {" "}
            <div className="flex justify-between items-center">
              {" "}
              <span className="text-gray-400">
                {t("dashboard.portfolio.value")}
              </span>{" "}
              <span className="text-lg font-semibold text-dark">
                {" "}
                {formatCurrency(stats.totalPropertyValue)}{" "}
              </span>{" "}
            </div>{" "}
            <div className="border-t pt-4">
              {" "}
              <div className="flex justify-between items-center mb-1">
                {" "}
                <span className="text-gray-400">
                  {t("dashboard.portfolio.annual")}
                </span>{" "}
                <span className="text-lg font-semibold text-dark">
                  {" "}
                  {formatCurrency(stats.totalMonthlyRent * 12)}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex justify-between items-center">
                {" "}
                <span className="text-xs text-gray-300">Monatlich</span>{" "}
                <span className="text-sm text-gray-400">
                  {" "}
                  {formatCurrency(stats.totalMonthlyRent)}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="border-t pt-4">
              {" "}
              <div className="flex justify-between items-center mb-1">
                {" "}
                <span className="text-gray-400">Jährliche Ausgaben</span>{" "}
                <span className="text-lg font-semibold text-dark">
                  {" "}
                  {formatCurrency(stats.totalMonthlyExpenses * 12)}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex justify-between items-center">
                {" "}
                <span className="text-xs text-gray-300">Monatlich</span>{" "}
                <span className="text-sm text-gray-400">
                  {" "}
                  {formatCurrency(stats.totalMonthlyExpenses)}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="border-t pt-4">
              {" "}
              <div className="flex justify-between items-center mb-1">
                {" "}
                <span className="text-gray-400 font-medium">
                  Jährlicher Überschuss
                </span>{" "}
                <span
                  className={`text-lg font-bold ${stats.monthlySurplus >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {" "}
                  {formatCurrency(stats.monthlySurplus * 12)}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex justify-between items-center">
                {" "}
                <span className="text-xs text-gray-300">Monatlich</span>{" "}
                <span
                  className={`text-sm font-semibold ${stats.monthlySurplus >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {" "}
                  {formatCurrency(stats.monthlySurplus)}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-gradient-to-br from-blue-500 to-primary-blue rounded-xl p-6 text-white">
          {" "}
          <h3 className="text-lg font-semibold mb-4">
            {t("dashboard.quickstart")}
          </h3>{" "}
          <p className="text-primary-blue/20 mb-4">
            {" "}
            {t("dashboard.quickstart.description")}{" "}
          </p>{" "}
          <div className="space-y-2 text-sm">
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>{" "}
              <span>{t("dashboard.quickstart.property")}</span>{" "}
            </div>{" "}
            <div className="flex items-center gap-2">
              {" "}
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>{" "}
              <span>{t("dashboard.quickstart.tenant")}</span>{" "}
            </div>{" "}
            <div className="flex items-center gap-2">
              {" "}
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>{" "}
              <span>{t("dashboard.quickstart.contract")}</span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          {" "}
          <div className="flex items-center gap-2 mb-3">
            {" "}
            <ExternalLink className="w-5 h-5" />{" "}
            <h3 className="text-lg font-semibold">
              {t("dashboard.portal.title")}
            </h3>{" "}
          </div>{" "}
          <p className="text-emerald-100 text-sm mb-4">
            {" "}
            {t("dashboard.portal.description")}{" "}
          </p>{" "}
          <div className="bg-white/20 rounded-lg p-3 mb-3">
            {" "}
            <div className="text-xs font-mono text-white/90 break-all">
              {" "}
              {window.location.origin}/portal/{user?.id}{" "}
            </div>{" "}
          </div>{" "}
          <button
            onClick={handleCopyPortalLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full font-medium transition-colors"
          >
            {" "}
            {copied ? (
              <>
                {" "}
                <Check className="w-4 h-4" />{" "}
                {t("dashboard.portal.copied")}{" "}
              </>
            ) : (
              <>
                {" "}
                <Copy className="w-4 h-4" /> {t("dashboard.portal.copy")}{" "}
              </>
            )}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}

      {upcomingTasks.length > 0 && showTasksCard && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark">Anstehende Wartungsaufgaben</h2>
          </div>
          <div className="bg-white rounded-lg">
            {upcomingTasks.map((task, index) => (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-dark truncate">{task.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority === "high" ? "Hoch" : task.priority === "low" ? "Niedrig" : "Mittel"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{task.properties?.name}</span>
                        {task.property_units?.unit_number && (
                          <>
                            <span>•</span>
                            <span>Einheit {task.property_units.unit_number}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Fällig: {new Date(task.due_date).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rentIncreases.length > 0 && showRentIncreasesCard && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark">Anstehende Mieterhöhungen</h2>
            <button
              onClick={() => setShowRentIncreasesCard(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Schließen"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="bg-white rounded-lg">
            {rentIncreases.map((increase, index) => (
              <div
                key={`${increase.tenant_id}-${increase.increase_date}`}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  if (onNavigateToTenant) {
                    onNavigateToTenant(increase.tenant_id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-dark truncate">{increase.tenant_name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {increase.increase_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>Datum: {new Date(increase.increase_date).toLocaleDateString("de-DE")}</span>
                        {increase.new_rent > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {formatCurrency(increase.old_rent)} → {formatCurrency(increase.new_rent)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
