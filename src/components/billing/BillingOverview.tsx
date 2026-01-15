import { useState, useEffect } from "react";
import { Plus, Calendar, Building, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface BillingPeriod {
  id: string;
  property_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
}

export default function BillingOverview() {
  const { user } = useAuth();
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    property_id: "",
    name: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      const [periodsRes, propsRes] = await Promise.all([
        supabase
          .from("billing_periods")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("properties").select("id, name").order("name"),
      ]);

      if (periodsRes.data) setBillingPeriods(periodsRes.data);
      if (propsRes.data) setProperties(propsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!user || !formData.property_id || !formData.name) return;

    try {
      const { error } = await supabase.from("billing_periods").insert({
        user_id: user.id,
        property_id: formData.property_id,
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: "draft",
      });

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({ property_id: "", name: "", start_date: "", end_date: "" });
      loadData();
    } catch (error) {
      console.error("Error creating billing period:", error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "finalized":
        return "bg-blue-100 text-blue-700";
      case "sent":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Entwurf";
      case "finalized":
        return "Finalisiert";
      case "sent":
        return "Versendet";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {billingPeriods.length}
          </div>
          <div className="text-sm text-gray-400">Abrechnungszeiträume</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <Building className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {properties.length}
          </div>
          <div className="text-sm text-gray-400">Objekte</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {billingPeriods.filter((p) => p.status === "draft").length}
          </div>
          <div className="text-sm text-gray-400">Entwürfe</div>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark">
            Abrechnungszeiträume
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Abrechnung
          </button>
        </div>

        {billingPeriods.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">
              Keine Abrechnungen vorhanden
            </h3>
            <p className="text-gray-400 mb-6">
              Erstellen Sie Ihre erste Betriebskostenabrechnung
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Neue Abrechnung erstellen
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-3">
              {billingPeriods.map((period) => {
                const property = properties.find(
                  (p) => p.id === period.property_id
                );
                return (
                  <div
                    key={period.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-blue transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-dark">
                            {period.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              period.status
                            )}`}
                          >
                            {getStatusLabel(period.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {property?.name || "Unbekannt"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(period.start_date).toLocaleDateString(
                              "de-DE"
                            )}{" "}
                            -{" "}
                            {new Date(period.end_date).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Neue Abrechnung erstellen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objekt
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) =>
                    setFormData({ ...formData, property_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Objekt wählen...</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bezeichnung
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Abrechnung 2024"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                disabled={
                  !formData.property_id ||
                  !formData.name ||
                  !formData.start_date ||
                  !formData.end_date
                }
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
