import { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Calendar,
  Image,
  CheckSquare,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";

interface TenantHandoverTabProps {
  tenantId: string;
}

interface HandoverProtocol {
  id: string;
  handover_type: string;
  handover_date: string;
  electricity_meter: string;
  water_meter: string;
  heating_meter: string;
  checklist_data: any;
  photos: any;
  notes: string;
  created_at: string;
}

export default function TenantHandoverTab({
  tenantId,
}: TenantHandoverTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [protocols, setProtocols] = useState<HandoverProtocol[]>([]);
  const [contractId, setContractId] = useState<string | null>(null);

  useEffect(() => {
    if (user && tenantId && isPremium) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, tenantId, isPremium]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: contractData } = await supabase
        .from("rental_contracts")
        .select("id")
        .eq("tenant_id", tenantId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractData) {
        setContractId(contractData.id);

        const { data: protocolsData } = await supabase
          .from("handover_protocols")
          .select("*")
          .eq("contract_id", contractData.id)
          .order("handover_date", { ascending: false });

        if (protocolsData) setProtocols(protocolsData);
      }
    } catch (error) {
      console.error("Error loading handover protocols:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "move_in":
        return "Einzug";
      case "move_out":
        return "Auszug";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "move_in":
        return "bg-emerald-100 text-emerald-700";
      case "move_out":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <PremiumFeatureGuard featureName="Übergabeprotokolle">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Übergabeprotokolle
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Dokumentation von Ein- und Auszügen
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              <Plus className="w-4 h-4" />
              Neues Protokoll
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Lädt...</div>
          ) : protocols.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Keine Übergabeprotokolle vorhanden
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Erstellen Sie Protokolle für Ein- und Auszüge mit Zählerständen,
                Checklisten und Fotos
              </p>
              <button className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
                Erstes Protokoll erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {protocols.map((protocol) => (
                <div key={protocol.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getTypeColor(
                            protocol.handover_type
                          )}`}
                        >
                          {getTypeLabel(protocol.handover_type)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(protocol.handover_date).toLocaleDateString(
                            "de-DE"
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Erstellt am:{" "}
                        {new Date(protocol.created_at).toLocaleDateString(
                          "de-DE"
                        )}
                      </div>
                    </div>
                    <button className="text-primary-blue text-sm font-medium hover:underline">
                      Details ansehen
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        Stromzähler
                      </div>
                      <div className="font-medium text-dark">
                        {protocol.electricity_meter || "-"}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        Wasserzähler
                      </div>
                      <div className="font-medium text-dark">
                        {protocol.water_meter || "-"}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        Heizungszähler
                      </div>
                      <div className="font-medium text-dark">
                        {protocol.heating_meter || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {Array.isArray(protocol.checklist_data) &&
                      protocol.checklist_data.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-4 h-4" />
                          <span>
                            {protocol.checklist_data.length} Checkpunkte
                          </span>
                        </div>
                      )}
                    {Array.isArray(protocol.photos) &&
                      protocol.photos.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          <span>{protocol.photos.length} Fotos</span>
                        </div>
                      )}
                  </div>

                  {protocol.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Notizen</div>
                      <div className="text-sm text-gray-700">
                        {protocol.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Funktionen der Übergabeprotokolle
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-primary-blue" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Zählerstände erfassen
                </h4>
                <p className="text-sm text-gray-600">
                  Dokumentieren Sie Strom-, Wasser- und Heizungszähler bei Ein-
                  und Auszug digital.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Digitale Checkliste
                </h4>
                <p className="text-sm text-gray-600">
                  Nutzen Sie vordefinierte oder eigene Checklisten für die
                  Wohnungsübergabe.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <Image className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">Foto-Upload</h4>
                <p className="text-sm text-gray-600">
                  Laden Sie Fotos vom Zustand der Wohnung hoch und ordnen Sie
                  diese dem Protokoll zu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark mb-1">
                  Historische Protokolle
                </h4>
                <p className="text-sm text-gray-600">
                  Alle Übergabeprotokolle bleiben dauerhaft einsehbar und
                  können verglichen werden.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-primary-blue mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Rechtssicher dokumentieren:</p>
              <p>
                Übergabeprotokolle dienen als rechtliche Absicherung bei
                Streitigkeiten über den Wohnungszustand. Alle Protokolle werden
                mit Zeitstempel versehen und können als PDF exportiert werden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
}
