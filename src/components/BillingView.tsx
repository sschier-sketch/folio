import { useState, useEffect } from "react";
import {
  FileText,
  Calculator,
  Gauge,
  Download,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import OperatingCostsView from "./billing/OperatingCostsView";
import MetersView from "./billing/MetersView";
import BillingExportView from "./billing/BillingExportView";
import AnlageVView from "./finances/AnlageVView";
import ScrollableTabNav from "./common/ScrollableTabNav";
import Badge from "./common/Badge";
import { useSubscription } from "../hooks/useSubscription";
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";

type Tab =
  | "operating-costs"
  | "meters"
  | "anlage_v"
  | "export";

export default function BillingView() {
  const location = useLocation();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<Tab>("operating-costs");
  const [viewKey, setViewKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['operating-costs', 'meters', 'anlage_v', 'export'].includes(tab)) {
      setActiveTab(tab as Tab);
      setViewKey(prev => prev + 1);
      const preserved = new URLSearchParams();
      const view = params.get('view');
      const year = params.get('year');
      if (view) preserved.set('view', view);
      if (year) preserved.set('year', year);
      const qs = preserved.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
  }, [location.search]);

  const tabs = [
    {
      id: "operating-costs" as Tab,
      label: "Betriebskosten",
      icon: Calculator,
      premium: true,
    },
    { id: "meters" as Tab, label: "Zähler & Verbrauch", icon: Gauge },
    {
      id: "anlage_v" as Tab,
      label: "Anlage V",
      icon: FileText,
      premium: true,
    },
    { id: "export" as Tab, label: "Export", icon: Download, premium: true, disabled: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Abrechnungen</h1>
        <p className="text-gray-400 mt-1">
          Abrechnungen erstellen und verwalten
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
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap text-sm ${
                    tab.disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                  disabled={tab.disabled}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  {tab.premium && tab.disabled ? (
                    <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: "#faf8f8", color: "#000000" }}>
                      Bald
                    </span>
                  ) : tab.premium ? (
                    <Badge variant="pro" size="sm">Pro</Badge>
                  ) : null}
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
        {activeTab === "meters" && <MetersView key={`meters-${viewKey}`} />}
        {activeTab === "operating-costs" && <OperatingCostsView key={`operating-costs-${viewKey}`} />}
        {activeTab === "anlage_v" && (
          isPremium ? (
            <AnlageVView />
          ) : (
            <PremiumUpgradePrompt featureKey="finances_anlage_v" />
          )
        )}
        {activeTab === "export" && <BillingExportView key={`export-${viewKey}`} />}
      </div>
    </div>
  );
}
