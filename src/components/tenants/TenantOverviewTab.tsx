import { useState, useEffect } from "react";
import {
  Home,
  User,
  Calendar,
  DollarSign,
  Wallet,
  CheckCircle,
  Edit,
  Plus,
  X,
  FileText,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface TenantOverviewTabProps {
  tenantId: string;
}

interface Contract {
  id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  utilities_advance: number;
  deposit_amount: number;
  deposit_status: string;
  status: string;
}

interface Tenant {
  id: string;
  name: string;
  property_id: string;
}

interface Property {
  name: string;
  address: string;
}

export default function TenantOverviewTab({
  tenantId,
}: TenantOverviewTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    start_date: "",
    end_date: "",
    monthly_rent: "",
    utilities_advance: "",
    deposit_amount: "",
    contract_type: "unlimited",
  });

  useEffect(() => {
    if (user && tenantId) {
      loadData();
    }
  }, [user, tenantId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (tenantData) {
        setTenant(tenantData);

        const { data: propertyData } = await supabase
          .from("properties")
          .select("name, address")
          .eq("id", tenantData.property_id)
          .single();

        if (propertyData) setProperty(propertyData);

        const { data: contractData } = await supabase
          .from("rental_contracts")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractData) setContract(contractData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!contract) return;

    try {
      const { error } = await supabase
        .from("rental_contracts")
        .update({ status: newStatus })
        .eq("id", contract.id);

      if (!error) {
        setContract({ ...contract, status: newStatus });
        setShowEditStatus(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  async function handleDeleteContract() {
    if (!contract) return;

    if (
      !confirm(
        "Möchten Sie dieses Mietverhältnis wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    try {
      const { error: updateTenantError } = await supabase
        .from("tenants")
        .update({ contract_id: null })
        .eq("id", tenantId);

      if (updateTenantError) throw updateTenantError;

      const { error: deleteError } = await supabase
        .from("rental_contracts")
        .delete()
        .eq("id", contract.id);

      if (deleteError) throw deleteError;

      setContract(null);
      alert("Mietverhältnis erfolgreich gelöscht");
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Fehler beim Löschen des Mietverhältnisses");
    }
  }

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !tenant) return;

    setSavingContract(true);
    try {
      const monthlyRent = parseFloat(contractForm.monthly_rent) || 0;
      const utilitiesAdvance = parseFloat(contractForm.utilities_advance) || 0;
      const depositAmount = parseFloat(contractForm.deposit_amount) || 0;

      const { data: newContract, error } = await supabase
        .from("rental_contracts")
        .insert([
          {
            tenant_id: tenantId,
            property_id: tenant.property_id,
            user_id: user.id,
            start_date: contractForm.start_date,
            end_date: contractForm.end_date || null,
            monthly_rent: monthlyRent,
            base_rent: monthlyRent,
            utilities_advance: utilitiesAdvance,
            additional_costs: utilitiesAdvance,
            total_rent: monthlyRent + utilitiesAdvance,
            deposit_amount: depositAmount,
            deposit: depositAmount,
            deposit_status: depositAmount > 0 ? "open" : "complete",
            contract_type: contractForm.contract_type,
            contract_start: contractForm.start_date,
            contract_end: contractForm.end_date || null,
            status: "active",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (newContract) {
        await supabase
          .from("tenants")
          .update({ contract_id: newContract.id })
          .eq("id", tenantId);
      }

      setShowCreateContract(false);
      loadData();
    } catch (error) {
      console.error("Error creating contract:", error);
      alert("Fehler beim Erstellen des Vertrags");
    } finally {
      setSavingContract(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "ending_soon":
        return "bg-amber-100 text-amber-700";
      case "terminated":
        return "bg-red-100 text-red-700";
      case "vacant":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "ending_soon":
        return "Endet bald";
      case "terminated":
        return "Gekündigt";
      case "vacant":
        return "Leer";
      default:
        return status;
    }
  };

  const getDepositStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Offen";
      case "partial":
        return "Teilweise";
      case "complete":
        return "Vollständig";
      case "returned":
        return "Zurückgezahlt";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!contract) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary-blue" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">
            Kein Mietvertrag vorhanden
          </h3>
          <p className="text-gray-400 mb-6">
            Erstellen Sie einen Mietvertrag, um alle Funktionen nutzen zu können
          </p>
          <button
            onClick={() => setShowCreateContract(true)}
            className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Mietvertrag erstellen
          </button>
        </div>

        {showCreateContract && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-dark">
                  Mietvertrag erstellen
                </h2>
                <button
                  onClick={() => setShowCreateContract(false)}
                  className="text-gray-300 hover:text-gray-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Mietbeginn *
                    </label>
                    <input
                      type="date"
                      value={contractForm.start_date}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Mietende (optional)
                    </label>
                    <input
                      type="date"
                      value={contractForm.end_date}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          end_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kaltmiete (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={contractForm.monthly_rent}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          monthly_rent: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Nebenkosten (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={contractForm.utilities_advance}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          utilities_advance: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kaution (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={contractForm.deposit_amount}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          deposit_amount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Vertragsart
                    </label>
                    <select
                      value={contractForm.contract_type}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          contract_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="unlimited">Unbefristet</option>
                      <option value="limited">Befristet</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Gesamtmiete:</strong>{" "}
                    {(
                      (parseFloat(contractForm.monthly_rent) || 0) +
                      (parseFloat(contractForm.utilities_advance) || 0)
                    ).toFixed(2)}{" "}
                    € / Monat
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateContract(false)}
                    className="flex-1 px-4 py-2 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={savingContract}
                    className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
                  >
                    {savingContract ? "Erstelle..." : "Vertrag erstellen"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">
            Mietverhältnis-Übersicht
          </h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Edit className="w-4 h-4" />
              Bearbeiten
            </button>
            <button
              onClick={handleDeleteContract}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Einheit</div>
                <div className="font-semibold text-dark">
                  {property?.name || "Unbekannt"}
                </div>
                <div className="text-sm text-gray-600">
                  {property?.address || ""}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mieter</div>
                <div className="font-semibold text-dark">
                  {tenant?.name || "Unbekannt"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">
                  Vertragsstatus
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      contract.status
                    )}`}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                  <button
                    onClick={() => setShowEditStatus(true)}
                    className="text-xs text-primary-blue hover:underline"
                  >
                    Ändern
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mietbeginn</div>
                <div className="font-semibold text-dark">
                  {new Date(contract.start_date).toLocaleDateString("de-DE")}
                </div>
                {contract.end_date && (
                  <div className="text-sm text-gray-600 mt-1">
                    Ende: {new Date(contract.end_date).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Kaltmiete</div>
                <div className="font-semibold text-dark">
                  {contract.monthly_rent.toFixed(2)} € / Monat
                </div>
                {contract.utilities_advance > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Nebenkosten: +{contract.utilities_advance.toFixed(2)} €
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Kaution</div>
                <div className="font-semibold text-dark">
                  {contract.deposit_amount?.toFixed(2) || "0.00"} €
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Status: {getDepositStatusLabel(contract.deposit_status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Status ändern
            </h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleStatusChange("active")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Aktiv</div>
                <div className="text-sm text-gray-400">
                  Mietverhältnis läuft normal
                </div>
              </button>

              <button
                onClick={() => handleStatusChange("ending_soon")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Endet bald</div>
                <div className="text-sm text-gray-400">
                  Mietvertrag läuft demnächst aus
                </div>
              </button>

              <button
                onClick={() => handleStatusChange("terminated")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Gekündigt</div>
                <div className="text-sm text-gray-400">
                  Mietvertrag wurde gekündigt
                </div>
              </button>

              <button
                onClick={() => handleStatusChange("vacant")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-blue transition-colors"
              >
                <div className="font-semibold text-dark">Leer</div>
                <div className="text-sm text-gray-400">
                  Einheit ist nicht vermietet
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowEditStatus(false)}
              className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
