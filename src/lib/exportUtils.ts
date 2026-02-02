import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

async function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

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
  rooms?: number;
  floor_number?: number;
  cold_rent?: number;
  total_rent?: number;
  monthly_rent?: number;
}

interface ExportEquipment {
  heating_type?: string;
  energy_source?: string;
  construction_type?: string;
  roof_type?: string;
  parking_spots?: number;
  elevator?: boolean;
  balcony_terrace?: boolean;
  garden?: boolean;
  basement?: boolean;
  fitted_kitchen?: boolean;
  wg_suitable?: boolean;
  guest_wc?: boolean;
  housing_permit?: boolean;
  parking_type?: string;
  equipment_notes?: string;
  special_features?: string;
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
  equipment?: ExportEquipment;
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

const getHeatingTypeLabel = (type?: string): string => {
  if (!type) return "-";
  const labels: Record<string, string> = {
    gas: "Gas",
    oil: "Öl",
    district_heating: "Fernwärme",
    heat_pump: "Wärmepumpe",
    electric: "Elektro",
    other: "Sonstiges",
  };
  return labels[type] || type;
};

const getEnergySourceLabel = (source?: string): string => {
  if (!source) return "-";
  const labels: Record<string, string> = {
    gas: "Gas",
    oil: "Öl",
    electricity: "Strom",
    solar: "Solar",
    district: "Fernwärme",
    other: "Sonstiges",
  };
  return labels[source] || source;
};

const getConstructionTypeLabel = (type?: string): string => {
  if (!type) return "-";
  const labels: Record<string, string> = {
    solid: "Massiv",
    prefab: "Fertigbau",
    wood: "Holzbau",
    mixed: "Gemischt",
    other: "Sonstiges",
  };
  return labels[type] || type;
};

export async function exportToPDF(data: PropertyWithUnitsAndTenants[] | TenantWithDetails[], type: 'properties' | 'tenants' = 'properties') {
  if (type === 'tenants') {
    return exportTenantsToPDF(data as TenantWithDetails[]);
  }
  return exportPropertiesToPDF(data as PropertyWithUnitsAndTenants[]);
}

async function exportPropertiesToPDF(data: PropertyWithUnitsAndTenants[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const exportDate = new Date().toLocaleDateString("de-DE");

  let logoData: string | null = null;
  try {
    logoData = await loadImageAsDataURL('/asset_1@4x.png');
  } catch (error) {
    console.warn('Could not load logo for PDF export:', error);
  }

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M_LEFT = 20;
  const M_RIGHT = 20;
  const M_TOP = 18;
  const M_BOTTOM = 18;
  const FOOTER_H = 12;
  const CONTENT_BOTTOM_Y = PAGE_H - M_BOTTOM - FOOTER_H;
  const HEADER_END_Y = 38;

  let currentY = HEADER_END_Y;

  const drawHeader = () => {
    if (logoData) {
      const logoHeight = 8;
      const logoWidth = 40;
      doc.addImage(logoData, 'PNG', PAGE_W - M_RIGHT - logoWidth, M_TOP, logoWidth, logoHeight);
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    doc.text("Immobilienübersicht", M_LEFT, M_TOP + 9);

    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, M_TOP + 12, PAGE_W - M_RIGHT, M_TOP + 12);

    doc.setTextColor(0);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const lineY = PAGE_H - M_BOTTOM - FOOTER_H;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, lineY, PAGE_W - M_RIGHT, lineY);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Rentably · Immobilienübersicht · Export vom ${exportDate}`, M_LEFT, PAGE_H - M_BOTTOM);

    const pageText = `Seite ${pageNum} von ${totalPages}`;
    const pageWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE_W - M_RIGHT - pageWidth, PAGE_H - M_BOTTOM);

    doc.setTextColor(0);
  };

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > CONTENT_BOTTOM_Y) {
      doc.addPage();
      drawHeader();
      currentY = HEADER_END_Y;
    }
  };

  const renderKeyValueTable = (rows: string[][], startY: number) => {
    const tableWidth = PAGE_W - M_LEFT - M_RIGHT;
    const labelWidth = 55;

    autoTable(doc, {
      startY: startY,
      body: rows,
      theme: 'plain',
      margin: { left: M_LEFT, right: M_RIGHT },
      tableWidth: tableWidth,
      styles: {
        fontSize: 10,
        cellPadding: { top: 1.6, right: 1.6, bottom: 1.6, left: 1.6 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: {
          cellWidth: labelWidth,
          textColor: 110,
          fontStyle: 'normal',
          fontSize: 9
        },
        1: {
          cellWidth: tableWidth - labelWidth,
          textColor: 20,
          fontSize: 10
        },
      },
      rowPageBreak: 'avoid',
      didDrawPage: () => {
        drawHeader();
      },
    });

    return (doc as any).lastAutoTable.finalY + 6;
  };

  drawHeader();

  data.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
      drawHeader();
      currentY = HEADER_END_Y;
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text(item.property.name, M_LEFT, currentY);
    currentY += 7;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(item.property.address, M_LEFT, currentY);
    doc.setTextColor(0);
    currentY += 4;

    doc.setDrawColor(230);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
    currentY += 8;

    const totalUnits = item.units.length;
    const rentedUnits = item.units.filter(u => u.unit.status === 'rented').length;
    const isFullyRented = totalUnits > 0 && rentedUnits === totalUnits;

    const totalSqm = item.property.size_sqm || item.units.reduce((sum, u) => sum + (u.unit.size_sqm || 0), 0);

    ensureSpace(40);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Kernkennzahlen", M_LEFT, currentY);
    currentY += 4;

    const coreData: string[][] = [
      ['Kaufpreis', formatCurrency(item.property.purchase_price)],
      ['Aktueller Wert', formatCurrency(item.property.current_value)],
      ['Gesamtfläche', totalSqm ? `${totalSqm} m²` : '-'],
      ['Einheiten', totalUnits.toString()],
    ];

    if (totalUnits > 0) {
      coreData.push(['Voll vermietet', isFullyRented ? 'Ja' : 'Nein']);
    }

    currentY = renderKeyValueTable(coreData, currentY);

    ensureSpace(30);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Objektinformationen", M_LEFT, currentY);
    currentY += 4;

    const objectInfo: string[][] = [
      ['Objekttyp', getPropertyTypeLabel(item.property.property_type)],
      ['Verwaltung', getManagementTypeLabel(item.property.property_management_type)],
    ];

    if (item.property.purchase_date) {
      objectInfo.push(['Kaufdatum', formatDate(item.property.purchase_date)]);
    }

    if (item.equipment?.construction_type) {
      objectInfo.push(['Bauweise', getConstructionTypeLabel(item.equipment.construction_type)]);
    }

    currentY = renderKeyValueTable(objectInfo, currentY);

    if (item.equipment) {
      const hasAusstattung =
        item.equipment.elevator ||
        item.equipment.fitted_kitchen ||
        item.equipment.guest_wc ||
        item.equipment.basement;

      if (hasAusstattung) {
        ensureSpace(30);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Ausstattung", M_LEFT, currentY);
        currentY += 4;

        const ausstattungData: string[][] = [];

        if (item.equipment.elevator !== undefined) {
          ausstattungData.push(['Aufzug', item.equipment.elevator ? 'Ja' : 'Nein']);
        }
        if (item.equipment.fitted_kitchen !== undefined) {
          ausstattungData.push(['Einbauküche', item.equipment.fitted_kitchen ? 'Ja' : 'Nein']);
        }
        if (item.equipment.guest_wc !== undefined) {
          ausstattungData.push(['Gäste-WC', item.equipment.guest_wc ? 'Ja' : 'Nein']);
        }
        if (item.equipment.basement !== undefined) {
          ausstattungData.push(['Keller', item.equipment.basement ? 'Ja' : 'Nein']);
        }

        if (ausstattungData.length > 0) {
          currentY = renderKeyValueTable(ausstattungData, currentY);
        }
      }

      const hasOutdoor =
        item.equipment.balcony_terrace ||
        item.equipment.garden ||
        (item.equipment.parking_spots && item.equipment.parking_spots > 0);

      if (hasOutdoor) {
        ensureSpace(30);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Außenbereiche & Stellplätze", M_LEFT, currentY);
        currentY += 4;

        const outdoorData: string[][] = [];

        if (item.equipment.balcony_terrace !== undefined) {
          outdoorData.push(['Balkon / Terrasse', item.equipment.balcony_terrace ? 'Ja' : 'Nein']);
        }
        if (item.equipment.garden !== undefined) {
          outdoorData.push(['Garten', item.equipment.garden ? 'Ja' : 'Nein']);
        }
        if (item.equipment.parking_spots !== undefined) {
          outdoorData.push(['Stellplätze', item.equipment.parking_spots.toString()]);
        }
        if (item.equipment.parking_type) {
          outdoorData.push(['Parkplatz-Typ', item.equipment.parking_type]);
        }

        if (outdoorData.length > 0) {
          currentY = renderKeyValueTable(outdoorData, currentY);
        }
      }

      const hasEnergy =
        item.equipment.heating_type ||
        item.equipment.energy_source;

      if (hasEnergy) {
        ensureSpace(30);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Energie & Technik", M_LEFT, currentY);
        currentY += 4;

        const energyData: string[][] = [];

        if (item.equipment.heating_type) {
          energyData.push(['Heizungsart', getHeatingTypeLabel(item.equipment.heating_type)]);
        }
        if (item.equipment.energy_source) {
          energyData.push(['Energiequelle', getEnergySourceLabel(item.equipment.energy_source)]);
        }

        if (energyData.length > 0) {
          currentY = renderKeyValueTable(energyData, currentY);
        }
      }
    }

    if (item.units.length > 0) {
      ensureSpace(40);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Einheiten", M_LEFT, currentY);
      currentY += 4;

      const unitsData = item.units.map(u => [
        u.unit.unit_number,
        u.unit.status === 'rented' ? 'Vermietet' : u.unit.status === 'vacant' ? 'Leer' : u.unit.status === 'self_occupied' ? 'Selbst genutzt' : u.unit.status,
        u.unit.rooms?.toString() || '-',
        u.unit.size_sqm ? `${u.unit.size_sqm} m²` : '-',
        u.unit.cold_rent ? formatCurrency(u.unit.cold_rent) : '-',
        u.tenant?.name || '-',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Nr.', 'Status', 'Zi.', 'Fläche', 'Kaltmiete', 'Mieter']],
        body: unitsData,
        theme: 'plain',
        margin: { left: M_LEFT, right: M_RIGHT },
        styles: {
          fontSize: 9,
          cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
          textColor: 20,
          lineColor: 230,
          lineWidth: 0.1,
        },
        headStyles: {
          fontSize: 9,
          fontStyle: 'bold',
          textColor: 0,
          fillColor: 245,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 15 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 50 },
        },
        rowPageBreak: 'avoid',
        didDrawPage: () => {
          drawHeader();
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    currentY += 10;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  doc.save(`Rentably_Immobilien_Export_${new Date().toISOString().split('T')[0]}.pdf`);
}

async function exportTenantsToPDF(data: TenantWithDetails[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const exportDate = new Date().toLocaleDateString("de-DE");

  let logoData: string | null = null;
  try {
    logoData = await loadImageAsDataURL('/asset_1@4x.png');
  } catch (error) {
    console.warn('Could not load logo for PDF export:', error);
  }

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M_LEFT = 20;
  const M_RIGHT = 20;
  const M_TOP = 18;
  const M_BOTTOM = 18;
  const FOOTER_H = 12;
  const CONTENT_BOTTOM_Y = PAGE_H - M_BOTTOM - FOOTER_H;
  const HEADER_END_Y = 38;

  let currentY = HEADER_END_Y;

  const drawHeader = () => {
    if (logoData) {
      const logoHeight = 8;
      const logoWidth = 40;
      doc.addImage(logoData, 'PNG', PAGE_W - M_RIGHT - logoWidth, M_TOP, logoWidth, logoHeight);
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);
    doc.text("Mietverhältnisse", M_LEFT, M_TOP + 9);

    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, M_TOP + 12, PAGE_W - M_RIGHT, M_TOP + 12);

    doc.setTextColor(0);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const lineY = PAGE_H - M_BOTTOM - FOOTER_H;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, lineY, PAGE_W - M_RIGHT, lineY);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Rentably · Mietverhältnisse · Export vom ${exportDate}`, M_LEFT, PAGE_H - M_BOTTOM);

    const pageText = `Seite ${pageNum} von ${totalPages}`;
    const pageWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE_W - M_RIGHT - pageWidth, PAGE_H - M_BOTTOM);

    doc.setTextColor(0);
  };

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > CONTENT_BOTTOM_Y) {
      doc.addPage();
      drawHeader();
      currentY = HEADER_END_Y;
    }
  };

  const renderKeyValueTable = (rows: string[][], startY: number) => {
    const tableWidth = PAGE_W - M_LEFT - M_RIGHT;
    const labelWidth = 55;

    autoTable(doc, {
      startY: startY,
      body: rows,
      theme: 'plain',
      margin: { left: M_LEFT, right: M_RIGHT },
      tableWidth: tableWidth,
      styles: {
        fontSize: 10,
        cellPadding: { top: 1.6, right: 1.6, bottom: 1.6, left: 1.6 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: {
          cellWidth: labelWidth,
          textColor: 110,
          fontStyle: 'normal',
          fontSize: 9
        },
        1: {
          cellWidth: tableWidth - labelWidth,
          textColor: 20,
          fontSize: 10
        },
      },
      rowPageBreak: 'avoid',
      didDrawPage: () => {
        drawHeader();
      },
    });

    return (doc as any).lastAutoTable.finalY + 6;
  };

  drawHeader();

  data.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
      drawHeader();
      currentY = HEADER_END_Y;
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text(item.tenant.name, M_LEFT, currentY);
    currentY += 7;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`${item.tenant.property} · ${item.tenant.address}`, M_LEFT, currentY);
    doc.setTextColor(0);
    currentY += 4;

    doc.setDrawColor(230);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
    currentY += 8;

    ensureSpace(30);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Mieterdaten", M_LEFT, currentY);
    currentY += 4;

    const tenantData: string[][] = [
      ['E-Mail', item.tenant.email || '-'],
      ['Telefon', item.tenant.phone || '-'],
      ['Immobilie', item.tenant.property],
      ['Adresse', item.tenant.address],
    ];

    currentY = renderKeyValueTable(tenantData, currentY);

    if (item.contracts.length > 0) {
      ensureSpace(40);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Mietverträge", M_LEFT, currentY);
      currentY += 4;

      const contractsData = item.contracts.map(c => [
        c.start_date ? formatDate(c.start_date) : '-',
        c.end_date ? formatDate(c.end_date) : 'Unbefristet',
        c.unit_number || '-',
        formatCurrency(c.monthly_rent || c.total_rent || 0),
        formatCurrency(c.deposit || 0),
        c.status === 'active' ? 'Aktiv' : c.status === 'terminated' ? 'Gekündigt' : c.status,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Start', 'Ende', 'Einheit', 'Miete', 'Kaution', 'Status']],
        body: contractsData,
        theme: 'plain',
        margin: { left: M_LEFT, right: M_RIGHT },
        styles: {
          fontSize: 9,
          cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
          textColor: 20,
          lineColor: 230,
          lineWidth: 0.1,
        },
        headStyles: {
          fontSize: 9,
          fontStyle: 'bold',
          textColor: 0,
          fillColor: 245,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 28 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 25 },
        },
        rowPageBreak: 'avoid',
        didDrawPage: () => {
          drawHeader();
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    currentY += 10;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

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
