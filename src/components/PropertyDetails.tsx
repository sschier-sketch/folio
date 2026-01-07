import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Package,
  Zap,
  FileText,
  Clock,
  Users,
  Wrench,
  BarChart3,
} from "lucide-react";
import PropertyOverviewTab from "./property/PropertyOverviewTab";
import PropertyUnitsTab from "./property/PropertyUnitsTab";
import PropertyEquipmentTab from "./property/PropertyEquipmentTab";
import PropertyDocumentsTab from "./property/PropertyDocumentsTab";
import PropertyHistoryTab from "./property/PropertyHistoryTab";
import PropertyContactsTab from "./property/PropertyContactsTab";
import PropertyMaintenanceTab from "./property/PropertyMaintenanceTab";
import PropertyMetricsTab from "./property/PropertyMetricsTab";

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  property_management_type?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  parking_spot_number?: string;
  description: string;
}

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
  onNavigateToTenant?: (tenantId: string) => void;
}

type Tab =
  | "overview"
  | "units"
  | "equipment"
  | "documents"
  | "history"
  | "contacts"
  | "maintenance"
  | "metrics";

export default function PropertyDetails({ property, onBack, onNavigateToTenant }: PropertyDetailsProps) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || "overview");

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const tabs = [
    { id: "overview" as Tab, label: "Überblick", icon: Home },
    { id: "units" as Tab, label: "Einheiten", icon: Package },
    { id: "equipment" as Tab, label: "Ausstattung & Daten", icon: Zap },
    { id: "history" as Tab, label: "Historie", icon: Clock, isPro: true },
    { id: "documents" as Tab, label: "Dokumente", icon: FileText, isPro: true },
    { id: "contacts" as Tab, label: "Kontakte", icon: Users, isPro: true },
    { id: "maintenance" as Tab, label: "Instandhaltung", icon: Wrench, isPro: true },
    { id: "metrics" as Tab, label: "Kennzahlen", icon: BarChart3, isPro: true },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück zur Übersicht
      </button>

      <div className="bg-white rounded-lg p-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">{property.name}</h1>
          <p className="text-gray-400">{property.address}</p>
        </div>
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
                  {tab.isPro && (
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
        {activeTab === "overview" && <PropertyOverviewTab property={property} onNavigateToTenant={onNavigateToTenant} />}
        {activeTab === "units" && <PropertyUnitsTab propertyId={property.id} />}
        {activeTab === "equipment" && <PropertyEquipmentTab propertyId={property.id} />}
        {activeTab === "documents" && <PropertyDocumentsTab propertyId={property.id} />}
        {activeTab === "history" && <PropertyHistoryTab propertyId={property.id} />}
        {activeTab === "contacts" && <PropertyContactsTab propertyId={property.id} />}
        {activeTab === "maintenance" && (
          <PropertyMaintenanceTab propertyId={property.id} />
        )}
        {activeTab === "metrics" && <PropertyMetricsTab propertyId={property.id} />}
      </div>
    </div>
  );
}
