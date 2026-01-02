import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Home, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyUnitsTabProps {
  propertyId: string;
}

interface PropertyUnit {
  id: string;
  unit_number: string;
  unit_type: string;
  floor: number | null;
  area_sqm: number | null;
  rooms: number | null;
  status: string;
  tenant_id: string | null;
  rent_amount: number | null;
  notes: string;
  tenants?: {
    name: string;
  };
}

export default function PropertyUnitsTab({ propertyId }: PropertyUnitsTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null);
  const [formData, setFormData] = useState({
    unit_number: "",
    unit_type: "apartment",
    floor: "",
    area_sqm: "",
    rooms: "",
    status: "vacant",
    rent_amount: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadUnits();
    }
  }, [user, propertyId]);

  async function loadUnits() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_units")
        .select(`
          *,
          tenants:tenant_id (
            name
          )
        `)
        .eq("property_id", propertyId)
        .order("unit_number", { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const unitData = {
        property_id: propertyId,
        user_id: user.id,
        unit_number: formData.unit_number,
        unit_type: formData.unit_type,
        floor: formData.floor ? parseInt(formData.floor) : null,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        status: formData.status,
        rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
        notes: formData.notes,
      };

      if (editingUnit) {
        const { error } = await supabase
          .from("property_units")
          .update(unitData)
          .eq("id", editingUnit.id);

        if (error) throw error;

        await supabase.from("property_history").insert([
          {
            property_id: propertyId,
            user_id: user.id,
            event_type: "unit_updated",
            event_description: `Einheit ${formData.unit_number} wurde aktualisiert`,
          },
        ]);
      } else {
        const { error } = await supabase.from("property_units").insert([unitData]);

        if (error) throw error;

        await supabase.from("property_history").insert([
          {
            property_id: propertyId,
            user_id: user.id,
            event_type: "unit_created",
            event_description: `Einheit ${formData.unit_number} wurde angelegt`,
          },
        ]);
      }

      setShowModal(false);
      setEditingUnit(null);
      resetForm();
      loadUnits();
    } catch (error) {
      console.error("Error saving unit:", error);
      alert("Fehler beim Speichern der Einheit");
    }
  }

  async function handleDeleteUnit(unit: PropertyUnit) {
    if (!confirm(`Möchten Sie die Einheit ${unit.unit_number} wirklich löschen?`))
      return;

    try {
      const { error } = await supabase.from("property_units").delete().eq("id", unit.id);

      if (error) throw error;
      loadUnits();
    } catch (error) {
      console.error("Error deleting unit:", error);
    }
  }

  function openEditModal(unit: PropertyUnit) {
    setEditingUnit(unit);
    setFormData({
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      floor: unit.floor ? unit.floor.toString() : "",
      area_sqm: unit.area_sqm ? unit.area_sqm.toString() : "",
      rooms: unit.rooms ? unit.rooms.toString() : "",
      status: unit.status,
      rent_amount: unit.rent_amount ? unit.rent_amount.toString() : "",
      notes: unit.notes || "",
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      unit_number: "",
      unit_type: "apartment",
      floor: "",
      area_sqm: "",
      rooms: "",
      status: "vacant",
      rent_amount: "",
      notes: "",
    });
  }

  const getUnitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "Wohnung",
      office: "Büro",
      parking: "Stellplatz",
      storage: "Lager",
      commercial: "Gewerbe",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      vacant: "Leer",
      rented: "Vermietet",
      maintenance: "Wartung",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      vacant: "bg-amber-100 text-amber-700",
      rented: "bg-emerald-100 text-emerald-700",
      maintenance: "bg-blue-100 text-blue-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark">Einheiten</h3>
            <p className="text-sm text-gray-400 mt-1">
              Verwalten Sie die Einheiten dieser Immobilie
            </p>
          </div>
          <button
            onClick={() => {
              setEditingUnit(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            Einheit hinzufügen
          </button>
        </div>

        {units.length === 0 ? (
          <div className="p-12 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Noch keine Einheiten angelegt</p>
            <button
              onClick={() => {
                setEditingUnit(null);
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Erste Einheit hinzufügen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Bezeichnung
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Typ
                  </th>
                  {isPremium && (
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Etage
                    </th>
                  )}
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Fläche
                  </th>
                  {isPremium && (
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Zimmer
                    </th>
                  )}
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                    Miete
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="font-medium">{unit.unit_number}</div>
                      {unit.tenants && (
                        <div className="text-xs text-gray-400 mt-1">
                          {unit.tenants.name}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {getUnitTypeLabel(unit.unit_type)}
                    </td>
                    {isPremium && (
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {unit.floor !== null ? `${unit.floor}. OG` : "-"}
                      </td>
                    )}
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {unit.area_sqm ? `${unit.area_sqm} m²` : "-"}
                    </td>
                    {isPremium && (
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {unit.rooms || "-"}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(unit.status)}`}
                      >
                        {getStatusLabel(unit.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-right text-gray-700 font-medium">
                      {unit.rent_amount
                        ? `${unit.rent_amount.toFixed(2)} €`
                        : "-"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="text-primary-blue hover:text-primary-blue transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit)}
                          className="text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-dark">
                {editingUnit ? "Einheit bearbeiten" : "Einheit hinzufügen"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUnit(null);
                  resetForm();
                }}
                className="text-gray-300 hover:text-gray-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezeichnung / Nummer *
                  </label>
                  <input
                    type="text"
                    value={formData.unit_number}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_number: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ *
                  </label>
                  <select
                    value={formData.unit_type}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_type: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="apartment">Wohnung</option>
                    <option value="office">Büro</option>
                    <option value="parking">Stellplatz</option>
                    <option value="storage">Lager</option>
                    <option value="commercial">Gewerbe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage {isPremium && "(Pro)"}
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({ ...formData, floor: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fläche (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area_sqm}
                    onChange={(e) =>
                      setFormData({ ...formData, area_sqm: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zimmeranzahl {isPremium && "(Pro)"}
                  </label>
                  <input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) =>
                      setFormData({ ...formData, rooms: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="vacant">Leer</option>
                    <option value="rented">Vermietet</option>
                    <option value="maintenance">Wartung</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miete (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rent_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, rent_amount: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUnit(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
                >
                  {editingUnit ? "Speichern" : "Hinzufügen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
