import { useState, useEffect } from "react";
import { Plus, Gauge, Droplet, Zap, Flame, Wind, TrendingUp } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface Property {
  id: string;
  name: string;
}

interface Meter {
  id: string;
  property_id: string;
  meter_type: string;
  meter_number: string;
  location: string;
  installation_date: string;
}

interface MeterReading {
  id: string;
  meter_id: string;
  reading_date: string;
  reading_value: number;
  reading_type: string;
  notes: string;
}

export default function MetersView() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);

  const [meterFormData, setMeterFormData] = useState({
    property_id: "",
    meter_type: "water",
    meter_number: "",
    location: "",
    installation_date: "",
  });

  const [readingFormData, setReadingFormData] = useState({
    reading_date: new Date().toISOString().split("T")[0],
    reading_value: "",
    reading_type: "intermediate",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProperty) {
      loadMeters();
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (selectedMeter) {
      loadReadings();
    }
  }, [selectedMeter]);

  async function loadProperties() {
    const { data } = await supabase
      .from("properties")
      .select("id, name")
      .order("name");

    if (data) {
      setProperties(data);
      if (data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0].id);
      }
    }
  }

  async function loadMeters() {
    const { data } = await supabase
      .from("meters")
      .select("*")
      .eq("property_id", selectedProperty)
      .order("meter_type");

    if (data) setMeters(data);
  }

  async function loadReadings() {
    if (!selectedMeter) return;

    const { data } = await supabase
      .from("meter_readings")
      .select("*")
      .eq("meter_id", selectedMeter)
      .order("reading_date", { ascending: false });

    if (data) setReadings(data);
  }

  async function handleAddMeter() {
    if (!user || !meterFormData.property_id || !meterFormData.meter_number)
      return;

    try {
      const { error } = await supabase.from("meters").insert({
        property_id: meterFormData.property_id,
        meter_type: meterFormData.meter_type,
        meter_number: meterFormData.meter_number,
        location: meterFormData.location,
        installation_date: meterFormData.installation_date || null,
      });

      if (error) throw error;

      setShowMeterModal(false);
      setMeterFormData({
        property_id: "",
        meter_type: "water",
        meter_number: "",
        location: "",
        installation_date: "",
      });
      loadMeters();
    } catch (error) {
      console.error("Error adding meter:", error);
    }
  }

  async function handleAddReading() {
    if (!selectedMeter || !readingFormData.reading_value) return;

    try {
      const { error } = await supabase.from("meter_readings").insert({
        meter_id: selectedMeter,
        reading_date: readingFormData.reading_date,
        reading_value: parseFloat(readingFormData.reading_value),
        reading_type: readingFormData.reading_type,
        notes: readingFormData.notes,
      });

      if (error) throw error;

      setShowReadingModal(false);
      setReadingFormData({
        reading_date: new Date().toISOString().split("T")[0],
        reading_value: "",
        reading_type: "intermediate",
        notes: "",
      });
      loadReadings();
    } catch (error) {
      console.error("Error adding reading:", error);
    }
  }

  const getMeterIcon = (type: string) => {
    switch (type) {
      case "water":
        return Droplet;
      case "electricity":
        return Zap;
      case "heating":
        return Flame;
      case "gas":
        return Wind;
      default:
        return Gauge;
    }
  };

  const getMeterTypeLabel = (type: string) => {
    switch (type) {
      case "water":
        return "Wasser";
      case "electricity":
        return "Strom";
      case "heating":
        return "Heizung";
      case "gas":
        return "Gas";
      default:
        return type;
    }
  };

  const getMeterTypeColor = (type: string) => {
    switch (type) {
      case "water":
        return "bg-blue-100 text-blue-700";
      case "electricity":
        return "bg-amber-100 text-amber-700";
      case "heating":
        return "bg-red-100 text-red-700";
      case "gas":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const calculateConsumption = (meterId: string) => {
    const meterReadings = readings.filter((r) => r.meter_id === meterId);
    if (meterReadings.length < 2) return null;

    const latest = meterReadings[0];
    const previous = meterReadings[1];

    return latest.reading_value - previous.reading_value;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objekt
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              {properties.length === 0 && (
                <option value="">Keine Objekte vorhanden</option>
              )}
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setMeterFormData({
                ...meterFormData,
                property_id: selectedProperty,
              });
              setShowMeterModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
            disabled={!selectedProperty}
          >
            <Plus className="w-4 h-4" />
            Zähler hinzufügen
          </button>
        </div>

        {selectedProperty && (
          <>
            <h3 className="text-lg font-semibold text-dark mb-4">Zähler</h3>

            {meters.length === 0 ? (
              <div className="text-center py-12">
                <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Keine Zähler vorhanden</p>
                <button
                  onClick={() => {
                    setMeterFormData({
                      ...meterFormData,
                      property_id: selectedProperty,
                    });
                    setShowMeterModal(true);
                  }}
                  className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
                >
                  Ersten Zähler hinzufügen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {meters.map((meter) => {
                  const Icon = getMeterIcon(meter.meter_type);
                  const consumption = calculateConsumption(meter.id);

                  return (
                    <div
                      key={meter.id}
                      onClick={() => setSelectedMeter(meter.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedMeter === meter.id
                          ? "border-primary-blue bg-blue-50"
                          : "border-gray-200 hover:border-primary-blue"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMeterTypeColor(
                            meter.meter_type
                          )}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getMeterTypeColor(
                            meter.meter_type
                          )}`}
                        >
                          {getMeterTypeLabel(meter.meter_type)}
                        </span>
                      </div>
                      <div className="font-semibold text-dark mb-1">
                        {meter.meter_number}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {meter.location || "Kein Standort"}
                      </div>
                      {consumption !== null && (
                        <div className="flex items-center gap-1 text-sm text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                          {consumption.toFixed(2)} Einheiten
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {selectedMeter && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark">Zählerstände</h3>
            <button
              onClick={() => setShowReadingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ablesung erfassen
            </button>
          </div>

          {readings.length === 0 ? (
            <div className="text-center py-12">
              <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Keine Ablesungen vorhanden
              </p>
              <button
                onClick={() => setShowReadingModal(true)}
                className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
              >
                Erste Ablesung erfassen
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Datum
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Zählerstand
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Verbrauch
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Typ
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Notizen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading, index) => {
                    const previousReading =
                      index < readings.length - 1 ? readings[index + 1] : null;
                    const consumption = previousReading
                      ? reading.reading_value - previousReading.reading_value
                      : null;

                    return (
                      <tr key={reading.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {new Date(reading.reading_date).toLocaleDateString(
                            "de-DE"
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-dark">
                          {reading.reading_value.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          {consumption !== null ? (
                            <span className="text-emerald-600 font-medium">
                              +{consumption.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {reading.reading_type === "start"
                              ? "Start"
                              : reading.reading_type === "end"
                              ? "Ende"
                              : "Zwischenstand"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {reading.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showMeterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Zähler hinzufügen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zählertyp
                </label>
                <select
                  value={meterFormData.meter_type}
                  onChange={(e) =>
                    setMeterFormData({
                      ...meterFormData,
                      meter_type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="water">Wasser</option>
                  <option value="electricity">Strom</option>
                  <option value="heating">Heizung</option>
                  <option value="gas">Gas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zählernummer
                </label>
                <input
                  type="text"
                  value={meterFormData.meter_number}
                  onChange={(e) =>
                    setMeterFormData({
                      ...meterFormData,
                      meter_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. WZ-12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standort
                </label>
                <input
                  type="text"
                  value={meterFormData.location}
                  onChange={(e) =>
                    setMeterFormData({
                      ...meterFormData,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Keller, Einheit 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installationsdatum (optional)
                </label>
                <input
                  type="date"
                  value={meterFormData.installation_date}
                  onChange={(e) =>
                    setMeterFormData({
                      ...meterFormData,
                      installation_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMeterModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddMeter}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
                disabled={!meterFormData.meter_number}
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {showReadingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Zählerstand erfassen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ablesedatum
                </label>
                <input
                  type="date"
                  value={readingFormData.reading_date}
                  onChange={(e) =>
                    setReadingFormData({
                      ...readingFormData,
                      reading_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zählerstand
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={readingFormData.reading_value}
                  onChange={(e) =>
                    setReadingFormData({
                      ...readingFormData,
                      reading_value: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ablesungstyp
                </label>
                <select
                  value={readingFormData.reading_type}
                  onChange={(e) =>
                    setReadingFormData({
                      ...readingFormData,
                      reading_type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="start">Startwert</option>
                  <option value="end">Endwert</option>
                  <option value="intermediate">Zwischenstand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={readingFormData.notes}
                  onChange={(e) =>
                    setReadingFormData({
                      ...readingFormData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReadingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddReading}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
                disabled={!readingFormData.reading_value}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
