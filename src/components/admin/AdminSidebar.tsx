import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  adminMenuGroups,
  type AdminTabKey,
  type AdminMenuGroup,
} from "../../config/adminMenu";
import { supabase } from "../../lib/supabase";

interface AdminSidebarProps {
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openTicketCount, setOpenTicketCount] = useState(0);

  useEffect(() => {
    async function loadOpenTicketCount() {
      const { count } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("ticket_type", "contact")
        .eq("status", "open");
      setOpenTicketCount(count || 0);
    }
    loadOpenTicketCount();
    const interval = setInterval(loadOpenTicketCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    adminMenuGroups.forEach((g) => {
      initial[g.id] = g.defaultOpen !== false;
    });
    return initial;
  });

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return adminMenuGroups;
    const q = search.toLowerCase();
    return adminMenuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [search]);

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  const isGroupOpen = (group: AdminMenuGroup) =>
    search.trim() ? true : openGroups[group.id] !== false;

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-gray-100 transition-all duration-200 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[260px]"}
        h-full
      `}
    >
      <div
        className={`flex items-center border-b border-gray-100 h-16 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        {!collapsed && (
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800 leading-tight">Admin</p>
              <p className="text-[11px] text-gray-400 leading-tight group-hover:text-primary-blue transition-colors">
                rentab.ly
              </p>
            </div>
          </button>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-blue/30 focus:border-primary-blue/40 placeholder:text-gray-300 text-gray-600"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
        {filteredGroups.map((group) => (
          <div key={group.id} className="mb-0.5">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-1.5 mt-1"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                  {group.label}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-gray-300 transition-transform duration-150 ${
                    isGroupOpen(group) ? "" : "-rotate-90"
                  }`}
                />
              </button>
            )}

            {(collapsed || isGroupOpen(group)) && (
              <div className={collapsed ? "px-1.5" : "px-2.5"}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => onTabChange(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-2.5 rounded-lg transition-all duration-150
                        ${collapsed ? "justify-center px-0 py-2 my-0.5" : "px-2.5 py-[7px] my-[1px]"}
                        ${
                          isActive
                            ? "bg-primary-blue/8 text-primary-blue font-medium"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }
                      `}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 ${
                          isActive ? "text-primary-blue" : ""
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-[13px] truncate flex-1">{item.label}</span>
                      )}
                      {!collapsed && item.key === "tickets" && openTicketCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full bg-red-500 text-white">
                          {openTicketCount > 99 ? "99+" : openTicketCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {collapsed && group.id !== "system" && (
              <div className="mx-3 my-1 border-b border-gray-50" />
            )}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Zurück zum Dashboard
          </button>
        </div>
      )}
    </aside>
  );
}
