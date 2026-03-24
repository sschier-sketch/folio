import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Euro,
  Tag,
  Users,
  UserCheck,
  Building2,
  Bell,
  RotateCw,
  CreditCard as Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  TaskItem,
  MemberOption,
  getPriorityColor,
  getCategoryColor,
  STATUS_LABELS_DE,
  STATUS_LABELS_EN,
  PRIORITY_LABELS_DE,
  PRIORITY_LABELS_EN,
  CATEGORY_LABELS_DE,
  CATEGORY_LABELS_EN,
} from "./taskHelpers";

interface TaskListViewProps {
  tasks: TaskItem[];
  members: MemberOption[];
  de: boolean;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: string) => void;
  canWrite: boolean;
}

export default function TaskListView({ tasks, members, de, onEdit, onDelete, canWrite }: TaskListViewProps) {
  const statusLabels = de ? STATUS_LABELS_DE : STATUS_LABELS_EN;
  const priorityLabels = de ? PRIORITY_LABELS_DE : PRIORITY_LABELS_EN;
  const categoryLabels = de ? CATEGORY_LABELS_DE : CATEGORY_LABELS_EN;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case "in_progress": return <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
    }
  };

  const isDueOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onEdit(task)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {getStatusIcon(task.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-semibold text-dark truncate max-w-[300px]">{task.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                    <Tag className="w-3 h-3 inline mr-0.5" />
                    {categoryLabels[task.category] || task.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {priorityLabels[task.priority] || task.priority}
                  </span>
                  {task.is_recurring && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50 flex items-center gap-0.5">
                      <RotateCw className="w-3 h-3" />
                      {de ? "Wiederkehrend" : "Recurring"}
                    </span>
                  )}
                  {task.source === "tenant_request" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-teal-700 bg-teal-50">
                      {de ? "Mieteranfrage" : "Tenant Request"}
                    </span>
                  )}
                  {task.source === "recurring" && task.parent_task_id && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50 flex items-center gap-0.5">
                      <RotateCw className="w-3 h-3" />
                      {de ? "Serieninstanz" : "Series Instance"}
                    </span>
                  )}
                  {task.tickets?.ticket_number && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                      #{task.tickets.ticket_number}
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{task.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  {task.properties?.name && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{task.properties.name}</span>
                    </div>
                  )}
                  {task.property_units?.unit_number && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <span>{de ? "Einheit" : "Unit"} {task.property_units.unit_number}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className={`flex items-center gap-1 ${isDueOverdue(task.due_date) && task.status !== "completed" ? "text-red-600 font-medium" : ""}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
                    </div>
                  )}
                  {task.cost != null && task.cost > 0 && (
                    <div className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      <span>{task.cost.toFixed(2)} EUR</span>
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
                      <span>{members.find(m => m.user_id === task.assigned_user_id)?.name || (de ? "Zugewiesen" : "Assigned")}</span>
                    </div>
                  )}
                  {task.email_notification_enabled && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Bell className="w-3 h-3" />
                      <span>E-Mail</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-3 flex-shrink-0">
              {canWrite && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    className="p-2 text-gray-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                    title={de ? "Bearbeiten" : "Edit"}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title={de ? "Löschen" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <ChevronRight className="w-4 h-4 text-gray-300 ml-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
