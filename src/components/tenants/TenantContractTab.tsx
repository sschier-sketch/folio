import { useState, useEffect } from "react";
import { FileText, Upload, Download, Lock, Calendar, Euro, Home } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

interface TenantContractTabProps {
  tenantId: string;
}

interface ContractDocument {
  id: string;
  document_name: string;
  document_type: string;
  version: string;
  file_size: number;
  uploaded_at: string;
}

interface Contract {
  id: string;
  rent_type: string;
  flat_rate_amount: number;
  cold_rent: number;
  total_advance: number;
  operating_costs: number;
  heating_costs: number;
  total_rent: number;
  rent_due_day: number;
  deposit_type: string;
  deposit_amount: number;
  contract_start: string;
  contract_end: string | null;
  is_unlimited: boolean;
  status: string;
}

export default function TenantContractTab({
  tenantId,
}: TenantContractTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (user && tenantId) {
      loadData();
    }
  }, [user, tenantId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: contractData } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractData) setContract(contractData);

      const { data: documentsData } = await supabase
        .from("contract_documents")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("uploaded_at", { ascending: false });

      if (documentsData) setDocuments(documentsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "main_contract":
        return "Hauptvertrag";
      case "amendment":
        return "Nachtrag";
      case "other":
        return "Sonstiges";
      default:
        return type;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getRentTypeLabel = (type: string) => {
    switch (type) {
      case "flat_rate":
        return "Warmmiete (Pauschal)";
      case "cold_rent_advance":
        return "Kaltmiete + Pauschale NK";
      case "cold_rent_utilities_heating":
        return "Kaltmiete + NK + Heizung";
      default:
        return type;
    }
  };

  const getDepositTypeLabel = (type: string) => {
    switch (type) {
      case "none":
        return "Keine Kaution";
      case "cash":
        return "Barkaution";
      case "bank_transfer":
        return "Banküberweisung";
      case "pledged_savings":
        return "Verpfändetes Sparbuch";
      case "bank_guarantee":
        return "Bankbürgschaft";
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-400">Kein Mietvertrag vorhanden</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">
            Premium-Funktion
          </h3>
          <p className="text-gray-600 mb-6">
            Der Upload und die Verwaltung von Vertragsdokumenten ist im
            Pro-Tarif verfügbar. Upgrade jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Upload von Mietverträgen und Nachträgen
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Automatische Versionierung
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Zentrale Dokumentenverwaltung
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Vorbereitung für digitale Signatur
              </span>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            Jetzt upgraden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Vertragsdaten
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary-blue" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mietbeginn</div>
                <div className="font-semibold text-dark">
                  {contract.contract_start
                    ? new Date(contract.contract_start).toLocaleDateString("de-DE")
                    : "-"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Euro className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mietart</div>
                <div className="font-semibold text-dark">
                  {getRentTypeLabel(contract.rent_type)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <Euro className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Gesamtmiete</div>
                <div className="text-2xl font-bold text-dark">
                  {contract.total_rent.toFixed(2)} €
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Fällig am {contract.rent_due_day}. des Monats
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Mietdetails</div>
                {contract.rent_type === "flat_rate" ? (
                  <div className="font-semibold text-dark">
                    Warmmiete: {contract.flat_rate_amount.toFixed(2)} €
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-dark">
                      Kaltmiete: {contract.cold_rent.toFixed(2)} €
                    </div>
                    {contract.rent_type === "cold_rent_advance" && (
                      <div className="text-sm text-gray-600">
                        NK-Pauschale: {contract.total_advance.toFixed(2)} €
                      </div>
                    )}
                    {contract.rent_type === "cold_rent_utilities_heating" && (
                      <>
                        <div className="text-sm text-gray-600">
                          Betriebskosten: {contract.operating_costs.toFixed(2)} €
                        </div>
                        <div className="text-sm text-gray-600">
                          Heizkosten: {contract.heating_costs.toFixed(2)} €
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Kaution</div>
                <div className="font-semibold text-dark">
                  {contract.deposit_amount > 0
                    ? `${contract.deposit_amount.toFixed(2)} €`
                    : "Keine Kaution"}
                </div>
                {contract.deposit_amount > 0 && (
                  <div className="text-sm text-gray-600">
                    {getDepositTypeLabel(contract.deposit_type)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Vertragslaufzeit</div>
                <div className="font-semibold text-dark">
                  {contract.is_unlimited ? (
                    "Unbefristet"
                  ) : contract.contract_end ? (
                    <>
                      Befristet bis{" "}
                      {new Date(contract.contract_end).toLocaleDateString("de-DE")}
                    </>
                  ) : (
                    "Unbefristet"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">
            Vertragsdokumente
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
            <Upload className="w-4 h-4" />
            Dokument hochladen
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Keine Dokumente vorhanden</p>
            <button className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Erstes Dokument hochladen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Dokumentname
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Typ
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Version
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Größe
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Hochgeladen
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {doc.document_name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      v{doc.version}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="text-primary-blue hover:text-primary-blue transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Versionierung:</p>
            <p>
              Alle hochgeladenen Dokumente werden automatisch versioniert. Bei
              Änderungen am Vertrag laden Sie einfach das neue Dokument hoch -
              die alte Version bleibt erhalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
