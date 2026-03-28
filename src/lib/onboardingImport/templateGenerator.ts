import * as XLSX from 'xlsx';

export function downloadImportTemplate() {
  const wb = XLSX.utils.book_new();

  const propertiesHeader = [
    'Ref-Nr.',
    'Name',
    'Straße',
    'PLZ',
    'Stadt',
    'Objekttyp',
    'Eigentumsart',
    'Kaufpreis',
    'Aktueller Wert',
    'Kaufdatum',
    'Baujahr',
  ];

  const propertiesExample = [
    'IMM-1',
    'Musterstraße 10',
    'Musterstraße 10',
    '10115',
    'Berlin',
    'Mehrfamilienhaus',
    'Gesamtobjekt',
    '350000',
    '420000',
    '15.03.2020',
    '1985',
  ];

  const propertiesHint = [
    '(Pflicht, eindeutig)',
    '(Pflicht)',
    '(Pflicht)',
    '(Pflicht)',
    '(Pflicht)',
    'Mehrfamilienhaus / Einfamilienhaus / Wohnung / Gewerbeeinheit / Garage/Stellplatz / Grundstück / Sonstiges',
    'Gesamtobjekt / Einzelne Einheiten',
    '(Optional, in EUR)',
    '(Optional, in EUR)',
    '(Optional, TT.MM.JJJJ)',
    '(Optional)',
  ];

  const propertiesData = [propertiesHeader, propertiesHint, propertiesExample];
  const wsProperties = XLSX.utils.aoa_to_sheet(propertiesData);
  wsProperties['!cols'] = propertiesHeader.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, wsProperties, 'Immobilien');

  const unitsHeader = [
    'Immobilien-Ref',
    'Einheitennummer',
    'Einheitentyp',
    'Etage',
    'Fläche (m²)',
    'Zimmer',
  ];

  const unitsExample = [
    'IMM-1',
    'WE01',
    'Wohnung',
    '1',
    '65',
    '3',
  ];

  const unitsHint = [
    '(Pflicht, muss mit Ref-Nr. aus Blatt "Immobilien" übereinstimmen)',
    '(Pflicht)',
    'Wohnung / Büro / Stellplatz / Lager / Gewerbe',
    '(Optional)',
    '(Optional)',
    '(Optional)',
  ];

  const unitsData = [unitsHeader, unitsHint, unitsExample];
  const wsUnits = XLSX.utils.aoa_to_sheet(unitsData);
  wsUnits['!cols'] = unitsHeader.map(() => ({ wch: 28 }));
  XLSX.utils.book_append_sheet(wb, wsUnits, 'Einheiten');

  const tenantsHeader = [
    'Immobilien-Ref',
    'Einheitennummer',
    'Anrede',
    'Vorname',
    'Nachname',
    'E-Mail',
    'Telefon',
    'Firma',
    'Vertragsbeginn',
    'Vertragsende',
    'Kaltmiete',
    'Nebenkosten-Vorauszahlung',
    'Heizkostenvorauszahlung',
    'Kaution',
    'Mietart',
  ];

  const tenantsExample = [
    'IMM-1',
    'WE01',
    'Herr',
    'Max',
    'Mustermann',
    'max@example.de',
    '+49 170 1234567',
    '',
    '01.01.2022',
    '',
    '650',
    '200',
    '80',
    '1950',
    'Kaltmiete + Vorauszahlung',
  ];

  const tenantsHint = [
    '(Pflicht, muss mit Ref-Nr. aus Blatt "Immobilien" übereinstimmen)',
    '(Pflicht, muss mit Einheitennummer aus Blatt "Einheiten" übereinstimmen)',
    'Herr / Frau / Divers (Optional)',
    '(Pflicht)',
    '(Pflicht)',
    '(Optional)',
    '(Optional)',
    '(Optional)',
    '(Pflicht, TT.MM.JJJJ)',
    '(Optional, TT.MM.JJJJ, leer = unbefristet)',
    '(Pflicht, in EUR)',
    '(Optional, in EUR)',
    '(Optional, in EUR)',
    '(Optional, in EUR)',
    'Kaltmiete + Vorauszahlung / Kaltmiete + NK + Heizkosten / Pauschalmiete',
  ];

  const tenantsData = [tenantsHeader, tenantsHint, tenantsExample];
  const wsTenants = XLSX.utils.aoa_to_sheet(tenantsData);
  wsTenants['!cols'] = tenantsHeader.map(() => ({ wch: 30 }));
  XLSX.utils.book_append_sheet(wb, wsTenants, 'Mietverhältnisse');

  XLSX.writeFile(wb, 'Rentably_Import_Vorlage.xlsx');
}
