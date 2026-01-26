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
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    heating_type: "",
    energy_source: "",
    construction_type: "",
    roof_type: "",
    parking_spots: "0",
    parking_type: "",
    elevator: false,
    balcony_terrace: false,
    garden: false,
    basement: false,
    fitted_kitchen: false,
    wg_suitable: false,
    barrier_free: false,
    furnished: false,
    condition: "",
    flooring: "",
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
        const equipmentData = {
          heating_type: data.heating_type || "",
          energy_source: data.energy_source || "",
          construction_type: data.construction_type || "",
          roof_type: data.roof_type || "",
          parking_spots: data.parking_spots?.toString() || "0",
          parking_type: data.parking_type || "",
          elevator: data.elevator || false,
          balcony_terrace: data.balcony_terrace || false,
          garden: data.garden || false,
          basement: data.basement || false,
          fitted_kitchen: data.fitted_kitchen || false,
          wg_suitable: data.wg_suitable || false,
          barrier_free: data.barrier_free || false,
          furnished: data.furnished || false,
          condition: data.condition || "",
          flooring: data.flooring || "",
          equipment_notes: data.equipment_notes || "",
          special_features: data.special_features || "",
        };
        setFormData(equipmentData);
        setOriginalData(equipmentData);
      } else {
        setOriginalData({
          heating_type: "",
          energy_source: "",
          construction_type: "",
          roof_type: "",
          parking_spots: "0",
          parking_type: "",
          elevator: false,
          balcony_terrace: false,
          garden: false,
          basement: false,
          fitted_kitchen: false,
          wg_suitable: false,
          barrier_free: false,
          furnished: false,
          condition: "",
          flooring: "",
          equipment_notes: "",
          special_features: "",
        });
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    } finally {
      setLoading(false);
    }
  }

  function getChanges() {
    if (!originalData) return [];

    const changes: string[] = [];
    const fieldLabels: Record<string, string> = {
      heating_type: "Heizungstyp",
      energy_source: "Energieart",
      construction_type: "Bauweise",
      roof_type: "Dachtyp",
      parking_spots: "Anzahl Stellplätze",
      parking_type: "Art des Stellplatzes",
      elevator: "Aufzug",
      balcony_terrace: "Balkon/Terrasse",
      garden: "Garten",
      basement: "Keller",
      fitted_kitchen: "Einbauküche",
      wg_suitable: "WG geeignet",
      barrier_free: "Barrierefrei",
      furnished: "Möbliert",
      condition: "Zustand",
      flooring: "Bodenbelag",
      equipment_notes: "Ausstattungsnotizen",
      special_features: "Besonderheiten",
    };

    Object.keys(formData).forEach((key) => {
      const oldValue = originalData[key];
      const newValue = formData[key as keyof typeof formData];

      if (oldValue !== newValue) {
        const label = fieldLabels[key] || key;
        if (typeof newValue === 'boolean') {
          changes.push(`${label}: ${newValue ? 'Ja' : 'Nein'}`);
        } else if (newValue === '' || newValue === '0') {
          changes.push(`${label}: Gelöscht`);
        } else {
          changes.push(`${label}: ${newValue}`);
        }
      }
    });

    return changes;
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
        parking_type: formData.parking_type || null,
        elevator: formData.elevator,
        balcony_terrace: formData.balcony_terrace,
        garden: formData.garden,
        basement: formData.basement,
        fitted_kitchen: formData.fitted_kitchen,
        wg_suitable: formData.wg_suitable,
        barrier_free: formData.barrier_free,
        furnished: formData.furnished,
        condition: formData.condition || null,
        flooring: formData.flooring || null,
        equipment_notes: formData.equipment_notes,
        special_features: formData.special_features,
      };

      const { error } = await supabase
        .from("property_equipment")
        .upsert(equipmentData, { onConflict: "property_id" });

      if (error) throw error;

      const changes = getChanges();
      if (changes.length > 0) {
        await supabase.from("property_history").insert([
          {
            property_id: propertyId,
            user_id: user.id,
            event_type: "equipment_updated",
            event_description: `Ausstattung & Daten aktualisiert: ${changes.join(', ')}`,
          },
        ]);
      }

      const newOriginalData = {
        heating_type: formData.heating_type,
        energy_source: formData.energy_source,
        construction_type: formData.construction_type,
        roof_type: formData.roof_type,
        parking_spots: formData.parking_spots,
        parking_type: formData.parking_type,
        elevator: formData.elevator,
        balcony_terrace: formData.balcony_terrace,
        garden: formData.garden,
        basement: formData.basement,
        fitted_kitchen: formData.fitted_kitchen,
        wg_suitable: formData.wg_suitable,
        barrier_free: formData.barrier_free,
        furnished: formData.furnished,
        condition: formData.condition,
        flooring: formData.flooring,
        equipment_notes: formData.equipment_notes,
        special_features: formData.special_features,
      };
      setOriginalData(newOriginalData);
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
      <div className="bg-white rounded-lg p-6">
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

      <div className="bg-white rounded-lg p-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Art des Stellplatzes
            </label>
            <select
              value={formData.parking_type}
              onChange={(e) =>
                setFormData({ ...formData, parking_type: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Bitte wählen</option>
              <option value="garage">Garage</option>
              <option value="carport">Carport</option>
              <option value="outdoor">Außenstellplatz</option>
              <option value="underground">Tiefgarage</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
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

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.fitted_kitchen}
              onChange={(e) =>
                setFormData({ ...formData, fitted_kitchen: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">EBK (Einbauküche)</span>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.wg_suitable}
              onChange={(e) =>
                setFormData({ ...formData, wg_suitable: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">WG geeignet</span>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.barrier_free}
              onChange={(e) =>
                setFormData({ ...formData, barrier_free: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Barrierefrei</span>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.furnished}
              onChange={(e) =>
                setFormData({ ...formData, furnished: e.target.checked })
              }
              className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Möbliert</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zustand
            </label>
            <select
              value={formData.condition}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Bitte wählen</option>
              <option value="first_time_use">Erstbezug</option>
              <option value="mint_condition">Neuwertig</option>
              <option value="renovated">Renoviert</option>
              <option value="well_maintained">Gepflegt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bodenbelag
            </label>
            <select
              value={formData.flooring}
              onChange={(e) =>
                setFormData({ ...formData, flooring: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Bitte wählen</option>
              <option value="parquet">Parkett</option>
              <option value="laminate">Laminat</option>
              <option value="tiles">Fliesen</option>
              <option value="carpet">Teppich</option>
              <option value="vinyl">Vinyl</option>
              <option value="floorboards">Dielen</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
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
          className="flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </form>
  );
}
