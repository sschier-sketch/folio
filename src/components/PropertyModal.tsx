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
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  rooms: number | null;
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
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    zip_code: "",
    city: "",
    country: "Deutschland",
    property_type: "apartment",
    purchase_price: 0,
    current_value: 0,
    purchase_date: "",
    size_sqm: 0,
    rooms: 0,
    parking_spot_number: "",
    description: "",
  });
  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        street: property.street || "",
        zip_code: property.zip_code || "",
        city: property.city || "",
        country: property.country || "Deutschland",
        property_type: property.property_type,
        purchase_price: property.purchase_price,
        current_value: property.current_value,
        purchase_date: property.purchase_date || "",
        size_sqm: property.size_sqm || 0,
        rooms: property.rooms || 0,
        parking_spot_number: property.parking_spot_number || "",
        description: property.description,
      });
    }
  }, [property]);
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
        purchase_price: formData.purchase_price,
        current_value: formData.current_value,
        purchase_date: formData.purchase_date,
        user_id: user.id,
        size_sqm:
          formData.property_type === "parking"
            ? null
            : formData.size_sqm || null,
        rooms:
          formData.property_type === "parking" ? null : formData.rooms || null,
        parking_spot_number:
          formData.property_type === "parking"
            ? formData.parking_spot_number || null
            : null,
        description: formData.description,
      };
      if (property) {
        const { error } = await supabase
          .from("properties")
          .update(data)
          .eq("id", property.id);
        if (error) throw error;
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
                <option value="apartment">Eigentumswohnung</option>{" "}
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
            {formData.property_type !== "parking" && (
              <>
                {" "}
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
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {" "}
                    Anzahl Zimmer{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.rooms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rooms: parseNumberInput(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. 3 oder 3,5"
                  />{" "}
                </div>{" "}
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
