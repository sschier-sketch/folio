import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
interface Tenant {
  id: string;
  property_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  is_active: boolean;
}
interface Property {
  id: string;
  name: string;
}
interface TenantModalProps {
  tenant: Tenant | null;
  properties: Property[];
  onClose: () => void;
  onSave: () => void;
}
export default function TenantModal({
  tenant,
  properties,
  onClose,
  onSave,
}: TenantModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    move_in_date: "",
    move_out_date: "",
    is_active: true,
    base_rent: "",
    additional_costs: "",
    deposit: "",
    contract_type: "unlimited",
  });
  useEffect(() => {
    if (tenant) {
      setFormData({
        property_id: tenant.property_id,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email || "",
        phone: tenant.phone || "",
        move_in_date: tenant.move_in_date || "",
        move_out_date: tenant.move_out_date || "",
        is_active: tenant.is_active,
        base_rent: "",
        additional_costs: "",
        deposit: "",
        contract_type: "unlimited",
      });
    }
  }, [tenant]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (tenant) {
        const data = {
          property_id: formData.property_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          name: `${formData.first_name} ${formData.last_name}`,
          email: formData.email || null,
          phone: formData.phone || null,
          move_in_date: formData.move_in_date || null,
          move_out_date: formData.move_out_date || null,
          is_active: formData.is_active,
          user_id: user.id,
        };
        const { error } = await supabase
          .from("tenants")
          .update(data)
          .eq("id", tenant.id);
        if (error) throw error;
      } else {
        const baseRent = parseFloat(formData.base_rent) || 0;
        const additionalCosts = parseFloat(formData.additional_costs) || 0;
        const totalRent = baseRent + additionalCosts;

        const { data: newTenant, error: tenantError } = await supabase
          .from("tenants")
          .insert([
            {
              property_id: formData.property_id || null,
              first_name: formData.first_name,
              last_name: formData.last_name,
              name: `${formData.first_name} ${formData.last_name}`,
              email: formData.email || null,
              phone: formData.phone || null,
              move_in_date: formData.move_in_date || null,
              move_out_date: formData.move_out_date || null,
              is_active: formData.is_active,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (tenantError) throw tenantError;

        const { error: contractError } = await supabase
          .from("rental_contracts")
          .insert([
            {
              tenant_id: newTenant.id,
              property_id: formData.property_id,
              user_id: user.id,
              base_rent: baseRent,
              additional_costs: additionalCosts,
              total_rent: totalRent,
              monthly_rent: baseRent,
              utilities_advance: additionalCosts,
              deposit: parseFloat(formData.deposit) || 0,
              deposit_amount: parseFloat(formData.deposit) || 0,
              contract_start: formData.move_in_date || null,
              start_date: formData.move_in_date || null,
              contract_end: formData.move_out_date || null,
              end_date: formData.move_out_date || null,
              contract_type: formData.contract_type,
              status: "active",
            },
          ]);

        if (contractError) throw contractError;

        const { error: updateError } = await supabase
          .from("tenants")
          .update({ contract_id: newTenant.id })
          .eq("id", newTenant.id);

        if (updateError) console.warn("Could not link contract:", updateError);
      }
      onSave();
    } catch (error) {
      console.error("Error saving tenant:", error);
      alert("Fehler beim Speichern des Mietverhältnisses");
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
            {tenant ? "Mieter bearbeiten" : "Neues Mietverhältnis"}{" "}
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
                Immobilie *{" "}
              </label>{" "}
              <select
                value={formData.property_id}
                onChange={(e) =>
                  setFormData({ ...formData, property_id: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                {" "}
                <option value="">Bitte wählen...</option>{" "}
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {" "}
                    {property.name}{" "}
                  </option>
                ))}{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Vorname *{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Nachname *{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                E-Mail{" "}
              </label>{" "}
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Telefon{" "}
              </label>{" "}
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Einzugsdatum{" "}
              </label>{" "}
              <input
                type="date"
                value={formData.move_in_date}
                onChange={(e) =>
                  setFormData({ ...formData, move_in_date: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {" "}
                Auszugsdatum{" "}
              </label>{" "}
              <input
                type="date"
                value={formData.move_out_date}
                onChange={(e) =>
                  setFormData({ ...formData, move_out_date: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />{" "}
            </div>{" "}
            <div className="col-span-2">
              {" "}
              <label className="flex items-center gap-2">
                {" "}
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-blue rounded focus:ring-blue-500"
                />{" "}
                <span className="text-sm font-medium text-gray-400">
                  Aktiver Mieter
                </span>{" "}
              </label>{" "}
            </div>{" "}
          </div>{" "}
          {!tenant && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-dark mb-4">
                  Mietvertrag
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kaltmiete (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.base_rent}
                      onChange={(e) =>
                        setFormData({ ...formData, base_rent: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Nebenkosten (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.additional_costs}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          additional_costs: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kaution (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) =>
                        setFormData({ ...formData, deposit: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Vertragsart
                    </label>
                    <select
                      value={formData.contract_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contract_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="unlimited">Unbefristet</option>
                      <option value="limited">Befristet</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
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
