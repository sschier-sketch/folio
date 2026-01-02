import { useState, useEffect } from "react";
import { Save, Zap, Droplet, Home as HomeIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface PropertyEquipmentTabProps {
  propertyId: string;
}

export default function PropertyEquipmentTab({ propertyId }: PropertyEquipmentTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    heating_type: "",
    energy_source: "",
    construction_type: "",
    roof_type: "",
    parking_spots: "0",
    elevator: false,
    balcony_terrace: false,
    garden: false,
    basement: false,
    equipment_notes: "",
    special_features: "",
  });

  useEffect(() => {
    if (user) {
      loadEquipment();
    }
  }, [user, propertyId]);

  async function loadEquipment() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_equipment")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setFormData({
          heating_type: data.heating_type || "",
          energy_source: data.energy_source || "",
          construction_type: data.construction_type || "",
          roof_type: data.roof_type || "",
          parking_spots: data.parking_spots?.toString() || "0",
          elevator: data.elevator || false,
          balcony_terrace: data.balcony_terrace || false,
          garden: data.garden || false,
          basement: data.basement || false,
          equipment_notes: data.equipment_notes || "",
          special_features: data.special_features || "",
        });
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const equipmentData = {
        property_id: propertyId,
        user_id: user.id,
        heating_type: formData.heating_type || null,
        energy_source: formData.energy_source || null,
        construction_type: formData.construction_type || null,
        roof_type: formData.roof_type || null,
        parking_spots: parseInt(formData.parking_spots) || 0,
        elevator: formData.elevator,
        balcony_terrace: formData.balcony_terrace,
        garden: formData.garden,
        basement: formData.basement,
        equipment_notes: formData.equipment_notes,
        special_features: formData.special_features,
      };

      const { error } = await supabase
        .from("property_equipment")
        .upsert(equipmentData, { onConflict: "property_id" });

      if (error) throw error;

      alert("Ausstattung erfolgreich gespeichert");
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Fehler beim Speichern der Ausstattung");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">Energie & Heizung</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heizungstyp
            </label>
            <select
              value={formData.heating_type}
              onChange={(e) =>
                setFormData({ ...formData, heating_type: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Bitte wählen</option>
              <option value="gas">Gas</option>
              <option value="oil">Öl</option>
              <option value="district_heating">Fernwärme</option>
              <option value="heat_pump">Wärmepumpe</option>
              <option value="electric">Elektrisch</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Energieart
            </label>
            <select
              value={formData.energy_source}
              onChange={(e) =>
                setFormData({ ...formData, energy_source: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Bitte wählen</option>
              <option value="gas">Gas</option>
              <option value="oil">Öl</option>
              <option value="electricity">Strom</option>
              <option value="solar">Solar</option>
              <option value="district">Fernwärme</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <HomeIcon className="w-6 h-6 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">Bauweise & Konstruktion</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bauweise
            </label>
            <select
              value={formData.construction_type}
              onChange={(e) =>
                setFormData({ ...formData, construction_type: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Bitte wählen</option>
              <option value="solid">Massiv</option>
              <option value="prefab">Fertigbau</option>
              <option value="wood">Holzbau</option>
              <option value="mixed">Gemischt</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dachtyp
            </label>
            <input
              type="text"
              value={formData.roof_type}
              onChange={(e) =>
                setFormData({ ...formData, roof_type: e.target.value })
              }
              placeholder="z.B. Satteldach, Flachdach"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anzahl Stellplätze
            </label>
            <input
              type="number"
              min="0"
              value={formData.parking_spots}
              onChange={(e) =>
                setFormData({ ...formData, parking_spots: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Droplet className="w-6 h-6 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">Ausstattungsmerkmale</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.elevator}
              onChange={(e) =>
                setFormData({ ...formData, elevator: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Aufzug vorhanden</span>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.balcony_terrace}
              onChange={(e) =>
                setFormData({ ...formData, balcony_terrace: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Balkon / Terrasse
            </span>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.garden}
              onChange={(e) =>
                setFormData({ ...formData, garden: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Garten</span>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.basement}
              onChange={(e) =>
                setFormData({ ...formData, basement: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Keller</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Zusätzliche Informationen
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ausstattungsnotizen
            </label>
            <textarea
              value={formData.equipment_notes}
              onChange={(e) =>
                setFormData({ ...formData, equipment_notes: e.target.value })
              }
              rows={3}
              placeholder="Weitere Details zur Ausstattung..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Besonderheiten
            </label>
            <textarea
              value={formData.special_features}
              onChange={(e) =>
                setFormData({ ...formData, special_features: e.target.value })
              }
              rows={3}
              placeholder="Besondere Merkmale der Immobilie..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Diese Daten dienen der Vorbereitung für zukünftige Energie- und
          Verbrauchsauswertungen und sind für alle Nutzer verfügbar.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </form>
  );
}
