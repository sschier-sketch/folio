import * as XLSX from 'xlsx';
import {
  ImportProperty,
  ImportUnit,
  ImportTenant,
  ParsedImportData,
  ValidationError,
  PROPERTY_TYPES,
  UNIT_TYPES,
  RENT_TYPES,
  OWNERSHIP_TYPES,
} from './types';

function parseGermanDate(value: string | number | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) {
      const yy = d.y.toString().padStart(4, '0');
      const mm = (d.m).toString().padStart(2, '0');
      const dd = d.d.toString().padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    }
    return undefined;
  }
  const str = String(value).trim();
  if (!str) return undefined;

  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`;
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return undefined;
}

function parseNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const cleaned = String(value).trim().replace(/\s/g, '').replace(/€/g, '');
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return parseFloat(cleaned.replace('.', '').replace(',', '.'));
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function getCellValue(row: Record<string, unknown>, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
}

function getNumericValue(row: Record<string, unknown>, possibleKeys: string[]): number | undefined {
  for (const key of possibleKeys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return parseNumber(val as string | number);
    }
  }
  return undefined;
}

function getDateValue(row: Record<string, unknown>, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return parseGermanDate(val as string | number);
    }
  }
  return undefined;
}

function parseProperties(ws: XLSX.WorkSheet): { data: ImportProperty[]; errors: ValidationError[] } {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const properties: ImportProperty[] = [];
  const errors: ValidationError[] = [];

  const dataRows = rows.filter(row => {
    const firstVal = String(Object.values(row)[0] || '').trim();
    return firstVal !== '' && !firstVal.startsWith('(');
  });

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 3;

    const ref = getCellValue(row, ['Ref-Nr.', 'Ref-Nr', 'RefNr', 'ref_nr', 'Referenz']);
    const name = getCellValue(row, ['Name', 'Bezeichnung', 'Objektname']);
    const street = getCellValue(row, ['Straße', 'Strasse', 'Adresse', 'Street']);
    const zip = getCellValue(row, ['PLZ', 'Postleitzahl', 'ZIP']);
    const city = getCellValue(row, ['Stadt', 'Ort', 'City']);

    if (!ref) errors.push({ sheet: 'Immobilien', row: rowNum, column: 'Ref-Nr.', message: 'Ref-Nr. ist erforderlich' });
    if (!name) errors.push({ sheet: 'Immobilien', row: rowNum, column: 'Name', message: 'Name ist erforderlich' });
    if (!street) errors.push({ sheet: 'Immobilien', row: rowNum, column: 'Straße', message: 'Straße ist erforderlich' });
    if (!zip) errors.push({ sheet: 'Immobilien', row: rowNum, column: 'PLZ', message: 'PLZ ist erforderlich' });
    if (!city) errors.push({ sheet: 'Immobilien', row: rowNum, column: 'Stadt', message: 'Stadt ist erforderlich' });

    const rawType = getCellValue(row, ['Objekttyp', 'Typ', 'Immobilientyp', 'Type']);
    const propertyType = PROPERTY_TYPES[rawType] || 'apartment';

    const rawOwnership = getCellValue(row, ['Eigentumsart', 'Eigentum', 'Ownership']);
    const ownershipType = OWNERSHIP_TYPES[rawOwnership] || 'full_property';

    if (ref && name && street && zip && city) {
      properties.push({
        ref_nr: ref,
        name,
        street,
        zip_code: zip,
        city,
        property_type: propertyType,
        ownership_type: ownershipType,
        purchase_price: getNumericValue(row, ['Kaufpreis', 'Purchase Price']),
        current_value: getNumericValue(row, ['Aktueller Wert', 'Current Value', 'Marktwert']),
        purchase_date: getDateValue(row, ['Kaufdatum', 'Purchase Date']),
        construction_year: getNumericValue(row, ['Baujahr', 'Construction Year']),
      });
    }
  });

  const refs = properties.map(p => p.ref_nr);
  const duplicates = refs.filter((r, i) => refs.indexOf(r) !== i);
  duplicates.forEach(d => {
    errors.push({ sheet: 'Immobilien', row: 0, column: 'Ref-Nr.', message: `Doppelte Ref-Nr.: "${d}"` });
  });

  return { data: properties, errors };
}

function parseUnits(ws: XLSX.WorkSheet, propertyRefs: string[]): { data: ImportUnit[]; errors: ValidationError[] } {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const units: ImportUnit[] = [];
  const errors: ValidationError[] = [];

  const dataRows = rows.filter(row => {
    const firstVal = String(Object.values(row)[0] || '').trim();
    return firstVal !== '' && !firstVal.startsWith('(');
  });

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 3;

    const propRef = getCellValue(row, ['Immobilien-Ref', 'Immobilien-Ref.', 'Property Ref', 'Immobilie']);
    const unitNumber = getCellValue(row, ['Einheitennummer', 'Einheit', 'Nr.', 'Unit Number']);

    if (!propRef) errors.push({ sheet: 'Einheiten', row: rowNum, column: 'Immobilien-Ref', message: 'Immobilien-Ref ist erforderlich' });
    if (!unitNumber) errors.push({ sheet: 'Einheiten', row: rowNum, column: 'Einheitennummer', message: 'Einheitennummer ist erforderlich' });

    if (propRef && !propertyRefs.includes(propRef)) {
      errors.push({ sheet: 'Einheiten', row: rowNum, column: 'Immobilien-Ref', message: `Immobilie "${propRef}" nicht in Blatt "Immobilien" gefunden` });
    }

    const rawType = getCellValue(row, ['Einheitentyp', 'Typ', 'Unit Type']);
    const unitType = UNIT_TYPES[rawType] || 'apartment';

    if (propRef && unitNumber) {
      units.push({
        property_ref: propRef,
        unit_number: unitNumber,
        unit_type: unitType,
        floor: getNumericValue(row, ['Etage', 'Floor', 'Stockwerk']),
        area_sqm: getNumericValue(row, ['Fläche (m²)', 'Fläche', 'Area', 'qm']),
        rooms: getNumericValue(row, ['Zimmer', 'Rooms', 'Zi.']),
      });
    }
  });

  return { data: units, errors };
}

function parseTenants(ws: XLSX.WorkSheet, propertyRefs: string[], unitKeys: Set<string>): { data: ImportTenant[]; errors: ValidationError[] } {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const tenants: ImportTenant[] = [];
  const errors: ValidationError[] = [];

  const dataRows = rows.filter(row => {
    const firstVal = String(Object.values(row)[0] || '').trim();
    return firstVal !== '' && !firstVal.startsWith('(');
  });

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 3;

    const propRef = getCellValue(row, ['Immobilien-Ref', 'Immobilien-Ref.', 'Property Ref', 'Immobilie']);
    const unitRef = getCellValue(row, ['Einheitennummer', 'Einheit', 'Unit', 'Unit Number']);
    const firstName = getCellValue(row, ['Vorname', 'First Name']);
    const lastName = getCellValue(row, ['Nachname', 'Last Name', 'Familienname']);
    const contractStartStr = getDateValue(row, ['Vertragsbeginn', 'Contract Start', 'Mietbeginn']);
    const coldRent = getNumericValue(row, ['Kaltmiete', 'Cold Rent', 'Nettomiete']);

    if (!propRef) errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Immobilien-Ref', message: 'Immobilien-Ref ist erforderlich' });
    if (!unitRef) errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Einheitennummer', message: 'Einheitennummer ist erforderlich' });
    if (!firstName) errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Vorname', message: 'Vorname ist erforderlich' });
    if (!lastName) errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Nachname', message: 'Nachname ist erforderlich' });
    if (!contractStartStr) errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Vertragsbeginn', message: 'Vertragsbeginn ist erforderlich' });
    if (coldRent === undefined) errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Kaltmiete', message: 'Kaltmiete ist erforderlich' });

    if (propRef && !propertyRefs.includes(propRef)) {
      errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Immobilien-Ref', message: `Immobilie "${propRef}" nicht in Blatt "Immobilien" gefunden` });
    }

    if (propRef && unitRef) {
      const key = `${propRef}::${unitRef}`;
      if (!unitKeys.has(key)) {
        errors.push({ sheet: 'Mietverhältnisse', row: rowNum, column: 'Einheitennummer', message: `Einheit "${unitRef}" für Immobilie "${propRef}" nicht in Blatt "Einheiten" gefunden` });
      }
    }

    const rawRentType = getCellValue(row, ['Mietart', 'Rent Type']);
    const rentType = RENT_TYPES[rawRentType] || 'cold_rent_advance';

    if (propRef && unitRef && firstName && lastName && contractStartStr && coldRent !== undefined) {
      tenants.push({
        property_ref: propRef,
        unit_ref: unitRef,
        salutation: getCellValue(row, ['Anrede', 'Salutation']) || undefined,
        first_name: firstName,
        last_name: lastName,
        email: getCellValue(row, ['E-Mail', 'Email', 'Mail']) || undefined,
        phone: getCellValue(row, ['Telefon', 'Phone', 'Tel.']) || undefined,
        company_name: getCellValue(row, ['Firma', 'Company', 'Unternehmen']) || undefined,
        contract_start: contractStartStr,
        contract_end: getDateValue(row, ['Vertragsende', 'Contract End', 'Mietende']),
        cold_rent: coldRent,
        additional_costs: getNumericValue(row, ['Nebenkosten-Vorauszahlung', 'Nebenkosten', 'Additional Costs', 'NK']),
        heating_costs: getNumericValue(row, ['Heizkostenvorauszahlung', 'Heizkosten', 'Heating Costs']),
        deposit: getNumericValue(row, ['Kaution', 'Deposit']),
        rent_type: rentType,
      });
    }
  });

  return { data: tenants, errors };
}

export function parseImportExcel(file: ArrayBuffer): ParsedImportData {
  const wb = XLSX.read(file, { type: 'array', cellDates: false });
  const allErrors: ValidationError[] = [];

  const propSheetName = wb.SheetNames.find(n =>
    n.toLowerCase().includes('immobil') || n.toLowerCase() === 'properties'
  );
  const unitSheetName = wb.SheetNames.find(n =>
    n.toLowerCase().includes('einheit') || n.toLowerCase() === 'units'
  );
  const tenantSheetName = wb.SheetNames.find(n =>
    n.toLowerCase().includes('miet') || n.toLowerCase() === 'tenants'
  );

  if (!propSheetName) {
    allErrors.push({ sheet: '-', row: 0, column: '-', message: 'Blatt "Immobilien" nicht gefunden. Bitte verwenden Sie die Vorlage.' });
    return { properties: [], units: [], tenants: [], errors: allErrors };
  }

  const { data: properties, errors: propErrors } = parseProperties(wb.Sheets[propSheetName]);
  allErrors.push(...propErrors);

  const propertyRefs = properties.map(p => p.ref_nr);

  let units: ImportUnit[] = [];
  if (unitSheetName) {
    const result = parseUnits(wb.Sheets[unitSheetName], propertyRefs);
    units = result.data;
    allErrors.push(...result.errors);
  }

  const unitKeys = new Set(units.map(u => `${u.property_ref}::${u.unit_number}`));

  let tenants: ImportTenant[] = [];
  if (tenantSheetName) {
    const result = parseTenants(wb.Sheets[tenantSheetName], propertyRefs, unitKeys);
    tenants = result.data;
    allErrors.push(...result.errors);
  }

  return { properties, units, tenants, errors: allErrors };
}
