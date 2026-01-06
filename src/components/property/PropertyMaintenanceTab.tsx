import { useState, useEffect } from "react";
import { Lock, Wrench, Plus, CheckCircle2, Clock, AlertCircle, Trash2, Edit2, Calendar, Euro, FileText, Receipt, Bell } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyMaintenanceTabProps {
  propertyId: string;
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
  email_notification_enabled?: boolean | null;
  notification_days_before?: number | null;
  created_at: string;
  property_units?: {
    unit_number: string;
  };
}

export default function PropertyMaintenanceTab({ propertyId }: PropertyMaintenanceTabProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "completed">("all");
  const [units, setUnits] = useState<{ id: string; unit_number: string }[]>([]);

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
  });

  useEffect(() => {
    if (user && isPremium) {
      loadTasks();
      loadUnits();
    }
  }, [user, propertyId, isPremium]);

  async function loadTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          *,
          property_units (
            unit_number
          )
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

      if (data) {
        setUnits(data);
      }
    } catch (error) {
      console.error("Error loading units:", error);
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
    });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!user || !formData.title) {
      alert("Bitte geben Sie mindestens einen Titel ein.");
      return;
    }

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        due_date: formData.due_date || null,
        is_recurring: formData.is_recurring,
        recurrence_interval: formData.is_recurring ? formData.recurrence_interval : null,
        unit_id: formData.unit_id || null,
        notes: formData.notes || null,
        email_notification_enabled: formData.email_notification_enabled,
        notification_days_before: formData.email_notification_enabled ? parseInt(formData.notification_days_before) : null,
        completed_at: formData.status === "completed" && !editingTask?.completed_at ? new Date().toISOString() : editingTask?.completed_at,
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
          user_id: user.id,
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

  const filteredTasks = filterStatus === "all"
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  const recurringTasks = tasks.filter(t => t.is_recurring);
  const oneTimeTasks = tasks.filter(t => !t.is_recurring);

  if (!isPremium) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">Pro-Funktion</h3>
          <p className="text-gray-600 mb-6">
            Die Instandhaltungsverwaltung ist im Pro-Tarif verfügbar. Upgrade jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <Wrench className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Aufgaben je Immobilie verwalten</span>
            </div>
            <div className="flex items-start gap-2">
              <Wrench className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Wiederkehrende Wartungen planen</span>
            </div>
            <div className="flex items-start gap-2">
              <Wrench className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Kosten erfassen und dokumentieren</span>
            </div>
            <div className="flex items-start gap-2">
              <Wrench className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">Verknüpfung mit Ausgaben und Belegen</span>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            Jetzt auf Pro upgraden
          </button>
        </div>
      </div>
    );
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
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aufgabe hinzufügen
        </button>
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
            Erstellen Sie Wartungsaufgaben und behalten Sie alle Instandhaltungsarbeiten im Blick
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Erste Aufgabe hinzufügen
          </button>
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
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-dark">{task.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.is_recurring && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
                          Wiederkehrend ({task.recurrence_interval === "monthly" ? "Monatlich" : task.recurrence_interval === "quarterly" ? "Vierteljährlich" : "Jährlich"})
                        </span>
                      )}
                      {task.email_notification_enabled && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50 flex items-center gap-1" title={`E-Mail-Benachrichtigung ${task.notification_days_before} Tage vor Fälligkeit`}>
                          <Bell className="w-3 h-3" />
                          E-Mail
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      {task.cost && (
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
                    </div>
                    {task.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">{task.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
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
                      <option value="monthly">Monatlich</option>
                      <option value="quarterly">Vierteljährlich</option>
                      <option value="yearly">Jährlich</option>
                    </select>
                  </div>
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
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {editingTask ? "Speichern" : "Hinzufügen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
