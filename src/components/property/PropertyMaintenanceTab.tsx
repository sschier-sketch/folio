import { useState, useEffect } from "react";
import { Wrench, CheckCircle2, Clock, AlertCircle, Trash2, CreditCard as Edit2, Calendar, Euro, Bell, Tag, Users, UserCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { usePermissions } from "../../hooks/usePermissions";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";
import { Button } from '../ui/Button';

interface PropertyMaintenanceTabProps {
  propertyId: string;
  readOnly?: boolean;
}

interface MaintenanceTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  cost: number | null;
  due_date: string | null;
  completed_at: string | null;
  is_recurring: boolean | null;
  recurrence_interval: string | null;
  notes: string | null;
  unit_id: string | null;
  category: string;
  source: string;
  tenant_id: string | null;
  assigned_user_id: string | null;
  parent_task_id: string | null;
  next_recurrence_date: string | null;
  notify_tenant_on_status: boolean | null;
  notify_assignee: boolean | null;
  email_notification_enabled?: boolean | null;
  notification_days_before?: number | null;
  created_at: string;
  property_units?: {
    unit_number: string;
  };
  tenants?: {
    first_name: string;
    last_name: string;
  };
}

interface TenantOption {
  id: string;
  name: string;
}

interface MemberOption {
  user_id: string;
  name: string;
}

export default function PropertyMaintenanceTab({ propertyId, readOnly = false }: PropertyMaintenanceTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { dataOwnerId } = usePermissions();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "completed">("all");
  const [units, setUnits] = useState<{ id: string; unit_number: string }[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    cost: "",
    due_date: "",
    is_recurring: false,
    recurrence_interval: "monthly",
    unit_id: "",
    notes: "",
    email_notification_enabled: false,
    notification_days_before: "30",
    category: "allgemein",
    tenant_id: "",
    assigned_user_id: "",
    notify_tenant_on_status: false,
    notify_assignee: false,
  });

  useEffect(() => {
    if (user && isPremium) {
      loadTasks();
      loadUnits();
      loadTenants();
      loadMembers();
    }
  }, [user, propertyId, isPremium, dataOwnerId]);

  async function loadTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          *,
          property_units (unit_number),
          tenants (first_name, last_name)
        `)
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnits() {
    try {
      const { data } = await supabase
        .from("property_units")
        .select("id, unit_number")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (data) setUnits(data);
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  async function loadTenants() {
    if (!dataOwnerId) return;
    try {
      const { data } = await supabase
        .from("tenants")
        .select("id, first_name, last_name")
        .eq("user_id", dataOwnerId)
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("last_name");

      if (data) {
        setTenantOptions(
          data.map((t) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` }))
        );
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  }

  async function loadMembers() {
    if (!dataOwnerId) return;
    try {
      const { data } = await supabase.rpc("get_account_members", {
        p_account_owner_id: dataOwnerId,
      });
      if (data) {
        setMemberOptions(
          data
            .filter((m: { is_active_member: boolean; removed_at: string | null }) => m.is_active_member && !m.removed_at)
            .map((m: { user_id: string; first_name: string | null; last_name: string | null; email: string }) => ({
              user_id: m.user_id,
              name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
            }))
        );
      }
    } catch {
      setMemberOptions([]);
    }
  }

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "open",
      priority: "medium",
      cost: "",
      due_date: "",
      is_recurring: false,
      recurrence_interval: "monthly",
      unit_id: "",
      notes: "",
      email_notification_enabled: false,
      notification_days_before: "30",
      category: "allgemein",
      tenant_id: "",
      assigned_user_id: "",
      notify_tenant_on_status: false,
      notify_assignee: false,
    });
    setShowAddModal(true);
  };

  const openEditModal = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      cost: task.cost ? task.cost.toString() : "",
      due_date: task.due_date || "",
      is_recurring: task.is_recurring || false,
      recurrence_interval: task.recurrence_interval || "monthly",
      unit_id: task.unit_id || "",
      notes: task.notes || "",
      email_notification_enabled: task.email_notification_enabled || false,
      notification_days_before: task.notification_days_before?.toString() || "30",
      category: task.category || "allgemein",
      tenant_id: task.tenant_id || "",
      assigned_user_id: task.assigned_user_id || "",
      notify_tenant_on_status: task.notify_tenant_on_status || false,
      notify_assignee: task.notify_assignee || false,
    });
    setShowAddModal(true);
  };

  function computeNextRecurrenceDate(interval: string, dueDate: string | null): string | null {
    const base = dueDate ? new Date(dueDate) : new Date();
    switch (interval) {
      case "daily": base.setDate(base.getDate() + 1); break;
      case "weekly": base.setDate(base.getDate() + 7); break;
      case "monthly": base.setMonth(base.getMonth() + 1); break;
      case "quarterly": base.setMonth(base.getMonth() + 3); break;
      case "yearly": base.setFullYear(base.getFullYear() + 1); break;
      default: return null;
    }
    return base.toISOString().split("T")[0];
  }

  const handleSubmit = async () => {
    if (!user || !formData.title) {
      alert("Bitte geben Sie mindestens einen Titel ein.");
      return;
    }

    try {
      const isRecurring = formData.is_recurring;
      const interval = isRecurring ? formData.recurrence_interval : null;

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        due_date: formData.due_date || null,
        is_recurring: isRecurring,
        recurrence_interval: interval,
        unit_id: formData.unit_id || null,
        notes: formData.notes || null,
        email_notification_enabled: formData.email_notification_enabled,
        notification_days_before: formData.email_notification_enabled ? parseInt(formData.notification_days_before) : null,
        completed_at: formData.status === "completed" && !editingTask?.completed_at ? new Date().toISOString() : editingTask?.completed_at,
        category: formData.category,
        source: editingTask?.source || "manual",
        tenant_id: formData.tenant_id || null,
        assigned_user_id: formData.assigned_user_id || null,
        notify_tenant_on_status: formData.notify_tenant_on_status,
        notify_assignee: formData.notify_assignee,
        next_recurrence_date: isRecurring && interval
          ? computeNextRecurrenceDate(interval, formData.due_date || null)
          : null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from("maintenance_tasks")
          .update(taskData)
          .eq("id", editingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("maintenance_tasks").insert({
          ...taskData,
          property_id: propertyId,
          user_id: dataOwnerId || user.id,
        });

        if (error) throw error;
      }

      setShowAddModal(false);
      loadTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Fehler beim Speichern der Aufgabe");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Möchten Sie diese Aufgabe wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("maintenance_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Fehler beim Löschen der Aufgabe");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Offen",
      in_progress: "In Bearbeitung",
      completed: "Erledigt",
    };
    return labels[status] || status;
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

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Niedrig",
      medium: "Mittel",
      high: "Hoch",
    };
    return labels[priority] || priority;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      allgemein: "Allgemein",
      wartung: "Wartung",
      reparatur: "Reparatur",
      beschwerde: "Beschwerde",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "wartung": return "text-blue-700 bg-blue-50";
      case "reparatur": return "text-orange-700 bg-orange-50";
      case "beschwerde": return "text-red-700 bg-red-50";
      default: return "text-gray-700 bg-gray-50";
    }
  };

  const getRecurrenceLabel = (interval: string | null) => {
    const labels: Record<string, string> = {
      daily: "Täglich",
      weekly: "Wöchentlich",
      monthly: "Monatlich",
      quarterly: "Vierteljährlich",
      yearly: "Jährlich",
    };
    return interval ? labels[interval] || interval : "";
  };

  const filteredTasks = filterStatus === "all"
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  if (!isPremium) {
    return <PremiumUpgradePrompt featureKey="property_maintenance" />;
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark">Instandhaltung</h3>
          <p className="text-sm text-gray-500 mt-1">
            {tasks.length} Aufgabe{tasks.length !== 1 ? "n" : ""} gesamt
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openAddModal} variant="primary">
            Aufgabe hinzufügen
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 w-fit">
        {["all", "open", "in_progress", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {status === "all"
              ? "Alle"
              : status === "open"
              ? "Offen"
              : status === "in_progress"
              ? "In Bearbeitung"
              : "Erledigt"}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Keine Aufgaben gefunden</p>
          <p className="text-sm text-gray-400 mb-4">
            {readOnly ? "Keine Wartungsaufgaben vorhanden" : "Erstellen Sie Wartungsaufgaben und behalten Sie alle Instandhaltungsarbeiten im Blick"}
          </p>
          {!readOnly && (
            <Button onClick={openAddModal} variant="primary">
              Erste Aufgabe hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(task.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-dark">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                        <Tag className="w-3 h-3 inline mr-0.5" />
                        {getCategoryLabel(task.category)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.is_recurring && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
                          Wiederkehrend ({getRecurrenceLabel(task.recurrence_interval)})
                        </span>
                      )}
                      {task.email_notification_enabled && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50 flex items-center gap-1" title={`E-Mail-Benachrichtigung ${task.notification_days_before} Tage vor Fälligkeit`}>
                          <Bell className="w-3 h-3" />
                          E-Mail
                        </span>
                      )}
                      {task.source === "tenant_request" && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-teal-700 bg-teal-50">
                          Mieteranfrage
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Status:</span>
                        <span>{getStatusLabel(task.status)}</span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
                        </div>
                      )}
                      {task.cost != null && task.cost > 0 && (
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          <span>{task.cost.toFixed(2)} €</span>
                        </div>
                      )}
                      {task.property_units && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <span>Einheit {task.property_units.unit_number}</span>
                        </div>
                      )}
                      {task.tenants && (
                        <div className="flex items-center gap-1 text-teal-600">
                          <Users className="w-3 h-3" />
                          <span>{task.tenants.first_name} {task.tenants.last_name}</span>
                        </div>
                      )}
                      {task.assigned_user_id && (
                        <div className="flex items-center gap-1 text-sky-600">
                          <UserCheck className="w-3 h-3" />
                          <span>
                            {memberOptions.find((m) => m.user_id === task.assigned_user_id)?.name || "Zugewiesen"}
                          </span>
                        </div>
                      )}
                    </div>
                    {task.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">{task.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">
                {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Heizungswartung"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Detaillierte Beschreibung der Aufgabe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="allgemein">Allgemein</option>
                    <option value="wartung">Wartung</option>
                    <option value="reparatur">Reparatur</option>
                    <option value="beschwerde">Beschwerde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="completed">Erledigt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorität</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kosten (€)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_notification_enabled}
                    onChange={(e) => setFormData({ ...formData, email_notification_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Per E-Mail benachrichtigen</span>
                </label>

                {formData.email_notification_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vorlaufzeit zur Fälligkeit</label>
                    <select
                      value={formData.notification_days_before}
                      onChange={(e) => setFormData({ ...formData, notification_days_before: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="90">3 Monate vorher</option>
                      <option value="30">1 Monat vorher</option>
                      <option value="14">14 Tage vorher</option>
                      <option value="5">5 Tage vorher</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {units.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Einheit (optional)</label>
                    <select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Gesamte Immobilie</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          Einheit {unit.unit_number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tenantOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mieter (optional)</label>
                    <select
                      value={formData.tenant_id}
                      onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Kein Mieter</option>
                      {tenantOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {memberOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zugewiesen an (optional)</label>
                  <select
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Nicht zugewiesen</option>
                    {memberOptions.map((m) => (
                      <option key={m.user_id} value={m.user_id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Wiederkehrende Aufgabe</span>
                </label>

                {formData.is_recurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intervall</label>
                    <select
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">Täglich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="monthly">Monatlich</option>
                      <option value="quarterly">Vierteljährlich</option>
                      <option value="yearly">Jährlich</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Benachrichtigungen</p>
                {formData.tenant_id && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_tenant_on_status}
                      onChange={(e) => setFormData({ ...formData, notify_tenant_on_status: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Mieter bei Statusänderung benachrichtigen</span>
                  </label>
                )}
                {formData.assigned_user_id && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_assignee}
                      onChange={(e) => setFormData({ ...formData, notify_assignee: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Zugewiesene Person per E-Mail benachrichtigen</span>
                  </label>
                )}
                {!formData.tenant_id && !formData.assigned_user_id && (
                  <p className="text-xs text-gray-400">Wählen Sie einen Mieter oder eine zugewiesene Person, um Benachrichtigungsoptionen zu sehen.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Zusätzliche Informationen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button onClick={() => setShowAddModal(false)} variant="cancel">
                  Abbrechen
                </Button>
                <Button onClick={handleSubmit} variant="primary">
                  {editingTask ? "Speichern" : "Hinzufügen"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
