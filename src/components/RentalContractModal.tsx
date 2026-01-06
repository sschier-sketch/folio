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
  company_name?: string;
  date_of_birth?: string;
}
interface Contract {
  id: string;
  property_id: string;
  unit_id?: string | null;
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

interface PropertyUnit {
  id: string;
  unit_number: string;
  unit_type: string;
  floor: number | null;
  area_sqm: number | null;
  status: string;
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
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    base_rent: 0,
    additional_costs: 0,
    deposit: 0,
    deposit_type: "",
    deposit_account: "",
    deposit_received_date: "",
    contract_start: "",
    contract_end: "",
    contract_type: "unlimited",
    rent_increase_type: "none",
    staffel_amount: 0,
    staffel_type: "fixed",
    staffel_years: 1,
    index_first_increase_date: "",
    auto_create_rent_increase_tickets: false,
    is_sublet: false,
    vat_applicable: false,
    graduated_rent_date: "",
    notes: "",
  });
  const [tenants, setTenants] = useState<Tenant[]>([
    { first_name: "", last_name: "", email: "", phone: "", company_name: "", date_of_birth: "" },
  ]);
  useEffect(() => {
    if (contract) {
      const contractWithDeposit = contract as Contract & {
        deposit_type?: string;
        deposit_account?: string;
        deposit_received_date?: string;
        tenants?: Tenant[];
      };
      const contractWithAll = contractWithDeposit as typeof contractWithDeposit & {
        is_sublet?: boolean;
        vat_applicable?: boolean;
        graduated_rent_date?: string;
      };

      setFormData({
        property_id: contractWithAll.property_id,
        unit_id: contractWithAll.unit_id || "",
        base_rent: contractWithAll.base_rent,
        additional_costs: contractWithAll.additional_costs,
        deposit: contractWithAll.deposit,
        deposit_type: contractWithAll.deposit_type || "",
        deposit_account: contractWithAll.deposit_account || "",
        deposit_received_date: contractWithAll.deposit_received_date || "",
        contract_start: contractWithAll.contract_start,
        contract_end: contractWithAll.contract_end || "",
        contract_type: contractWithAll.contract_type,
        rent_increase_type: contractWithAll.rent_increase_type || "none",
        staffel_amount: contractWithAll.staffel_amount || 0,
        staffel_type: contractWithAll.staffel_type || "fixed",
        staffel_years: contractWithAll.staffel_years || 1,
        index_first_increase_date: contractWithAll.index_first_increase_date || "",
        auto_create_rent_increase_tickets:
          contractWithAll.auto_create_rent_increase_tickets || false,
        is_sublet: contractWithAll.is_sublet || false,
        vat_applicable: contractWithAll.vat_applicable || false,
        graduated_rent_date: contractWithAll.graduated_rent_date || "",
        notes: contractWithAll.notes,
      });
      if (contractWithDeposit.tenants && contractWithDeposit.tenants.length > 0) {
        setTenants(contractWithDeposit.tenants);
      }
    }
  }, [contract]);

  useEffect(() => {
    if (formData.property_id) {
      loadUnits(formData.property_id);
    } else {
      setUnits([]);
      setFormData((prev) => ({ ...prev, unit_id: "" }));
    }
  }, [formData.property_id]);

  async function loadUnits(propertyId: string) {
    setLoadingUnits(true);
    try {
      const { data, error } = await supabase
        .from("property_units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error("Error loading units:", error);
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }
  const addTenant = () => {
    setTenants([
      ...tenants,
      { first_name: "", last_name: "", email: "", phone: "", company_name: "", date_of_birth: "" },
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
        unit_id: formData.unit_id || null,
        user_id: user.id,
        base_rent: Number(formData.base_rent),
        additional_costs: Number(formData.additional_costs),
        total_rent: totalRent,
        deposit: Number(formData.deposit),
        deposit_type: formData.deposit_type || null,
        deposit_account: formData.deposit_account || null,
        deposit_received_date: formData.deposit_received_date || null,
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
        is_sublet: formData.is_sublet,
        vat_applicable: formData.vat_applicable,
        graduated_rent_date: formData.rent_increase_type === "graduated" ? formData.graduated_rent_date : null,
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
          company_name: tenant.company_name || null,
          date_of_birth: tenant.date_of_birth || null,
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {" "}
              Immobilie *{" "}
            </label>{" "}
            <select
              value={formData.property_id}
              onChange={(e) =>
                setFormData({ ...formData, property_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
          {formData.property_id && (
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {" "}
                Einheit {units.length > 0 && "*"}{" "}
              </label>{" "}
              {loadingUnits ? (
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-400">
                  Lädt Einheiten...
                </div>
              ) : units.length === 0 ? (
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-400 bg-gray-50">
                  Keine Einheiten vorhanden
                </div>
              ) : (
                <select
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required={units.length > 0}
                >
                  {" "}
                  <option value="">Bitte wählen...</option>{" "}
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {" "}
                      {unit.unit_number}
                      {unit.floor !== null && ` - ${unit.floor}. OG`}
                      {unit.area_sqm && ` - ${unit.area_sqm} m²`}
                      {unit.status === "rented" && " (Vermietet)"}
                      {" "}
                    </option>
                  ))}{" "}
                </select>
              )}{" "}
            </div>
          )}{" "}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_sublet}
                  onChange={(e) =>
                    setFormData({ ...formData, is_sublet: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-2 focus:ring-primary-blue"
                />
                <span className="text-sm font-medium text-gray-700">Untermietverhältnis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.vat_applicable}
                  onChange={(e) =>
                    setFormData({ ...formData, vat_applicable: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-2 focus:ring-primary-blue"
                />
                <span className="text-sm font-medium text-gray-700">Mehrwertsteuer berechnen</span>
              </label>
            </div>
          </div>
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
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      placeholder="Vorname *"
                      required
                    />{" "}
                    <input
                      type="text"
                      value={tenant.last_name}
                      onChange={(e) =>
                        updateTenant(index, "last_name", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      placeholder="Nachname *"
                      required
                    />{" "}
                    <input
                      type="email"
                      value={tenant.email}
                      onChange={(e) =>
                        updateTenant(index, "email", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      placeholder="E-Mail"
                    />{" "}
                    <input
                      type="tel"
                      value={tenant.phone}
                      onChange={(e) =>
                        updateTenant(index, "phone", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      placeholder="Telefon"
                    />{" "}
                    <input
                      type="text"
                      value={tenant.company_name || ""}
                      onChange={(e) =>
                        updateTenant(index, "company_name", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      placeholder="Firmenname (optional)"
                    />{" "}
                    <input
                      type="date"
                      value={tenant.date_of_birth || ""}
                      onChange={(e) =>
                        updateTenant(index, "date_of_birth", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      placeholder="Geburtsdatum (optional)"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. 9750"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Kautionsart{" "}
                </label>{" "}
                <select
                  value={formData.deposit_type}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  {" "}
                  <option value="">Bitte wählen...</option>{" "}
                  <option value="cash">Bar</option>{" "}
                  <option value="bank_account">Bankkonto</option>{" "}
                  <option value="deposit_account">Mietkautionskonto</option>{" "}
                  <option value="guarantee">Bürgschaft</option>{" "}
                </select>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Eingangsdatum{" "}
                </label>{" "}
                <input
                  type="date"
                  value={formData.deposit_received_date}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_received_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />{" "}
              </div>{" "}
              <div className="col-span-2">
                {" "}
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {" "}
                  Konto/Details{" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.deposit_account}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_account: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Mietkautionskonto bei Bank XYZ, IBAN: DE..."
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  {" "}
                  <option value="none">Keine automatische Erhöhung</option>{" "}
                  <option value="index">Indexmiete</option>{" "}
                  <option value="staffel">Staffelmiete</option>{" "}
                  <option value="graduated">Staffelmiete (vorausgeplant)</option>{" "}
                </select>{" "}
              </div>{" "}
              {formData.rent_increase_type === "graduated" && (
                <div className="col-span-2 space-y-3">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Erste Erhöhung am (1. Januar)
                  </label>
                  <input
                    type="date"
                    value={formData.graduated_rent_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        graduated_rent_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    Die Miete erhöht sich automatisch immer am 1. Januar eines jeden Jahres. Sie können die Erhöhungen für mehrere Jahre im Voraus planen.
                  </p>
                </div>
              )}
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
