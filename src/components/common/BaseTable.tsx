import { ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render: (item: T, index: number) => ReactNode;
}

export interface BaseTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

export function BaseTable<T>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = "Keine Daten vorhanden",
  loading = false,
  onRowClick,
}: BaseTableProps<T>) {
  const handleHeaderClick = (column: TableColumn<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const getAlignmentClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="p-12 text-center">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${getAlignmentClass(column.align)} ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
                  }`}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && sortKey === column.key && (
                      <span className="text-gray-400">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${getAlignmentClass(column.align)}`}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface StatusBadgeProps {
  type: "success" | "warning" | "info" | "neutral" | "error";
  label: string;
  icon?: ReactNode;
}

export function StatusBadge({ type, label, icon }: StatusBadgeProps) {
  const colorClasses = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    neutral: "bg-gray-100 text-gray-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorClasses[type]}`}
    >
      {icon}
      {label}
    </span>
  );
}

export interface ActionButtonProps {
  icon: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  disabled?: boolean;
  variant?: "default" | "danger";
}

export function ActionButton({
  icon,
  onClick,
  title,
  disabled = false,
  variant = "default",
}: ActionButtonProps) {
  const colorClass = variant === "danger"
    ? "text-gray-300 hover:text-red-600 transition-colors"
    : "text-gray-300 hover:text-primary-blue transition-colors";

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${colorClass} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  );
}

export function ActionsCell({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}
