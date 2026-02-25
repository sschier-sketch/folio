import { supabase } from './supabase';

export interface AfaSettings {
  enabled: boolean;
  purchase_date: string;
  purchase_price_total: number;
  building_share_type: 'percent' | 'amount';
  building_share_value: number;
  building_value_amount: number;
  construction_year: number | null;
  usage_type: 'residential' | 'commercial' | 'mixed';
  afa_rate: number;
  ownership_share: number;
}

export interface AfaSetupStatus {
  property_id: string;
  missing_fields: string[];
  current_values: Partial<AfaSettings>;
  proposed_defaults: Partial<AfaSettings>;
  is_complete: boolean;
}

export interface AfaCalculationResult {
  afa_amount: number;
  annual_afa_full: number;
  months_factor: number;
  building_value_amount: number;
  afa_rate: number;
  ownership_share: number;
  enabled: boolean;
}

const PROPERTY_TYPE_USAGE_MAP: Record<string, 'residential' | 'commercial'> = {
  multi_family: 'residential',
  house: 'residential',
  apartment: 'residential',
  commercial: 'commercial',
  parking: 'commercial',
};

export function mapPropertyTypeToUsage(propertyType: string | null): 'residential' | 'commercial' | 'mixed' | null {
  if (!propertyType) return null;
  return PROPERTY_TYPE_USAGE_MAP[propertyType] || null;
}

export function getDefaultAfaRate(usageType: string): number {
  if (usageType === 'residential') return 0.02;
  if (usageType === 'commercial') return 0.03;
  return 0.02;
}

export async function getAfaSetupStatus(propertyId: string, userId: string): Promise<AfaSetupStatus> {
  const { data: property } = await supabase
    .from('properties')
    .select('id, property_type, construction_year, purchase_date, purchase_price, ownership_type, afa_settings')
    .eq('id', propertyId)
    .eq('user_id', userId)
    .maybeSingle();

  const missingFields: string[] = [];
  const currentValues: Partial<AfaSettings> = {};
  const proposedDefaults: Partial<AfaSettings> = {};

  if (!property) {
    return { property_id: propertyId, missing_fields: ['all'], current_values: {}, proposed_defaults: {}, is_complete: false };
  }

  let unitFallbackDate: string | null = null;
  let unitFallbackPrice: number | null = null;
  let unitFallbackConstructionYear: number | null = null;

  const { data: units } = await supabase
    .from('property_units')
    .select('purchase_date, purchase_price, construction_year')
    .eq('property_id', propertyId)
    .eq('user_id', userId);

  if (units && units.length > 0) {
    const firstWithDate = units.find(u => u.purchase_date);
    if (firstWithDate) unitFallbackDate = firstWithDate.purchase_date;

    const firstWithPrice = units.find(u => u.purchase_price && Number(u.purchase_price) > 0);
    if (firstWithPrice) unitFallbackPrice = Number(firstWithPrice.purchase_price);

    const firstWithYear = units.find(u => u.construction_year);
    if (firstWithYear) unitFallbackConstructionYear = firstWithYear.construction_year;
  }

  const existing: Partial<AfaSettings> = property.afa_settings || {};

  const purchaseDate = existing.purchase_date
    || property.purchase_date
    || unitFallbackDate
    || null;
  if (purchaseDate) {
    currentValues.purchase_date = purchaseDate;
  } else {
    missingFields.push('purchase_date');
  }

  const purchasePrice = existing.purchase_price_total
    || (property.purchase_price && Number(property.purchase_price) > 0 ? Number(property.purchase_price) : null)
    || (unitFallbackPrice && unitFallbackPrice > 0 ? unitFallbackPrice : null);
  if (purchasePrice && purchasePrice > 0) {
    currentValues.purchase_price_total = purchasePrice;
  } else {
    missingFields.push('purchase_price_total');
  }

  if (existing.building_share_type && existing.building_share_value != null && existing.building_share_value > 0) {
    currentValues.building_share_type = existing.building_share_type;
    currentValues.building_share_value = existing.building_share_value;
  } else {
    missingFields.push('building_share');
    proposedDefaults.building_share_type = 'percent';
    proposedDefaults.building_share_value = 80;
  }

  const constructionYear = existing.construction_year || property.construction_year || unitFallbackConstructionYear || null;
  if (constructionYear) {
    currentValues.construction_year = constructionYear;
  }

  const mappedUsage = mapPropertyTypeToUsage(property.property_type);
  const usageType = existing.usage_type || mappedUsage || null;
  if (usageType) {
    currentValues.usage_type = usageType;
  } else {
    missingFields.push('usage_type');
    proposedDefaults.usage_type = 'residential';
  }

  const effectiveUsage = usageType || 'residential';
  const afaRate = existing.afa_rate || getDefaultAfaRate(effectiveUsage);
  currentValues.afa_rate = afaRate;
  if (!existing.afa_rate) {
    proposedDefaults.afa_rate = getDefaultAfaRate(effectiveUsage);
  }

  const ownershipShare = existing.ownership_share ?? 100;
  currentValues.ownership_share = ownershipShare;

  currentValues.enabled = existing.enabled ?? true;

  return {
    property_id: propertyId,
    missing_fields: missingFields,
    current_values: currentValues,
    proposed_defaults: proposedDefaults,
    is_complete: missingFields.length === 0,
  };
}

export async function saveAfaSettings(propertyId: string, userId: string, settings: AfaSettings): Promise<{ error: string | null }> {
  let buildingValue = settings.building_value_amount;
  if (settings.building_share_type === 'percent') {
    buildingValue = Math.round(settings.purchase_price_total * (settings.building_share_value / 100) * 100) / 100;
  } else {
    buildingValue = settings.building_share_value;
  }

  const payload: AfaSettings = {
    ...settings,
    building_value_amount: buildingValue,
  };

  const updateData: Record<string, any> = {
    afa_settings: payload,
  };

  if (settings.construction_year) {
    updateData.construction_year = settings.construction_year;
  }

  const { error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId)
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

export function calculateAfaForYear(settings: AfaSettings | null | undefined, year: number): AfaCalculationResult {
  const empty: AfaCalculationResult = {
    afa_amount: 0,
    annual_afa_full: 0,
    months_factor: 0,
    building_value_amount: 0,
    afa_rate: 0,
    ownership_share: 100,
    enabled: false,
  };

  if (!settings || !settings.enabled) return empty;
  if (!settings.purchase_date || !settings.purchase_price_total || settings.purchase_price_total <= 0) return empty;
  if (!settings.building_share_value || settings.building_share_value <= 0) return empty;
  if (!settings.afa_rate || settings.afa_rate <= 0) return empty;

  const buildingValue = settings.building_share_type === 'percent'
    ? round2(settings.purchase_price_total * (settings.building_share_value / 100))
    : settings.building_share_value;

  if (buildingValue <= 0) return empty;

  const purchaseDate = new Date(settings.purchase_date);
  const purchaseYear = purchaseDate.getFullYear();
  const purchaseMonth = purchaseDate.getMonth() + 1;

  let monthsFactor = 0;
  if (year < purchaseYear) {
    monthsFactor = 0;
  } else if (year === purchaseYear) {
    monthsFactor = (12 - purchaseMonth + 1) / 12;
  } else {
    monthsFactor = 1;
  }

  if (monthsFactor <= 0) {
    return { ...empty, building_value_amount: buildingValue, afa_rate: settings.afa_rate, ownership_share: settings.ownership_share ?? 100, enabled: true };
  }

  const annualAfaFull = round2(buildingValue * settings.afa_rate);
  const ownershipShare = settings.ownership_share ?? 100;
  const afaAmount = round2(annualAfaFull * monthsFactor * (ownershipShare / 100));

  return {
    afa_amount: afaAmount,
    annual_afa_full: annualAfaFull,
    months_factor: Math.round(monthsFactor * 100) / 100,
    building_value_amount: buildingValue,
    afa_rate: settings.afa_rate,
    ownership_share: ownershipShare,
    enabled: true,
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
