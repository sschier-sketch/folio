import { useState, useEffect } from "react";
import { X, Plus, Trash2, ArrowLeft, Check, Building2, Info } from "lucide-react";
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
  ownership_type?: string;
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

interface Unit {
  unit_number: string;
  floor: string;
  size_sqm: string;
  rooms: string;
  unit_type: string;
  description: string;
  purchase_price?: string;
  current_value?: string;
  purchase_date?: string;
  broker_costs?: string;
  notary_costs?: string;
  lawyer_costs?: string;
  real_estate_transfer_tax?: string;
  registration_costs?: string;
  expert_costs?: string;
  additional_purchase_costs?: Array<{name: string, amount: number}>;
}

export default function PropertyModal({
  property,
  onClose,
  onSave,
}: PropertyModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'property' | 'units'>(property ? 'property' : 'property');
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    zip_code: "",
    city: "",
    country: "Deutschland",
    property_type: "multi_family",
    property_management_type: "self_management",
    ownership_type: "full_property",
    purchase_price: "",
    current_value: "",
    purchase_date: "",
    parking_spot_number: "",
    description: "",
    broker_costs: "",
    notary_costs: "",
    lawyer_costs: "",
    real_estate_transfer_tax: "",
    registration_costs: "",
    expert_costs: "",
  });
  const [additionalCosts, setAdditionalCosts] = useState<Array<{name: string, amount: number}>>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (property) {
      const propertyWithCosts = property as Property & {
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
        ownership_type: property.ownership_type || "full_property",
        purchase_price: property.purchase_price ? String(property.purchase_price) : "",
        current_value: property.current_value ? String(property.current_value) : "",
        purchase_date: property.purchase_date || "",
        parking_spot_number: property.parking_spot_number || "",
        description: property.description,
        broker_costs: propertyWithCosts.broker_costs ? String(propertyWithCosts.broker_costs) : "",
        notary_costs: propertyWithCosts.notary_costs ? String(propertyWithCosts.notary_costs) : "",
        lawyer_costs: propertyWithCosts.lawyer_costs ? String(propertyWithCosts.lawyer_costs) : "",
        real_estate_transfer_tax: propertyWithCosts.real_estate_transfer_tax ? String(propertyWithCosts.real_estate_transfer_tax) : "",
        registration_costs: propertyWithCosts.registration_costs ? String(propertyWithCosts.registration_costs) : "",
        expert_costs: propertyWithCosts.expert_costs ? String(propertyWithCosts.expert_costs) : "",
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

  const handleAddUnit = () => {
    const newUnit: Unit = {
      unit_number: "",
      floor: "",
      size_sqm: "",
      rooms: "",
      unit_type: "residential",
      description: "",
    };

    if (formData.ownership_type === "units_only") {
      newUnit.purchase_price = "";
      newUnit.current_value = "";
      newUnit.purchase_date = "";
      newUnit.broker_costs = "";
      newUnit.notary_costs = "";
      newUnit.lawyer_costs = "";
      newUnit.real_estate_transfer_tax = "";
      newUnit.registration_costs = "";
      newUnit.expert_costs = "";
      newUnit.additional_purchase_costs = [];
    }

    setUnits([...units, newUnit]);
  };

  const handleRemoveUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: keyof Unit, value: string) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Sie müssen angemeldet sein, um eine Immobilie zu speichern.");
      return;
    }

    if (!property && step === 'property') {
      setStep('units');
      return;
    }

    setLoading(true);
    console.log("Starting property save...", { property, formData, units });
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
        ownership_type: formData.ownership_type,
        purchase_price: formData.ownership_type === 'full_property' ? parseNumberInput(formData.purchase_price) : 0,
        current_value: formData.ownership_type === 'full_property' ? parseNumberInput(formData.current_value) : 0,
        purchase_date: formData.ownership_type === 'full_property' ? formData.purchase_date : null,
        user_id: user.id,
        parking_spot_number:
          formData.property_type === "parking"
            ? formData.parking_spot_number || null
            : null,
        description: formData.description,
        broker_costs: formData.ownership_type === 'full_property' && formData.broker_costs ? parseNumberInput(formData.broker_costs) : 0,
        notary_costs: formData.ownership_type === 'full_property' && formData.notary_costs ? parseNumberInput(formData.notary_costs) : 0,
        lawyer_costs: formData.ownership_type === 'full_property' && formData.lawyer_costs ? parseNumberInput(formData.lawyer_costs) : 0,
        real_estate_transfer_tax: formData.ownership_type === 'full_property' && formData.real_estate_transfer_tax ? parseNumberInput(formData.real_estate_transfer_tax) : 0,
        registration_costs: formData.ownership_type === 'full_property' && formData.registration_costs ? parseNumberInput(formData.registration_costs) : 0,
        expert_costs: formData.ownership_type === 'full_property' && formData.expert_costs ? parseNumberInput(formData.expert_costs) : 0,
        additional_purchase_costs: formData.ownership_type === 'full_property' && additionalCosts.length > 0 ? additionalCosts : [],
      };

      let propertyId: string;

      if (property) {
        console.log("Updating existing property...", data);
        const { error } = await supabase
          .from("properties")
          .update(data)
          .eq("id", property.id);
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        console.log("Property updated successfully");

        propertyId = property.id;

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
        console.log("Inserting new property...", data);
        const { data: newProperty, error } = await supabase
          .from("properties")
          .insert([data])
          .select()
          .single();
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        console.log("Property inserted successfully", newProperty);
        propertyId = newProperty.id;

        if (units.length > 0) {
          const unitsData = units.map((unit) => {
            const baseData: any = {
              property_id: propertyId,
              user_id: user.id,
              unit_number: unit.unit_number,
              floor: unit.floor,
              size_sqm: unit.size_sqm ? parseNumberInput(unit.size_sqm) : null,
              rooms: unit.rooms ? parseNumberInput(unit.rooms) : null,
              unit_type: unit.unit_type,
              status: "vacant",
              description: unit.description,
            };

            if (formData.ownership_type === 'units_only') {
              baseData.purchase_price = unit.purchase_price ? parseNumberInput(unit.purchase_price) : 0;
              baseData.current_value = unit.current_value ? parseNumberInput(unit.current_value) : 0;
              baseData.purchase_date = unit.purchase_date || null;
              baseData.broker_costs = unit.broker_costs ? parseNumberInput(unit.broker_costs) : 0;
              baseData.notary_costs = unit.notary_costs ? parseNumberInput(unit.notary_costs) : 0;
              baseData.lawyer_costs = unit.lawyer_costs ? parseNumberInput(unit.lawyer_costs) : 0;
              baseData.real_estate_transfer_tax = unit.real_estate_transfer_tax ? parseNumberInput(unit.real_estate_transfer_tax) : 0;
              baseData.registration_costs = unit.registration_costs ? parseNumberInput(unit.registration_costs) : 0;
              baseData.expert_costs = unit.expert_costs ? parseNumberInput(unit.expert_costs) : 0;
              baseData.additional_purchase_costs = unit.additional_purchase_costs && unit.additional_purchase_costs.length > 0 ? unit.additional_purchase_costs : [];
            }

            return baseData;
          });

          const { error: unitsError } = await supabase
            .from("property_units")
            .insert(unitsData);

          if (unitsError) throw unitsError;
        }
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving property:", error);
      const errorMessage = error?.message || "Unbekannter Fehler";
      const errorDetails = error?.details || "";
      const errorHint = error?.hint || "";
      alert(`Fehler beim Speichern der Immobilie:\n\n${errorMessage}\n${errorDetails}\n${errorHint}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipUnits = () => {
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {step === 'units' && (
              <button
                type="button"
                onClick={() => setStep('property')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-dark">
              {property ? "Immobilie bearbeiten" : step === 'property' ? "Neue Immobilie" : "Einheiten hinzufügen"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'property' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Bezeichnung *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Wohnung Musterstraße 1"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Straße und Hausnummer *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Musterstraße 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  PLZ *
                </label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) =>
                    setFormData({ ...formData, zip_code: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Stadt *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Berlin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Land *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="Deutschland">Deutschland</option>
                  <option value="Österreich">Österreich</option>
                  <option value="Schweiz">Schweiz</option>
                  <option value="Belgien">Belgien</option>
                  <option value="Dänemark">Dänemark</option>
                  <option value="Frankreich">Frankreich</option>
                  <option value="Italien">Italien</option>
                  <option value="Niederlande">Niederlande</option>
                  <option value="Polen">Polen</option>
                  <option value="Spanien">Spanien</option>
                  <option value="Tschechien">Tschechien</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Immobilientyp
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) =>
                    setFormData({ ...formData, property_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="multi_family">Mehrfamilienhaus</option>
                  <option value="house">Einfamilienhaus</option>
                  <option value="apartment">Wohnung</option>
                  <option value="commercial">Gewerbeeinheit</option>
                  <option value="parking">Garage/Stellplatz</option>
                  <option value="land">Grundstück</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Immobilienverwaltung
                </label>
                <select
                  value={formData.property_management_type}
                  onChange={(e) =>
                    setFormData({ ...formData, property_management_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="self_management">Eigenverwaltung</option>
                  <option value="property_management">Hausverwaltung</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Besitzvariante *
                </label>
                <select
                  value={formData.ownership_type}
                  onChange={(e) => {
                    setFormData({ ...formData, ownership_type: e.target.value });
                    if (e.target.value === 'units_only') {
                      setUnits(units.map(unit => ({
                        ...unit,
                        purchase_price: unit.purchase_price || "",
                        current_value: unit.current_value || "",
                        purchase_date: unit.purchase_date || "",
                        broker_costs: unit.broker_costs || "",
                        notary_costs: unit.notary_costs || "",
                        lawyer_costs: unit.lawyer_costs || "",
                        real_estate_transfer_tax: unit.real_estate_transfer_tax || "",
                        registration_costs: unit.registration_costs || "",
                        expert_costs: unit.expert_costs || "",
                        additional_purchase_costs: unit.additional_purchase_costs || [],
                      })));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="full_property">Gesamte Immobilie im Besitz</option>
                  <option value="units_only">Nur einzelne Einheiten im Besitz (Teileigentum)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.ownership_type === 'full_property'
                    ? 'Sie besitzen die gesamte Immobilie und tragen die Kaufdaten auf Immobilienebene ein.'
                    : 'Sie besitzen nur einzelne Einheiten (z.B. Eigentumswohnungen) und tragen die Kaufdaten bei den jeweiligen Einheiten ein.'
                  }
                </p>
              </div>

              {formData.ownership_type === 'full_property' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kaufdatum
                    </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Kaufpreis (€)
                </label>
                <input
                  type="text"
                  value={formData.purchase_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchase_price: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 250000 oder 250.000,50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Aktueller Wert (€)
                </label>
                <input
                  type="text"
                  value={formData.current_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_value: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 280000 oder 280.000,00"
                />
              </div>

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
                      broker_costs: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 7500 oder 7.500,00"
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
                      notary_costs: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 3000 oder 3.000,00"
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
                      lawyer_costs: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 1500 oder 1.500,00"
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
                      real_estate_transfer_tax: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 15000 oder 15.000,00"
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
                      registration_costs: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 500 oder 500,00"
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
                      expert_costs: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 800 oder 800,00"
                />
              </div>

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
                </>
              )}

              {formData.property_type === "parking" && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Stellplatznummer (optional)
                  </label>
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
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
              >
                {loading ? "Speichern..." : property ? "Speichern" : "Weiter zu Einheiten"}
              </button>
            </div>
          </form>
        )}

        {step === 'units' && (
          <div className="p-6 space-y-4">
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Sie können jetzt Einheiten für diese Immobilie anlegen. Dies können z.B. einzelne Wohnungen in einem Mehrfamilienhaus sein.
              </p>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  Sie können Einheiten auch später über den Tab "Einheiten" hinzufügen oder diesen Schritt überspringen.
                </p>
              </div>
            </div>

            {units.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Noch keine Einheiten hinzugefügt</p>
                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Erste Einheit hinzufügen
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {units.map((unit, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-dark">Einheit {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Einheitennummer *
                          </label>
                          <input
                            type="text"
                            value={unit.unit_number}
                            onChange={(e) => handleUnitChange(index, 'unit_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                            placeholder="z.B. 1.OG links"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Stockwerk
                          </label>
                          <input
                            type="text"
                            value={unit.floor}
                            onChange={(e) => handleUnitChange(index, 'floor', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                            placeholder="z.B. 1. OG"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Wohnfläche (m²)
                          </label>
                          <input
                            type="text"
                            value={unit.size_sqm}
                            onChange={(e) => handleUnitChange(index, 'size_sqm', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                            placeholder="z.B. 75,5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Zimmer
                          </label>
                          <input
                            type="text"
                            value={unit.rooms}
                            onChange={(e) => handleUnitChange(index, 'rooms', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                            placeholder="z.B. 3,5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Typ
                          </label>
                          <select
                            value={unit.unit_type}
                            onChange={(e) => handleUnitChange(index, 'unit_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                          >
                            <option value="residential">Wohnung</option>
                            <option value="commercial">Gewerbe</option>
                            <option value="storage">Lager</option>
                            <option value="garage">Garage</option>
                            <option value="other">Sonstiges</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Beschreibung
                          </label>
                          <input
                            type="text"
                            value={unit.description}
                            onChange={(e) => handleUnitChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                            placeholder="Zusätzliche Informationen..."
                          />
                        </div>

                        {formData.ownership_type === 'units_only' && (
                          <>
                            <div className="col-span-2 pt-3 border-t border-gray-300 mt-3">
                              <h5 className="text-xs font-semibold text-gray-700 mb-2">Kaufdaten für diese Einheit</h5>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Kaufpreis (€)
                              </label>
                              <input
                                type="text"
                                value={unit.purchase_price || ""}
                                onChange={(e) => handleUnitChange(index, 'purchase_price', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                                placeholder="z.B. 250000"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Aktueller Wert (€)
                              </label>
                              <input
                                type="text"
                                value={unit.current_value || ""}
                                onChange={(e) => handleUnitChange(index, 'current_value', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                                placeholder="z.B. 280000"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Kaufdatum
                              </label>
                              <input
                                type="date"
                                value={unit.purchase_date || ""}
                                onChange={(e) => handleUnitChange(index, 'purchase_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Maklerkosten (€)
                              </label>
                              <input
                                type="text"
                                value={unit.broker_costs || ""}
                                onChange={(e) => handleUnitChange(index, 'broker_costs', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                                placeholder="z.B. 7500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Notarkosten (€)
                              </label>
                              <input
                                type="text"
                                value={unit.notary_costs || ""}
                                onChange={(e) => handleUnitChange(index, 'notary_costs', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                                placeholder="z.B. 3000"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Grunderwerbsteuer (€)
                              </label>
                              <input
                                type="text"
                                value={unit.real_estate_transfer_tax || ""}
                                onChange={(e) => handleUnitChange(index, 'real_estate_transfer_tax', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                                placeholder="z.B. 15000"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-blue hover:text-primary-blue transition-colors font-medium"
                >
                  + Weitere Einheit hinzufügen
                </button>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSkipUnits}
                disabled={loading}
                style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors disabled:opacity-50"
              >
                Überspringen
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || units.length === 0 || units.some(u => !u.unit_number)}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Speichern..." : (
                  <>
                    <Check className="w-4 h-4" />
                    Immobilie erstellen
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
