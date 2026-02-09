import { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Check,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  Key,
  Zap,
  Droplet,
  Flame,
  Wind,
  BarChart3,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Button } from '../ui/Button';

interface HandoverProtocolModalProps {
  contractId: string;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}

interface ChecklistItem {
  id: string;
  item: string;
  status: "good" | "damaged" | "missing";
  notes: string;
  photoRefs?: string[];
}

interface PhotoItem {
  id: string;
  file: File | null;
  preview: string;
  description: string;
  tagType: "general" | "checklist" | "meter";
  tagRefId: string;
}

interface MeterReading {
  id: string;
  type: "electricity" | "water" | "heating" | "gas" | "other";
  meterNumber: string;
  reading: string;
  unit: string;
  readingDate: string;
  photoRefs?: string[];
}

interface KeysData {
  aptKeys: number;
  buildingKeys: number;
  mailboxKeys: number;
  cellarKeys: number;
  otherKeys: Array<{ label: string; count: number }>;
  allKeysReceived: boolean;
  missingKeysNote: string;
}

export default function HandoverProtocolModal({
  contractId,
  tenantId,
  onClose,
  onSave,
}: HandoverProtocolModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contextData, setContextData] = useState({
    propertyName: "",
    propertyAddress: "",
    unitName: "",
    squareMeters: "",
    landlordName: "",
    tenantName: "",
    propertyId: "",
    unitId: "",
  });

  const [properties, setProperties] = useState<{ id: string; name: string; address: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; unit_number: string }[]>([]);

  const [formData, setFormData] = useState({
    handover_type: "move_in" as "move_in" | "move_out",
    handover_date: new Date().toISOString().split("T")[0],
    landlordName: "",
    tenantName: "",
    witnessName: "",
    notes: "",
    lastRenovation: "",
    status: "draft" as "draft" | "final",
  });

  const [meters, setMeters] = useState<MeterReading[]>([]);
  const [systemMeters, setSystemMeters] = useState<any[]>([]);
  const [checklistTemplate, setChecklistTemplate] = useState<string>("standard_apartment");

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const [keys, setKeys] = useState<KeysData>({
    aptKeys: 2,
    buildingKeys: 1,
    mailboxKeys: 1,
    cellarKeys: 0,
    otherKeys: [],
    allKeysReceived: true,
    missingKeysNote: "",
  });

  useEffect(() => {
    if (user && contractId && tenantId) {
      loadContextData();
    }
  }, [user, contractId, tenantId]);

  useEffect(() => {
    loadChecklistTemplate(checklistTemplate);
  }, [checklistTemplate]);

  async function loadContextData() {
    try {
      const [tenantRes, propertiesRes, profileRes] = await Promise.all([
        supabase
          .from("tenants")
          .select("first_name, last_name, property_id, unit_id")
          .eq("id", tenantId)
          .maybeSingle(),
        supabase
          .from("properties")
          .select("id, name, street, house_number, postal_code, city")
          .eq("user_id", user!.id)
          .order("name"),
        supabase
          .from("account_profiles")
          .select("first_name, last_name, company_name")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);

      const tenant = tenantRes.data;
      const profile = profileRes.data;

      if (propertiesRes.data) {
        const propertiesData = propertiesRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          address: `${p.street || ""} ${p.house_number || ""}, ${p.postal_code || ""} ${p.city || ""}`.trim(),
        }));
        setProperties(propertiesData);
      }

      if (tenant) {
        let propertyName = "";
        let propertyAddress = "";
        let unitName = "";
        let squareMeters = "";

        if (tenant.property_id) {
          const { data: propertyData } = await supabase
            .from("properties")
            .select("name, street, house_number, postal_code, city")
            .eq("id", tenant.property_id)
            .maybeSingle();

          if (propertyData) {
            propertyName = propertyData.name || "";
            propertyAddress = `${propertyData.street || ""} ${propertyData.house_number || ""}, ${propertyData.postal_code || ""} ${propertyData.city || ""}`.trim();
          }

          await loadUnits(tenant.property_id);

          if (tenant.unit_id) {
            const { data: unitData } = await supabase
              .from("property_units")
              .select("unit_number, square_meters")
              .eq("id", tenant.unit_id)
              .maybeSingle();

            if (unitData) {
              unitName = unitData.unit_number || "";
              squareMeters = unitData.square_meters?.toString() || "";
            }
          }

          loadSystemMeters(tenant.property_id);
        }

        const newContextData = {
          propertyName,
          propertyAddress,
          unitName,
          squareMeters,
          landlordName: profile?.company_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
          tenantName: `${tenant.first_name} ${tenant.last_name}`,
          propertyId: tenant.property_id || "",
          unitId: tenant.unit_id || "",
        };

        setContextData(newContextData);
        setFormData((prev) => ({
          ...prev,
          landlordName: newContextData.landlordName,
          tenantName: newContextData.tenantName,
        }));
      }
    } catch (error) {
      console.error("Error loading context data:", error);
    }
  }

  async function loadUnits(propertyId: string) {
    try {
      const { data } = await supabase
        .from("property_units")
        .select("id, unit_number")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (data) {
        setUnits(data);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  async function loadSystemMeters(propertyId: string) {
    try {
      const { data } = await supabase
        .from("meters")
        .select("*")
        .eq("user_id", user!.id)
        .eq("property_id", propertyId);

      if (data && data.length > 0) {
        setSystemMeters(data);

        const meterReadings: MeterReading[] = data.map((meter) => ({
          id: meter.id,
          type: meter.meter_type as any,
          meterNumber: meter.meter_number || "",
          reading: "",
          unit: meter.meter_type === "electricity" ? "kWh" : "m³",
          readingDate: formData.handover_date,
          photoRefs: [],
        }));

        setMeters(meterReadings);
      }
    } catch (error) {
      console.error("Error loading system meters:", error);
    }
  }

  function loadChecklistTemplate(template: string) {
    const templates = {
      standard_apartment: [
        { id: "1", item: "Wände und Decken", status: "good" as const, notes: "", photoRefs: [] },
        { id: "2", item: "Böden", status: "good" as const, notes: "", photoRefs: [] },
        { id: "3", item: "Fenster und Türen", status: "good" as const, notes: "", photoRefs: [] },
        { id: "4", item: "Sanitäranlagen", status: "good" as const, notes: "", photoRefs: [] },
        { id: "5", item: "Küche und Geräte", status: "good" as const, notes: "", photoRefs: [] },
        { id: "6", item: "Elektrik und Lichtschalter", status: "good" as const, notes: "", photoRefs: [] },
        { id: "7", item: "Heizkörper", status: "good" as const, notes: "", photoRefs: [] },
      ],
      standard_house: [
        { id: "1", item: "Wände und Decken", status: "good" as const, notes: "", photoRefs: [] },
        { id: "2", item: "Böden", status: "good" as const, notes: "", photoRefs: [] },
        { id: "3", item: "Fenster und Türen", status: "good" as const, notes: "", photoRefs: [] },
        { id: "4", item: "Sanitäranlagen", status: "good" as const, notes: "", photoRefs: [] },
        { id: "5", item: "Küche und Geräte", status: "good" as const, notes: "", photoRefs: [] },
        { id: "6", item: "Garten und Außenanlagen", status: "good" as const, notes: "", photoRefs: [] },
        { id: "7", item: "Garage/Stellplatz", status: "good" as const, notes: "", photoRefs: [] },
        { id: "8", item: "Keller", status: "good" as const, notes: "", photoRefs: [] },
        { id: "9", item: "Dach und Dachboden", status: "good" as const, notes: "", photoRefs: [] },
      ],
      minimal: [
        { id: "1", item: "Allgemeiner Zustand", status: "good" as const, notes: "", photoRefs: [] },
        { id: "2", item: "Zählerstände", status: "good" as const, notes: "", photoRefs: [] },
        { id: "3", item: "Schlüsselübergabe", status: "good" as const, notes: "", photoRefs: [] },
      ],
    };

    setChecklist(templates[template as keyof typeof templates] || templates.standard_apartment);
  }

  const addMeter = () => {
    setMeters([
      ...meters,
      {
        id: Date.now().toString(),
        type: "other",
        meterNumber: "",
        reading: "",
        unit: "kWh",
        readingDate: formData.handover_date,
        photoRefs: [],
      },
    ]);
  };

  const removeMeter = (id: string) => {
    setMeters(meters.filter((meter) => meter.id !== id));
  };

  const updateMeter = (id: string, field: keyof MeterReading, value: any) => {
    setMeters(
      meters.map((meter) =>
        meter.id === id ? { ...meter, [field]: value } : meter
      )
    );
  };

  const addChecklistItem = () => {
    setChecklist([
      ...checklist,
      {
        id: Date.now().toString(),
        item: "",
        status: "good",
        notes: "",
        photoRefs: [],
      },
    ]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const updateChecklistItem = (
    id: string,
    field: keyof ChecklistItem,
    value: any
  ) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handlePhotoSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoItem[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      description: "",
      tagType: "general",
      tagRefId: "",
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo?.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const updatePhotoTag = (id: string, tagType: PhotoItem["tagType"], tagRefId: string) => {
    setPhotos(
      photos.map((photo) =>
        photo.id === id ? { ...photo, tagType, tagRefId } : photo
      )
    );
  };

  const updatePhotoDescription = (id: string, description: string) => {
    setPhotos(
      photos.map((photo) =>
        photo.id === id ? { ...photo, description } : photo
      )
    );
  };

  const addOtherKey = () => {
    setKeys({
      ...keys,
      otherKeys: [...keys.otherKeys, { label: "", count: 1 }],
    });
  };

  const removeOtherKey = (index: number) => {
    setKeys({
      ...keys,
      otherKeys: keys.otherKeys.filter((_, i) => i !== index),
    });
  };

  const updateOtherKey = (index: number, field: "label" | "count", value: string | number) => {
    setKeys({
      ...keys,
      otherKeys: keys.otherKeys.map((key, i) =>
        i === index ? { ...key, [field]: value } : key
      ),
    });
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep === 2) {
      const hasInvalidItems = checklist.some(
        (item) => (item.status === "damaged" || item.status === "missing") && !item.notes.trim()
      );

      if (hasInvalidItems) {
        alert("Bitte beschreiben Sie alle beschädigten oder fehlenden Punkte.");
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();

    if (!user) return;

    if (!asDraft && !keys.allKeysReceived && !keys.missingKeysNote.trim()) {
      alert("Bitte geben Sie eine Notiz ein, wenn Schlüssel fehlen.");
      return;
    }

    setLoading(true);

    try {
      const photoData = [];

      for (const photo of photos) {
        if (photo.file) {
          const fileExt = photo.file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user.id}/handover/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, photo.file);

          if (!uploadError) {
            photoData.push({
              path: filePath,
              description: photo.description,
              tagType: photo.tagType,
              tagRefId: photo.tagRefId,
            });
          }
        }
      }

      const { error } = await supabase.from("handover_protocols").insert([
        {
          user_id: user.id,
          contract_id: contractId,
          property_id: contextData.propertyId || null,
          unit_id: contextData.unitId || null,
          landlord_name: formData.landlordName || null,
          tenant_name: formData.tenantName || null,
          witness_name: formData.witnessName || null,
          handover_type: formData.handover_type,
          handover_date: formData.handover_date,
          checklist_template: checklistTemplate,
          checklist_data: checklist,
          meters: meters,
          keys: keys,
          last_renovation: formData.lastRenovation || null,
          photos: photoData,
          notes: formData.notes || null,
          status: asDraft ? "draft" : "final",
          electricity_meter: null,
          water_meter: null,
          heating_meter: null,
        },
      ]);

      if (error) throw error;

      onSave();
    } catch (error) {
      console.error("Error creating handover protocol:", error);
      alert("Fehler beim Erstellen des Protokolls");
    } finally {
      setLoading(false);
    }
  };

  const getMeterIcon = (type: string) => {
    switch (type) {
      case "electricity":
        return <Zap className="w-4 h-4" />;
      case "water":
        return <Droplet className="w-4 h-4" />;
      case "heating":
        return <Flame className="w-4 h-4" />;
      case "gas":
        return <Wind className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Kontext</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Immobilie *
            </label>
            <select
              value={contextData.propertyId}
              onChange={async (e) => {
                const propertyId = e.target.value;
                const selectedProperty = properties.find((p) => p.id === propertyId);

                setContextData((prev) => ({
                  ...prev,
                  propertyId,
                  propertyName: selectedProperty?.name || "",
                  propertyAddress: selectedProperty?.address || "",
                  unitId: "",
                  unitName: "",
                  squareMeters: "",
                }));

                if (propertyId) {
                  await loadUnits(propertyId);
                  loadSystemMeters(propertyId);
                } else {
                  setUnits([]);
                  setMeters([]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              required
            >
              <option value="">-- Immobilie wählen --</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            {contextData.propertyAddress && (
              <p className="text-xs text-gray-600 mt-1">{contextData.propertyAddress}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Einheit
            </label>
            <select
              value={contextData.unitId}
              onChange={async (e) => {
                const unitId = e.target.value;
                const selectedUnit = units.find((u) => u.id === unitId);

                if (unitId && selectedUnit) {
                  const { data: unitData } = await supabase
                    .from("property_units")
                    .select("square_meters")
                    .eq("id", unitId)
                    .maybeSingle();

                  setContextData((prev) => ({
                    ...prev,
                    unitId,
                    unitName: selectedUnit.unit_number,
                    squareMeters: unitData?.square_meters?.toString() || "",
                  }));
                } else {
                  setContextData((prev) => ({
                    ...prev,
                    unitId: "",
                    unitName: "",
                    squareMeters: "",
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              disabled={!contextData.propertyId}
            >
              <option value="">-- Einheit wählen --</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number}
                </option>
              ))}
            </select>
            {contextData.squareMeters && (
              <p className="text-xs text-gray-600 mt-1">{contextData.squareMeters} m²</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-dark mb-3">Grundinformationen</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Art der Übergabe *
            </label>
            <select
              value={formData.handover_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  handover_type: e.target.value as "move_in" | "move_out",
                })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              required
            >
              <option value="move_in">Einzug</option>
              <option value="move_out">Auszug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Datum der Übergabe *
            </label>
            <input
              type="date"
              value={formData.handover_date}
              onChange={(e) =>
                setFormData({ ...formData, handover_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Beteiligte</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Vermieter
            </label>
            <input
              type="text"
              value={formData.landlordName}
              onChange={(e) =>
                setFormData({ ...formData, landlordName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              placeholder="Name des Vermieters"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Mieter
            </label>
            <input
              type="text"
              value={formData.tenantName}
              onChange={(e) =>
                setFormData({ ...formData, tenantName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              placeholder="Name des Mieters"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Zeuge (optional)
          </label>
          <input
            type="text"
            value={formData.witnessName}
            onChange={(e) =>
              setFormData({ ...formData, witnessName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="Name des Zeugen"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-semibold text-gray-700">Zählerstände</h4>
          <button
            type="button"
            onClick={addMeter}
            className="flex items-center gap-1 text-sm text-primary-blue hover:underline"
          >
            <Plus className="w-4 h-4" />
            Zähler hinzufügen
          </button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {meters.map((meter) => (
            <div
              key={meter.id}
              className="p-3 border border-gray-200 rounded-lg space-y-2 bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getMeterIcon(meter.type)}
                  <select
                    value={meter.type}
                    onChange={(e) => updateMeter(meter.id, "type", e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="electricity">Strom</option>
                    <option value="water">Wasser</option>
                    <option value="heating">Heizung</option>
                    <option value="gas">Gas</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeMeter(meter.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Zählernummer
                  </label>
                  <input
                    type="text"
                    value={meter.meterNumber}
                    onChange={(e) =>
                      updateMeter(meter.id, "meterNumber", e.target.value)
                    }
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Stand *
                  </label>
                  <input
                    type="text"
                    value={meter.reading}
                    onChange={(e) =>
                      updateMeter(meter.id, "reading", e.target.value)
                    }
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. 12345"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Einheit
                  </label>
                  <select
                    value={meter.unit}
                    onChange={(e) => updateMeter(meter.id, "unit", e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="kWh">kWh</option>
                    <option value="m³">m³</option>
                    <option value="Einheiten">Einheiten</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Ablesedatum
                  </label>
                  <input
                    type="date"
                    value={meter.readingDate}
                    onChange={(e) =>
                      updateMeter(meter.id, "readingDate", e.target.value)
                    }
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {meters.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            Keine Zähler hinzugefügt. Klicken Sie auf "Zähler hinzufügen", um einen hinzuzufügen.
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark">Checkliste</h3>
        <div className="flex items-center gap-3">
          <select
            value={checklistTemplate}
            onChange={(e) => setChecklistTemplate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="standard_apartment">Standard Wohnung</option>
            <option value="standard_house">Standard Haus</option>
            <option value="minimal">Minimal</option>
          </select>
          <button
            type="button"
            onClick={addChecklistItem}
            className="flex items-center gap-1 text-sm text-primary-blue hover:underline"
          >
            <Plus className="w-4 h-4" />
            Punkt hinzufügen
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="p-3 border border-gray-200 rounded-lg space-y-2"
          >
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={item.item}
                onChange={(e) =>
                  updateChecklistItem(item.id, "item", e.target.value)
                }
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                placeholder="Bezeichnung"
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(item.id)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateChecklistItem(item.id, "status", "good")}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  item.status === "good"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Gut
              </button>
              <button
                type="button"
                onClick={() =>
                  updateChecklistItem(item.id, "status", "damaged")
                }
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  item.status === "damaged"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Beschädigt
              </button>
              <button
                type="button"
                onClick={() =>
                  updateChecklistItem(item.id, "status", "missing")
                }
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  item.status === "missing"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Fehlt
              </button>
            </div>

            <div>
              <input
                type="text"
                value={item.notes}
                onChange={(e) =>
                  updateChecklistItem(item.id, "notes", e.target.value)
                }
                className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-xs ${
                  (item.status === "damaged" || item.status === "missing") && !item.notes.trim()
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200"
                }`}
                placeholder={
                  item.status === "damaged" || item.status === "missing"
                    ? "Bitte Schaden beschreiben (Pflicht)"
                    : "Anmerkungen (optional)"
                }
              />
              {(item.status === "damaged" || item.status === "missing") && !item.notes.trim() && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Kommentar erforderlich bei Schaden/Fehlen
                </p>
              )}
            </div>

            {photos.filter(p => p.tagType === "checklist" && p.tagRefId === item.id).length > 0 && (
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {photos.filter(p => p.tagType === "checklist" && p.tagRefId === item.id).length} Foto(s)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-3">Fotos & Dokumentation</h3>

        <label className="block text-sm font-medium text-gray-400 mb-2">
          Fotos hochladen (optional)
        </label>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handlePhotoSelect(e.target.files)}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-blue hover:text-primary-blue transition-colors flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Fotos auswählen
        </button>

        {photos.length > 0 && (
          <div className="mt-4 space-y-3">
            {photos.map((photo) => (
              <div key={photo.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={photo.description}
                    onChange={(e) =>
                      updatePhotoDescription(photo.id, e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-blue"
                    placeholder="Beschreibung"
                  />
                  <div className="flex gap-2">
                    <select
                      value={photo.tagType}
                      onChange={(e) => {
                        const newType = e.target.value as PhotoItem["tagType"];
                        updatePhotoTag(photo.id, newType, "");
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-blue"
                    >
                      <option value="general">Allgemein</option>
                      <option value="checklist">Checklistenpunkt</option>
                      <option value="meter">Zähler</option>
                    </select>

                    {photo.tagType === "checklist" && (
                      <select
                        value={photo.tagRefId}
                        onChange={(e) =>
                          updatePhotoTag(photo.id, photo.tagType, e.target.value)
                        }
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-blue"
                      >
                        <option value="">Punkt wählen</option>
                        {checklist.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item}
                          </option>
                        ))}
                      </select>
                    )}

                    {photo.tagType === "meter" && (
                      <select
                        value={photo.tagRefId}
                        onChange={(e) =>
                          updatePhotoTag(photo.id, photo.tagType, e.target.value)
                        }
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-blue"
                      >
                        <option value="">Zähler wählen</option>
                        {meters.map((meter) => (
                          <option key={meter.id} value={meter.id}>
                            {getMeterTypeLabel(meter.type)} {meter.meterNumber ? `(${meter.meterNumber})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-5 h-5 text-gray-700" />
          <h4 className="text-md font-semibold text-gray-700">Schlüsselübergabe</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Wohnungsschlüssel
            </label>
            <input
              type="number"
              min="0"
              value={keys.aptKeys}
              onChange={(e) =>
                setKeys({ ...keys, aptKeys: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Haustürschlüssel
            </label>
            <input
              type="number"
              min="0"
              value={keys.buildingKeys}
              onChange={(e) =>
                setKeys({ ...keys, buildingKeys: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Briefkastenschlüssel
            </label>
            <input
              type="number"
              min="0"
              value={keys.mailboxKeys}
              onChange={(e) =>
                setKeys({ ...keys, mailboxKeys: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Kellerschlüssel
            </label>
            <input
              type="number"
              min="0"
              value={keys.cellarKeys}
              onChange={(e) =>
                setKeys({ ...keys, cellarKeys: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-gray-500">
              Sonstige Schlüssel
            </label>
            <button
              type="button"
              onClick={addOtherKey}
              className="text-xs text-primary-blue hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Hinzufügen
            </button>
          </div>

          {keys.otherKeys.map((key, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={key.label}
                onChange={(e) => updateOtherKey(index, "label", e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Bezeichnung"
              />
              <input
                type="number"
                min="0"
                value={key.count}
                onChange={(e) => updateOtherKey(index, "count", parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
              <button
                type="button"
                onClick={() => removeOtherKey(index)}
                className="p-1.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={keys.allKeysReceived}
              onChange={(e) =>
                setKeys({ ...keys, allKeysReceived: e.target.checked })
              }
              className="w-4 h-4 text-primary-blue rounded focus:ring-2 focus:ring-primary-blue"
            />
            <span className="text-sm text-gray-700">
              Alle Schlüssel übergeben
            </span>
          </label>
        </div>

        {!keys.allKeysReceived && (
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">
              Notiz zu fehlenden Schlüsseln *
            </label>
            <textarea
              value={keys.missingKeysNote}
              onChange={(e) =>
                setKeys({ ...keys, missingKeysNote: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              rows={2}
              placeholder="Bitte geben Sie an, welche Schlüssel fehlen..."
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Letzte Renovierung (optional)
        </label>
        <input
          type="text"
          value={formData.lastRenovation}
          onChange={(e) =>
            setFormData({ ...formData, lastRenovation: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder="z.B. 2023 oder 'Vor 2 Jahren'"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Zusätzliche Notizen
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          rows={4}
          placeholder="Sonstige Anmerkungen zum Übergabeprotokoll..."
        />
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: "Grunddaten" },
    { number: 2, title: "Checkliste" },
    { number: 3, title: "Fotos & Notizen" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-dark">
            Neues Übergabeprotokoll
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                    currentStep >= step.number
                      ? "bg-primary-blue text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step.number
                      ? "text-primary-blue"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      currentStep > step.number ? "bg-primary-blue" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <Button type="button" onClick={() => setCurrentStep(currentStep - 1)} variant="secondary">
                Zurück
              </Button>
            )}

            <Button type="button" onClick={onClose} variant="cancel" fullWidth>
              Abbrechen
            </Button>

            {currentStep === 3 && (
              <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} variant="warning" fullWidth>
                {loading ? "Speichern..." : "Als Entwurf speichern"}
              </Button>
            )}

            <Button
              type={currentStep === 3 ? "submit" : "button"}
              onClick={currentStep < 3 ? handleNext : undefined}
              disabled={loading}
              variant="primary"
              fullWidth
            >
              {loading
                ? "Speichern..."
                : currentStep === 3
                  ? "Finalisieren & speichern"
                  : "Weiter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
