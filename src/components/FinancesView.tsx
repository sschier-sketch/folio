import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard,
  Lightbulb,
  Calculator,
  FileText,
} from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import { useAuth } from "../contexts/AuthContext";
import IncomeView from "./finances/IncomeView";
import ExpensesView from "./finances/ExpensesView";
import CashflowView from "./finances/CashflowView";
import BankConnectionView from "./finances/BankConnectionView";
import IntelligenceView from "./finances/IntelligenceView";
import IndexRentView from "./finances/IndexRentView";
import AnlageVView from "./finances/AnlageVView";
import ScrollableTabNav from "./common/ScrollableTabNav";
import Badge from "./common/Badge";
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";
import { Button } from "./ui/Button";
import {
  loadIncomeExportData,
  loadExpenseExportData,
  loadCashflowExportData,
  exportIncomeToCSV,
  exportIncomeToExcel,
  exportExpensesToCSV,
  exportExpensesToExcel,
  exportCashflowToCSV,
  exportCashflowToExcel,
} from "../lib/financeExportUtils";

type Tab =
  | "income"
  | "expenses"
  | "cashflow"
  | "indexrent"
  | "anlage_v"
  | "intelligence"
  | "bank";

const EXPORTABLE_TABS: Tab[] = ["income", "expenses", "cashflow"];

export default function FinancesView() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<Tab>("income");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const tabs = [
    { id: "income" as Tab, label: "Einnahmen", icon: TrendingUp },
    { id: "expenses" as Tab, label: "Ausgaben", icon: TrendingDown },
    { id: "cashflow" as Tab, label: "Cashflow", icon: BarChart3, premium: true },
    { id: "indexrent" as Tab, label: "Indexmiete", icon: Calculator, premium: true },
    { id: "anlage_v" as Tab, label: "Anlage V", icon: FileText, premium: true },
    { id: "intelligence" as Tab, label: "Intelligenz", icon: Lightbulb, premium: true },
    { id: "bank" as Tab, label: "Bankanbindung", icon: CreditCard, premium: true },
  ];

  const canExport = EXPORTABLE_TABS.includes(activeTab) && (activeTab !== "cashflow" || isPremium);

  async function handleExport(format: "csv" | "excel") {
    if (!user || exporting) return;
    setExporting(true);
    setShowExportMenu(false);

    try {
      if (activeTab === "income") {
        const data = await loadIncomeExportData(user.id);
        if (data.length === 0) {
          alert("Keine Einnahmen zum Exportieren vorhanden.");
          return;
        }
        format === "csv" ? exportIncomeToCSV(data) : exportIncomeToExcel(data);
      } else if (activeTab === "expenses") {
        const data = await loadExpenseExportData(user.id);
        if (data.length === 0) {
          alert("Keine Ausgaben zum Exportieren vorhanden.");
          return;
        }
        format === "csv" ? exportExpensesToCSV(data) : exportExpensesToExcel(data);
      } else if (activeTab === "cashflow") {
        const data = await loadCashflowExportData(user.id);
        format === "csv" ? exportCashflowToCSV(data) : exportCashflowToExcel(data);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Fehler beim Exportieren der Daten.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Finanzen</h1>
          <p className="text-gray-400 mt-1">
            Verwalten Sie Ihre Einnahmen, Ausgaben und den Cashflow
          </p>
        </div>
        {canExport && (
          <div className="relative">
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              variant="outlined"
              disabled={exporting}
            >
              {exporting ? "Exportiert..." : "Exportieren"}
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  CSV exportieren
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Excel exportieren
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg mb-6">
        <ScrollableTabNav>
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isDisabled = tab.id === "bank" || tab.id === "intelligence";
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(tab.id);
                      setShowExportMenu(false);
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap text-sm ${
                    isDisabled
                      ? "text-gray-300 cursor-not-allowed opacity-50"
                      : activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  {tab.premium && (tab.id === "intelligence" || tab.id === "bank") ? (
                    <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: "#faf8f8", color: "#000000" }}>
                      Bald
                    </span>
                  ) : tab.premium ? (
                    <Badge variant="pro" size="sm">Pro</Badge>
                  ) : null}
                  {activeTab === tab.id && !isDisabled && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableTabNav>
      </div>

      <div>
        {activeTab === "income" && <IncomeView />}
        {activeTab === "expenses" && <ExpensesView />}
        {activeTab === "cashflow" && (
          isPremium ? (
            <CashflowView />
          ) : (
            <PremiumUpgradePrompt featureKey="finances_cashflow" />
          )
        )}
        {activeTab === "indexrent" && (
          isPremium ? (
            <IndexRentView />
          ) : (
            <PremiumUpgradePrompt featureKey="finances_indexrent" />
          )
        )}
        {activeTab === "anlage_v" && (
          isPremium ? (
            <AnlageVView />
          ) : (
            <PremiumUpgradePrompt featureKey="finances_anlage_v" />
          )
        )}
        {activeTab === "intelligence" && <IntelligenceView />}
        {activeTab === "bank" && <BankConnectionView />}
      </div>
    </div>
  );
}
