export interface WizardCalc {
  id: string;
  contract_id: string;
  calculation_date: string;
  basis_monat: string;
  aktueller_monat: string;
  possible_since: string | null;
  rental_contract: {
    tenant_id: string;
    monthly_rent: number;
    property_id: string;
    contract_start: string | null;
    start_date: string | null;
    cold_rent: number;
    base_rent: number;
    additional_costs: number;
    utilities_advance: number;
    unit_id: string | null;
    tenants: {
      id: string;
      name: string;
      first_name: string;
      last_name: string;
      email: string | null;
      salutation: string | null;
      street: string | null;
      house_number: string | null;
      zip_code: string | null;
      city: string | null;
    };
    properties: {
      id: string;
      name: string;
      address: string;
    };
  };
}

export interface WizardState {
  currentRent: number;
  currentUtilities: number;
  currentRentValidFrom: string;
  lastChangeDate: string | null;
  lastChangeReason: string | null;
  effectiveDate: string;
  vpiOldMonth: string;
  vpiOldValue: string;
  vpiNewMonth: string;
  vpiNewValue: string;
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantSalutation: "male" | "female" | "neutral";
  tenantAddress: string;
  propertyAddress: string;
  unitNumber: string;
  contractDate: string;
}

export type WizardStep = "overview" | "vpi" | "parties" | "preview" | "finalize";
