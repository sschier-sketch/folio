import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Tenant {
  id: string;
  property_id: string;
  unit_id?: string | null;
  salutation?: string | null;
  first_name: string;
  last_name: string;
  company_name?: string | null;
  date_of_birth?: string | null;
  street?: string | null;
  house_number?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string | null;
  email: string | null;
  phone: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  household_size?: number;
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

type RentType = "flat_rate" | "cold_rent_advance" | "cold_rent_utilities_heating";
type DepositType = "none" | "cash" | "bank_transfer" | "pledged_savings" | "bank_guarantee";
type DepositStatus = "open" | "partial" | "complete" | "returned";

export default function TenantModal({
  tenant,
  properties,
  onClose,
  onSave,
}: TenantModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [units, setUnits] = useState<{ id: string; unit_number: string }[]>([]);

  const [tenantData, setTenantData] = useState({
    property_id: "",
    unit_id: "",
    salutation: "",
    first_name: "",
    last_name: "",
    company_name: "",
    date_of_birth: "",
    street: "",
    house_number: "",
    zip_code: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
    move_in_date: "",
    move_out_date: "",
    is_unlimited: true,
    household_size: 1,
    is_active: true,
  });

  const [rentData, setRentData] = useState({
    rent_type: "flat_rate" as RentType,
    flat_rate_amount: "",
    cold_rent: "",
    total_advance: "",
    operating_costs: "",
    heating_costs: "",
    valid_from: "",
    rent_due_day: "1",
    rent_increase_type: "none",
    graduated_rent_date: "",
    graduated_rent_new_amount: "",
    is_sublet: false,
    vat_applicable: false,
  });

  const [depositData, setDepositData] = useState({
    deposit_type: "none" as DepositType,
    deposit_amount: "",
    deposit_payment_date: "",
    deposit_status: "open" as DepositStatus,
  });

  const [costAllocations, setCostAllocations] = useState<string[]>([]);

  useEffect(() => {
    const loadTenantData = async () => {
      if (tenant) {
        setTenantData({
          property_id: tenant.property_id,
          unit_id: tenant.unit_id || "",
          salutation: tenant.salutation || "",
          first_name: tenant.first_name,
          last_name: tenant.last_name,
          company_name: tenant.company_name || "",
          date_of_birth: tenant.date_of_birth || "",
          street: tenant.street || "",
          house_number: tenant.house_number || "",
          zip_code: tenant.zip_code || "",
          city: tenant.city || "",
          country: tenant.country || "Deutschland",
          email: tenant.email || "",
          phone: tenant.phone || "",
          move_in_date: tenant.move_in_date || "",
          move_out_date: tenant.move_out_date || "",
          is_unlimited: !tenant.move_out_date,
          household_size: tenant.household_size || 1,
          is_active: tenant.is_active,
        });

        if (tenant.property_id) {
          loadUnits(tenant.property_id);
        }

        const { data: contract } = await supabase
          .from("rental_contracts")
          .select("*")
          .eq("tenant_id", tenant.id)
          .maybeSingle();

        if (contract) {
          setRentData({
            rent_type: contract.rent_type || "flat_rate",
            flat_rate_amount: contract.flat_rate_amount?.toString() || "",
            cold_rent: contract.cold_rent?.toString() || "",
            total_advance: contract.total_advance?.toString() || "",
            operating_costs: contract.operating_costs?.toString() || "",
            heating_costs: contract.heating_costs?.toString() || "",
            valid_from: contract.start_date || "",
            rent_due_day: contract.rent_due_day?.toString() || "1",
            rent_increase_type: contract.rent_increase_type || "none",
            graduated_rent_date: contract.graduated_rent_date || "",
            graduated_rent_new_amount: contract.graduated_rent_new_amount?.toString() || "",
            is_sublet: contract.is_sublet || false,
            vat_applicable: contract.vat_applicable || false,
          });

          setDepositData({
            deposit_type: contract.deposit_type || "none",
            deposit_amount: contract.deposit_amount?.toString() || "",
            deposit_payment_date: contract.deposit_due_date || "",
            deposit_status: contract.deposit_status || "open",
          });
        }
      }
    };

    loadTenantData();
  }, [tenant]);

  const loadUnits = async (propertyId: string) => {
    try {
      const { data } = await supabase
        .from("property_units")
        .select("id, unit_number")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (data) {
        setUnits(data);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  };

  useEffect(() => {
    if (tenantData.property_id) {
      loadUnits(tenantData.property_id);
      setTenantData({ ...tenantData, unit_id: "" });
    } else {
      setUnits([]);
    }
  }, [tenantData.property_id]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!tenantData.first_name || !tenantData.last_name) {
      alert("Bitte geben Sie Vor- und Nachname ein");
      return;
    }

    if (!tenantData.property_id) {
      alert("Bitte wählen Sie eine Immobilie aus");
      return;
    }

    if (!tenantData.move_in_date) {
      alert("Bitte geben Sie ein Einzugsdatum ein");
      return;
    }

    if (tenantData.email && !validateEmail(tenantData.email)) {
      alert("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }

    if (rentData.rent_type === "flat_rate" && !rentData.flat_rate_amount) {
      alert("Bitte geben Sie die Warmmiete (Brutto) ein");
      return;
    }

    if (rentData.rent_type === "cold_rent_advance" && (!rentData.cold_rent || !rentData.total_advance)) {
      alert("Bitte geben Sie Kaltmiete und Nebenkostenvorauszahlung ein");
      return;
    }

    if (rentData.rent_type === "cold_rent_utilities_heating" && (!rentData.cold_rent || !rentData.operating_costs || !rentData.heating_costs)) {
      alert("Bitte geben Sie Kaltmiete, Betriebskosten und Heizkosten ein");
      return;
    }

    if (rentData.rent_increase_type === "graduated" && (!rentData.graduated_rent_date || !rentData.graduated_rent_new_amount)) {
      alert("Bitte geben Sie bei Staffelmiete das Datum der ersten Erhöhung und die neue Kaltmiete ein");
      return;
    }

    setLoading(true);
    try {
      if (tenant) {
        const tenantUpdateData = {
          property_id: tenantData.property_id || null,
          unit_id: tenantData.unit_id || null,
          salutation: tenantData.salutation || null,
          first_name: tenantData.first_name,
          last_name: tenantData.last_name,
          name: `${tenantData.first_name} ${tenantData.last_name}`,
          company_name: tenantData.company_name || null,
          date_of_birth: tenantData.date_of_birth || null,
          street: tenantData.street || null,
          house_number: tenantData.house_number || null,
          zip_code: tenantData.zip_code || null,
          city: tenantData.city || null,
          country: tenantData.country || "Deutschland",
          email: tenantData.email || null,
          phone: tenantData.phone || null,
          move_in_date: tenantData.move_in_date || null,
          move_out_date: tenantData.is_unlimited ? null : (tenantData.move_out_date || null),
          household_size: tenantData.household_size,
          is_active: tenantData.is_active,
          user_id: user.id,
        };

        const { error: tenantError } = await supabase
          .from("tenants")
          .update(tenantUpdateData)
          .eq("id", tenant.id);

        if (tenantError) throw tenantError;

        let monthlyRent = 0;
        let utilitiesAdvance = 0;

        if (rentData.rent_type === "flat_rate") {
          monthlyRent = parseFloat(rentData.flat_rate_amount) || 0;
        } else if (rentData.rent_type === "cold_rent_advance") {
          monthlyRent = parseFloat(rentData.cold_rent) || 0;
          utilitiesAdvance = parseFloat(rentData.total_advance) || 0;
        } else if (rentData.rent_type === "cold_rent_utilities_heating") {
          monthlyRent = parseFloat(rentData.cold_rent) || 0;
          utilitiesAdvance = (parseFloat(rentData.operating_costs) || 0) + (parseFloat(rentData.heating_costs) || 0);
        }

        const totalRent = monthlyRent + utilitiesAdvance;

        if (tenantData.property_id && tenantData.move_in_date) {
          const contractUpdateData = {
            property_id: tenantData.property_id,
            unit_id: tenantData.unit_id || null,
            rent_type: rentData.rent_type,
            flat_rate_amount: rentData.rent_type === "flat_rate" ? parseFloat(rentData.flat_rate_amount) || 0 : 0,
            cold_rent: rentData.rent_type !== "flat_rate" ? parseFloat(rentData.cold_rent) || 0 : 0,
            total_advance: rentData.rent_type === "cold_rent_advance" ? parseFloat(rentData.total_advance) || 0 : 0,
            operating_costs: rentData.rent_type === "cold_rent_utilities_heating" ? parseFloat(rentData.operating_costs) || 0 : 0,
            heating_costs: rentData.rent_type === "cold_rent_utilities_heating" ? parseFloat(rentData.heating_costs) || 0 : 0,
            rent_due_day: parseInt(rentData.rent_due_day) || 1,
            rent_increase_type: rentData.rent_increase_type,
            graduated_rent_date: rentData.graduated_rent_date || null,
            graduated_rent_new_amount: rentData.graduated_rent_new_amount ? parseFloat(rentData.graduated_rent_new_amount) : null,
            is_sublet: rentData.is_sublet,
            vat_applicable: rentData.vat_applicable,
            base_rent: monthlyRent,
            monthly_rent: monthlyRent,
            additional_costs: utilitiesAdvance,
            utilities_advance: utilitiesAdvance,
            total_rent: totalRent,
            deposit_type: depositData.deposit_type,
            deposit: parseFloat(depositData.deposit_amount) || 0,
            deposit_amount: parseFloat(depositData.deposit_amount) || 0,
            deposit_due_date: depositData.deposit_payment_date || null,
            deposit_status: depositData.deposit_type === "none" ? "complete" : depositData.deposit_status,
            contract_start: tenantData.move_in_date,
            start_date: tenantData.move_in_date,
            contract_end: tenantData.is_unlimited ? null : (tenantData.move_out_date || null),
            end_date: tenantData.is_unlimited ? null : (tenantData.move_out_date || null),
            is_unlimited: tenantData.is_unlimited,
            contract_type: tenantData.is_unlimited ? "unlimited" : "limited",
            status: "active",
          };

          const { data: existingContract } = await supabase
            .from("rental_contracts")
            .select("id")
            .eq("tenant_id", tenant.id)
            .maybeSingle();

          if (existingContract) {
            const { error: contractError } = await supabase
              .from("rental_contracts")
              .update(contractUpdateData)
              .eq("tenant_id", tenant.id);

            if (contractError) throw contractError;
          } else {
            const { data: newContract, error: contractError } = await supabase
              .from("rental_contracts")
              .insert([
                {
                  ...contractUpdateData,
                  tenant_id: tenant.id,
                  user_id: user.id,
                },
              ])
              .select()
              .single();

            if (contractError) throw contractError;

            const { error: updateError } = await supabase
              .from("tenants")
              .update({ contract_id: newContract.id })
              .eq("id", tenant.id);

            if (updateError) throw updateError;
          }
        }
      } else {
        const { data: newTenant, error: tenantError } = await supabase
          .from("tenants")
          .insert([
            {
              property_id: tenantData.property_id || null,
              unit_id: tenantData.unit_id || null,
              salutation: tenantData.salutation || null,
              first_name: tenantData.first_name,
              last_name: tenantData.last_name,
              name: `${tenantData.first_name} ${tenantData.last_name}`,
              company_name: tenantData.company_name || null,
              date_of_birth: tenantData.date_of_birth || null,
              street: tenantData.street || null,
              house_number: tenantData.house_number || null,
              zip_code: tenantData.zip_code || null,
              city: tenantData.city || null,
              country: tenantData.country || "Deutschland",
              email: tenantData.email || null,
              phone: tenantData.phone || null,
              move_in_date: tenantData.move_in_date || null,
              move_out_date: tenantData.is_unlimited ? null : (tenantData.move_out_date || null),
              household_size: tenantData.household_size,
              is_active: tenantData.is_active,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (tenantError) throw tenantError;

        if (tenantData.property_id && tenantData.move_in_date) {
          let monthlyRent = 0;
          let utilitiesAdvance = 0;

          if (rentData.rent_type === "flat_rate") {
            monthlyRent = parseFloat(rentData.flat_rate_amount) || 0;
            utilitiesAdvance = 0;
          } else if (rentData.rent_type === "cold_rent_advance") {
            monthlyRent = parseFloat(rentData.cold_rent) || 0;
            utilitiesAdvance = parseFloat(rentData.total_advance) || 0;
          } else if (rentData.rent_type === "cold_rent_utilities_heating") {
            monthlyRent = parseFloat(rentData.cold_rent) || 0;
            utilitiesAdvance = (parseFloat(rentData.operating_costs) || 0) + (parseFloat(rentData.heating_costs) || 0);
          }

          const totalRent = monthlyRent + utilitiesAdvance;

          const { data: newContract, error: contractError } = await supabase
            .from("rental_contracts")
            .insert([
              {
                tenant_id: newTenant.id,
                property_id: tenantData.property_id,
                unit_id: tenantData.unit_id || null,
                user_id: user.id,
                rent_type: rentData.rent_type,
                flat_rate_amount: rentData.rent_type === "flat_rate" ? parseFloat(rentData.flat_rate_amount) || 0 : 0,
                cold_rent: rentData.rent_type !== "flat_rate" ? parseFloat(rentData.cold_rent) || 0 : 0,
                total_advance: rentData.rent_type === "cold_rent_advance" ? parseFloat(rentData.total_advance) || 0 : 0,
                operating_costs: rentData.rent_type === "cold_rent_utilities_heating" ? parseFloat(rentData.operating_costs) || 0 : 0,
                heating_costs: rentData.rent_type === "cold_rent_utilities_heating" ? parseFloat(rentData.heating_costs) || 0 : 0,
                rent_due_day: parseInt(rentData.rent_due_day) || 1,
                rent_increase_type: rentData.rent_increase_type,
                graduated_rent_date: rentData.graduated_rent_date || null,
                graduated_rent_new_amount: rentData.graduated_rent_new_amount ? parseFloat(rentData.graduated_rent_new_amount) : null,
                is_sublet: rentData.is_sublet,
                vat_applicable: rentData.vat_applicable,
                base_rent: monthlyRent,
                monthly_rent: monthlyRent,
                additional_costs: utilitiesAdvance,
                utilities_advance: utilitiesAdvance,
                total_rent: totalRent,
                deposit_type: depositData.deposit_type,
                deposit: parseFloat(depositData.deposit_amount) || 0,
                deposit_amount: parseFloat(depositData.deposit_amount) || 0,
                deposit_due_date: depositData.deposit_payment_date || null,
                deposit_status: depositData.deposit_type === "none" ? "complete" : depositData.deposit_status,
                contract_start: tenantData.move_in_date,
                start_date: tenantData.move_in_date,
                contract_end: tenantData.is_unlimited ? null : (tenantData.move_out_date || null),
                end_date: tenantData.is_unlimited ? null : (tenantData.move_out_date || null),
                is_unlimited: tenantData.is_unlimited,
                contract_type: tenantData.is_unlimited ? "unlimited" : "limited",
                status: "active",
              },
            ])
            .select()
            .single();

          if (contractError) throw contractError;

          const { error: updateError } = await supabase
            .from("tenants")
            .update({ contract_id: newContract.id })
            .eq("id", newTenant.id);

          if (updateError) throw updateError;
        }
      }

      onSave();
    } catch (error) {
      console.error("Error saving tenant:", error);
      alert("Fehler beim Speichern des Mietverhältnisses");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: "Mieterdaten" },
      { number: 2, label: "Mietdetails" },
      { number: 3, label: "Kaution" },
      { number: 4, label: "Kostenarten" },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.number
                    ? "bg-[#008CFF] text-white"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-3">
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.number ? "text-dark" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? "bg-[#008CFF]" : "bg-gray-50"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-dark mb-4">Mieterdaten</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Immobilie *
          </label>
          <select
            value={tenantData.property_id}
            onChange={(e) =>
              setTenantData({ ...tenantData, property_id: e.target.value, unit_id: "" })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            required
          >
            <option value="">Bitte wählen...</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        {units.length > 0 && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Mieteinheit (Optional)
            </label>
            <select
              value={tenantData.unit_id}
              onChange={(e) =>
                setTenantData({ ...tenantData, unit_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            >
              <option value="">Keine Einheit zuweisen</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Anrede
          </label>
          <select
            value={tenantData.salutation}
            onChange={(e) =>
              setTenantData({ ...tenantData, salutation: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          >
            <option value="">Bitte wählen...</option>
            <option value="Herr">Herr</option>
            <option value="Frau">Frau</option>
            <option value="Divers">Divers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Anzahl Personen im Haushalt *
          </label>
          <input
            type="number"
            min="1"
            value={tenantData.household_size}
            onChange={(e) =>
              setTenantData({ ...tenantData, household_size: parseInt(e.target.value) || 1 })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Vorname *
          </label>
          <input
            type="text"
            value={tenantData.first_name}
            onChange={(e) =>
              setTenantData({ ...tenantData, first_name: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Nachname *
          </label>
          <input
            type="text"
            value={tenantData.last_name}
            onChange={(e) =>
              setTenantData({ ...tenantData, last_name: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Firmenname (optional)
          </label>
          <input
            type="text"
            value={tenantData.company_name}
            onChange={(e) =>
              setTenantData({ ...tenantData, company_name: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Geburtsdatum (optional)
          </label>
          <input
            type="date"
            value={tenantData.date_of_birth}
            onChange={(e) =>
              setTenantData({ ...tenantData, date_of_birth: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Straße
          </label>
          <input
            type="text"
            value={tenantData.street}
            onChange={(e) =>
              setTenantData({ ...tenantData, street: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Hausnummer
          </label>
          <input
            type="text"
            value={tenantData.house_number}
            onChange={(e) =>
              setTenantData({ ...tenantData, house_number: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            PLZ
          </label>
          <input
            type="text"
            value={tenantData.zip_code}
            onChange={(e) =>
              setTenantData({ ...tenantData, zip_code: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Stadt
          </label>
          <input
            type="text"
            value={tenantData.city}
            onChange={(e) =>
              setTenantData({ ...tenantData, city: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Land
          </label>
          <input
            type="text"
            value={tenantData.country}
            onChange={(e) =>
              setTenantData({ ...tenantData, country: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            E-Mail
          </label>
          <input
            type="email"
            value={tenantData.email}
            onChange={(e) =>
              setTenantData({ ...tenantData, email: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Telefon
          </label>
          <input
            type="tel"
            value={tenantData.phone}
            onChange={(e) =>
              setTenantData({ ...tenantData, phone: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Einzugsdatum *
          </label>
          <input
            type="date"
            value={tenantData.move_in_date}
            onChange={(e) =>
              setTenantData({ ...tenantData, move_in_date: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tenantData.is_unlimited}
              onChange={(e) =>
                setTenantData({ ...tenantData, is_unlimited: e.target.checked })
              }
              className="w-4 h-4 text-[#008CFF] rounded focus:ring-[#008CFF]"
            />
            <span className="text-sm font-medium text-gray-400">
              Unbefristet
            </span>
          </label>
        </div>

        {!tenantData.is_unlimited && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Auszugsdatum
            </label>
            <input
              type="date"
              value={tenantData.move_out_date}
              onChange={(e) =>
                setTenantData({ ...tenantData, move_out_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-dark mb-4">
        Wie sollen die Betriebs- und Heizkostenvorauszahlungen im Mietvertrag angegeben werden?
      </h3>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg cursor-pointer hover:border-[#008CFF] transition-colors">
          <input
            type="radio"
            name="rent_type"
            value="flat_rate"
            checked={rentData.rent_type === "flat_rate"}
            onChange={(e) =>
              setRentData({ ...rentData, rent_type: e.target.value as RentType })
            }
            className="w-5 h-5 text-[#008CFF]"
          />
          <div className="flex-1">
            <div className="font-medium text-dark">Pauschalmiete</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg cursor-pointer hover:border-[#008CFF] transition-colors">
          <input
            type="radio"
            name="rent_type"
            value="cold_rent_advance"
            checked={rentData.rent_type === "cold_rent_advance"}
            onChange={(e) =>
              setRentData({ ...rentData, rent_type: e.target.value as RentType })
            }
            className="w-5 h-5 text-[#008CFF]"
          />
          <div className="flex-1">
            <div className="font-medium text-dark">Kaltmiete + Gesamtvorauszahlung</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-lg cursor-pointer hover:border-[#008CFF] transition-colors">
          <input
            type="radio"
            name="rent_type"
            value="cold_rent_utilities_heating"
            checked={rentData.rent_type === "cold_rent_utilities_heating"}
            onChange={(e) =>
              setRentData({ ...rentData, rent_type: e.target.value as RentType })
            }
            className="w-5 h-5 text-[#008CFF]"
          />
          <div className="flex-1">
            <div className="font-medium text-dark">Kaltmiete + Betriebskosten + Heizkosten</div>
          </div>
        </label>
      </div>

      {rentData.rent_type === "flat_rate" && (
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Pauschalmiete <span className="text-[#008CFF]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.flat_rate_amount}
                  onChange={(e) =>
                    setRentData({ ...rentData, flat_rate_amount: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Gültig ab
              </label>
              <input
                type="date"
                value={rentData.valid_from}
                onChange={(e) =>
                  setRentData({ ...rentData, valid_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Mieteingang erwartet am (Tag des Monats)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={rentData.rent_due_day}
              onChange={(e) =>
                setRentData({ ...rentData, rent_due_day: e.target.value })
              }
              placeholder="z.B. 1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            />
          </div>
        </div>
      )}

      {rentData.rent_type === "cold_rent_advance" && (
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kaltmiete <span className="text-[#008CFF]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.cold_rent}
                  onChange={(e) =>
                    setRentData({ ...rentData, cold_rent: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Gesamtvorauszahlung <span className="text-[#008CFF]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.total_advance}
                  onChange={(e) =>
                    setRentData({ ...rentData, total_advance: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Gültig ab
              </label>
              <input
                type="date"
                value={rentData.valid_from}
                onChange={(e) =>
                  setRentData({ ...rentData, valid_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">Gesamtmiete</div>
              <div className="text-2xl font-bold text-dark">
                {((parseFloat(rentData.cold_rent) || 0) + (parseFloat(rentData.total_advance) || 0)).toFixed(2)} €
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Mieteingang erwartet am (Tag des Monats)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={rentData.rent_due_day}
              onChange={(e) =>
                setRentData({ ...rentData, rent_due_day: e.target.value })
              }
              placeholder="z.B. 1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            />
          </div>
        </div>
      )}

      {rentData.rent_type === "cold_rent_utilities_heating" && (
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kaltmiete <span className="text-[#008CFF]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.cold_rent}
                  onChange={(e) =>
                    setRentData({ ...rentData, cold_rent: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Betriebskosten <span className="text-[#008CFF]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.operating_costs}
                  onChange={(e) =>
                    setRentData({ ...rentData, operating_costs: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Heizkosten <span className="text-[#008CFF]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.heating_costs}
                  onChange={(e) =>
                    setRentData({ ...rentData, heating_costs: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Gültig ab
              </label>
              <input
                type="date"
                value={rentData.valid_from}
                onChange={(e) =>
                  setRentData({ ...rentData, valid_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">Gesamtmiete</div>
              <div className="text-2xl font-bold text-dark">
                {((parseFloat(rentData.cold_rent) || 0) + (parseFloat(rentData.operating_costs) || 0) + (parseFloat(rentData.heating_costs) || 0)).toFixed(2)} €
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Mieteingang erwartet am (Tag des Monats)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={rentData.rent_due_day}
              onChange={(e) =>
                setRentData({ ...rentData, rent_due_day: e.target.value })
              }
              placeholder="z.B. 1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            />
          </div>
        </div>
      )}

      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rentData.is_sublet}
              onChange={(e) =>
                setRentData({ ...rentData, is_sublet: e.target.checked })
              }
              className="w-4 h-4 text-[#008CFF] border-gray-300 rounded focus:ring-2 focus:ring-[#008CFF]"
            />
            <span className="text-sm font-medium text-gray-700">Untermietverhältnis</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rentData.vat_applicable}
              onChange={(e) =>
                setRentData({ ...rentData, vat_applicable: e.target.checked })
              }
              className="w-4 h-4 text-[#008CFF] border-gray-300 rounded focus:ring-2 focus:ring-[#008CFF]"
            />
            <span className="text-sm font-medium text-gray-700">Mehrwertsteuer berechnen</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Art der Mieterhöhung
        </label>
        <select
          value={rentData.rent_increase_type}
          onChange={(e) =>
            setRentData({ ...rentData, rent_increase_type: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
        >
          <option value="none">Keine automatische Erhöhung</option>
          <option value="index">Indexmiete</option>
          <option value="graduated">Staffelmiete (vorausgeplant)</option>
        </select>

        {rentData.rent_increase_type === "graduated" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Erste Erhöhung am
              </label>
              <input
                type="date"
                value={rentData.graduated_rent_date}
                onChange={(e) =>
                  setRentData({ ...rentData, graduated_rent_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Das Datum der ersten Mieterhöhung (normalerweise 12 Monate nach Mietbeginn).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Neue Kaltmiete ab diesem Zeitpunkt
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={rentData.graduated_rent_new_amount}
                  onChange={(e) =>
                    setRentData({ ...rentData, graduated_rent_new_amount: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                  placeholder="z.B. 850.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Die neue Kaltmiete, die ab dem angegebenen Datum gelten soll.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-dark mb-4">Kautionsart</h3>

      <div className="space-y-3">
        {[
          { value: "none", label: "Keine Kaution" },
          { value: "cash", label: "Barkaution" },
          { value: "bank_transfer", label: "Banküberweisung" },
          { value: "pledged_savings", label: "Verpfändetes Sparkonto" },
          { value: "bank_guarantee", label: "Bankbürgschaft" },
        ].map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-[#008CFF] transition-colors ${
              depositData.deposit_type === option.value ? "border-[#008CFF] bg-blue-50" : "border-gray-100"
            }`}
          >
            <input
              type="radio"
              name="deposit_type"
              value={option.value}
              checked={depositData.deposit_type === option.value}
              onChange={(e) =>
                setDepositData({ ...depositData, deposit_type: e.target.value as DepositType })
              }
              className="w-5 h-5 text-[#008CFF]"
            />
            <div className="font-medium text-dark">{option.label}</div>
          </label>
        ))}
      </div>

      {depositData.deposit_type !== "none" && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Kautionsbetrag
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={depositData.deposit_amount}
                  onChange={(e) =>
                    setDepositData({ ...depositData, deposit_amount: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                value={depositData.deposit_status}
                onChange={(e) =>
                  setDepositData({ ...depositData, deposit_status: e.target.value as DepositStatus })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
              >
                <option value="open">Offen</option>
                <option value="partial">Teilweise bezahlt</option>
                <option value="complete">Vollständig bezahlt</option>
                <option value="returned">Zurückgezahlt</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Bezahldatum
            </label>
            <input
              type="date"
              value={depositData.deposit_payment_date}
              onChange={(e) =>
                setDepositData({ ...depositData, deposit_payment_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008CFF] focus:border-[#008CFF] outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-dark mb-4">
        Markierte Kostenarten werden auf diesen Mieter umgelegt.
      </h3>
      <p className="text-sm text-gray-500">
        Entfernen Sie die Haken der Kostenarten, welche dieser Mieter nicht bezahlen muss.
        Diese Kostenarten werden dann vollständig auf die anderen Mieter verteilt.
      </p>

      <div className="space-y-2">
        <label className="flex items-center gap-3 p-4 bg-[#EDEFF7] rounded-lg">
          <input
            type="checkbox"
            checked={costAllocations.includes("electricity")}
            onChange={(e) => {
              if (e.target.checked) {
                setCostAllocations([...costAllocations, "electricity"]);
              } else {
                setCostAllocations(costAllocations.filter((c) => c !== "electricity"));
              }
            }}
            className="w-5 h-5 text-[#008CFF] rounded"
          />
          <span className="font-medium text-dark">Strom</span>
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900">
          <strong>Hinweis:</strong> Die Kostenverteilung wird automatisch bei der Betriebskostenabrechnung berücksichtigt.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark">
            {tenant ? "Mieter bearbeiten" : "Neues Mietverhältnis"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!tenant && renderStepIndicator()}

          <div className="mb-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {currentStep > 1 && !tenant && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-100 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Zurück
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-100 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>

            {tenant || currentStep === 4 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#008CFF] text-white rounded-lg font-medium hover:bg-[#0073CC] transition-colors disabled:opacity-50"
              >
                {loading ? "Speichern..." : "Speichern"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-[#008CFF] text-white rounded-lg font-medium hover:bg-[#0073CC] transition-colors"
              >
                Weiter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
