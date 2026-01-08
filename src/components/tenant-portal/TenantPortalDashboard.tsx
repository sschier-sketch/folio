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
          property:properties(name, address, street, house_number, city, zip),
          unit:property_units!tenants_unit_id_fkey(name, rental_area)
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
        ? `${tenant.property.street || ""} ${tenant.property.house_number || ""}, ${tenant.property.zip || ""} ${tenant.property.city || ""}`
        : tenant.property?.address || "";

      setTenantData({
        tenant_name: `${tenant.first_name} ${tenant.last_name}`,
        property_name: tenant.property?.name || "Keine Immobilie",
        property_address: propertyAddress,
        unit_name: tenant.unit?.name || "Keine Einheit",
        move_in_date: contract?.contract_start || tenant.move_in_date || "",
        move_out_date: contract?.contract_end || tenant.move_out_date || null,
        rental_area: tenant.unit?.rental_area || null,
        cold_rent: parseFloat(contract?.cold_rent || contract?.base_rent || "0"),
        operating_costs: parseFloat(contract?.operating_costs || "0"),
        heating_costs: parseFloat(contract?.heating_costs || "0"),
        warm_rent: parseFloat(contract?.total_rent || contract?.warm_rent || "0"),
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
          <Home className="w-5 h-5" />
          Meine Mietdaten
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Mieter</label>
            <p className="text-dark font-medium">{tenantData.tenant_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Immobilie</label>
            <p className="text-dark font-medium">{tenantData.property_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Adresse</label>
            <p className="text-dark font-medium">
              {tenantData.property_address}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Einheit</label>
            <p className="text-dark font-medium">{tenantData.unit_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Einzugsdatum</label>
            <p className="text-dark font-medium">
              {formatDate(tenantData.move_in_date)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Auszugsdatum</label>
            <p className="text-dark font-medium">
              {tenantData.move_out_date
                ? formatDate(tenantData.move_out_date)
                : "Unbefristet"}
            </p>
          </div>
          {tenantData.rental_area && (
            <div>
              <label className="text-sm text-gray-400">Mietfläche</label>
              <p className="text-dark font-medium">
                {tenantData.rental_area} m²
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Monatliche Miete
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-gray-400">Kaltmiete</label>
              <p className="text-xl font-bold text-dark">
                {formatCurrency(tenantData.cold_rent)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-gray-400">Betriebskosten</label>
              <p className="text-xl font-bold text-dark">
                {formatCurrency(tenantData.operating_costs)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-gray-400">Heizkosten</label>
              <p className="text-xl font-bold text-dark">
                {formatCurrency(tenantData.heating_costs)}
              </p>
            </div>
            <div className="bg-primary-blue/10 rounded-lg p-4">
              <label className="text-sm text-primary-blue">Warmmiete</label>
              <p className="text-xl font-bold text-primary-blue">
                {formatCurrency(tenantData.warm_rent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {newDocumentsCount > 0 && (
          <button
            onClick={() => onNavigateToTab("documents")}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-primary-blue" />
              <span className="bg-primary-blue text-white text-xs font-bold px-2 py-1 rounded-full">
                {newDocumentsCount}
              </span>
            </div>
            <h3 className="font-semibold text-dark">Neue Dokumente</h3>
            <p className="text-sm text-gray-400 mt-1">
              Sie haben neue Dokumente erhalten
            </p>
          </button>
        )}

        {openTicketsCount > 0 && (
          <button
            onClick={() => onNavigateToTab("tickets")}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Wrench className="w-8 h-8 text-amber-600" />
              <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {openTicketsCount}
              </span>
            </div>
            <h3 className="font-semibold text-dark">Offene Tickets</h3>
            <p className="text-sm text-gray-400 mt-1">
              Ihre Anfragen werden bearbeitet
            </p>
          </button>
        )}

        {unreadMessagesCount > 0 && (
          <button
            onClick={() => onNavigateToTab("messages")}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-emerald-600" />
              <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadMessagesCount}
              </span>
            </div>
            <h3 className="font-semibold text-dark">Neue Nachrichten</h3>
            <p className="text-sm text-gray-400 mt-1">
              Sie haben ungelesene Nachrichten
            </p>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark mb-4">
          Schnellaktionen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateToTab("tickets")}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-blue hover:bg-primary-blue/5 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-dark">Schaden melden</h3>
              <p className="text-sm text-gray-400">
                Neue Anfrage erstellen
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab("meters")}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-blue hover:bg-primary-blue/5 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gauge className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-dark">Zählerstand melden</h3>
              <p className="text-sm text-gray-400">
                Aktuellen Stand übermitteln
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
