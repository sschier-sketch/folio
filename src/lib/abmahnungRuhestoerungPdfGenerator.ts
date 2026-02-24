import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  LandlordData,
  TenantEntry,
  GreetingData,
  AbmahnungRuhestoerungSachverhalt,
} from '../components/wizard-templates/types';

interface AbmahnungPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: AbmahnungRuhestoerungSachverhalt;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function buildSenderLine(l: LandlordData): string {
  const parts = [l.name];
  if (l.prefix) parts.push(l.prefix);
  parts.push(`${l.street} ${l.number}`.trim());
  parts.push(`${l.zip} ${l.city}`.trim());
  return parts.filter(Boolean).join(', ');
}

function buildRecipientBlock(tenants: TenantEntry[]): string[] {
  const lines: string[] = [];
  const names = tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean);
  if (names.length > 0) lines.push(names.join(', '));

  const primary = tenants[0];
  const streetLine = `${primary.street} ${primary.number}`.trim();
  if (streetLine && streetLine !== ' ') lines.push(streetLine + ' ,');
  const cityLine = `${primary.zip} ${primary.city}`.trim();
  if (cityLine) lines.push(cityLine);
  return lines;
}

function buildPropertyDesignation(t: TenantEntry): string {
  const streetLine = `${t.street} ${t.number}`.trim();
  const cityLine = `${t.zip} ${t.city}`.trim();
  return [streetLine, cityLine].filter(Boolean).join(' , ');
}

export function generateAbmahnungRuhestoerungPdf(input: AbmahnungPdfInput): Blob {
  const { landlord, tenants, greeting, sachverhalt } = input;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 20;
  const MR = 20;
  const MB = 15;
  const FOOTER_H = 8;
  const CONTENT_W = PAGE_W - ML - MR;
  const BOTTOM_LIMIT = PAGE_H - MB - FOOTER_H;

  let y = 0;

  const checkPage = (needed: number = 10) => {
    if (y > BOTTOM_LIMIT - needed) {
      doc.addPage();
      y = 25;
    }
  };

  const writeLines = (text: string, maxW: number = CONTENT_W, lineH: number = 5) => {
    const split = doc.splitTextToSize(text, maxW);
    split.forEach((line: string) => {
      checkPage(lineH + 2);
      doc.text(line, ML, y);
      y += lineH;
    });
  };

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const senderLine = buildSenderLine(landlord);
  y = 57;
  doc.text(senderLine, ML, y);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  y = 70;

  const recipientLines = buildRecipientBlock(tenants);
  recipientLines.forEach((line) => {
    doc.text(line, ML, y);
    y += 6;
  });

  y = Math.max(y, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const today = new Date().toISOString().split('T')[0];
  doc.text(`Datum: ${formatDate(today)}`, ML, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Abmahnung wegen Ruhestörung', ML, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mietverhältnis:', ML, y);
  y += 5;
  const primaryTenant = tenants[0];
  const designation = buildPropertyDesignation(primaryTenant);
  doc.text(designation, ML, y);

  y += 10;
  const tenantNames = tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean)
    .join(', ');
  doc.text(`Sehr geehrte/r ${tenantNames},`, ML, y);

  y += 8;
  if (greeting.hasPersonalGreeting && greeting.greetingText) {
    doc.setFont('helvetica', 'normal');
    writeLines(greeting.greetingText);
    y += 3;
  }

  y += 2;
  doc.setFont('helvetica', 'normal');

  const nachbar = sachverhalt.nachbarName || 'ein/e Mitmieter/in';
  const anzahl = sachverhalt.anzahlEreignisse;
  const para1 = `Der oder die Mieter/in ${nachbar} haben festgestellt, dass Sie insgesamt ${anzahl} Mal erheblichen Lärm und Geräusche verursacht haben. Der von Ihnen verursachte Lärm überstieg den bei einer normalen und vertragsgemäßen Nutzung der Wohnung entstehenden Geräuschpegel. Eine derartige Nutzung der Wohnung ist vertragswidrig, weil sich Mitmieter erheblich beeinträchtigt fühlen.`;
  writeLines(para1);

  y += 5;
  writeLines('Zu den jeweiligen von Ihnen verursachten Störungen durch Lärm verweise ich auf die nachfolgende Aufstellung:');

  y += 5;

  const validEreignisse = sachverhalt.ereignisse.filter(
    (e) => e.datum || e.uhrzeit || e.kategorie || e.beschreibung,
  );

  if (validEreignisse.length > 0) {
    const tableBody = validEreignisse.map((e) => [
      formatDate(e.datum),
      e.uhrzeit,
      e.kategorie,
      e.beschreibung,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Uhrzeit', 'Kategorie', 'Beschreibung']],
      body: tableBody,
      margin: { left: ML, right: MR },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' },
      },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable?.finalY || y + 20;
    y += 8;
  }

  writeLines('Wir fordern Sie auf, derartige Ruhestörungen künftig zu unterlassen. Sie haben Ihr Verhalten so anzupassen, dass Sie bei Nutzung der von Ihnen angemieteten Wohnung keine anderen Mitmieter des Wohnhauses stören.');

  y += 5;
  writeLines('Sollte es weiterhin zu erheblichen Ruhestörungen und Lärmbelästigungen durch Sie kommen, werden wir das Mietverhältnis mit Ihnen beenden und die Kündigung Ihnen gegenüber aussprechen.');

  y += 5;
  doc.text('Mit freundlichen Grüßen', ML, y);

  y += 18;
  checkPage(40);

  const colLeft = ML;
  const colRight = PAGE_W / 2 + 10;
  const sigW = 60;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(colLeft, y, colLeft + sigW, y);
  doc.line(colRight, y, colRight + sigW, y);
  y += 4;
  doc.setFontSize(9);
  doc.text('Vermieter', colLeft, y);
  doc.text('Mieter', colRight, y);

  y += 10;
  checkPage(20);
  doc.setLineWidth(0.2);
  doc.line(colLeft, y, colLeft + 35, y);
  doc.text(', ', colLeft + 36, y);
  doc.line(colLeft + 40, y, colLeft + sigW + 10, y);

  doc.line(colRight, y, colRight + 35, y);
  doc.text(', ', colRight + 36, y);
  doc.line(colRight + 40, y, colRight + sigW + 10, y);

  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text('Ort', colLeft, y);
  doc.text('Datum', colLeft + 40, y);
  doc.text('Ort', colRight, y);
  doc.text('Datum', colRight + 40, y);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`${p} / ${totalPages}`, PAGE_W - MR, PAGE_H - 8, { align: 'right' });
  }

  return doc.output('blob');
}

export function buildAbmahnungFilename(tenants: TenantEntry[]): string {
  const year = new Date().getFullYear();
  const t = tenants[0];
  const objekt = (t?.propertyName || t?.city || 'Immobilie')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const parts = ['Abmahnung_Ruhestoerung', String(year)];
  if (objekt) parts.push(objekt);
  return parts.join('_') + '.pdf';
}
