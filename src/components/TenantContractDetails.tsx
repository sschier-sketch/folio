import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  Wallet,
  User,
  MessageSquare,
  ClipboardList,
  Home,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import TenantOverviewTab from "./tenants/TenantOverviewTab";
import TenantContractTab from "./tenants/TenantContractTab";
import TenantRentHistoryTab from "./tenants/TenantRentHistoryTab";
import TenantDepositTab from "./tenants/TenantDepositTab";
import TenantCommunicationTab from "./tenants/TenantCommunicationTab";
import TenantHandoverTab from "./tenants/TenantHandoverTab";
import ScrollableTabNav from "./common/ScrollableTabNav";
import Badge from "./common/Badge";
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";

type Tab =
  | "overview"
  | "contract"
  | "rent"
  | "deposit"
  | "communication"
  | "handover";

interface TenantContractDetailsProps {
  tenantId: string;
  onBack: () => void;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
}

export default function TenantContractDetails({
  tenantId,
  onBack,
}: TenantContractDetailsProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || "overview");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (user && tenantId) {
      loadTenant();
    }
  }, [user, tenantId]);

  async function loadTenant() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (data) setTenant(data);
    } catch (error) {
      console.error("Error loading tenant:", error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "overview" as Tab, label: "Überblick", icon: Home },
    { id: "rent" as Tab, label: "Miete & Historie", icon: TrendingUp },
    { id: "deposit" as Tab, label: "Kaution", icon: Wallet },
    {
      id: "contract" as Tab,
      label: "Vertrag & Dokumente",
      icon: FileText,
      premium: true
    },
    {
      id: "communication" as Tab,
      label: "Kommunikation",
      icon: MessageSquare,
      premium: true,
    },
    {
      id: "handover" as Tab,
      label: "Übergabe & Wechsel",
      icon: ClipboardList,
      premium: true,
    },
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Mietverhältnis nicht gefunden</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-dark">
            {tenant.name}
          </h1>
          <p className="text-gray-400 mt-1">Mietverhältnis-Details</p>
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
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.premium && (
                    <Badge variant="pro" size="sm">Pro</Badge>
                  )}
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
        {activeTab === "overview" && <TenantOverviewTab tenantId={tenantId} />}
        {activeTab === "contract" && (
          isPremium ? (
            <TenantContractTab tenantId={tenantId} />
          ) : (
            <PremiumUpgradePrompt featureKey="tenant_details_contract" />
          )
        )}
        {activeTab === "rent" && <TenantRentHistoryTab tenantId={tenantId} />}
        {activeTab === "deposit" && <TenantDepositTab tenantId={tenantId} />}
        {activeTab === "communication" && (
          isPremium ? (
            <TenantCommunicationTab tenantId={tenantId} />
          ) : (
            <PremiumUpgradePrompt featureKey="tenant_details_communication" />
          )
        )}
        {activeTab === "handover" && (
          isPremium ? (
            <TenantHandoverTab tenantId={tenantId} />
          ) : (
            <PremiumUpgradePrompt featureKey="tenant_details_handover" />
          )
        )}
      </div>
    </div>
  );
}
