import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { parseNumberInput } from "../lib/utils";
interface Tenant {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}
interface Contract {
  id: string;
  property_id: string;
  base_rent: number;
  additional_costs: number;
  deposit: number;
  contract_start: string;
  contract_end: string | null;
  contract_type: string;
  rent_increase_type?: string;
  staffel_amount?: number;
  staffel_type?: string;
  staffel_years?: number;
  index_first_increase_date?: string;
  auto_create_rent_increase_tickets?: boolean;
  notes: string;
}
interface Property {
  id: string;
  name: string;
}
interface RentalContractModalProps {
  contract: (Contract & { tenants?: Tenant[] }) | null;
  properties: Property[];
  onClose: () => void;
  onSave: () => void;
}
export default function RentalContractModal({
  contract,
  properties,
  onClose,
  onSave,
}: RentalContractModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    base_rent: 0,
    additional_costs: 0,
    deposit: 0,
    contract_start: "",
    contract_end: "",
    contract_type: "unlimited",
    rent_increase_type: "none",
    staffel_amount: 0,
    staffel_type: "fixed",
    staffel_years: 1,
    index_first_increase_date: "",
    auto_create_rent_increase_tickets: false,
    notes: "",
  });
  const [tenants, setTenants] = useState<Tenant[]>([
    { first_name: "", last_name: "", email: "", phone: "" },
  ]);
  useEffect(() => {
    if (contract) {
      setFormData({
        property_id: contract.property_id,
        base_rent: contract.base_rent,
        additional_costs: contract.additional_costs,
        deposit: contract.deposit,
        contract_start: contract.contract_start,
        contract_end: contract.contract_end || "",
        contract_type: contract.contract_type,
        rent_increase_type: contract.rent_increase_type || "none",
        staffel_amount: contract.staffel_amount || 0,
        staffel_type: contract.staffel_type || "fixed",
        staffel_years: contract.staffel_years || 1,
        index_first_increase_date: contract.index_first_increase_date || "",
        auto_create_rent_increase_tickets:
          contract.auto_create_rent_increase_tickets || false,
        notes: contract.notes,
      });
      if (contract.tenants && contract.tenants.length > 0) {
        setTenants(contract.tenants);
      }
    }
  }, [contract]);
  const addTenant = () => {
    setTenants([
      ...tenants,
      { first_name: "", last_name: "", email: "", phone: "" },
    ]);
  };
  const removeTenant = (index: number) => {
    if (tenants.length > 1) {
      setTenants(tenants.filter((_, i) => i !== index));
    }
  };
  const updateTenant = (index: number, field: keyof Tenant, value: string) => {
    const newTenants = [...tenants];
    newTenants[index] = { ...newTenants[index], [field]: value };
    setTenants(newTenants);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (tenants.some((t) => !t.first_name || !t.last_name)) {
      alert("Bitte füllen Sie Vor- und Nachname für alle Mieter aus");
      return;
    }
    setLoading(true);
    try {
      const totalRent =
        Number(formData.base_rent) + Number(formData.additional_costs);
      const contractData = {
        property_id: formData.property_id,
        user_id: user.id,
        base_rent: Number(formData.base_rent),
        additional_costs: Number(formData.additional_costs),
        total_rent: totalRent,
        deposit: Number(formData.deposit),
        contract_start: formData.contract_start,
        contract_end: formData.contract_end || null,
        contract_type: formData.contract_type,
        rent_increase_type: formData.rent_increase_type,
        staffel_amount:
          formData.rent_increase_type === "staffel"
            ? Number(formData.staffel_amount)
            : null,
        staffel_type:
          formData.rent_increase_type === "staffel"
            ? formData.staffel_type
            : null,
        staffel_years:
          formData.rent_increase_type === "staffel"
            ? Number(formData.staffel_years)
            : null,
        index_first_increase_date:
          formData.rent_increase_type === "index"
            ? formData.index_first_increase_date || null
            : null,
        auto_create_rent_increase_tickets:
          formData.rent_increase_type !== "none"
            ? formData.auto_create_rent_increase_tickets
            : false,
        notes: formData.notes,
      };
      let contractId: string;
      if (contract) {
        const { error } = await supabase
          .from("rental_contracts")
          .update(contractData)
          .eq("id", contract.id);
        if (error) throw error;
        contractId = contract.id;
        const existingTenantIds =
          contract.tenants?.map((t) => t.id).filter(Boolean) || [];
        for (const existingId of existingTenantIds) {
          const stillExists = tenants.find((t) => t.id === existingId);
          if (!stillExists) {
            await supabase.from("tenants").delete().eq("id", existingId);
          }
        }
      } else {
        const { data, error } = await supabase
          .from("rental_contracts")
          .insert([contractData])
          .select()
          .single();
        if (error) throw error;
        contractId = data.id;
      }
      for (const tenant of tenants) {
        const tenantData = {
          contract_id: contractId,
          user_id: user.id,
          first_name: tenant.first_name,
          last_name: tenant.last_name,
          email: tenant.email || null,
          phone: tenant.phone || null,
          is_active: true,
        };
        if (tenant.id) {
          const { error } = await supabase
            .from("tenants")
            .update(tenantData)
            .eq("id", tenant.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("tenants").insert([tenantData]);
          if (error) throw error;
        }
      }
      onSave();
    } catch (error) {
      console.error("Error saving rental contract:", error);
      alert("Fehler beim Speichern des Mietverhältnisses");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {" "}
      <div className="bg-white rounded-md w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {" "}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          {" "}
          <h2 className="text-2xl font-bold text-dark">
            {" "}
            {contract
              ? "Mietverhältnis bearbeiten"
              : "Neues Mietverhältnis"}{" "}
          </h2>{" "}
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            {" "}
            <X className="w-6 h-6" />{" "}
          </button>{" "}
        </div>{" "}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {" "}
          <div>
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
              disabled={!!contract}
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
          <div className="space-y-4">
            {" "}
            <div className="flex justify-between items-center">
              {" "}
              <h3 className="font-semibold text-dark text-lg">Mieter</h3>{" "}
              <button
                type="button"
                onClick={addTenant}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                {" "}
                <Plus className="w-4 h-4" /> Mieter hinzufügen{" "}
              </button>{" "}
            </div>{" "}
            <div className="space-y-3">
              {" "}
              {tenants.map((tenant, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  {" "}
                  <div className="flex justify-between items-center mb-2">
                    {" "}
                    <span className="text-sm font-medium text-gray-400">
                      Mieter {index + 1}
                    </span>{" "}
                    {tenants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTenant(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        {" "}
                        <Trash2 className="w-4 h-4" />{" "}
                      </button>
                    )}{" "}
                  </div>{" "}
                  <div className="grid grid-cols-2 gap-3">
                    {" "}
                    <input
                      type="text"
                      value={tenant.first_name}
                      onChange={(e) =>
                        updateTenant(index, "first_name", e.target.value)
                      }
                      className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Vorname *"
                      required
                    />{" "}
                    <input
                      type="text"
                      value={tenant.last_name}
                      onChange={(e) =>
                        updateTenant(index, "last_name", e.target.value)
                      }
                      className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Nachname *"
                      required
                    />{" "}
                    <input
                      type="email"
                      value={tenant.email}
                      onChange={(e) =>
                        updateTenant(index, "email", e.target.value)
                      }
                      className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="E-Mail"
                    />{" "}
                    <input
                      type="tel"
                      value={tenant.phone}
                      onChange={(e) =>
                        updateTenant(index, "phone", e.target.value)
                      }
                      className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Telefon"
                    />{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-4">
            {" "}
            <h3 className="font-semibold text-dark text-lg">Miete</h3>{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Kaltmiete (€) *{" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.base_rent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      base_rent: parseNumberInput(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. 3250"
                  required
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Nebenkosten (€){" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.additional_costs}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additional_costs: parseNumberInput(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. 250"
                />{" "}
              </div>{" "}
              <div className="col-span-2">
                {" "}
                <div className="bg-primary-blue/5 rounded-full p-4">
                  {" "}
                  <div className="text-sm text-primary-blue mb-1">
                    Warmmiete (gesamt)
                  </div>{" "}
                  <div className="text-2xl font-bold text-blue-900">
                    {" "}
                    {(
                      Number(formData.base_rent) +
                      Number(formData.additional_costs)
                    ).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="col-span-2">
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Kaution (€){" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.deposit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deposit: parseNumberInput(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. 9750"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-4">
            {" "}
            <h3 className="font-semibold text-dark text-lg">
              Vertragsdaten
            </h3>{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Vertragsbeginn *{" "}
                </label>{" "}
                <input
                  type="date"
                  value={formData.contract_start}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_start: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Vertragsende{" "}
                </label>{" "}
                <input
                  type="date"
                  value={formData.contract_end}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_end: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />{" "}
              </div>{" "}
              <div className="col-span-2">
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Vertragsart{" "}
                </label>{" "}
                <select
                  value={formData.contract_type}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_type: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {" "}
                  <option value="unlimited">Unbefristet</option>{" "}
                  <option value="fixed">Befristet</option>{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-4">
            {" "}
            <h3 className="font-semibold text-dark text-lg">
              Mietanpassung
            </h3>{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div className="col-span-2">
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Art der Mieterhöhung{" "}
                </label>{" "}
                <select
                  value={formData.rent_increase_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rent_increase_type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {" "}
                  <option value="none">Keine automatische Erhöhung</option>{" "}
                  <option value="index">Indexmiete</option>{" "}
                  <option value="staffel">Staffelmiete</option>{" "}
                </select>{" "}
              </div>{" "}
              {formData.rent_increase_type === "index" && (
                <div className="col-span-2">
                  {" "}
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {" "}
                    Erste Erhöhung am{" "}
                  </label>{" "}
                  <input
                    type="date"
                    value={formData.index_first_increase_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        index_first_increase_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />{" "}
                  <p className="text-xs text-gray-300 mt-1">
                    {" "}
                    Die Miete wird jährlich gemäß Verbraucherpreisindex
                    angepasst{" "}
                  </p>{" "}
                </div>
              )}{" "}
              {formData.rent_increase_type === "staffel" && (
                <>
                  {" "}
                  <div>
                    {" "}
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {" "}
                      Erhöhung alle (Jahre){" "}
                    </label>{" "}
                    <input
                      type="number"
                      min="1"
                      value={formData.staffel_years}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffel_years: parseNumberInput(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {" "}
                      Art der Erhöhung{" "}
                    </label>{" "}
                    <select
                      value={formData.staffel_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffel_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {" "}
                      <option value="fixed">Fester Betrag (€)</option>{" "}
                      <option value="percentage">Prozent (%)</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div className="col-span-2">
                    {" "}
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {" "}
                      {formData.staffel_type === "fixed"
                        ? "Betrag (€)"
                        : "Prozent (%)"}{" "}
                    </label>{" "}
                    <input
                      type="text"
                      value={formData.staffel_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffel_amount: parseNumberInput(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={
                        formData.staffel_type === "fixed" ? "z.B. 50" : "z.B. 3"
                      }
                    />{" "}
                    <p className="text-xs text-gray-300 mt-1">
                      {" "}
                      {formData.staffel_type === "fixed"
                        ? `Die Miete erhöht sich alle ${formData.staffel_years} Jahr(e) um ${formData.staffel_amount}€`
                        : `Die Miete erhöht sich alle ${formData.staffel_years} Jahr(e) um ${formData.staffel_amount}%`}{" "}
                    </p>{" "}
                  </div>{" "}
                </>
              )}{" "}
              {formData.rent_increase_type !== "none" && (
                <div className="col-span-2">
                  {" "}
                  <label className="flex items-center gap-2 cursor-pointer">
                    {" "}
                    <input
                      type="checkbox"
                      checked={formData.auto_create_rent_increase_tickets}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_create_rent_increase_tickets: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary-blue rounded focus:ring-2 focus:ring-blue-500"
                    />{" "}
                    <span className="text-sm text-gray-400">
                      {" "}
                      Automatisches Erinnerungs-Ticket erstellen (3 Monate vor
                      Erhöhung){" "}
                    </span>{" "}
                  </label>{" "}
                  <p className="text-xs text-gray-300 mt-1 ml-6">
                    {" "}
                    Es wird automatisch ein Ticket erstellt, um Sie an die
                    bevorstehende Mieterhöhung zu erinnern{" "}
                  </p>{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-4">
            {" "}
            <div className="grid grid-cols-1 gap-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Notizen{" "}
                </label>{" "}
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />{" "}
              </div>{" "}
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
