import { useState, useRef } from "react";
import {
  X,
  Camera,
  Check,
  CheckSquare,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

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
}

interface PhotoItem {
  id: string;
  file: File | null;
  preview: string;
  description: string;
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

  const [formData, setFormData] = useState({
    handover_type: "move_in" as "move_in" | "move_out",
    handover_date: new Date().toISOString().split("T")[0],
    electricity_meter: "",
    water_meter: "",
    heating_meter: "",
    gas_meter: "",
    notes: "",
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "1",
      item: "Wände und Decken",
      status: "good",
      notes: "",
    },
    {
      id: "2",
      item: "Böden",
      status: "good",
      notes: "",
    },
    {
      id: "3",
      item: "Fenster und Türen",
      status: "good",
      notes: "",
    },
    {
      id: "4",
      item: "Sanitäranlagen",
      status: "good",
      notes: "",
    },
    {
      id: "5",
      item: "Küche und Geräte",
      status: "good",
      notes: "",
    },
  ]);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const addChecklistItem = () => {
    setChecklist([
      ...checklist,
      {
        id: Date.now().toString(),
        item: "",
        status: "good",
        notes: "",
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

  const updatePhotoDescription = (id: string, description: string) => {
    setPhotos(
      photos.map((photo) =>
        photo.id === id ? { ...photo, description } : photo
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!user) return;
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
            });
          }
        }
      }

      const { error } = await supabase.from("handover_protocols").insert([
        {
          user_id: user.id,
          contract_id: contractId,
          tenant_id: tenantId,
          handover_type: formData.handover_type,
          handover_date: formData.handover_date,
          electricity_meter: formData.electricity_meter || null,
          water_meter: formData.water_meter || null,
          heating_meter: formData.heating_meter || null,
          gas_meter: formData.gas_meter || null,
          checklist_data: checklist,
          photos: photoData,
          notes: formData.notes || null,
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

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-dark mb-3">
        Grundinformationen
      </h3>

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

      <div className="border-t border-gray-200 pt-4 mt-6">
        <h4 className="text-md font-semibold text-gray-700 mb-3">
          Zählerstände
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Stromzähler
            </label>
            <input
              type="text"
              value={formData.electricity_meter}
              onChange={(e) =>
                setFormData({ ...formData, electricity_meter: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="z.B. 12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Wasserzähler
            </label>
            <input
              type="text"
              value={formData.water_meter}
              onChange={(e) =>
                setFormData({ ...formData, water_meter: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="z.B. 67890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Heizungszähler
            </label>
            <input
              type="text"
              value={formData.heating_meter}
              onChange={(e) =>
                setFormData({ ...formData, heating_meter: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="z.B. 11223"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Gaszähler (optional)
            </label>
            <input
              type="text"
              value={formData.gas_meter}
              onChange={(e) =>
                setFormData({ ...formData, gas_meter: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="z.B. 44556"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark">Checkliste</h3>
        <button
          type="button"
          onClick={addChecklistItem}
          className="flex items-center gap-1 text-sm text-primary-blue hover:underline"
        >
          <Plus className="w-4 h-4" />
          Punkt hinzufügen
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
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

            <input
              type="text"
              value={item.notes}
              onChange={(e) =>
                updateChecklistItem(item.id, "notes", e.target.value)
              }
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-xs"
              placeholder="Anmerkungen (optional)"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-dark mb-3">Fotos & Notizen</h3>

      <div>
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
          <div className="mt-4 grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={photo.description}
                  onChange={(e) =>
                    updatePhotoDescription(photo.id, e.target.value)
                  }
                  className="w-full mt-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-blue"
                  placeholder="Beschreibung"
                />
              </div>
            ))}
          </div>
        )}
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
      <div className="bg-white rounded-md w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-6">
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
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Zurück
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>

            <button
              type={currentStep === 3 ? "submit" : "button"}
              onClick={currentStep < 3 ? () => setCurrentStep(currentStep + 1) : undefined}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading
                ? "Speichern..."
                : currentStep === 3
                  ? "Protokoll erstellen"
                  : "Weiter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
