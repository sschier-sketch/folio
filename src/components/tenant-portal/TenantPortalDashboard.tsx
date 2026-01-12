import { useState, useEffect } from "react";
import { Home, FileText, Wrench, Gauge, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface TenantData {
  tenant_name: string;
  property_name: string;
  property_address: string;
  unit_name: string;
  move_in_date: string;
  move_out_date: string | null;
  rental_area: number | null;
  cold_rent: number;
  operating_costs: number;
  heating_costs: number;
  warm_rent: number;
}

interface TenantPortalDashboardProps {
  tenantId: string;
  onNavigateToTab: (tab: string) => void;
}

export default function TenantPortalDashboard({
  tenantId,
  onNavigateToTab,
}: TenantPortalDashboardProps) {
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDocumentsCount, setNewDocumentsCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    loadTenantData();
    loadNotifications();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select(
          `
          *,
          property:properties(name, address, street, city, zip_code),
          unit:property_units!tenants_unit_id_fkey(unit_number, area_sqm)
        `
        )
        .eq("id", tenantId)
        .maybeSingle();

      if (tenantError) {
        console.error("Error loading tenant:", tenantError);
        throw tenantError;
      }

      if (!tenant) {
        console.error("No tenant found");
        return;
      }

      const { data: contracts, error: contractError } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("contract_start", { ascending: false })
        .limit(1);

      if (contractError) {
        console.error("Error loading contract:", contractError);
      }

      const contract = contracts && contracts.length > 0 ? contracts[0] : null;

      const propertyAddress = tenant.property
        ? `${tenant.property.street || ""}, ${tenant.property.zip_code || ""} ${tenant.property.city || ""}`.trim()
        : tenant.property?.address || "";

      let coldRent = 0;
      let operatingCosts = 0;
      let heatingCosts = 0;

      if (contract) {
        if (contract.rent_type === "flat_rate") {
          coldRent = parseFloat(contract.flat_rate_amount || "0");
          operatingCosts = 0;
          heatingCosts = 0;
        } else if (contract.rent_type === "cold_rent_advance") {
          coldRent = parseFloat(contract.cold_rent || "0");
          operatingCosts = parseFloat(contract.total_advance || "0");
          heatingCosts = 0;
        } else if (contract.rent_type === "cold_rent_utilities_heating") {
          coldRent = parseFloat(contract.cold_rent || "0");
          operatingCosts = parseFloat(contract.operating_costs || "0");
          heatingCosts = parseFloat(contract.heating_costs || "0");
        } else {
          coldRent = parseFloat(contract.cold_rent || contract.base_rent || "0");
          operatingCosts = parseFloat(contract.operating_costs || "0");
          heatingCosts = parseFloat(contract.heating_costs || "0");
        }
      }

      const warmRent = coldRent + operatingCosts + heatingCosts;

      setTenantData({
        tenant_name: `${tenant.first_name} ${tenant.last_name}`,
        property_name: tenant.property?.name || "Keine Immobilie",
        property_address: propertyAddress,
        unit_name: tenant.unit?.unit_number || "Keine Einheit",
        move_in_date: contract?.contract_start || tenant.move_in_date || "",
        move_out_date: contract?.contract_end || tenant.move_out_date || null,
        rental_area: tenant.unit?.area_sqm || null,
        cold_rent: coldRent,
        operating_costs: operatingCosts,
        heating_costs: heatingCosts,
        warm_rent: warmRent,
      });
    } catch (error) {
      console.error("Error loading tenant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: tenant } = await supabase
        .from("tenants")
        .select("property_id, unit_id")
        .eq("id", tenantId)
        .maybeSingle();

      if (tenant) {
        const { data: propertyAssociations } = await supabase
          .from("document_associations")
          .select("document_id")
          .eq("association_type", "property")
          .eq("association_id", tenant.property_id);

        const propertyDocIds = propertyAssociations?.map(a => a.document_id) || [];

        let unitDocIds: string[] = [];
        if (tenant.unit_id) {
          const { data: unitAssociations } = await supabase
            .from("document_associations")
            .select("document_id")
            .eq("association_type", "unit")
            .eq("association_id", tenant.unit_id);

          unitDocIds = unitAssociations?.map(a => a.document_id) || [];
        }

        const allDocIds = [...new Set([...propertyDocIds, ...unitDocIds])];

        if (allDocIds.length > 0) {
          const { data: documents } = await supabase
            .from("documents")
            .select("id")
            .in("id", allDocIds)
            .eq("shared_with_tenant", true)
            .gte("created_at", sevenDaysAgo.toISOString());

          setNewDocumentsCount(documents?.length || 0);
        }
      }

      const { data: tickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "open");

      setOpenTicketsCount(tickets?.length || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Keine Mietdaten gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-dark">
            Meine Mietdaten
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mieter</label>
            <p className="text-dark font-semibold text-lg">{tenantData.tenant_name}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Immobilie</label>
            <p className="text-dark font-semibold text-lg">{tenantData.property_name}</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse</label>
            <p className="text-dark font-semibold text-lg">
              {tenantData.property_address}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Einheit</label>
            <p className="text-dark font-semibold text-lg">{tenantData.unit_name}</p>
          </div>
          {tenantData.rental_area && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mietfläche</label>
              <p className="text-dark font-semibold text-lg">
                {tenantData.rental_area} m²
              </p>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Einzugsdatum</label>
            <p className="text-dark font-semibold text-lg">
              {formatDate(tenantData.move_in_date)}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Auszugsdatum</label>
            <p className="text-dark font-semibold text-lg">
              {tenantData.move_out_date
                ? formatDate(tenantData.move_out_date)
                : "Unbefristet"}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold text-dark mb-4">
            Monatliche Miete
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Kaltmiete</label>
              <p className="text-2xl font-bold text-dark">
                {formatCurrency(tenantData.cold_rent)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Betriebskosten</label>
              <p className="text-2xl font-bold text-dark">
                {formatCurrency(tenantData.operating_costs)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Heizkosten</label>
              <p className="text-2xl font-bold text-dark">
                {formatCurrency(tenantData.heating_costs)}
              </p>
            </div>
            <div className="bg-primary-blue rounded-lg p-5 border border-blue-600">
              <label className="text-xs font-semibold text-blue-100 uppercase tracking-wider block mb-2">Warmmiete</label>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(tenantData.warm_rent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(newDocumentsCount > 0 || openTicketsCount > 0 || unreadMessagesCount > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newDocumentsCount > 0 && (
              <button
                onClick={() => onNavigateToTab("documents")}
                className="relative bg-blue-50 rounded-lg p-6 text-left hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-primary-blue text-white text-sm font-bold px-3 py-1 rounded-full">
                    {newDocumentsCount}
                  </span>
                </div>
                <h3 className="font-bold text-dark text-lg mb-1">Neue Dokumente</h3>
                <p className="text-sm text-gray-600">
                  Sie haben neue Dokumente erhalten
                </p>
              </button>
            )}

            {openTicketsCount > 0 && (
              <button
                onClick={() => onNavigateToTab("tickets")}
                className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 text-left hover:shadow-md transition-all border-2 border-transparent hover:border-amber-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-amber-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {openTicketsCount}
                  </span>
                </div>
                <h3 className="font-bold text-dark text-lg mb-1">Ticket-Updates</h3>
                <p className="text-sm text-gray-600">
                  Ihre Anfragen werden bearbeitet
                </p>
              </button>
            )}

            {unreadMessagesCount > 0 && (
              <button
                onClick={() => onNavigateToTab("messages")}
                className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 text-left hover:shadow-md transition-all border-2 border-transparent hover:border-emerald-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {unreadMessagesCount}
                  </span>
                </div>
                <h3 className="font-bold text-dark text-lg mb-1">Neue Nachrichten</h3>
                <p className="text-sm text-gray-600">
                  Sie haben ungelesene Nachrichten
                </p>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold text-dark mb-4">
          Schnellaktionen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateToTab("tickets")}
            className="group relative overflow-hidden flex items-center gap-4 p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 transition-all"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-dark text-lg mb-1">Schaden melden</h3>
              <p className="text-sm text-gray-600">
                Neue Anfrage erstellen
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab("meters")}
            className="group relative overflow-hidden flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 transition-all"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Gauge className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-dark text-lg mb-1">Zählerstand melden</h3>
              <p className="text-sm text-gray-600">
                Aktuellen Stand übermitteln
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
