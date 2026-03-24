import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  List,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePermissions } from "../../hooks/usePermissions";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";
import { Button } from "../ui/Button";
import TaskListView from "./TaskListView";
import TaskBoardView from "./TaskBoardView";
import TaskCreateEditModal from "./TaskCreateEditModal";
import {
  TaskItem,
  PropertyOption,
  UnitOption,
  TenantOption,
  MemberOption,
  TaskTab,
  TaskViewMode,
  TaskSortKey,
  sortTasks,
  filterTasksByTab,
} from "./taskHelpers";

export default function TasksView() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { dataOwnerId, filterPropertiesByScope, filterByPropertyId, canWrite: hasWritePermission } = usePermissions();
  const { isPremium } = useSubscription();
  const de = language === "de";

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TaskTab>("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("list");
  const [sortKey, setSortKey] = useState<TaskSortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterPropertyId, setFilterPropertyId] = useState("");
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTenantId, setFilterTenantId] = useState("");
  const [filterAssignedUserId, setFilterAssignedUserId] = useState("");

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [allUnits, setAllUnits] = useState<UnitOption[]>([]);
  const [allTenants, setAllTenants] = useState<TenantOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user || !dataOwnerId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select(`
          *,
          properties (name),
          property_units (unit_number),
          tenants (first_name, last_name)
        `)
        .eq("user_id", dataOwnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(filterByPropertyId(data || []));
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [user, dataOwnerId, filterByPropertyId]);

  const loadReferenceData = useCallback(async () => {
    if (!user || !dataOwnerId) return;
    try {
      const [propsRes, unitsRes, tenantsRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("user_id", dataOwnerId).order("name"),
        supabase.from("property_units").select("id, unit_number, property_id").eq("user_id", dataOwnerId).order("unit_number"),
        supabase.from("tenants").select("id, first_name, last_name, property_id").eq("user_id", dataOwnerId).eq("is_active", true).order("last_name"),
      ]);

      setProperties(filterPropertiesByScope(propsRes.data || []));
      setAllUnits(filterByPropertyId(unitsRes.data || []));
      setAllTenants(
        filterByPropertyId(tenantsRes.data || []).map(t => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`,
          property_id: t.property_id,
        }))
      );
    } catch (error) {
      console.error("Error loading reference data:", error);
    }

    try {
      const { data } = await supabase.rpc("get_account_members", { p_account_owner_id: dataOwnerId });
      if (data) {
        setMembers(
          data
            .filter((m: { is_active_member: boolean; removed_at: string | null }) => m.is_active_member && !m.removed_at)
            .map((m: { user_id: string; first_name: string | null; last_name: string | null; email: string }) => ({
              user_id: m.user_id,
              name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
            }))
        );
      }
    } catch {
      setMembers([]);
    }
  }, [user, dataOwnerId, filterPropertiesByScope, filterByPropertyId]);

  useEffect(() => {
    if (!user || !dataOwnerId) return;
    loadTasks();
    loadReferenceData();
  }, [user, dataOwnerId, loadTasks, loadReferenceData]);

  const hasActiveFilters = filterPropertyId || filterUnitId || filterStatus || filterCategory || filterTenantId || filterAssignedUserId;

  const resetFilters = () => {
    setFilterPropertyId("");
    setFilterUnitId("");
    setFilterStatus("");
    setFilterCategory("");
    setFilterTenantId("");
    setFilterAssignedUserId("");
    setSearchQuery("");
  };

  const filteredTasks = useMemo(() => {
    let result = filterTasksByTab(tasks, tab);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.properties?.name?.toLowerCase().includes(q) ||
        t.tenants?.first_name?.toLowerCase().includes(q) ||
        t.tenants?.last_name?.toLowerCase().includes(q)
      );
    }

    if (filterPropertyId) result = result.filter(t => t.property_id === filterPropertyId);
    if (filterUnitId) result = result.filter(t => t.unit_id === filterUnitId);
    if (filterStatus) result = result.filter(t => t.status === filterStatus);
    if (filterCategory) result = result.filter(t => t.category === filterCategory);
    if (filterTenantId) result = result.filter(t => t.tenant_id === filterTenantId);
    if (filterAssignedUserId) result = result.filter(t => t.assigned_user_id === filterAssignedUserId);

    return sortTasks(result, sortKey);
  }, [tasks, tab, searchQuery, filterPropertyId, filterUnitId, filterStatus, filterCategory, filterTenantId, filterAssignedUserId, sortKey]);

  const openCount = tasks.filter(t => t.status === "open").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm(de ? "Möchten Sie diese Aufgabe wirklich löschen?" : "Do you really want to delete this task?")) return;
    try {
      const { error } = await supabase.from("maintenance_tasks").delete().eq("id", taskId);
      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("maintenance_tasks").update(updateData).eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}) } : t));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  if (!isPremium) {
    return <PremiumUpgradePrompt featureKey="property_maintenance" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  const filterUnits = filterPropertyId ? allUnits.filter(u => u.property_id === filterPropertyId) : allUnits;
  const filterTenants = filterPropertyId ? allTenants.filter(t => t.property_id === filterPropertyId) : allTenants;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">
            {de ? "Aufgaben" : "Tasks"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {de
              ? `${openCount} offen, ${inProgressCount} in Bearbeitung, ${completedCount} erledigt`
              : `${openCount} open, ${inProgressCount} in progress, ${completedCount} completed`}
          </p>
        </div>
        {hasWritePermission && (
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            {de ? "Neue Aufgabe" : "New Task"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 bg-white rounded-lg p-1 border border-gray-200 w-fit">
        {([
          { key: "all", de: "Alle Aufgaben", en: "All Tasks" },
          { key: "tenant_requests", de: "Mieteranfragen", en: "Tenant Requests" },
          { key: "internal", de: "Eigene / Intern", en: "Internal" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {de ? t.de : t.en}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={de ? "Aufgaben durchsuchen..." : "Search tasks..."}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || hasActiveFilters
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as TaskSortKey)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">{de ? "Neueste zuerst" : "Newest first"}</option>
            <option value="due_date">{de ? "Fälligkeitsdatum" : "Due date"}</option>
            <option value="priority">{de ? "Priorität" : "Priority"}</option>
          </select>

          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
              title={de ? "Listenansicht" : "List view"}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`p-2 transition-colors ${viewMode === "board" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
              title={de ? "Board-Ansicht" : "Board view"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-dark">{de ? "Filter" : "Filters"}</span>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                {de ? "Alle zurücksetzen" : "Reset all"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{de ? "Immobilie" : "Property"}</label>
              <select
                value={filterPropertyId}
                onChange={(e) => { setFilterPropertyId(e.target.value); setFilterUnitId(""); setFilterTenantId(""); }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{de ? "Alle" : "All"}</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{de ? "Einheit" : "Unit"}</label>
              <select
                value={filterUnitId}
                onChange={(e) => setFilterUnitId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{de ? "Alle" : "All"}</option>
                {filterUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{de ? "Alle" : "All"}</option>
                <option value="open">{de ? "Offen" : "Open"}</option>
                <option value="in_progress">{de ? "In Bearbeitung" : "In Progress"}</option>
                <option value="completed">{de ? "Erledigt" : "Completed"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{de ? "Kategorie" : "Category"}</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{de ? "Alle" : "All"}</option>
                <option value="allgemein">{de ? "Allgemein" : "General"}</option>
                <option value="wartung">{de ? "Wartung" : "Maintenance"}</option>
                <option value="reparatur">{de ? "Reparatur" : "Repair"}</option>
                <option value="beschwerde">{de ? "Beschwerde" : "Complaint"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{de ? "Mieter" : "Tenant"}</label>
              <select
                value={filterTenantId}
                onChange={(e) => setFilterTenantId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{de ? "Alle" : "All"}</option>
                {filterTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{de ? "Zugewiesen an" : "Assigned to"}</label>
              <select
                value={filterAssignedUserId}
                onChange={(e) => setFilterAssignedUserId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{de ? "Alle" : "All"}</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark mb-2">
            {hasActiveFilters || searchQuery
              ? (de ? "Keine Aufgaben gefunden" : "No tasks found")
              : (de ? "Noch keine Aufgaben" : "No tasks yet")}
          </h3>
          <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
            {hasActiveFilters || searchQuery
              ? (de ? "Versuchen Sie, Ihre Filter anzupassen oder die Suche zu ändern." : "Try adjusting your filters or changing the search.")
              : (de ? "Erstellen Sie Ihre erste Aufgabe, um alle Instandhaltungsarbeiten zentral zu verwalten." : "Create your first task to manage all maintenance work centrally.")}
          </p>
          {!hasActiveFilters && !searchQuery && hasWritePermission && (
            <Button onClick={handleCreate} variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              {de ? "Erste Aufgabe erstellen" : "Create first task"}
            </Button>
          )}
          {(hasActiveFilters || searchQuery) && (
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
              {de ? "Filter zurücksetzen" : "Reset filters"}
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <TaskListView
              tasks={filteredTasks}
              members={members}
              de={de}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canWrite={hasWritePermission}
            />
          ) : (
            <TaskBoardView
              tasks={filteredTasks}
              members={members}
              de={de}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
            />
          )}
        </>
      )}

      {showModal && (
        <TaskCreateEditModal
          task={editingTask}
          properties={properties}
          units={allUnits}
          tenants={allTenants}
          members={members}
          de={de}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSaved={() => { setShowModal(false); setEditingTask(null); loadTasks(); }}
        />
      )}
    </div>
  );
}
