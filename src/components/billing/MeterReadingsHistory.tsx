import { useState, useEffect } from "react";
import { X, Calendar, User as UserIcon, FileText, Image as ImageIcon, ChevronDown, ChevronUp, Gauge } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface MeterReading {
  id: string;
  value: number;
  date: string;
  recorded_by: string | null;
  note: string | null;
  photos: string[];
  created_at: string;
}

interface MeterReadingsHistoryProps {
  meter: any;
  onClose: () => void;
}

export default function MeterReadingsHistory({ meter, onClose }: MeterReadingsHistoryProps) {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReading, setExpandedReading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadReadings();
  }, [meter.id]);

  const loadReadings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("meter_id", meter.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setReadings(data || []);
    } catch (error) {
      console.error("Error loading meter readings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getMeterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      strom: "Strom",
      gas: "Gas",
      heizung: "Heizung",
      fernwaerme: "Fernwärme",
      warmwasser: "Warmwasser",
      kaltwasser: "Kaltwasser",
      wasser_gesamt: "Wasser (Gesamt)",
      sonstiges: "Sonstiges"
    };
    return types[type] || type;
  };

  const toggleExpand = (id: string) => {
    setExpandedReading(expandedReading === id ? null : id);
  };

  const calculateConsumption = (index: number) => {
    if (index === readings.length - 1) return null;
    const currentReading = readings[index];
    const previousReading = readings[index + 1];
    return currentReading.value - previousReading.value;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-dark">Zählerstand-Verlauf</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Gauge className="w-4 h-4" />
                  <span>{meter.meter_name || meter.meter_number}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>{getMeterTypeLabel(meter.meter_type)}</span>
                {meter.property && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{meter.property.name}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Lade Verlauf...</div>
              </div>
            ) : readings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-dark mb-2">
                  Keine Zählerstände erfasst
                </h4>
                <p className="text-gray-400">
                  Es wurden noch keine Zählerstände für diesen Zähler erfasst.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {readings.map((reading, index) => {
                  const consumption = calculateConsumption(index);
                  const isExpanded = expandedReading === reading.id;

                  return (
                    <div
                      key={reading.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpand(reading.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-6">
                          <div className="text-left">
                            <div className="text-2xl font-bold text-dark">
                              {reading.value} {meter.unit_of_measurement}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(reading.date)}
                            </div>
                          </div>

                          {consumption !== null && (
                            <div className="px-3 py-1 bg-blue-50 rounded-full">
                              <div className="text-xs text-gray-500">Verbrauch</div>
                              <div className="text-sm font-semibold text-primary-blue">
                                {consumption >= 0 ? "+" : ""}{consumption.toFixed(2)} {meter.unit_of_measurement}
                              </div>
                            </div>
                          )}
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50 space-y-3">
                          <div className="grid grid-cols-2 gap-4 pt-4">
                            {reading.recorded_by && (
                              <div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                  <UserIcon className="w-3 h-3" />
                                  <span>Erfasst durch</span>
                                </div>
                                <div className="text-sm font-medium text-dark">
                                  {reading.recorded_by}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                <Calendar className="w-3 h-3" />
                                <span>Erfasst am</span>
                              </div>
                              <div className="text-sm font-medium text-dark">
                                {formatDateTime(reading.created_at)}
                              </div>
                            </div>
                          </div>

                          {reading.note && (
                            <div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                <FileText className="w-3 h-3" />
                                <span>Notiz</span>
                              </div>
                              <div className="text-sm text-dark bg-white rounded-lg p-3 border border-gray-200">
                                {reading.note}
                              </div>
                            </div>
                          )}

                          {reading.photos && reading.photos.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                <ImageIcon className="w-3 h-3" />
                                <span>Fotos ({reading.photos.length})</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {reading.photos.map((photo, photoIndex) => (
                                  <button
                                    key={photoIndex}
                                    onClick={() => setSelectedPhoto(photo)}
                                    className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 hover:border-primary-blue transition-colors"
                                  >
                                    <img
                                      src={photo}
                                      alt={`Foto ${photoIndex + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Zählerstand Foto"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
