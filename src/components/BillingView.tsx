import { useState } from "react";
import {
  FileText,
  Calculator,
  Gauge,
  Download,
  History,
} from "lucide-react";
import BillingOverview from "./billing/BillingOverview";
import OperatingCostsView from "./billing/OperatingCostsView";
import MetersView from "./billing/MetersView";
import BillingExportView from "./billing/BillingExportView";
import BillingHistoryView from "./billing/BillingHistoryView";
import ScrollableTabNav from "./common/ScrollableTabNav";

type Tab =
  | "meters"
  | "operating-costs"
  | "export"
  | "history";

export default function BillingView() {
  const [activeTab, setActiveTab] = useState<Tab>("meters");

  const tabs = [
    { id: "meters" as Tab, label: "Zähler & Verbrauch", icon: Gauge },
    {
      id: "operating-costs" as Tab,
      label: "Betriebskosten",
      icon: Calculator,
      premium: true,
      disabled: true,
    },
    { id: "export" as Tab, label: "Export", icon: Download, premium: true, disabled: true },
    { id: "history" as Tab, label: "Historie", icon: History, premium: true, disabled: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Abrechnungen</h1>
        <p className="text-gray-400 mt-1">
          Betriebskostenabrechnungen erstellen und verwalten
        </p>
      </div>

      <div className="bg-white rounded-lg mb-6">
        <ScrollableTabNav>
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                    tab.disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                  disabled={tab.disabled}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.premium && (
                    <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: "#faf8f8", color: "#000000" }}>
                      Pro
                    </span>
                  )}
                  {activeTab === tab.id && !tab.disabled && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableTabNav>
      </div>

      <div>
        {activeTab === "meters" && <MetersView />}
        {activeTab === "operating-costs" && <OperatingCostsView />}
        {activeTab === "export" && <BillingExportView />}
        {activeTab === "history" && <BillingHistoryView />}
      </div>
    </div>
  );
}
