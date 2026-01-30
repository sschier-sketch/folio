import { useState, useEffect } from "react";
import { Plus, TrendingDown, Trash2, Building, Tag, Upload, X, Filter, Edit, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";

interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  description: string;
  notes: string;
  status: string;
  category_id: string;
  property_id: string;
  tenant_id: string | null;
  unit_id: string | null;
  recipient: string | null;
  is_apportionable: boolean;
  due_date: string | null;
  vat_rate: number;
  is_labor_cost: boolean;
  is_cashflow_relevant: boolean;
  exclude_from_operating_costs: boolean;
  document_id: string | null;
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

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
}

export default function ExpensesView() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<"current" | "last" | "all">("current");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    tenant_id: "",
    category_id: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
    recipient: "",
    notes: "",
    status: "open",
    is_apportionable: false,
    is_labor_cost: false,
    is_cashflow_relevant: true,
    exclude_from_operating_costs: false,
    vat_rate: "19",
    due_date: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<{id: string, file_name: string, file_path: string} | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedProperty, selectedUnit, timePeriod, startDate, endDate]);

  async function loadData() {
    try {
      setLoading(true);

      let filterStartDate = startDate;
      let filterEndDate = endDate;

      if (!startDate || !endDate) {
        const now = new Date();
        const currentYear = now.getFullYear();

        if (timePeriod === "current") {
          filterStartDate = `${currentYear}-01-01`;
          filterEndDate = `${currentYear}-12-31`;
        } else if (timePeriod === "last") {
          filterStartDate = `${currentYear - 1}-01-01`;
          filterEndDate = `${currentYear - 1}-12-31`;
        }
      }

      let expensesQuery = supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user!.id)
        .order("expense_date", { ascending: false });

      if (selectedProperty) {
        expensesQuery = expensesQuery.eq("property_id", selectedProperty);
      }

      if (selectedUnit) {
        expensesQuery = expensesQuery.eq("unit_id", selectedUnit);
      }

      if (timePeriod !== "all" && filterStartDate && filterEndDate) {
        expensesQuery = expensesQuery
          .gte("expense_date", filterStartDate)
          .lte("expense_date", filterEndDate);
      }

      const [expensesRes, propertiesRes, categoriesRes, tenantsRes, unitsRes] =
        await Promise.all([
          expensesQuery,
          supabase.from("properties").select("id, name").eq("user_id", user!.id).order("name"),
          supabase.from("expense_categories").select("*").order("name"),
          supabase.from("tenants").select("id, name").eq("user_id", user!.id).order("name"),
          supabase.from("property_units").select("id, unit_number, property_id").eq("user_id", user!.id).order("unit_number"),
        ]);

      if (expensesRes.data) setExpenses(expensesRes.data);
      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
      if (unitsRes.data) setUnits(unitsRes.data);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense() {
    if (!user || !formData.property_id || !formData.category_id) return;

    try {
      let documentId = null;

      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_name: uploadedFile.name,
            file_path: uploadData.path,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
            document_type: 'receipt',
            category: 'expense',
            description: formData.description || 'Ausgabenbeleg'
          })
          .select()
          .single();

        if (docError) throw docError;
        documentId = docData.id;

        if (documentId && formData.property_id) {
          await supabase.from('document_associations').insert({
            document_id: documentId,
            association_type: 'property',
            association_id: formData.property_id,
            created_by: user.id
          });

          if (formData.unit_id) {
            await supabase.from('document_associations').insert({
              document_id: documentId,
              association_type: 'unit',
              association_id: formData.unit_id,
              created_by: user.id
            });
          }
        }
      }

      const expensePayload = {
        user_id: user.id,
        property_id: formData.property_id,
        unit_id: formData.unit_id || null,
        tenant_id: formData.tenant_id || null,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount) || 0,
        expense_date: formData.expense_date,
        description: formData.description,
        recipient: formData.recipient || null,
        notes: formData.notes,
        status: formData.status,
        is_apportionable: formData.is_apportionable,
        is_labor_cost: formData.is_labor_cost,
        is_cashflow_relevant: formData.is_cashflow_relevant,
        exclude_from_operating_costs: formData.exclude_from_operating_costs,
        vat_rate: parseFloat(formData.vat_rate),
        due_date: formData.due_date || null,
        document_id: documentId,
      };

      let expenseData, error;

      if (editingExpense) {
        const result = await supabase
          .from("expenses")
          .update(expensePayload)
          .eq("id", editingExpense.id)
          .select()
          .single();
        expenseData = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("expenses")
          .insert(expensePayload)
          .select()
          .single();
        expenseData = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (documentId && expenseData?.id) {
        await supabase.from('document_associations').insert({
          document_id: documentId,
          association_type: 'expense',
          association_id: expenseData.id,
          created_by: user.id
        });
      }

      alert(editingExpense ? "Ausgabe erfolgreich aktualisiert!" : "Ausgabe erfolgreich gespeichert!");
      setShowAddModal(false);
      setEditingExpense(null);
      setExistingDocument(null);
      setUploadedFile(null);
      setFormData({
        property_id: "",
        unit_id: "",
        tenant_id: "",
        category_id: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        description: "",
        recipient: "",
        notes: "",
        status: "open",
        is_apportionable: false,
        is_labor_cost: false,
        is_cashflow_relevant: true,
        exclude_from_operating_costs: false,
        vat_rate: "19",
        due_date: "",
      });
      loadData();
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Fehler beim Speichern der Ausgabe: " + (error as Error).message);
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm("Ausgabe wirklich löschen?")) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (!error) loadData();
  }

  async function handleDownloadDocument(documentId: string) {
    try {
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('file_path, file_name')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;
      if (!document) throw new Error('Dokument nicht gefunden');

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) throw downloadError;

      const url = URL.createObjectURL(fileData);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Fehler beim Herunterladen: ' + (error as Error).message);
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const openExpenses = expenses
    .filter((e) => e.status === "open")
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
      case "open":
        return "Offen";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
      case "open":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  async function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setFormData({
      property_id: expense.property_id,
      unit_id: expense.unit_id || "",
      tenant_id: expense.tenant_id || "",
      category_id: expense.category_id,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      description: expense.description,
      recipient: expense.recipient || "",
      notes: expense.notes || "",
      status: expense.status,
      is_apportionable: expense.is_apportionable,
      is_labor_cost: expense.is_labor_cost,
      is_cashflow_relevant: expense.is_cashflow_relevant,
      exclude_from_operating_costs: expense.exclude_from_operating_costs,
      vat_rate: expense.vat_rate.toString(),
      due_date: expense.due_date || "",
    });

    if (expense.document_id) {
      try {
        const { data: docData } = await supabase
          .from('documents')
          .select('id, file_name, file_path')
          .eq('id', expense.document_id)
          .maybeSingle();

        if (docData) {
          setExistingDocument(docData);
        }
      } catch (error) {
        console.error('Error loading document:', error);
      }
    } else {
      setExistingDocument(null);
    }

    setUploadedFile(null);
    setShowAddModal(true);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objekt
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                setSelectedUnit("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Alle Objekte</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Einheit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              disabled={!selectedProperty}
            >
              <option value="">Alle Einheiten</option>
              {units
                .filter((u) => !selectedProperty || u.property_id === selectedProperty)
                .map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Einheit {unit.unit_number}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeitraum
            </label>
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value as "current" | "last" | "all");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="current">Aktuelles Jahr</option>
              <option value="last">Letztes Jahr</option>
              <option value="all">Alle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <TrendingDown className="w-6 h-6 text-[#1e1e24]" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">Gesamt-Ausgaben</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <CheckCircle className="w-6 h-6 text-[#1e1e24]" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {paidExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">Bezahlt</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <Clock className="w-6 h-6 text-[#1e1e24]" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {openExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">Offen</div>
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
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Betrag
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
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
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-dark">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {expense.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {getCategoryName(expense.category_id)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        {getPropertyName(expense.property_id)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-dark">
                      {expense.amount.toFixed(2)} €
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          expense.status
                        )}`}
                      >
                        {getStatusLabel(expense.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center">
                        <TableActionsDropdown
                          actions={[
                            ...(expense.document_id ? [{
                              label: 'Beleg herunterladen',
                              onClick: () => handleDownloadDocument(expense.document_id!)
                            }] : []),
                            {
                              label: 'Bearbeiten',
                              onClick: () => handleEditExpense(expense)
                            },
                            {
                              label: 'Löschen',
                              onClick: () => handleDeleteExpense(expense.id),
                              variant: 'danger' as const
                            }
                          ]}
                        />
                      </div>
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
              {editingExpense ? "Ausgabe bearbeiten" : "Ausgabe hinzufügen"}
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
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Keine Einheit</option>
                  {units
                    .filter(u => !formData.property_id || u.property_id === formData.property_id)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Einheit {unit.unit_number}
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
                  Empfänger/Lieferant (optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Firma Müller GmbH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fälligkeitsdatum (optional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  MwSt-Satz
                </label>
                <select
                  value={formData.vat_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, vat_rate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="7">7%</option>
                  <option value="19">19%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dokument (optional)
                </label>
                {existingDocument && !uploadedFile && (
                  <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="mb-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <FileText className="w-4 h-4" />
                        <span>Vorhandenes Dokument: {existingDocument.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.storage
                                .from('documents')
                                .download(existingDocument.file_path);

                              if (error) throw error;

                              const url = URL.createObjectURL(data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = existingDocument.file_name;
                              document.body.appendChild(a);
                              a.click();
                              URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('Error downloading document:', error);
                              alert('Fehler beim Herunterladen des Dokuments');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          Herunterladen
                        </button>
                        <button
                          type="button"
                          onClick={() => setExistingDocument(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    id="expense-file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadedFile(file);
                    }}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="expense-file-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Datei auswählen (PDF, JPG, PNG)</span>
                  </label>
                  {uploadedFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 flex-1">{uploadedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Optionen
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="is_apportionable" className="text-sm text-gray-700">
                      Umlagefähig
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="is_apportionable"
                        checked={formData.is_apportionable}
                        onChange={(e) =>
                          setFormData({ ...formData, is_apportionable: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="is_labor_cost" className="text-sm text-gray-700">
                      Lohnkosten
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="is_labor_cost"
                        checked={formData.is_labor_cost}
                        onChange={(e) =>
                          setFormData({ ...formData, is_labor_cost: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="exclude_from_operating_costs" className="text-sm text-gray-700">
                      Ignoriert in BK-Abr.
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="exclude_from_operating_costs"
                        checked={formData.exclude_from_operating_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, exclude_from_operating_costs: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="is_cashflow_relevant" className="text-sm text-gray-700">
                      Cashflow-relevant
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="is_cashflow_relevant"
                        checked={formData.is_cashflow_relevant}
                        onChange={(e) =>
                          setFormData({ ...formData, is_cashflow_relevant: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsstatus
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="open">Offen</option>
                  <option value="paid">Bezahlt</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingExpense(null);
                  setExistingDocument(null);
                  setUploadedFile(null);
                }}
                style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
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
                {editingExpense ? "Aktualisieren" : "Hinzufügen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
