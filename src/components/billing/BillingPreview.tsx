import { useState, useEffect } from "react";
import { Eye, Users, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface BillingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Tenant {
  id: string;
  name: string;
  area: number;
}

interface OperatingCost {
  id: string;
  cost_type_id: string;
  amount: number;
  allocation_key: string;
}

interface CostType {
  id: string;
  name: string;
}

interface AllocationResult {
  tenant_id: string;
  tenant_name: string;
  cost_type: string;
  allocated_amount: number;
  advance_payments: number;
  balance: number;
}

export default function BillingPreview() {
  const { user } = useAuth();
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCost[]>([]);
  const [costTypes, setCostTypes] = useState<CostType[]>([]);
  const [allocations, setAllocations] = useState<AllocationResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadBillingPeriods();
      loadCostTypes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPeriod) {
      calculateAllocations();
    }
  }, [selectedPeriod]);

  async function loadBillingPeriods() {
    const { data } = await supabase
      .from("billing_periods")
      .select("id, name, start_date, end_date")
      .order("created_at", { ascending: false });

    if (data) {
      setBillingPeriods(data);
      if (data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].id);
      }
    }
  }

  async function loadCostTypes() {
    const { data } = await supabase.from("cost_types").select("*");
    if (data) setCostTypes(data);
  }

  async function calculateAllocations() {
    setLoading(true);
    try {
      const [costsRes, tenantsRes, periodRes] = await Promise.all([
        supabase
          .from("operating_costs")
          .select("*")
          .eq("billing_period_id", selectedPeriod),
        supabase.from("tenants").select("id, name, area"),
        supabase
          .from("billing_periods")
          .select("property_id")
          .eq("id", selectedPeriod)
          .single(),
      ]);

      if (!costsRes.data || !tenantsRes.data || !periodRes.data) return;

      const costs = costsRes.data;
      const allTenants = tenantsRes.data;

      const results: AllocationResult[] = [];

      for (const tenant of allTenants) {
        for (const cost of costs) {
          const costType = costTypes.find((ct) => ct.id === cost.cost_type_id);
          let allocatedAmount = 0;

          if (cost.allocation_key === "sqm") {
            const totalArea = allTenants.reduce((sum, t) => sum + (t.area || 0), 0);
            if (totalArea > 0) {
              allocatedAmount = (cost.amount * (tenant.area || 0)) / totalArea;
            }
          } else if (cost.allocation_key === "persons") {
            const personCount = allTenants.length;
            allocatedAmount = cost.amount / personCount;
          } else if (cost.allocation_key === "fixed") {
            allocatedAmount = cost.amount / allTenants.length;
          }

          results.push({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            cost_type: costType?.name || "Unbekannt",
            allocated_amount: allocatedAmount,
            advance_payments: 0,
            balance: -allocatedAmount,
          });
        }
      }

      setAllocations(results);
    } catch (error) {
      console.error("Error calculating allocations:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTenantTotal = (tenantId: string) => {
    return allocations
      .filter((a) => a.tenant_id === tenantId)
      .reduce((sum, a) => sum + a.allocated_amount, 0);
  };

  const getTenantBalance = (tenantId: string) => {
    return allocations
      .filter((a) => a.tenant_id === tenantId)
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const totalCosts = allocations.reduce((sum, a) => sum + a.allocated_amount, 0);
  const uniqueTenants = Array.from(
    new Set(allocations.map((a) => a.tenant_id))
  ).map((id) => {
    const allocation = allocations.find((a) => a.tenant_id === id);
    return {
      id,
      name: allocation?.tenant_name || "",
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abrechnungszeitraum
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              {billingPeriods.length === 0 && (
                <option value="">Keine Abrechnungen vorhanden</option>
              )}
              {billingPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Berechne Aufteilung...</div>
          </div>
        ) : allocations.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">
              Keine Daten für Vorschau verfügbar
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Fügen Sie Betriebskosten hinzu, um eine Vorschau zu erstellen
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div style={{ backgroundColor: "#eff4fe" }} className="rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-primary-blue" />
                  <span className="text-sm font-medium text-gray-700">
                    Gesamtkosten
                  </span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {totalCosts.toFixed(2)} €
                </div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Mieteinheiten
                  </span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {uniqueTenants.length}
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Ø pro Einheit
                  </span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {uniqueTenants.length > 0
                    ? (totalCosts / uniqueTenants.length).toFixed(2)
                    : "0.00"}{" "}
                  €
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-dark mb-4">
              Aufteilung pro Einheit
            </h3>

            <div className="space-y-6">
              {uniqueTenants.map((tenant) => {
                const tenantAllocations = allocations.filter(
                  (a) => a.tenant_id === tenant.id
                );
                const total = getTenantTotal(tenant.id);
                const balance = getTenantBalance(tenant.id);

                return (
                  <div
                    key={tenant.id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-dark text-lg">
                          {tenant.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">
                          Gesamtbetrag
                        </div>
                        <div className="text-2xl font-bold text-dark">
                          {total.toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                              Kostenart
                            </th>
                            <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">
                              Betrag
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenantAllocations.map((allocation, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 px-3 text-sm text-gray-700">
                                {allocation.cost_type}
                              </td>
                              <td className="py-2 px-3 text-sm text-right font-medium text-dark">
                                {allocation.allocated_amount.toFixed(2)} €
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Vorauszahlungen
                        </div>
                        <div className="text-lg font-semibold text-dark">
                          0.00 €
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Kostenanteil
                        </div>
                        <div className="text-lg font-semibold text-dark">
                          {total.toFixed(2)} €
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Nachzahlung
                        </div>
                        <div
                          className={`text-lg font-semibold flex items-center gap-1 ${
                            balance < 0 ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {balance < 0 ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                          {Math.abs(balance).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="mt-6 border rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
              <p className="text-sm text-blue-900">
                Diese Vorschau zeigt eine vereinfachte Berechnung der
                Betriebskostenaufteilung. Vorauszahlungen und
                Verbrauchsdaten müssen für die finale Abrechnung noch
                erfasst werden.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
