import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { parseNumberInput } from "../lib/utils";
interface Property {
  id: string;
  name: string;
  address: string;
  street?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  property_type: string;
  property_management_type?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  parking_spot_number?: string;
  description: string;
}
interface PropertyModalProps {
  property: Property | null;
  onClose: () => void;
  onSave: () => void;
}
export default function PropertyModal({
  property,
  onClose,
  onSave,
}: PropertyModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    zip_code: "",
    city: "",
    country: "Deutschland",
    property_type: "multi_family",
    property_management_type: "self_management",
    purchase_price: 0,
    current_value: 0,
    purchase_date: "",
    size_sqm: 0,
    usable_area_sqm: 0,
    parking_spot_number: "",
    description: "",
    broker_costs: 0,
    notary_costs: 0,
    lawyer_costs: 0,
    real_estate_transfer_tax: 0,
    registration_costs: 0,
    expert_costs: 0,
  });
  const [additionalCosts, setAdditionalCosts] = useState<Array<{name: string, amount: number}>>([]);
  useEffect(() => {
    if (property) {
      const propertyWithCosts = property as Property & {
        usable_area_sqm?: number;
        broker_costs?: number;
        notary_costs?: number;
        lawyer_costs?: number;
        real_estate_transfer_tax?: number;
        registration_costs?: number;
        expert_costs?: number;
        additional_purchase_costs?: Array<{name: string, amount: number}>;
      };

      const propData = {
        name: property.name,
        street: property.street || "",
        zip_code: property.zip_code || "",
        city: property.city || "",
        country: property.country || "Deutschland",
        property_type: property.property_type,
        property_management_type: property.property_management_type || "self_management",
        purchase_price: property.purchase_price,
        current_value: property.current_value,
        purchase_date: property.purchase_date || "",
        size_sqm: property.size_sqm || 0,
        usable_area_sqm: propertyWithCosts.usable_area_sqm || 0,
        parking_spot_number: property.parking_spot_number || "",
        description: property.description,
        broker_costs: propertyWithCosts.broker_costs || 0,
        notary_costs: propertyWithCosts.notary_costs || 0,
        lawyer_costs: propertyWithCosts.lawyer_costs || 0,
        real_estate_transfer_tax: propertyWithCosts.real_estate_transfer_tax || 0,
        registration_costs: propertyWithCosts.registration_costs || 0,
        expert_costs: propertyWithCosts.expert_costs || 0,
      };

      setFormData(propData);
      setOriginalData(propData);

      if (propertyWithCosts.additional_purchase_costs) {
        setAdditionalCosts(propertyWithCosts.additional_purchase_costs);
      }
    }
  }, [property]);
  function getPropertyChanges() {
    if (!originalData || !property) return [];

    const changes: string[] = [];
    const fieldLabels: Record<string, string> = {
      name: "Name",
      street: "Straße",
      zip_code: "PLZ",
      city: "Stadt",
      country: "Land",
      property_type: "Immobilientyp",
      property_management_type: "Verwaltungsart",
      purchase_price: "Kaufpreis",
      current_value: "Aktueller Wert",
      purchase_date: "Kaufdatum",
      size_sqm: "Wohnfläche (m²)",
      usable_area_sqm: "Nutzfläche (m²)",
      parking_spot_number: "Stellplatznummer",
      description: "Beschreibung",
    };

    Object.keys(fieldLabels).forEach((key) => {
      const oldValue = originalData[key];
      const newValue = formData[key];

      if (oldValue !== newValue) {
        const label = fieldLabels[key];
        changes.push(`${label}: ${newValue || 'Gelöscht'}`);
      }
    });

    return changes;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const address = `${formData.street}, ${formData.zip_code} ${formData.city}`;
      const data = {
        name: formData.name,
        street: formData.street,
        zip_code: formData.zip_code,
        city: formData.city,
        country: formData.country,
        address: address,
        property_type: formData.property_type,
        property_management_type: formData.property_management_type,
        purchase_price: formData.purchase_price,
        current_value: formData.current_value,
        purchase_date: formData.purchase_date,
        user_id: user.id,
        size_sqm:
          formData.property_type === "parking"
            ? null
            : formData.size_sqm || null,
        usable_area_sqm:
          formData.property_type === "parking"
            ? null
            : formData.usable_area_sqm || null,
        parking_spot_number:
          formData.property_type === "parking"
            ? formData.parking_spot_number || null
            : null,
        description: formData.description,
        broker_costs: formData.broker_costs || 0,
        notary_costs: formData.notary_costs || 0,
        lawyer_costs: formData.lawyer_costs || 0,
        real_estate_transfer_tax: formData.real_estate_transfer_tax || 0,
        registration_costs: formData.registration_costs || 0,
        expert_costs: formData.expert_costs || 0,
        additional_purchase_costs: additionalCosts.length > 0 ? additionalCosts : [],
      };
      if (property) {
        const { error } = await supabase
          .from("properties")
          .update(data)
          .eq("id", property.id);
        if (error) throw error;

        const changes = getPropertyChanges();
        if (changes.length > 0) {
          await supabase.from("property_history").insert([
            {
              property_id: property.id,
              user_id: user.id,
              event_type: "property_updated",
              event_description: `Immobiliendaten aktualisiert: ${changes.join(', ')}`,
            },
          ]);
        }
      } else {
        const { error } = await supabase.from("properties").insert([data]);
        if (error) throw error;
      }
      onSave();
    } catch (error) {
      console.error("Error saving property:", error);
      alert("Fehler beim Speichern der Immobilie");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {" "}
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {" "}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          {" "}
          <h2 className="text-2xl font-bold text-dark">
            {" "}
            {property ? "Immobilie bearbeiten" : "Neue Immobilie"}{" "}
          </h2>{" "}
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            {" "}
            <X className="w-6 h-6" />{" "}
          </button>{" "}
        </div>{" "}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div className="col-span-2">
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Bezeichnung *{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. Wohnung Musterstraße 1"
                required
              />{" "}
            </div>{" "}
            <div className="col-span-2">
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Straße und Hausnummer *{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. Musterstraße 1"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                PLZ *{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) =>
                  setFormData({ ...formData, zip_code: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 12345"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Stadt *{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. Berlin"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Land *{" "}
              </label>{" "}
              <select
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              >
                {" "}
                <option value="Deutschland">Deutschland</option>{" "}
                <option value="Österreich">Österreich</option>{" "}
                <option value="Schweiz">Schweiz</option>{" "}
                <option value="Belgien">Belgien</option>{" "}
                <option value="Dänemark">Dänemark</option>{" "}
                <option value="Frankreich">Frankreich</option>{" "}
                <option value="Italien">Italien</option>{" "}
                <option value="Niederlande">Niederlande</option>{" "}
                <option value="Polen">Polen</option>{" "}
                <option value="Spanien">Spanien</option>{" "}
                <option value="Tschechien">Tschechien</option>{" "}
                <option value="Sonstiges">Sonstiges</option>{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Immobilientyp{" "}
              </label>{" "}
              <select
                value={formData.property_type}
                onChange={(e) =>
                  setFormData({ ...formData, property_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                {" "}
                <option value="multi_family">Mehrfamilienhaus</option>{" "}
                <option value="house">Einfamilienhaus</option>{" "}
                <option value="commercial">Gewerbeeinheit</option>{" "}
                <option value="parking">Garage/Stellplatz</option>{" "}
                <option value="land">Grundstück</option>{" "}
                <option value="other">Sonstiges</option>{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Immobilienverwaltung{" "}
              </label>{" "}
              <select
                value={formData.property_management_type}
                onChange={(e) =>
                  setFormData({ ...formData, property_management_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                {" "}
                <option value="self_management">Eigenverwaltung</option>{" "}
                <option value="property_management">Hausverwaltung</option>{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Kaufdatum *{" "}
              </label>{" "}
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Kaufpreis (€){" "}
              </label>{" "}
              <input
                type="text"
                value={formData.purchase_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchase_price: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 250000 oder 250.000,50"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Aktueller Wert (€){" "}
              </label>{" "}
              <input
                type="text"
                value={formData.current_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_value: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 280000 oder 280.000,00"
              />{" "}
            </div>{" "}

            {/* Kaufnebenkosten Sektion */}
            <div className="col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Kaufnebenkosten</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Maklerkosten (€)
              </label>
              <input
                type="text"
                value={formData.broker_costs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    broker_costs: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 7500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Notarkosten (€)
              </label>
              <input
                type="text"
                value={formData.notary_costs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notary_costs: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 3000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Anwaltskosten (€)
              </label>
              <input
                type="text"
                value={formData.lawyer_costs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lawyer_costs: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 1500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Grunderwerbsteuer (€)
              </label>
              <input
                type="text"
                value={formData.real_estate_transfer_tax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    real_estate_transfer_tax: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Eintragungskosten (€)
              </label>
              <input
                type="text"
                value={formData.registration_costs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_costs: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Gutachterkosten (€)
              </label>
              <input
                type="text"
                value={formData.expert_costs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expert_costs: parseNumberInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="z.B. 800"
              />
            </div>

            {/* Zusätzliche Kaufnebenkosten */}
            <div className="col-span-2 mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Weitere Nebenkosten
              </label>
              {additionalCosts.map((cost, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={cost.name}
                    onChange={(e) => {
                      const newCosts = [...additionalCosts];
                      newCosts[index].name = e.target.value;
                      setAdditionalCosts(newCosts);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Bezeichnung"
                  />
                  <input
                    type="text"
                    value={cost.amount}
                    onChange={(e) => {
                      const newCosts = [...additionalCosts];
                      newCosts[index].amount = parseNumberInput(e.target.value);
                      setAdditionalCosts(newCosts);
                    }}
                    className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Betrag"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newCosts = additionalCosts.filter((_, i) => i !== index);
                      setAdditionalCosts(newCosts);
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAdditionalCosts([...additionalCosts, { name: "", amount: 0 }])}
                className="text-sm text-primary-blue hover:text-primary-blue/80 font-medium"
              >
                + Weitere Nebenkosten hinzufügen
              </button>
            </div>

            {formData.property_type !== "parking" && (
              <>
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {" "}
                    Wohnfläche (m²){" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.size_sqm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size_sqm: parseNumberInput(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. 75,5"
                  />{" "}
                </div>
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {" "}
                    Nutzfläche (m²){" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.usable_area_sqm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usable_area_sqm: parseNumberInput(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. 85,0"
                  />{" "}
                </div>
              </>
            )}{" "}
            {formData.property_type === "parking" && (
              <div className="col-span-2">
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Stellplatznummer (optional){" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.parking_spot_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parking_spot_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. P-12 oder A5"
                />{" "}
              </div>
            )}{" "}
            <div className="col-span-2">
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Beschreibung{" "}
              </label>{" "}
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                rows={3}
                placeholder="Zusätzliche Informationen..."
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex gap-3 pt-4">
            {" "}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {" "}
              Abbrechen{" "}
            </button>{" "}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
            >
              {" "}
              {loading ? "Speichern..." : "Speichern"}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
}
