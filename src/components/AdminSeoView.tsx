import { useState } from "react";
import { Settings, FileText, Globe, Code2 } from "lucide-react";
import AdminSeoPagesView from "./admin/AdminSeoPagesView";
import AdminSeoGlobalView from "./admin/AdminSeoGlobalView";
import AdminSeoHeadView from "./admin/AdminSeoHeadView";
import ScrollableTabNav from "./common/ScrollableTabNav";

type Tab = "pages" | "global" | "head";

export default function AdminSeoView() {
  const [activeTab, setActiveTab] = useState<Tab>("pages");

  const tabs = [
    { id: "pages" as Tab, label: "Seiten", icon: FileText },
    { id: "global" as Tab, label: "SEO-Einstellungen", icon: Settings },
    { id: "head" as Tab, label: "Head der Website", icon: Code2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark">SEO & Seiten</h1>
              <p className="text-gray-400 mt-1">
                Verwalten Sie Suchmaschinenoptimierung und Meta-Tags
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg mb-6">
        <ScrollableTabNav>
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableTabNav>
      </div>

      <div>
        {activeTab === "pages" && <AdminSeoPagesView />}
        {activeTab === "global" && <AdminSeoGlobalView />}
        {activeTab === "head" && <AdminSeoHeadView />}
      </div>
    </div>
  );
}
