import { useState, useEffect } from "react";
import { Plus, TrendingDown, Trash2, Building, Tag } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  description: string;
  notes: string;
  payment_status: string;
  category_id: string;
  property_id: string;
  tenant_id: string | null;
}

interface Property {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  tax_category: string;
}

interface Tenant {
  id: string;
  name: string;
}

export default function ExpensesView() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    property_id: "",
    tenant_id: "",
    category_id: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
    notes: "",
    payment_status: "pending",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);

      const [expensesRes, propertiesRes, categoriesRes, tenantsRes] =
        await Promise.all([
          supabase
            .from("expenses")
            .select("*")
            .order("expense_date", { ascending: false }),
          supabase.from("properties").select("id, name").order("name"),
          supabase.from("expense_categories").select("*").order("name"),
          supabase.from("tenants").select("id, name").order("name"),
        ]);

      if (expensesRes.data) setExpenses(expensesRes.data);
      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense() {
    if (!user || !formData.property_id || !formData.category_id) return;

    try {
      const { error } = await supabase.from("expenses").insert({
        user_id: user.id,
        property_id: formData.property_id,
        tenant_id: formData.tenant_id || null,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount) || 0,
        expense_date: formData.expense_date,
        description: formData.description,
        notes: formData.notes,
        payment_status: formData.payment_status,
      });

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        property_id: "",
        tenant_id: "",
        category_id: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        description: "",
        notes: "",
        payment_status: "pending",
      });
      loadData();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm("Ausgabe wirklich löschen?")) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (!error) loadData();
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses
    .filter((e) => e.payment_status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses
    .filter((e) => e.payment_status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unbekannt";
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || "Unbekannt";
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "-";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name || "Unbekannt";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Bezahlt";
      case "pending":
        return "Offen";
      case "overdue":
        return "Überfällig";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Gesamt-Ausgaben</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingDown className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {paidExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Bezahlt</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingDown className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {pendingExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Offen</div>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">Ausgaben</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ausgabe hinzufügen
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Keine Ausgaben erfasst</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
            >
              Erste Ausgabe hinzufügen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Datum
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Beschreibung
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Kategorie
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Objekt
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                    Betrag
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {new Date(expense.expense_date).toLocaleDateString(
                        "de-DE"
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="font-medium">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-gray-400 mt-1">
                          {expense.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {getCategoryName(expense.category_id)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        {getPropertyName(expense.property_id)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-right font-medium text-dark">
                      {expense.amount.toFixed(2)} €
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          expense.payment_status
                        )}`}
                      >
                        {getStatusLabel(expense.payment_status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Ausgabe hinzufügen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objekt *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) =>
                    setFormData({ ...formData, property_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Objekt wählen...</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einheit (optional)
                </label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tenant_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Keine Einheit</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Kategorie wählen...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Betrag (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expense_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Reparatur Heizung"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsstatus
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_status: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="pending">Offen</option>
                  <option value="paid">Bezahlt</option>
                  <option value="overdue">Überfällig</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                disabled={
                  !formData.property_id ||
                  !formData.category_id ||
                  !formData.amount ||
                  !formData.description
                }
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
