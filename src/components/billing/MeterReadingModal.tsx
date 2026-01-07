import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Upload, Image as ImageIcon, Trash2, Building2, Gauge, MapPin, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface MeterReadingModalProps {
  meter: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MeterReadingModal({ meter, onClose, onSuccess }: MeterReadingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMeterDetails, setShowMeterDetails] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState({
    value: "",
    date: new Date().toISOString().split("T")[0],
    recorded_by: user?.email?.split("@")[0] || "",
    note: ""
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const getMeterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      strom: "Strom",
      gas: "Gas",
      heizung: "Heizung",
      warmwasser: "Warmwasser",
      kaltwasser: "Kaltwasser",
      sonstiges: "Sonstiges"
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 2) {
      alert("Maximal 2 Fotos erlaubt");
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`${file.name} ist zu groß. Maximale Dateigröße: 25 MB`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} ist kein gültiges Bild`);
        return false;
      }
      return true;
    });

    setPhotos(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoUrls(prev => [...prev, url]);
    });
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoUrls[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileName = `${user!.id}/${Date.now()}_${photo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("meter-photos")
        .upload(fileName, photo);

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("meter-photos")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value || !formData.date) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value < 0) {
      alert("Bitte geben Sie einen gültigen Zählerstand ein.");
      return;
    }

    if (meter.last_reading_value !== null && value < meter.last_reading_value) {
      const confirmed = confirm(
        `Warnung: Der neue Zählerstand (${value}) ist niedriger als der letzte Stand (${meter.last_reading_value}). Möchten Sie trotzdem fortfahren?`
      );
      if (!confirmed) return;
    }

    try {
      setLoading(true);
      setUploadingPhotos(true);

      const photoUrls = await uploadPhotos();

      const readingData = {
        meter_id: meter.id,
        value,
        date: formData.date,
        recorded_by: formData.recorded_by || null,
        note: formData.note || null,
        photos: photoUrls
      };

      const { error: readingError } = await supabase
        .from("meter_readings")
        .insert([readingData]);

      if (readingError) throw readingError;

      const { error: meterError } = await supabase
        .from("meters")
        .update({
          last_reading_value: value,
          last_reading_date: formData.date,
          updated_at: new Date().toISOString()
        })
        .eq("id", meter.id);

      if (meterError) throw meterError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving meter reading:", error);
      alert("Fehler beim Erfassen des Zählerstands");
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  useEffect(() => {
    return () => {
      photoUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-xl font-bold text-dark">Zählerstand hinzufügen</h3>
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
              <button
                type="button"
                onClick={() => setShowMeterDetails(!showMeterDetails)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-dark">Zählerdaten</h4>
                </div>
                {showMeterDetails ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {!showMeterDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Objekt, Einheit</div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div className="font-medium text-dark">
                          {meter.property?.name || "-"}
                          {meter.unit && <span className="text-gray-500">, {meter.unit.unit_number}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Zählernummer, Typ, Zählername</div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-dark">
                            {meter.meter_number}, {getMeterTypeLabel(meter.meter_type)}
                          </div>
                          {meter.meter_name && (
                            <div className="text-sm text-gray-500">{meter.meter_name}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showMeterDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Objekt, Einheit</div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div className="font-medium text-dark">
                          {meter.property?.name || "-"}
                          {meter.unit && <span className="text-gray-500">, {meter.unit.unit_number}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Zählernummer, Typ, Zählername</div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-dark">
                            {meter.meter_number}, {getMeterTypeLabel(meter.meter_type)}
                          </div>
                          {meter.meter_name && (
                            <div className="text-sm text-gray-500">{meter.meter_name}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    {meter.location && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Lage des Zählers im Gebäude</div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="font-medium text-dark">{meter.location}</div>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Mietername</div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="font-medium text-dark">
                          {meter.tenant ? `${meter.tenant.first_name} ${meter.tenant.last_name}` : "Kein Mieter"}
                        </div>
                      </div>
                    </div>
                  </div>
                  {meter.last_reading_value !== null && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">Letzter Zählerstand</div>
                      <div className="font-medium text-dark">
                        {meter.last_reading_value} {meter.unit_of_measurement} ({formatDate(meter.last_reading_date)})
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold text-dark mb-4">Zählerstand erfassen</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neuer Zählerstand *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="0.00"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {meter.unit_of_measurement}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Erfasst durch
                  </label>
                  <input
                    type="text"
                    value={formData.recorded_by}
                    onChange={(e) => setFormData({ ...formData, recorded_by: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notiz
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.note.length} / 1000
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fotos hochladen
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-blue transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                      disabled={photos.length >= 2}
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`cursor-pointer ${photos.length >= 2 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm font-medium text-dark mb-1">
                        Datei hierhin ziehen oder auswählen
                      </div>
                      <div className="text-xs text-gray-500">
                        (max. 25 MB, bis zu 2 Fotos)
                      </div>
                    </label>
                  </div>

                  {photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {photoUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? uploadingPhotos
                  ? "Fotos werden hochgeladen..."
                  : "Speichern..."
                : "Zählerstand speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
