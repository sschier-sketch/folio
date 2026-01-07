import { useState } from "react";
import {
  FileText,
  Calculator,
  Gauge,
  Eye,
  Download,
  History,
} from "lucide-react";
import BillingOverview from "./billing/BillingOverview";
import OperatingCostsView from "./billing/OperatingCostsView";
import MetersView from "./billing/MetersView";
import BillingPreview from "./billing/BillingPreview";
import BillingExportView from "./billing/BillingExportView";
import BillingHistoryView from "./billing/BillingHistoryView";

type Tab =
  | "overview"
  | "operating-costs"
  | "meters"
  | "preview"
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
    { id: "preview" as Tab, label: "Vorschau", icon: Eye },
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

      <div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-primary-blue border-b-2 border-primary-blue"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.premium && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    Premium
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeTab === "overview" && <BillingOverview />}
        {activeTab === "operating-costs" && <OperatingCostsView />}
        {activeTab === "meters" && <MetersView />}
        {activeTab === "preview" && <BillingPreview />}
        {activeTab === "export" && <BillingExportView />}
        {activeTab === "history" && <BillingHistoryView />}
      </div>
    </div>
  );
}
