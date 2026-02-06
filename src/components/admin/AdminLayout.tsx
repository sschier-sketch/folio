import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { getMenuItemByKey, getGroupByKey, type AdminTabKey } from "../../config/adminMenu";

interface AdminLayoutProps {
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
  children: React.ReactNode;
}

export default function AdminLayout({ activeTab, onTabChange, children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentItem = getMenuItemByKey(activeTab);
  const currentGroup = getGroupByKey(activeTab);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div
        className={`
          fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto
          transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            onTabChange(tab);
            setMobileOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              {currentGroup && activeTab !== "overview" && (
                <>
                  <span className="text-gray-300 hidden sm:inline">{currentGroup.label}</span>
                  <span className="text-gray-200 hidden sm:inline">/</span>
                </>
              )}
              <span className="font-semibold text-gray-800">
                {currentItem?.label || "Admin"}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
