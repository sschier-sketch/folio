export interface TaskItem {
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
  property_id: string;
  created_at: string;
  properties?: { name: string } | null;
  property_units?: { unit_number: string } | null;
  tenants?: { first_name: string; last_name: string } | null;
}

export interface PropertyOption {
  id: string;
  name: string;
}

export interface UnitOption {
  id: string;
  unit_number: string;
  property_id: string;
}

export interface TenantOption {
  id: string;
  name: string;
  property_id: string;
}

export interface MemberOption {
  user_id: string;
  name: string;
}

export type TaskTab = "all" | "tenant_requests" | "internal";
export type TaskViewMode = "list" | "board";
export type TaskSortKey = "newest" | "due_date" | "priority";

export const STATUS_LABELS_DE: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  completed: "Erledigt",
};

export const STATUS_LABELS_EN: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export const PRIORITY_LABELS_DE: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export const PRIORITY_LABELS_EN: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const CATEGORY_LABELS_DE: Record<string, string> = {
  allgemein: "Allgemein",
  wartung: "Wartung",
  reparatur: "Reparatur",
  beschwerde: "Beschwerde",
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  allgemein: "General",
  wartung: "Maintenance",
  reparatur: "Repair",
  beschwerde: "Complaint",
};

export const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high": return "text-red-600 bg-red-50";
    case "low": return "text-gray-600 bg-gray-50";
    default: return "text-amber-600 bg-amber-50";
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "wartung": return "text-blue-700 bg-blue-50";
    case "reparatur": return "text-orange-700 bg-orange-50";
    case "beschwerde": return "text-red-700 bg-red-50";
    default: return "text-gray-700 bg-gray-50";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed": return "text-emerald-700 bg-emerald-50";
    case "in_progress": return "text-blue-700 bg-blue-50";
    default: return "text-amber-700 bg-amber-50";
  }
}

export function sortTasks(tasks: TaskItem[], sortKey: TaskSortKey): TaskItem[] {
  const sorted = [...tasks];
  switch (sortKey) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "due_date":
      return sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    case "priority":
      return sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
    default:
      return sorted;
  }
}

export function filterTasksByTab(tasks: TaskItem[], tab: TaskTab): TaskItem[] {
  switch (tab) {
    case "tenant_requests":
      return tasks.filter(t => t.source === "tenant_request");
    case "internal":
      return tasks.filter(t => t.source !== "tenant_request");
    default:
      return tasks;
  }
}

export function computeNextRecurrenceDate(interval: string, dueDate: string | null): string | null {
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
