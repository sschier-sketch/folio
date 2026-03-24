import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { Button } from "../ui/Button";
import {
  TaskItem,
  PropertyOption,
  UnitOption,
  TenantOption,
  MemberOption,
  computeNextRecurrenceDate,
} from "./taskHelpers";

interface TaskCreateEditModalProps {
  task: TaskItem | null;
  properties: PropertyOption[];
  units: UnitOption[];
  tenants: TenantOption[];
  members: MemberOption[];
  de: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskCreateEditModal({
  task,
  properties,
  units,
  tenants,
  members,
  de,
  onClose,
  onSaved,
}: TaskCreateEditModalProps) {
  const { user } = useAuth();
  const { dataOwnerId } = usePermissions();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    cost: "",
    due_date: "",
    is_recurring: false,
    recurrence_interval: "monthly",
    property_id: "",
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
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        cost: task.cost ? task.cost.toString() : "",
        due_date: task.due_date || "",
        is_recurring: task.is_recurring || false,
        recurrence_interval: task.recurrence_interval || "monthly",
        property_id: task.property_id,
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
    }
  }, [task]);

  const filteredUnits = units.filter(u => u.property_id === formData.property_id);
  const filteredTenants = tenants.filter(t => t.property_id === formData.property_id);

  const handlePropertyChange = (propertyId: string) => {
    setFormData(prev => ({
      ...prev,
      property_id: propertyId,
      unit_id: "",
      tenant_id: "",
    }));
  };

  const handleSubmit = async () => {
    if (!user || !formData.title || !formData.property_id) {
      alert(de ? "Bitte geben Sie mindestens einen Titel und eine Immobilie an." : "Please provide at least a title and a property.");
      return;
    }

    setSaving(true);
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
        property_id: formData.property_id,
        unit_id: formData.unit_id || null,
        notes: formData.notes || null,
        email_notification_enabled: formData.email_notification_enabled,
        notification_days_before: formData.email_notification_enabled ? parseInt(formData.notification_days_before) : null,
        completed_at: formData.status === "completed" && !task?.completed_at ? new Date().toISOString() : task?.completed_at || null,
        category: formData.category,
        source: task?.source || "manual",
        tenant_id: formData.tenant_id || null,
        assigned_user_id: formData.assigned_user_id || null,
        notify_tenant_on_status: formData.notify_tenant_on_status,
        notify_assignee: formData.notify_assignee,
        next_recurrence_date: isRecurring && interval
          ? computeNextRecurrenceDate(interval, formData.due_date || null)
          : null,
      };

      if (task) {
        const { error } = await supabase
          .from("maintenance_tasks")
          .update(taskData)
          .eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("maintenance_tasks").insert({
          ...taskData,
          user_id: dataOwnerId || user.id,
        });
        if (error) throw error;
      }

      onSaved();
    } catch (error) {
      console.error("Error saving task:", error);
      alert(de ? "Fehler beim Speichern der Aufgabe" : "Error saving task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-dark">
            {task ? (de ? "Aufgabe bearbeiten" : "Edit Task") : (de ? "Neue Aufgabe" : "New Task")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {de ? "Immobilie" : "Property"} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.property_id}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{de ? "Bitte wählen..." : "Please select..."}</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {de ? "Titel" : "Title"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={de ? "z.B. Heizungswartung" : "e.g. Heating maintenance"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {de ? "Beschreibung" : "Description"}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder={de ? "Detaillierte Beschreibung der Aufgabe" : "Detailed task description"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {de ? "Kategorie" : "Category"}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="allgemein">{de ? "Allgemein" : "General"}</option>
                <option value="wartung">{de ? "Wartung" : "Maintenance"}</option>
                <option value="reparatur">{de ? "Reparatur" : "Repair"}</option>
                <option value="beschwerde">{de ? "Beschwerde" : "Complaint"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="open">{de ? "Offen" : "Open"}</option>
                <option value="in_progress">{de ? "In Bearbeitung" : "In Progress"}</option>
                <option value="completed">{de ? "Erledigt" : "Completed"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {de ? "Priorität" : "Priority"}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">{de ? "Niedrig" : "Low"}</option>
                <option value="medium">{de ? "Mittel" : "Medium"}</option>
                <option value="high">{de ? "Hoch" : "High"}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {de ? "Kosten (EUR)" : "Cost (EUR)"}
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {de ? "Fälligkeitsdatum" : "Due Date"}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredUnits.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {de ? "Einheit" : "Unit"}
                </label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{de ? "Gesamte Immobilie" : "Entire property"}</option>
                  {filteredUnits.map(u => (
                    <option key={u.id} value={u.id}>{de ? "Einheit" : "Unit"} {u.unit_number}</option>
                  ))}
                </select>
              </div>
            )}
            {filteredTenants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {de ? "Mieter" : "Tenant"}
                </label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{de ? "Kein Mieter" : "No tenant"}</option>
                  {filteredTenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {de ? "Zugewiesen an" : "Assigned to"}
              </label>
              <select
                value={formData.assigned_user_id}
                onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{de ? "Nicht zugewiesen" : "Unassigned"}</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email_notification_enabled}
                onChange={(e) => setFormData({ ...formData, email_notification_enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {de ? "Per E-Mail benachrichtigen" : "Send email notification"}
              </span>
            </label>

            {formData.email_notification_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {de ? "Vorlaufzeit zur Fälligkeit" : "Notification lead time"}
                </label>
                <select
                  value={formData.notification_days_before}
                  onChange={(e) => setFormData({ ...formData, notification_days_before: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="90">{de ? "3 Monate vorher" : "3 months before"}</option>
                  <option value="30">{de ? "1 Monat vorher" : "1 month before"}</option>
                  <option value="14">{de ? "14 Tage vorher" : "14 days before"}</option>
                  <option value="5">{de ? "5 Tage vorher" : "5 days before"}</option>
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {de ? "Wiederkehrende Aufgabe" : "Recurring task"}
              </span>
            </label>

            {formData.is_recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {de ? "Intervall" : "Interval"}
                </label>
                <select
                  value={formData.recurrence_interval}
                  onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">{de ? "Täglich" : "Daily"}</option>
                  <option value="weekly">{de ? "Wöchentlich" : "Weekly"}</option>
                  <option value="monthly">{de ? "Monatlich" : "Monthly"}</option>
                  <option value="quarterly">{de ? "Vierteljährlich" : "Quarterly"}</option>
                  <option value="yearly">{de ? "Jährlich" : "Yearly"}</option>
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              {de ? "Benachrichtigungen" : "Notifications"}
            </p>
            {formData.tenant_id && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_tenant_on_status}
                  onChange={(e) => setFormData({ ...formData, notify_tenant_on_status: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {de ? "Mieter bei Statusänderung benachrichtigen" : "Notify tenant on status change"}
                </span>
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
                <span className="text-sm text-gray-700">
                  {de ? "Zugewiesene Person per E-Mail benachrichtigen" : "Notify assignee via email"}
                </span>
              </label>
            )}
            {!formData.tenant_id && !formData.assigned_user_id && (
              <p className="text-xs text-gray-400">
                {de
                  ? "Wählen Sie einen Mieter oder eine zugewiesene Person, um Benachrichtigungsoptionen zu sehen."
                  : "Select a tenant or assignee to see notification options."}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {de ? "Notizen" : "Notes"}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder={de ? "Zusätzliche Informationen" : "Additional information"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button onClick={onClose} variant="cancel">
              {de ? "Abbrechen" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} variant="primary" disabled={saving}>
              {saving
                ? (de ? "Speichern..." : "Saving...")
                : task
                  ? (de ? "Speichern" : "Save")
                  : (de ? "Hinzufügen" : "Add")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
