import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface MeterModalProps {
  meter?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MeterModal({ meter, onClose, onSuccess }: MeterModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    property_id: meter?.property_id || "",
    unit_id: meter?.unit_id || "",
    tenant_id: meter?.tenant_id || "",
    meter_number: meter?.meter_number || "",
    meter_type: meter?.meter_type || "",
    unit_of_measurement: meter?.unit_of_measurement || "",
    meter_name: meter?.meter_name || "",
    location: meter?.location || "",
    supplier: meter?.supplier || "",
    contract_number: meter?.contract_number || "",
    reading_interval: meter?.reading_interval || "yearly",
    note: meter?.note || ""
  });

  const meterTypes = [
    { value: "strom", label: "Strom", units: ["kWh", "MWh", "Wh"], defaultUnit: "kWh" },
    { value: "gas", label: "Gas", units: ["kWh", "m³", "MWh"], defaultUnit: "kWh" },
    { value: "heizung", label: "Heizung", units: ["kWh", "MWh", "Wh", "MJ", "GJ"], defaultUnit: "kWh" },
    { value: "fernwaerme", label: "Fernwärme", units: ["kWh", "MWh", "MJ", "GJ"], defaultUnit: "kWh" },
    { value: "warmwasser", label: "Warmwasser", units: ["m³", "Liter"], defaultUnit: "m³" },
    { value: "kaltwasser", label: "Kaltwasser", units: ["m³", "Liter"], defaultUnit: "m³" },
    { value: "wasser_gesamt", label: "Wasser (Gesamt)", units: ["m³", "Liter"], defaultUnit: "m³" },
    { value: "sonstiges", label: "Sonstiges", units: ["Wh", "kWh", "MWh", "MJ", "GJ", "m³", "Liter", "Sonstiges"], defaultUnit: "Sonstiges" }
  ];

  const readingIntervals = [
    { value: "monthly", label: "Monatlich" },
    { value: "quarterly", label: "Quartalsweise" },
    { value: "halfyearly", label: "Halbjährlich" },
    { value: "yearly", label: "Jährlich" },
    { value: "on_demand", label: "Bei Bedarf" },
    { value: "manual", label: "Manuell" }
  ];

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    if (formData.property_id) {
      loadUnits(formData.property_id);
      loadTenants(formData.property_id);
    } else {
      setUnits([]);
      setTenants([]);
    }
  }, [formData.property_id]);

  useEffect(() => {
    if (formData.meter_type && !meter) {
      const meterType = meterTypes.find(t => t.value === formData.meter_type);
      if (meterType) {
        setFormData(prev => ({ ...prev, unit_of_measurement: meterType.defaultUnit }));
      }
    }
  }, [formData.meter_type]);

  const loadProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  const loadUnits = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("property_units")
        .select("id, unit_number")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error("Error loading units:", error);
    }
  };

  const loadTenants = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, first_name, last_name")
        .eq("property_id", propertyId)
        .order("last_name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.property_id || !formData.meter_number || !formData.meter_type || !formData.unit_of_measurement) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    try {
      setLoading(true);

      const meterData = {
        user_id: user.id,
        property_id: formData.property_id || null,
        unit_id: formData.unit_id || null,
        tenant_id: formData.tenant_id || null,
        meter_number: formData.meter_number,
        meter_type: formData.meter_type,
        unit_of_measurement: formData.unit_of_measurement,
        meter_name: formData.meter_name || null,
        location: formData.location || null,
        supplier: formData.supplier || null,
        contract_number: formData.contract_number || null,
        reading_interval: formData.reading_interval || null,
        note: formData.note || null
      };

      if (meter) {
        const { error } = await supabase
          .from("meters")
          .update(meterData)
          .eq("id", meter.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("meters")
          .insert([meterData]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving meter:", error);
      alert("Fehler beim Speichern des Zählers");
    } finally {
      setLoading(false);
    }
  };

  const selectedMeterType = meterTypes.find(t => t.value === formData.meter_type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-xl font-bold text-dark">
            {meter ? "Zähler bearbeiten" : "Zähler anlegen"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-dark mb-4">
                Allgemeine Informationen
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objekt / Einheit *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.property_id}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          property_id: e.target.value,
                          unit_id: "",
                          tenant_id: ""
                        });
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      required
                    >
                      <option value="">Objekt wählen</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      disabled={!formData.property_id || units.length === 0}
                    >
                      <option value="">Einheit (optional)</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unit_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zählernummer *
                  </label>
                  <input
                    type="text"
                    value={formData.meter_number}
                    onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zählertyp *
                  </label>
                  <select
                    value={formData.meter_type}
                    onChange={(e) => setFormData({ ...formData, meter_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  >
                    <option value="">Typ wählen</option>
                    {meterTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maßeinheit *
                  </label>
                  <select
                    value={formData.unit_of_measurement}
                    onChange={(e) => setFormData({ ...formData, unit_of_measurement: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                    disabled={!formData.meter_type}
                  >
                    <option value="">Maßeinheit wählen</option>
                    {selectedMeterType?.units.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zählername
                  </label>
                  <input
                    type="text"
                    value={formData.meter_name}
                    onChange={(e) => setFormData({ ...formData, meter_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. Hauptzähler Erdgeschoss"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lage des Zählers im Gebäude
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. Keller, Technikraum"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versorger
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. Stadtwerke"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vertrags-Nr.
                  </label>
                  <input
                    type="text"
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ableseintervall
                  </label>
                  <select
                    value={formData.reading_interval}
                    onChange={(e) => setFormData({ ...formData, reading_interval: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    {readingIntervals.map(interval => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mieter
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    disabled={!formData.property_id || tenants.length === 0}
                  >
                    <option value="">Kein Mieter</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notiz
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    rows={3}
                    maxLength={1000}
                    placeholder="Optionale Notizen zum Zähler..."
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.note.length} / 1000
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Speichern..." : meter ? "Zähler speichern" : "Zähler anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
