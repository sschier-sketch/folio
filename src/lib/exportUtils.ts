import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportProperty {
  id: string;
  name: string;
  address: string;
  property_type: string;
  property_management_type?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  description: string;
}

interface ExportUnit {
  unit_number: string;
  status: string;
  size_sqm?: number;
  monthly_rent?: number;
}

interface ExportTenant {
  name: string;
  email: string | null;
  phone: string | null;
}

interface PropertyWithUnitsAndTenants {
  property: ExportProperty;
  units: Array<{
    unit: ExportUnit;
    tenant?: ExportTenant;
  }>;
}

interface ExportContract {
  start_date: string;
  end_date: string;
  monthly_rent: number;
  total_rent: number;
  deposit: number;
  status: string;
  rent_type: string;
  unit_number: string;
  is_sublet: boolean;
  vat_applicable: boolean;
}

interface TenantWithDetails {
  tenant: {
    name: string;
    email: string;
    phone: string;
    property: string;
    address: string;
  };
  contracts: ExportContract[];
}

const getPropertyTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    multi_family: "Mehrfamilienhaus",
    house: "Einfamilienhaus",
    commercial: "Gewerbeeinheit",
    parking: "Garage/Stellplatz",
    land: "Grundstück",
    other: "Sonstiges",
  };
  return labels[type] || type;
};

const getManagementTypeLabel = (type?: string): string => {
  if (!type) return "Nicht angegeben";
  const labels: Record<string, string> = {
    rental_management: "Miet Verwaltung",
    weg_management: "WEG Verwaltung",
    rental_and_weg_management: "Miet und WEG Verwaltung",
  };
  return labels[type] || type;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: string | null): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("de-DE");
};

export async function exportToPDF(data: PropertyWithUnitsAndTenants[] | TenantWithDetails[], type: 'properties' | 'tenants' = 'properties') {
  if (type === 'tenants') {
    return exportTenantsToPDF(data as TenantWithDetails[]);
  }
  return exportPropertiesToPDF(data as PropertyWithUnitsAndTenants[]);
}

async function exportPropertiesToPDF(data: PropertyWithUnitsAndTenants[]) {
  const doc = new jsPDF();
  const exportDate = new Date().toLocaleDateString("de-DE");

  doc.setFontSize(20);
  doc.text("Rentably - Immobilien Export", 14, 20);

  doc.setFontSize(10);
  doc.text(`Exportdatum: ${exportDate}`, 14, 28);

  let yPosition = 35;

  data.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(item.property.name, 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const propertyInfo = [
      ['Adresse', item.property.address],
      ['Typ', getPropertyTypeLabel(item.property.property_type)],
      ['Verwaltung', getManagementTypeLabel(item.property.property_management_type)],
      ['Kaufpreis', formatCurrency(item.property.purchase_price)],
      ['Aktueller Wert', formatCurrency(item.property.current_value)],
      ['Kaufdatum', formatDate(item.property.purchase_date)],
      ['Fläche', item.property.size_sqm ? `${item.property.size_sqm} m²` : '-'],
      ['Beschreibung', item.property.description || '-'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Stammdaten', '']],
      body: propertyInfo,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 130 },
      },
      margin: { left: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    if (item.units.length > 0) {
      const unitsData = item.units.map(u => [
        u.unit.unit_number,
        u.unit.status === 'rented' ? 'Vermietet' : u.unit.status === 'vacant' ? 'Leer' : u.unit.status,
        u.unit.size_sqm ? `${u.unit.size_sqm} m²` : '-',
        u.unit.monthly_rent ? formatCurrency(u.unit.monthly_rent) : '-',
        u.tenant?.name || '-',
        u.tenant?.email || '-',
        u.tenant?.phone || '-',
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Einheit', 'Status', 'Fläche', 'Miete', 'Mieter', 'E-Mail', 'Telefon']],
        body: unitsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
      });
    }
  });

  doc.save(`Rentably_Immobilien_Export_${new Date().toISOString().split('T')[0]}.pdf`);
}

async function exportTenantsToPDF(data: TenantWithDetails[]) {
  const doc = new jsPDF();
  const exportDate = new Date().toLocaleDateString("de-DE");

  doc.setFontSize(20);
  doc.text("Rentably - Mietverhältnisse Export", 14, 20);

  doc.setFontSize(10);
  doc.text(`Exportdatum: ${exportDate}`, 14, 28);

  let yPosition = 35;

  data.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(item.tenant.name, 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const tenantInfo = [
      ['E-Mail', item.tenant.email || '-'],
      ['Telefon', item.tenant.phone || '-'],
      ['Immobilie', item.tenant.property],
      ['Adresse', item.tenant.address],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Mieterdaten', '']],
      body: tenantInfo,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 130 },
      },
      margin: { left: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    if (item.contracts.length > 0) {
      const contractsData = item.contracts.map(c => [
        c.start_date ? formatDate(c.start_date) : '-',
        c.end_date ? formatDate(c.end_date) : 'Unbefristet',
        c.unit_number || '-',
        formatCurrency(c.monthly_rent || c.total_rent || 0),
        formatCurrency(c.deposit || 0),
        c.status === 'active' ? 'Aktiv' : c.status === 'terminated' ? 'Gekündigt' : c.status,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Start', 'Ende', 'Einheit', 'Miete', 'Kaution', 'Status']],
        body: contractsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
      });
    }
  });

  doc.save(`Rentably_Mietverhaeltnisse_Export_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToCSV(data: PropertyWithUnitsAndTenants[] | TenantWithDetails[], type: 'properties' | 'tenants' = 'properties') {
  if (type === 'tenants') {
    return exportTenantsToCSV(data as TenantWithDetails[]);
  }
  return exportPropertiesToCSV(data as PropertyWithUnitsAndTenants[]);
}

function exportPropertiesToCSV(data: PropertyWithUnitsAndTenants[]) {
  const rows: string[][] = [
    [
      'Immobilie',
      'Adresse',
      'Typ',
      'Verwaltung',
      'Kaufpreis',
      'Aktueller Wert',
      'Kaufdatum',
      'Fläche (m²)',
      'Einheit',
      'Einheit Status',
      'Einheit Fläche (m²)',
      'Monatsmiete',
      'Mieter',
      'Mieter E-Mail',
      'Mieter Telefon',
      'Beschreibung',
    ],
  ];

  data.forEach(item => {
    if (item.units.length === 0) {
      rows.push([
        item.property.name,
        item.property.address,
        getPropertyTypeLabel(item.property.property_type),
        getManagementTypeLabel(item.property.property_management_type),
        item.property.purchase_price.toString(),
        item.property.current_value.toString(),
        formatDate(item.property.purchase_date),
        item.property.size_sqm?.toString() || '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        item.property.description || '-',
      ]);
    } else {
      item.units.forEach(u => {
        rows.push([
          item.property.name,
          item.property.address,
          getPropertyTypeLabel(item.property.property_type),
          getManagementTypeLabel(item.property.property_management_type),
          item.property.purchase_price.toString(),
          item.property.current_value.toString(),
          formatDate(item.property.purchase_date),
          item.property.size_sqm?.toString() || '-',
          u.unit.unit_number,
          u.unit.status === 'rented' ? 'Vermietet' : u.unit.status === 'vacant' ? 'Leer' : u.unit.status,
          u.unit.size_sqm?.toString() || '-',
          u.unit.monthly_rent?.toString() || '-',
          u.tenant?.name || '-',
          u.tenant?.email || '-',
          u.tenant?.phone || '-',
          item.property.description || '-',
        ]);
      });
    }
  });

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Rentably_Immobilien_Export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

function exportTenantsToCSV(data: TenantWithDetails[]) {
  const rows: string[][] = [
    [
      'Mieter',
      'E-Mail',
      'Telefon',
      'Immobilie',
      'Adresse',
      'Vertrag Start',
      'Vertrag Ende',
      'Einheit',
      'Monatsmiete',
      'Kaution',
      'Status',
      'Mietart',
      'Untermiete',
      'MwSt. pflichtig',
    ],
  ];

  data.forEach(item => {
    if (item.contracts.length === 0) {
      rows.push([
        item.tenant.name,
        item.tenant.email || '-',
        item.tenant.phone || '-',
        item.tenant.property,
        item.tenant.address,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ]);
    } else {
      item.contracts.forEach(c => {
        rows.push([
          item.tenant.name,
          item.tenant.email || '-',
          item.tenant.phone || '-',
          item.tenant.property,
          item.tenant.address,
          c.start_date ? formatDate(c.start_date) : '-',
          c.end_date ? formatDate(c.end_date) : 'Unbefristet',
          c.unit_number || '-',
          (c.monthly_rent || c.total_rent || 0).toString(),
          (c.deposit || 0).toString(),
          c.status === 'active' ? 'Aktiv' : c.status === 'terminated' ? 'Gekündigt' : c.status,
          c.rent_type || '-',
          c.is_sublet ? 'Ja' : 'Nein',
          c.vat_applicable ? 'Ja' : 'Nein',
        ]);
      });
    }
  });

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Rentably_Mietverhaeltnisse_Export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportToExcel(data: PropertyWithUnitsAndTenants[] | TenantWithDetails[], type: 'properties' | 'tenants' = 'properties') {
  if (type === 'tenants') {
    return exportTenantsToExcel(data as TenantWithDetails[]);
  }
  return exportPropertiesToExcel(data as PropertyWithUnitsAndTenants[]);
}

function exportPropertiesToExcel(data: PropertyWithUnitsAndTenants[]) {
  const rows: any[][] = [
    [
      'Immobilie',
      'Adresse',
      'Typ',
      'Verwaltung',
      'Kaufpreis',
      'Aktueller Wert',
      'Kaufdatum',
      'Fläche (m²)',
      'Einheit',
      'Einheit Status',
      'Einheit Fläche (m²)',
      'Monatsmiete',
      'Mieter',
      'Mieter E-Mail',
      'Mieter Telefon',
      'Beschreibung',
    ],
  ];

  data.forEach(item => {
    if (item.units.length === 0) {
      rows.push([
        item.property.name,
        item.property.address,
        getPropertyTypeLabel(item.property.property_type),
        getManagementTypeLabel(item.property.property_management_type),
        item.property.purchase_price,
        item.property.current_value,
        formatDate(item.property.purchase_date),
        item.property.size_sqm || '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        item.property.description || '-',
      ]);
    } else {
      item.units.forEach(u => {
        rows.push([
          item.property.name,
          item.property.address,
          getPropertyTypeLabel(item.property.property_type),
          getManagementTypeLabel(item.property.property_management_type),
          item.property.purchase_price,
          item.property.current_value,
          formatDate(item.property.purchase_date),
          item.property.size_sqm || '-',
          u.unit.unit_number,
          u.unit.status === 'rented' ? 'Vermietet' : u.unit.status === 'vacant' ? 'Leer' : u.unit.status,
          u.unit.size_sqm || '-',
          u.unit.monthly_rent || '-',
          u.tenant?.name || '-',
          u.tenant?.email || '-',
          u.tenant?.phone || '-',
          item.property.description || '-',
        ]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Immobilien');

  XLSX.writeFile(wb, `Rentably_Immobilien_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportTenantsToExcel(data: TenantWithDetails[]) {
  const rows: any[][] = [
    [
      'Mieter',
      'E-Mail',
      'Telefon',
      'Immobilie',
      'Adresse',
      'Vertrag Start',
      'Vertrag Ende',
      'Einheit',
      'Monatsmiete',
      'Kaution',
      'Status',
      'Mietart',
      'Untermiete',
      'MwSt. pflichtig',
    ],
  ];

  data.forEach(item => {
    if (item.contracts.length === 0) {
      rows.push([
        item.tenant.name,
        item.tenant.email || '-',
        item.tenant.phone || '-',
        item.tenant.property,
        item.tenant.address,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ]);
    } else {
      item.contracts.forEach(c => {
        rows.push([
          item.tenant.name,
          item.tenant.email || '-',
          item.tenant.phone || '-',
          item.tenant.property,
          item.tenant.address,
          c.start_date ? formatDate(c.start_date) : '-',
          c.end_date ? formatDate(c.end_date) : 'Unbefristet',
          c.unit_number || '-',
          c.monthly_rent || c.total_rent || 0,
          c.deposit || 0,
          c.status === 'active' ? 'Aktiv' : c.status === 'terminated' ? 'Gekündigt' : c.status,
          c.rent_type || '-',
          c.is_sublet ? 'Ja' : 'Nein',
          c.vat_applicable ? 'Ja' : 'Nein',
        ]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mietverhältnisse');

  XLSX.writeFile(wb, `Rentably_Mietverhaeltnisse_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}
