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

export async function exportToPDF(data: PropertyWithUnitsAndTenants[]) {
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

export function exportToCSV(data: PropertyWithUnitsAndTenants[]) {
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

export function exportToExcel(data: PropertyWithUnitsAndTenants[]) {
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
