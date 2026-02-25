import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnlageVSummary } from './anlageVService';

const PAGE_W = 210;
const PAGE_H = 297;
const M_LEFT = 20;
const M_RIGHT = 20;
const M_TOP = 18;
const M_BOTTOM = 18;
const FOOTER_H = 12;
const HEADER_END_Y = 38;
const CONTENT_BOTTOM_Y = PAGE_H - M_BOTTOM - FOOTER_H;

function loadLogo(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const maxWidth = 200;
      const scale = Math.min(1, maxWidth / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/asset_1@4x.png';
  });
}

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function fmtDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('de-DE');
}

export async function generateAnlageVPdf(summary: AnlageVSummary): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const exportDate = new Date().toLocaleDateString('de-DE');
  const logoData = await loadLogo();
  let currentY = HEADER_END_Y;

  const drawHeader = () => {
    if (logoData) {
      doc.addImage(logoData, 'JPEG', PAGE_W - M_RIGHT - 40, M_TOP, 40, 8);
    }
    doc.setFontSize(10);
    doc.setFont(undefined as any, 'normal');
    doc.setTextColor(0);
    doc.text(`Anlage V - ${summary.year}`, M_LEFT, M_TOP + 9);
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, M_TOP + 12, PAGE_W - M_RIGHT, M_TOP + 12);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const lineY = PAGE_H - M_BOTTOM - FOOTER_H;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, lineY, PAGE_W - M_RIGHT, lineY);
    doc.setFontSize(7);
    doc.setFont(undefined as any, 'normal');
    doc.setTextColor(130);
    doc.text(
      'Hinweis: Diese Uebersicht ersetzt keine Steuerberatung. Alle Angaben ohne Gewaehr.',
      M_LEFT,
      lineY + 4
    );
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Rentably - Anlage V - Export vom ${exportDate}`, M_LEFT, PAGE_H - M_BOTTOM);
    const pageText = `Seite ${pageNum} von ${totalPages}`;
    doc.text(pageText, PAGE_W - M_RIGHT - doc.getTextWidth(pageText), PAGE_H - M_BOTTOM);
    doc.setTextColor(0);
  };

  const ensureSpace = (h: number) => {
    if (currentY + h > CONTENT_BOTTOM_Y) {
      doc.addPage();
      drawHeader();
      currentY = HEADER_END_Y;
    }
  };

  drawHeader();

  doc.setFontSize(18);
  doc.setFont(undefined as any, 'bold');
  doc.text(`Anlage V - Jahresuebersicht ${summary.year}`, M_LEFT, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont(undefined as any, 'normal');
  doc.setTextColor(80);
  doc.text(`Objekt: ${summary.scope_label}`, M_LEFT, currentY);
  currentY += 5;
  if (summary.scope_address) {
    doc.text(`Adresse: ${summary.scope_address}`, M_LEFT, currentY);
    currentY += 5;
  }
  if (summary.ownership_share !== 100) {
    doc.text(`Eigentumsanteil: ${summary.ownership_share}%`, M_LEFT, currentY);
    currentY += 5;
  }
  doc.setTextColor(0);
  currentY += 3;

  doc.setDrawColor(230);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

  ensureSpace(35);
  doc.setFontSize(12);
  doc.setFont(undefined as any, 'bold');
  doc.text('Zusammenfassung', M_LEFT, currentY);
  currentY += 5;

  const hasAfa = summary.afa && summary.afa.enabled && summary.afa.afa_amount > 0;

  const summaryData: string[][] = [
    ['Einnahmen gesamt', fmtCurrency(summary.income_total)],
    ['Ausgaben gesamt', fmtCurrency(summary.expense_total)],
  ];
  if (hasAfa) {
    summaryData.push(['AfA (Abschreibung)', fmtCurrency(summary.afa_total)]);
    summaryData.push(['Ergebnis (Einnahmen - Ausgaben - AfA)', fmtCurrency(summary.result_total)]);
  } else {
    summaryData.push(['Ergebnis (Einnahmen - Ausgaben)', fmtCurrency(summary.result_total)]);
  }

  autoTable(doc, {
    startY: currentY,
    body: summaryData,
    theme: 'plain',
    margin: { left: M_LEFT, right: M_RIGHT },
    tableWidth: PAGE_W - M_LEFT - M_RIGHT,
    styles: {
      fontSize: 10,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      textColor: 20,
      lineColor: 230,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 100, textColor: 80, fontSize: 10 },
      1: { cellWidth: 70, halign: 'right' as const, fontStyle: 'bold', fontSize: 10 },
    },
    didDrawPage: () => drawHeader(),
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  if (summary.incomes.length > 0) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setFont(undefined as any, 'bold');
    doc.text('Einnahmen', M_LEFT, currentY);
    currentY += 4;

    const incomeRows = summary.incomes.map(r => [
      fmtDate(r.date),
      fmtCurrency(r.amount),
      r.source_type,
      r.tenant_name || '-',
      r.property_name,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Datum', 'Betrag', 'Quelle', 'Mieter', 'Immobilie']],
      body: incomeRows,
      theme: 'plain',
      margin: { left: M_LEFT, right: M_RIGHT },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      headStyles: { fontSize: 8.5, fontStyle: 'bold', textColor: 0, fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30, halign: 'right' as const },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 35 },
      },
      didDrawPage: () => drawHeader(),
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (summary.expenses.length > 0) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setFont(undefined as any, 'bold');
    doc.text('Ausgaben', M_LEFT, currentY);
    currentY += 4;

    const expenseRows = summary.expenses.map(r => [
      fmtDate(r.date),
      fmtCurrency(r.amount),
      r.anlage_v_group,
      r.category,
      r.vendor || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Datum', 'Betrag', 'Gruppe', 'Kategorie', 'Empfaenger']],
      body: expenseRows,
      theme: 'plain',
      margin: { left: M_LEFT, right: M_RIGHT },
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      headStyles: { fontSize: 8.5, fontStyle: 'bold', textColor: 0, fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 28, halign: 'right' as const },
        2: { cellWidth: 38 },
        3: { cellWidth: 42 },
        4: { cellWidth: 37 },
      },
      didDrawPage: () => drawHeader(),
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (hasAfa) {
    ensureSpace(45);
    doc.setFontSize(12);
    doc.setFont(undefined as any, 'bold');
    doc.text('AfA (Absetzung fuer Abnutzung)', M_LEFT, currentY);
    currentY += 5;

    const afaParams: string[][] = [
      ['AfA-Betrag ' + summary.year, fmtCurrency(summary.afa.afa_amount)],
      ['Jaehrliche AfA (voll)', fmtCurrency(summary.afa.annual_afa_full)],
      ['Gebaeudeanteil (Bemessungsgrundlage)', fmtCurrency(summary.afa.building_value_amount)],
      ['AfA-Satz', `${(summary.afa.afa_rate * 100).toFixed(1)}%`],
      ['Eigentumsanteil', `${summary.afa.ownership_share}%`],
      ['Monatsfaktor', summary.afa.months_factor < 1 ? `${Math.round(summary.afa.months_factor * 12)}/12 (anteilig)` : '12/12'],
    ];

    if (summary.afa_settings?.purchase_date) {
      afaParams.push(['Anschaffungsdatum', fmtDate(summary.afa_settings.purchase_date)]);
    }
    if (summary.afa_settings?.usage_type) {
      const usageLabels: Record<string, string> = { residential: 'Wohnnutzung', commercial: 'Gewerblich', mixed: 'Gemischt' };
      afaParams.push(['Nutzungstyp', usageLabels[summary.afa_settings.usage_type] || summary.afa_settings.usage_type]);
    }

    autoTable(doc, {
      startY: currentY,
      body: afaParams,
      theme: 'plain',
      margin: { left: M_LEFT, right: M_RIGHT },
      tableWidth: PAGE_W - M_LEFT - M_RIGHT,
      styles: {
        fontSize: 9,
        cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 100, textColor: 80 },
        1: { cellWidth: 70, halign: 'right' as const, fontStyle: 'bold' },
      },
      didDrawPage: () => drawHeader(),
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;

    doc.setFontSize(7);
    doc.setFont(undefined as any, 'italic');
    doc.setTextColor(120);
    doc.text(
      'Hinweis: Die AfA-Berechnung dient ausschliesslich der Uebersicht. Sie ersetzt keine steuerliche Beratung.',
      M_LEFT,
      currentY
    );
    doc.setFont(undefined as any, 'normal');
    doc.setTextColor(0);
    currentY += 8;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  doc.save(`Anlage_V_${summary.year}_${summary.scope_label.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function exportAnlageVCsv(summary: AnlageVSummary, type: 'incomes' | 'expenses' | 'afa'): void {
  const rows: string[][] = [];

  if (type === 'incomes') {
    rows.push(['Datum', 'Betrag', 'Quelle', 'Mieter', 'Mietvertrag', 'Immobilie', 'Einheit', 'ID']);
    for (const r of summary.incomes) {
      rows.push([
        fmtDate(r.date),
        r.amount.toFixed(2).replace('.', ','),
        r.source_type,
        r.tenant_name,
        r.contract_info,
        r.property_name,
        r.unit_number,
        r.id,
      ]);
    }
  } else if (type === 'afa') {
    rows.push(['Parameter', 'Wert']);
    rows.push(['AfA-Betrag ' + summary.year, summary.afa.afa_amount.toFixed(2).replace('.', ',')]);
    rows.push(['Jährliche AfA (voll)', summary.afa.annual_afa_full.toFixed(2).replace('.', ',')]);
    rows.push(['Gebäudeanteil', summary.afa.building_value_amount.toFixed(2).replace('.', ',')]);
    rows.push(['AfA-Satz', (summary.afa.afa_rate * 100).toFixed(1).replace('.', ',') + '%']);
    rows.push(['Eigentumsanteil', summary.afa.ownership_share + '%']);
    rows.push(['Monatsfaktor', summary.afa.months_factor < 1 ? `${Math.round(summary.afa.months_factor * 12)}/12` : '12/12']);
    if (summary.afa_settings?.purchase_date) {
      rows.push(['Anschaffungsdatum', fmtDate(summary.afa_settings.purchase_date)]);
    }
    if (summary.afa_settings?.usage_type) {
      rows.push(['Nutzungstyp', summary.afa_settings.usage_type]);
    }
  } else {
    rows.push(['Datum', 'Betrag', 'Kategorie', 'Anlage-V-Gruppe', 'Empfänger', 'Notiz', 'Immobilie', 'Einheit', 'ID']);
    for (const r of summary.expenses) {
      rows.push([
        fmtDate(r.date),
        r.amount.toFixed(2).replace('.', ','),
        r.category,
        r.anlage_v_group,
        r.vendor,
        r.note,
        r.property_name,
        r.unit_number,
        r.id,
      ]);
    }
  }

  const csvContent = rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const typeLabels: Record<string, string> = { incomes: 'einnahmen', expenses: 'ausgaben', afa: 'afa' };
  link.download = `anlage-v-${typeLabels[type]}-${summary.year}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
