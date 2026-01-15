import { useState, useEffect } from "react";
import { Gauge, Plus, Camera, Calendar, Upload, X as XIcon, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Meter {
  id: string;
  meter_type: string;
  meter_number: string;
  location: string;
  unit: string;
}

interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  photo_url: string | null;
  notes: string | null;
  reported_by_tenant: boolean;
  meter: Meter;
}

interface TenantPortalMetersProps {
  tenantId: string;
  propertyId: string;
  unitId: string | null;
}

export default function TenantPortalMeters({
  tenantId,
  propertyId,
  unitId,
}: TenantPortalMetersProps) {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [showNewReading, setShowNewReading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newReadingForm, setNewReadingForm] = useState({
    meter_id: "",
    reading_value: "",
    reading_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    loadMeters();
    loadReadings();
  }, [propertyId, unitId]);

  const loadMeters = async () => {
    try {
      let query = supabase
        .from("meters")
        .select("*")
        .eq("property_id", propertyId);

      if (unitId) {
        query = query.eq("unit_id", unitId);
      }

      const { data, error } = await query.order("meter_type");

      if (error) throw error;
      setMeters(data || []);

      if (data && data.length > 0 && !newReadingForm.meter_id) {
        setNewReadingForm((prev) => ({ ...prev, meter_id: data[0].id }));
      }
    } catch (error) {
      console.error("Error loading meters:", error);
    }
  };

  const loadReadings = async () => {
    try {
      let query = supabase
        .from("meter_readings")
        .select("*, meter:meters(*)")
        .in("meter_id", meters.map(m => m.id))
        .order("date", { ascending: false })
        .limit(20);

      const { data, error } = await query;

      if (error) throw error;
      setReadings(data || []);
    } catch (error) {
      console.error("Error loading readings:", error);
    }
  };

  const handleSubmitReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const photoData = [];

      for (const file of photos) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        photoData.push({
          filename: file.name,
          data: base64,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        });
      }

      const { error } = await supabase.from("meter_readings").insert([
        {
          meter_id: newReadingForm.meter_id,
          value: parseFloat(newReadingForm.reading_value),
          date: newReadingForm.reading_date,
          note: newReadingForm.notes || null,
          photos: photoData.length > 0 ? photoData : null,
        },
      ]);

      if (error) throw error;

      setNewReadingForm({
        meter_id: meters[0]?.id || "",
        reading_value: "",
        reading_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setPhotos([]);
      setShowNewReading(false);
      loadReadings();
    } catch (error) {
      console.error("Error submitting reading:", error);
      alert("Fehler beim Übermitteln des Zählerstands");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== files.length) {
      alert("Bitte wählen Sie nur Bilddateien aus");
    }

    setPhotos((prev) => [...prev, ...imageFiles].slice(0, 3));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getMeterTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      strom: "Strom",
      gas: "Gas",
      wasser_kalt: "Kaltwasser",
      wasser_warm: "Warmwasser",
      wasser_gesamt: "Wasser (gesamt)",
      fernwaerme: "Fernwärme",
      heizung: "Heizung",
    };
    return types[type] || type;
  };

  const getMeterTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      strom: "bg-amber-100 text-amber-700",
      gas: "bg-amber-100 text-amber-700",
      wasser_kalt: "bg-blue-100 text-blue-700",
      wasser_warm: "bg-red-100 text-red-700",
      wasser_gesamt: "bg-blue-100 text-blue-700",
      fernwaerme: "bg-primary-blue/10 text-primary-blue",
      heizung: "bg-red-100 text-red-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  if (meters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Gauge className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-dark mb-2">
          Keine Zähler gefunden
        </h3>
        <p className="text-gray-400">
          Für Ihre Einheit sind keine Zähler hinterlegt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dark">Ihre Zähler</h2>
          <button
            onClick={() => setShowNewReading(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Zählerstand melden
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meters.map((meter) => (
            <div
              key={meter.id}
              className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-primary-blue"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary-blue" />
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getMeterTypeColor(meter.meter_type)}`}
                  >
                    {getMeterTypeLabel(meter.meter_type)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Zählernummer</p>
                <p className="font-mono font-semibold text-dark">
                  {meter.meter_number}
                </p>
                {meter.location && (
                  <>
                    <p className="text-sm text-gray-400 mt-2">Standort</p>
                    <p className="text-sm text-dark">{meter.location}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-dark mb-4">
          Ihre gemeldeten Zählerstände
        </h2>

        {readings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-400">
              Sie haben noch keine Zählerstände gemeldet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {readings.map((reading) => (
              <div key={reading.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getMeterTypeColor(reading.meter.meter_type)}`}
                      >
                        {getMeterTypeLabel(reading.meter.meter_type)}
                      </span>
                      <span className="text-sm text-gray-400">
                        Zähler: {reading.meter.meter_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Zählerstand</p>
                        <p className="text-xl font-bold text-dark">
                          {reading.reading_value} {reading.meter.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Ablesedatum</p>
                        <p className="text-dark font-medium">
                          {formatDate(reading.reading_date)}
                        </p>
                      </div>
                    </div>
                    {reading.notes && (
                      <p className="text-sm text-gray-400 mt-2">
                        {reading.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewReading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-dark">
                Zählerstand melden
              </h2>
              <button
                onClick={() => setShowNewReading(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReading} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Zähler *
                </label>
                <select
                  value={newReadingForm.meter_id}
                  onChange={(e) =>
                    setNewReadingForm({
                      ...newReadingForm,
                      meter_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  {meters.map((meter) => (
                    <option key={meter.id} value={meter.id}>
                      {getMeterTypeLabel(meter.meter_type)} -{" "}
                      {meter.meter_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Zählerstand *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newReadingForm.reading_value}
                  onChange={(e) =>
                    setNewReadingForm({
                      ...newReadingForm,
                      reading_value: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 12345.67"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Ablesedatum *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={newReadingForm.reading_date}
                    onChange={(e) =>
                      setNewReadingForm({
                        ...newReadingForm,
                        reading_date: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Notiz (optional)
                </label>
                <textarea
                  value={newReadingForm.notes}
                  onChange={(e) =>
                    setNewReadingForm({
                      ...newReadingForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={3}
                  placeholder="Optionale Anmerkungen..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Fotos (max. 3)
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-colors">
                    <Camera className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Fotos aufnehmen/auswählen
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={photos.length >= 3}
                    />
                  </label>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((file, index) => (
                        <div
                          key={index}
                          className="relative group border border-gray-200 rounded-lg p-2 flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate flex-1">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewReading(false)}
                  className="flex-1 px-4 py-2 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Speichern..." : "Melden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
