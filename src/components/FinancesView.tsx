import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  CreditCard,
  Bell,
  Lightbulb,
  Calculator,
} from "lucide-react";
import IncomeView from "./finances/IncomeView";
import ExpensesView from "./finances/ExpensesView";
import CashflowView from "./finances/CashflowView";
import ReceiptsView from "./finances/ReceiptsView";
import BankConnectionView from "./finances/BankConnectionView";
import DunningView from "./finances/DunningView";
import IntelligenceView from "./finances/IntelligenceView";
import IndexRentView from "./finances/IndexRentView";

type Tab =
  | "income"
  | "expenses"
  | "cashflow"
  | "receipts"
  | "indexrent"
  | "bank"
  | "dunning"
  | "intelligence";

export default function FinancesView() {
  const [activeTab, setActiveTab] = useState<Tab>("income");

  const tabs = [
    { id: "income" as Tab, label: "Einnahmen", icon: TrendingUp },
    { id: "expenses" as Tab, label: "Ausgaben", icon: TrendingDown },
    { id: "cashflow" as Tab, label: "Cashflow", icon: BarChart3 },
    { id: "receipts" as Tab, label: "Belege & Buchungen", icon: Receipt },
    { id: "indexrent" as Tab, label: "Indexmiete", icon: Calculator },
    { id: "bank" as Tab, label: "Bankanbindung", icon: CreditCard, premium: true },
    { id: "dunning" as Tab, label: "Mahnwesen", icon: Bell, premium: true },
    { id: "intelligence" as Tab, label: "Intelligenz", icon: Lightbulb, premium: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Finanzen</h1>
        <p className="text-gray-400 mt-1">
          Verwalten Sie Ihre Einnahmen, Ausgaben und den Cashflow
        </p>
      </div>

      <div className="border-b border-gray-200">
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
        {activeTab === "income" && <IncomeView />}
        {activeTab === "expenses" && <ExpensesView />}
        {activeTab === "cashflow" && <CashflowView />}
        {activeTab === "receipts" && <ReceiptsView />}
        {activeTab === "indexrent" && <IndexRentView />}
        {activeTab === "bank" && <BankConnectionView />}
        {activeTab === "dunning" && <DunningView />}
        {activeTab === "intelligence" && <IntelligenceView />}
      </div>
    </div>
  );
}
