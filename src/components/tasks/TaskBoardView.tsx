import {
  Calendar,
  Tag,
  Users,
  UserCheck,
  Building2,
  RotateCw,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  TaskItem,
  MemberOption,
  getPriorityColor,
  getCategoryColor,
  PRIORITY_LABELS_DE,
  PRIORITY_LABELS_EN,
  CATEGORY_LABELS_DE,
  CATEGORY_LABELS_EN,
} from "./taskHelpers";

interface TaskBoardViewProps {
  tasks: TaskItem[];
  members: MemberOption[];
  de: boolean;
  onEdit: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

const COLUMNS = [
  { key: "open", icon: AlertCircle, iconColor: "text-amber-600", borderColor: "border-amber-400" },
  { key: "in_progress", icon: Clock, iconColor: "text-blue-600", borderColor: "border-blue-400" },
  { key: "completed", icon: CheckCircle2, iconColor: "text-emerald-600", borderColor: "border-emerald-400" },
];

const STATUS_LABELS_DE: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  completed: "Erledigt",
};

const STATUS_LABELS_EN: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function TaskBoardView({ tasks, members, de, onEdit, onStatusChange }: TaskBoardViewProps) {
  const priorityLabels = de ? PRIORITY_LABELS_DE : PRIORITY_LABELS_EN;
  const categoryLabels = de ? CATEGORY_LABELS_DE : CATEGORY_LABELS_EN;
  const statusLabels = de ? STATUS_LABELS_DE : STATUS_LABELS_EN;

  const isDueOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toISOString().split("T")[0]);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasks.filter(t => t.status === col.key);

        return (
          <div
            key={col.key}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.borderColor}`}>
              <Icon className={`w-4 h-4 ${col.iconColor}`} />
              <h3 className="text-sm font-semibold text-dark">
                {statusLabels[col.key]}
              </h3>
              <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px] flex-1">
              {columnTasks.length === 0 && (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-400">
                    {de ? "Keine Aufgaben" : "No tasks"}
                  </p>
                </div>
              )}

              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onEdit(task)}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-dark flex-1 line-clamp-2">{task.title}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                      {priorityLabels[task.priority] || task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(task.category)}`}>
                      {categoryLabels[task.category] || task.category}
                    </span>
                    {task.source === "tenant_request" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-teal-700 bg-teal-50">
                        {de ? "Mieter" : "Tenant"}
                      </span>
                    )}
                    {task.is_recurring && (
                      <RotateCw className="w-3 h-3 text-blue-500" />
                    )}
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-500">
                    {task.properties?.name && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {task.properties.name}
                          {task.property_units?.unit_number && ` / ${de ? "Einheit" : "Unit"} ${task.property_units.unit_number}`}
                        </span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className={`flex items-center gap-1 ${isDueOverdue(task.due_date) && task.status !== "completed" ? "text-red-600 font-medium" : ""}`}>
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
                      </div>
                    )}
                    {task.tenants && (
                      <div className="flex items-center gap-1 text-teal-600">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{task.tenants.first_name} {task.tenants.last_name}</span>
                      </div>
                    )}
                    {task.assigned_user_id && (
                      <div className="flex items-center gap-1 text-sky-600">
                        <UserCheck className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {members.find(m => m.user_id === task.assigned_user_id)?.name || (de ? "Zugewiesen" : "Assigned")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
