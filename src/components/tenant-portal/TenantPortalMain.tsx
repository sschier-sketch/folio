import { useState, useEffect } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Gauge,
  Mail,
  User,
  LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import TenantPortalDashboard from "./TenantPortalDashboard";
import TenantPortalDocuments from "./TenantPortalDocuments";
import TenantPortalTickets from "./TenantPortalTickets";
import TenantPortalMeters from "./TenantPortalMeters";
import TenantPortalMessages from "./TenantPortalMessages";
import TenantPortalProfile from "./TenantPortalProfile";

interface TenantData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  property_id: string;
  unit_id: string | null;
  user_id: string;
}

interface TenantPortalMainProps {
  tenantId: string;
  onLogout: () => void;
}

type TabType =
  | "dashboard"
  | "documents"
  | "tickets"
  | "meters"
  | "messages"
  | "profile";

export default function TenantPortalMain({
  tenantId,
  onLogout,
}: TenantPortalMainProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setTenantData(data);
      }
    } catch (error) {
      console.error("Error loading tenant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "documents", label: "Dokumente", icon: FileText },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
    { id: "meters", label: "Zählerstände", icon: Gauge },
    { id: "messages", label: "Nachrichten", icon: Mail },
    { id: "profile", label: "Profil", icon: User },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Mieter nicht gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-dark">Mieterportal</h1>
              <p className="text-sm text-gray-400">{tenantData.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-dark hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-primary-blue/10 text-primary-blue"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === "dashboard" && (
              <TenantPortalDashboard
                tenantId={tenantId}
                onNavigateToTab={(tab) => setActiveTab(tab as TabType)}
              />
            )}
            {activeTab === "documents" && (
              <TenantPortalDocuments
                tenantId={tenantId}
                propertyId={tenantData.property_id}
              />
            )}
            {activeTab === "tickets" && (
              <TenantPortalTickets
                tenantId={tenantId}
                tenantEmail={tenantData.email}
                propertyId={tenantData.property_id}
                userId={tenantData.user_id}
              />
            )}
            {activeTab === "meters" && (
              <TenantPortalMeters
                tenantId={tenantId}
                propertyId={tenantData.property_id}
                unitId={tenantData.unit_id}
              />
            )}
            {activeTab === "messages" && (
              <TenantPortalMessages
                tenantId={tenantId}
                tenantEmail={tenantData.email}
              />
            )}
            {activeTab === "profile" && (
              <TenantPortalProfile
                tenantId={tenantId}
                tenantName={`${tenantData.first_name} ${tenantData.last_name}`}
                tenantEmail={tenantData.email}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
