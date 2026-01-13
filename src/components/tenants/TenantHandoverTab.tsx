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
import HandoverProtocolModal from "./HandoverProtocolModal";

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
  const [showModal, setShowModal] = useState(false);
  const [expandedProtocolId, setExpandedProtocolId] = useState<string | null>(null);

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
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-dark">
                Übergabeprotokolle
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Dokumentation von Ein- und Auszügen
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={!contractId}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
              <button
                onClick={() => setShowModal(true)}
                disabled={!contractId}
                className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Erstes Protokoll erstellen
              </button>
              {!contractId && (
                <p className="text-xs text-red-500 mt-2">
                  Für diesen Mieter existiert kein Mietvertrag
                </p>
              )}
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
                    <button
                      onClick={() => setExpandedProtocolId(
                        expandedProtocolId === protocol.id ? null : protocol.id
                      )}
                      className="text-primary-blue text-sm font-medium hover:underline"
                    >
                      {expandedProtocolId === protocol.id ? "Weniger anzeigen" : "Details ansehen"}
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

                  {expandedProtocolId === protocol.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-dark mb-3">Vollständige Details</h4>

                      {Array.isArray(protocol.checklist_data) && protocol.checklist_data.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Checkliste</h5>
                          <div className="space-y-2">
                            {protocol.checklist_data.map((item: any, index: number) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <CheckSquare className={`w-4 h-4 mt-0.5 ${
                                  item.status === 'good' ? 'text-emerald-600' :
                                  item.status === 'damaged' ? 'text-amber-600' : 'text-red-600'
                                }`} />
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-dark">{item.item}</div>
                                  {item.notes && (
                                    <div className="text-xs text-gray-600 mt-1">{item.notes}</div>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  item.status === 'good' ? 'bg-emerald-100 text-emerald-700' :
                                  item.status === 'damaged' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.status === 'good' ? 'Gut' :
                                   item.status === 'damaged' ? 'Beschädigt' : 'Fehlt'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(protocol.photos) && protocol.photos.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Fotos</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {protocol.photos.map((photo: any, index: number) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo.preview || photo.url}
                                  alt={photo.description || `Foto ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                {photo.description && (
                                  <div className="mt-1 text-xs text-gray-600">{photo.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6">
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

        {showModal && contractId && (
          <HandoverProtocolModal
            contractId={contractId}
            tenantId={tenantId}
            onClose={() => setShowModal(false)}
            onSave={() => {
              setShowModal(false);
              loadData();
            }}
          />
        )}
      </div>
    </PremiumFeatureGuard>
  );
}
