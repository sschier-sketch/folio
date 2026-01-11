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

type Tab =
  | "overview"
  | "operating-costs"
  | "meters"
  | "export"
  | "history";

export default function BillingView() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs = [
    { id: "overview" as Tab, label: "Übersicht", icon: FileText },
    {
      id: "operating-costs" as Tab,
      label: "Betriebskosten",
      icon: Calculator,
    },
    { id: "meters" as Tab, label: "Zähler & Verbrauch", icon: Gauge },
    { id: "export" as Tab, label: "Export", icon: Download, premium: true },
    { id: "history" as Tab, label: "Historie", icon: History, premium: true },
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
        <div className="overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.premium && (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">
                      Pro
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {activeTab === "overview" && <BillingOverview />}
        {activeTab === "operating-costs" && <OperatingCostsView />}
        {activeTab === "meters" && <MetersView />}
        {activeTab === "export" && <BillingExportView />}
        {activeTab === "history" && <BillingHistoryView />}
      </div>
    </div>
  );
}
