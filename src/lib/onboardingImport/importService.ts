import { supabase } from '../supabase';
import { ImportProperty, ImportUnit, ImportTenant, ImportResult, ParsedImportData } from './types';

export async function executeImport(
  data: ParsedImportData,
  userId: string,
): Promise<ImportResult> {
  const result: ImportResult = {
    propertiesCreated: 0,
    unitsCreated: 0,
    tenantsCreated: 0,
    contractsCreated: 0,
    errors: [],
  };

  const propertyIdMap = new Map<string, string>();
  const unitIdMap = new Map<string, string>();

  for (const prop of data.properties) {
    try {
      const dbProperty = await createProperty(prop, userId);
      if (dbProperty) {
        propertyIdMap.set(prop.ref_nr, dbProperty.id);
        result.propertiesCreated++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Immobilie "${prop.name}" (${prop.ref_nr}): ${msg}`);
    }
  }

  for (const unit of data.units) {
    const propertyId = propertyIdMap.get(unit.property_ref);
    if (!propertyId) {
      result.errors.push(`Einheit "${unit.unit_number}": Zugehörige Immobilie "${unit.property_ref}" wurde nicht angelegt`);
      continue;
    }
    try {
      const dbUnit = await createUnit(unit, propertyId, userId);
      if (dbUnit) {
        const key = `${unit.property_ref}::${unit.unit_number}`;
        unitIdMap.set(key, dbUnit.id);
        result.unitsCreated++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Einheit "${unit.unit_number}": ${msg}`);
    }
  }

  for (const tenant of data.tenants) {
    const propertyId = propertyIdMap.get(tenant.property_ref);
    const unitKey = `${tenant.property_ref}::${tenant.unit_ref}`;
    const unitId = unitIdMap.get(unitKey);

    if (!propertyId) {
      result.errors.push(`Mieter "${tenant.first_name} ${tenant.last_name}": Zugehörige Immobilie "${tenant.property_ref}" wurde nicht angelegt`);
      continue;
    }
    if (!unitId) {
      result.errors.push(`Mieter "${tenant.first_name} ${tenant.last_name}": Zugehörige Einheit "${tenant.unit_ref}" wurde nicht angelegt`);
      continue;
    }

    try {
      const { tenantId, contractId } = await createTenantAndContract(tenant, propertyId, unitId, userId);
      if (tenantId) result.tenantsCreated++;
      if (contractId) result.contractsCreated++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Mieter "${tenant.first_name} ${tenant.last_name}": ${msg}`);
    }
  }

  try {
    await supabase.from('onboarding_import_logs').insert({
      user_id: userId,
      properties_count: result.propertiesCreated,
      units_count: result.unitsCreated,
      tenants_count: result.tenantsCreated,
      contracts_count: result.contractsCreated,
      errors: result.errors.length > 0 ? result.errors : null,
    });
  } catch {
    // non-critical
  }

  return result;
}

async function createProperty(prop: ImportProperty, userId: string) {
  const address = `${prop.street}, ${prop.zip_code} ${prop.city}`;

  const { data, error } = await supabase
    .from('properties')
    .insert({
      user_id: userId,
      name: prop.name,
      street: prop.street,
      zip_code: prop.zip_code,
      city: prop.city,
      address,
      property_type: prop.property_type,
      ownership_type: prop.ownership_type,
      purchase_price: prop.purchase_price || 0,
      current_value: prop.current_value || 0,
      purchase_date: prop.purchase_date || null,
      construction_year: prop.construction_year || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function createUnit(unit: ImportUnit, propertyId: string, userId: string) {
  const { data, error } = await supabase
    .from('property_units')
    .insert({
      property_id: propertyId,
      user_id: userId,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      floor: unit.floor || null,
      area_sqm: unit.area_sqm || null,
      rooms: unit.rooms || null,
      status: 'vacant',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function createTenantAndContract(
  tenant: ImportTenant,
  propertyId: string,
  unitId: string,
  userId: string,
): Promise<{ tenantId: string | null; contractId: string | null }> {
  const { data: newTenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      property_id: propertyId,
      unit_id: unitId,
      user_id: userId,
      salutation: tenant.salutation || null,
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      name: `${tenant.first_name} ${tenant.last_name}`,
      email: tenant.email || null,
      phone: tenant.phone || null,
      company_name: tenant.company_name || null,
      move_in_date: tenant.contract_start,
      move_out_date: tenant.contract_end || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (tenantError) throw new Error(tenantError.message);

  const additionalCosts = (tenant.additional_costs || 0) + (tenant.heating_costs || 0);
  const totalRent = tenant.cold_rent + additionalCosts;

  const contractPayload: Record<string, unknown> = {
    tenant_id: newTenant.id,
    property_id: propertyId,
    unit_id: unitId,
    user_id: userId,
    base_rent: tenant.cold_rent,
    additional_costs: additionalCosts,
    total_rent: totalRent,
    cold_rent: tenant.cold_rent,
    operating_costs: tenant.additional_costs || 0,
    heating_costs: tenant.heating_costs || 0,
    total_advance: additionalCosts,
    deposit: tenant.deposit || 0,
    contract_start: tenant.contract_start,
    contract_end: tenant.contract_end || null,
    contract_type: tenant.contract_end ? 'limited' : 'unlimited',
    is_unlimited: !tenant.contract_end,
    rent_type: tenant.rent_type,
    rent_due_day: 1,
    generate_historic_payments: false,
  };

  if (tenant.rent_type === 'flat_rate') {
    contractPayload.flat_rate_amount = totalRent;
  }

  const { data: contract, error: contractError } = await supabase
    .from('rental_contracts')
    .insert(contractPayload)
    .select('id')
    .single();

  if (contractError) throw new Error(contractError.message);

  await supabase
    .from('property_units')
    .update({ status: 'rented', tenant_id: newTenant.id })
    .eq('id', unitId);

  await supabase.from('rent_history').insert({
    rental_contract_id: contract.id,
    user_id: userId,
    valid_from: tenant.contract_start,
    base_rent: tenant.cold_rent,
    total_rent: totalRent,
    total_advance: additionalCosts,
    change_reason: 'Erstmiete (Import)',
  });

  return { tenantId: newTenant.id, contractId: contract.id };
}
