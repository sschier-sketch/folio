import { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Calendar,
  Image,
  CheckSquare,
  Lock,
  Download,
  Key,
  Zap,
  Droplet,
  Flame,
  Wind,
  BarChart3,
  User,
  MapPin,
  Trash2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumFeatureGuard } from "../PremiumFeatureGuard";
import HandoverProtocolModal from "./HandoverProtocolModal";
import { generateHandoverPDF } from "../../lib/handoverPdfExport";

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
  landlord_name?: string;
  tenant_name?: string;
  witness_name?: string;
  property_id?: string;
  unit_id?: string;
  checklist_data: any;
  checklist_template?: string;
  meters?: any[];
  keys?: any;
  last_renovation?: string;
  photos: any;
  notes: string;
  status?: string;
  created_at: string;
  updated_at?: string;
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

        if (protocolsData) {
          const protocolsWithUrls = await Promise.all(
            protocolsData.map(async (protocol) => {
              if (Array.isArray(protocol.photos) && protocol.photos.length > 0) {
                const photosWithUrls = await Promise.all(
                  protocol.photos.map(async (photo: any) => {
                    if (photo.path) {
                      const { data: urlData } = await supabase.storage
                        .from("documents")
                        .createSignedUrl(photo.path, 3600);

                      return {
                        ...photo,
                        url: urlData?.signedUrl || null,
                      };
                    }
                    return photo;
                  })
                );
                return { ...protocol, photos: photosWithUrls };
              }
              return protocol;
            })
          );
          setProtocols(protocolsWithUrls);
        }
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

  const getMeterIcon = (type: string) => {
    switch (type) {
      case "electricity":
        return <Zap className="w-4 h-4 text-amber-600" />;
      case "water":
        return <Droplet className="w-4 h-4 text-blue-600" />;
      case "heating":
        return <Flame className="w-4 h-4 text-red-600" />;
      case "gas":
        return <Wind className="w-4 h-4 text-gray-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMeterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      electricity: "Strom",
      water: "Wasser",
      heating: "Heizung",
      gas: "Gas",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const handleDownloadPDF = async (protocol: HandoverProtocol) => {
    try {
      let propertyData = {
        name: "",
        address: "",
        unitName: "",
        squareMeters: "",
      };

      if (protocol.property_id) {
        const { data: property } = await supabase
          .from("properties")
          .select("name, street, house_number, postal_code, city")
          .eq("id", protocol.property_id)
          .maybeSingle();

        if (property) {
          propertyData.name = property.name || "";
          propertyData.address = `${property.street || ""} ${property.house_number || ""}, ${property.postal_code || ""} ${property.city || ""}`;
        }
      }

      if (protocol.unit_id) {
        const { data: unit } = await supabase
          .from("property_units")
          .select("unit_number, square_meters")
          .eq("id", protocol.unit_id)
          .maybeSingle();

        if (unit) {
          propertyData.unitName = unit.unit_number || "";
          propertyData.squareMeters = unit.square_meters?.toString() || "";
        }
      }

      await generateHandoverPDF(protocol, propertyData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Fehler beim Erstellen des PDFs");
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    try {
      const protocol = protocols.find((p) => p.id === protocolId);

      if (protocol && Array.isArray(protocol.photos)) {
        for (const photo of protocol.photos) {
          if (photo.path) {
            await supabase.storage.from("documents").remove([photo.path]);
          }
        }
      }

      const { error } = await supabase
        .from("handover_protocols")
        .delete()
        .eq("id", protocolId);

      if (error) throw error;

      setDeleteConfirmId(null);
      loadData();
    } catch (error) {
      console.error("Error deleting protocol:", error);
      alert("Fehler beim Löschen des Protokolls");
    }
  };

  const handleFinalizeProtocol = async (protocolId: string) => {
    try {
      const { error } = await supabase
        .from("handover_protocols")
        .update({ status: "final" })
        .eq("id", protocolId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error("Error finalizing protocol:", error);
      alert("Fehler beim Finalisieren des Protokolls");
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
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
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
                        {protocol.status && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              protocol.status === "final"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {protocol.status === "final" ? "Finalisiert" : "Entwurf"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        Erstellt am:{" "}
                        {new Date(protocol.created_at).toLocaleDateString(
                          "de-DE"
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {protocol.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleFinalizeProtocol(protocol.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Finalisieren
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(protocol.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Löschen
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(protocol)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-blue text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => setExpandedProtocolId(
                          expandedProtocolId === protocol.id ? null : protocol.id
                        )}
                        className="text-primary-blue text-sm font-medium hover:underline"
                      >
                        {expandedProtocolId === protocol.id ? "Weniger anzeigen" : "Details ansehen"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {(() => {
                      const electricityMeter = Array.isArray(protocol.meters)
                        ? protocol.meters.find((m: any) => m.type === "electricity")
                        : null;
                      const waterMeter = Array.isArray(protocol.meters)
                        ? protocol.meters.find((m: any) => m.type === "water")
                        : null;
                      const heatingMeter = Array.isArray(protocol.meters)
                        ? protocol.meters.find((m: any) => m.type === "heating" || m.type === "heizung")
                        : null;

                      return (
                        <>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">
                              Stromzähler
                            </div>
                            <div className="font-medium text-dark">
                              {electricityMeter?.reading
                                ? `${electricityMeter.reading} ${electricityMeter.unit}`
                                : protocol.electricity_meter || "-"}
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">
                              Wasserzähler
                            </div>
                            <div className="font-medium text-dark">
                              {waterMeter?.reading
                                ? `${waterMeter.reading} ${waterMeter.unit}`
                                : protocol.water_meter || "-"}
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">
                              Heizungszähler
                            </div>
                            <div className="font-medium text-dark">
                              {heatingMeter?.reading
                                ? `${heatingMeter.reading} ${heatingMeter.unit}`
                                : protocol.heating_meter || "-"}
                            </div>
                          </div>
                        </>
                      );
                    })()}
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
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
                      <h4 className="font-semibold text-dark mb-3">Vollständige Details</h4>

                      {(protocol.landlord_name || protocol.tenant_name || protocol.witness_name) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-gray-700" />
                            <h5 className="text-sm font-semibold text-gray-700">Beteiligte</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {protocol.landlord_name && (
                              <div>
                                <span className="text-gray-500">Vermieter:</span>
                                <p className="font-medium text-gray-800">{protocol.landlord_name}</p>
                              </div>
                            )}
                            {protocol.tenant_name && (
                              <div>
                                <span className="text-gray-500">Mieter:</span>
                                <p className="font-medium text-gray-800">{protocol.tenant_name}</p>
                              </div>
                            )}
                            {protocol.witness_name && (
                              <div>
                                <span className="text-gray-500">Zeuge:</span>
                                <p className="font-medium text-gray-800">{protocol.witness_name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {Array.isArray(protocol.meters) && protocol.meters.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">Zählerstände</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {protocol.meters.map((meter: any, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  {getMeterIcon(meter.type)}
                                  <span className="font-medium text-sm text-dark">
                                    {getMeterTypeLabel(meter.type)}
                                  </span>
                                  {meter.meterNumber && (
                                    <span className="text-xs text-gray-500">
                                      ({meter.meterNumber})
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold">{meter.reading}</span> {meter.unit}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(meter.readingDate).toLocaleDateString("de-DE")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(protocol.checklist_data) && protocol.checklist_data.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">Checkliste</h5>
                          {protocol.checklist_template && (
                            <div className="text-xs text-gray-500 mb-2">
                              Vorlage: {protocol.checklist_template === "standard_apartment" ? "Standard Wohnung" :
                                       protocol.checklist_template === "standard_house" ? "Standard Haus" : "Minimal"}
                            </div>
                          )}
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
                                <span className={`text-xs px-3 py-1 rounded-full ${
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

                      {protocol.keys && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Key className="w-4 h-4 text-gray-700" />
                            <h5 className="text-sm font-semibold text-gray-700">Schlüsselübergabe</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Wohnungsschlüssel:</span>
                              <p className="font-medium text-gray-800">{protocol.keys.aptKeys || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Haustürschlüssel:</span>
                              <p className="font-medium text-gray-800">{protocol.keys.buildingKeys || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Briefkastenschlüssel:</span>
                              <p className="font-medium text-gray-800">{protocol.keys.mailboxKeys || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Kellerschlüssel:</span>
                              <p className="font-medium text-gray-800">{protocol.keys.cellarKeys || 0}</p>
                            </div>
                          </div>
                          {Array.isArray(protocol.keys.otherKeys) && protocol.keys.otherKeys.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-xs text-gray-500 block mb-2">Sonstige Schlüssel:</span>
                              {protocol.keys.otherKeys.map((key: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-700">{key.label}</span>
                                  <span className="font-medium text-gray-800">{key.count}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {!protocol.keys.allKeysReceived && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-amber-700 text-sm mb-1">
                                <span className="font-medium">Fehlende Schlüssel</span>
                              </div>
                              <p className="text-xs text-gray-600">{protocol.keys.missingKeysNote}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {protocol.last_renovation && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Letzte Renovierung</div>
                          <div className="text-sm font-medium text-gray-800">{protocol.last_renovation}</div>
                        </div>
                      )}

                      {Array.isArray(protocol.photos) && protocol.photos.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">Fotos</h5>
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
                                {photo.tagType && photo.tagType !== "general" && (
                                  <div className="mt-1">
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                      {photo.tagType === "checklist" ? "Checklist" : "Zähler"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {protocol.updated_at && protocol.updated_at !== protocol.created_at && (
                        <div className="text-xs text-gray-400 pt-3 border-t border-gray-200">
                          Zuletzt bearbeitet am: {new Date(protocol.updated_at).toLocaleDateString("de-DE")}
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
                  Nutzen Sie vordefinierte Checklisten für die
                  Wohnungsüber- und Rückgabe.
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
                  Alle Übergabeprotokolle bleiben dauerhaft einsehbar.
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

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark mb-1">
                    Protokoll löschen?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Möchten Sie diesen Entwurf wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleDeleteProtocol(deleteConfirmId)}
                  className="px-4 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PremiumFeatureGuard>
  );
}
