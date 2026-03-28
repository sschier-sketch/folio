export interface ImportProperty {
  ref_nr: string;
  name: string;
  street: string;
  zip_code: string;
  city: string;
  property_type: string;
  ownership_type: string;
  purchase_price?: number;
  current_value?: number;
  purchase_date?: string;
  construction_year?: number;
}

export interface ImportUnit {
  property_ref: string;
  unit_number: string;
  unit_type: string;
  floor?: number;
  area_sqm?: number;
  rooms?: number;
}

export interface ImportTenant {
  unit_ref: string;
  property_ref: string;
  salutation?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  contract_start: string;
  contract_end?: string;
  cold_rent: number;
  additional_costs?: number;
  heating_costs?: number;
  deposit?: number;
  rent_type: string;
}

export interface ValidationError {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

export interface ParsedImportData {
  properties: ImportProperty[];
  units: ImportUnit[];
  tenants: ImportTenant[];
  errors: ValidationError[];
}

export interface ImportResult {
  propertiesCreated: number;
  unitsCreated: number;
  tenantsCreated: number;
  contractsCreated: number;
  errors: string[];
}

export const PROPERTY_TYPES: Record<string, string> = {
  'Mehrfamilienhaus': 'multi_family',
  'Einfamilienhaus': 'house',
  'Wohnung': 'apartment',
  'Gewerbeeinheit': 'commercial',
  'Garage/Stellplatz': 'parking',
  'Grundstück': 'land',
  'Sonstiges': 'other',
};

export const UNIT_TYPES: Record<string, string> = {
  'Wohnung': 'apartment',
  'Büro': 'office',
  'Stellplatz': 'parking',
  'Lager': 'storage',
  'Gewerbe': 'commercial',
};

export const RENT_TYPES: Record<string, string> = {
  'Kaltmiete + Vorauszahlung': 'cold_rent_advance',
  'Kaltmiete + NK + Heizkosten': 'cold_rent_utilities_heating',
  'Pauschalmiete': 'flat_rate',
};

export const OWNERSHIP_TYPES: Record<string, string> = {
  'Gesamtobjekt': 'full_property',
  'Einzelne Einheiten': 'units_only',
};
