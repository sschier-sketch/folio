import jsPDF from 'jspdf';
import type {
  LandlordData,
  TenantEntry,
  GreetingData,
  ZahlungserinnerungSachverhalt,
} from '../components/wizard-templates/types';

interface ZahlungserinnerungPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: ZahlungserinnerungSachverhalt;
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
  if (streetLine && streetLine !== ' ') lines.push(streetLine);
  const cityLine = `${primary.zip} ${primary.city}`.trim();
  if (cityLine) lines.push(cityLine);
  return lines;
}

function buildPropertyDesignation(t: TenantEntry): string {
  const streetLine = `${t.street} ${t.number}`.trim();
  const cityLine = `${t.zip} ${t.city}`.trim();
  return [streetLine, cityLine].filter(Boolean).join(', ');
}

function formatBetrag(raw: string): string {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return raw + ' \u20AC';
  return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' \u20AC';
}

export function generateZahlungserinnerungPdf(input: ZahlungserinnerungPdfInput): Blob {
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

  y = Math.max(y, 95);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const today = new Date().toISOString().split('T')[0];
  doc.text(`Datum des Schreibens: ${formatDate(today)}`, ML, y);

  y += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Erinnerung zur Zahlung ausstehender Mieten', ML, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
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

  const betragFormatted = formatBetrag(sachverhalt.offenerBetrag);

  const erwartetText = sachverhalt.zahlungErwartetBis
    ? `leider habe ich für den ${formatDate(sachverhalt.zahlungErwartetBis)} keinen Zahlungseingang der Miete in Höhe von ${betragFormatted} verzeichnen können.`
    : `leider habe ich keinen Zahlungseingang der Miete in Höhe von ${betragFormatted} verzeichnen können.`;
  writeLines(erwartetText);

  y += 5;
  writeLines('Ich bin mir sicher, dass Sie lediglich vergessen haben die Miete für den genannten Monat zu überweisen. Es kann jedem mal passieren, dass man einen Zahlungstermin unbeabsichtigt aus den Augen verliert.');

  y += 5;
  const bittText = `Ich bitte Sie daher höflich um Zahlung der Miete in Höhe von ${betragFormatted} auf das im Vertrag genannte Konto spätestens bis zum ${formatDate(sachverhalt.zahlungsfrist)}.`;
  writeLines(bittText);

  y += 5;
  writeLines('Sollten Sie die Miete in den letzten Tagen bereits überwiesen haben, so betrachten Sie bitte dieses Schreiben als gegenstandslos.');

  y += 15;
  checkPage(30);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + 60, y);
  y += 4;
  doc.setFontSize(9);
  doc.text('Vermieter', ML, y);

  y += 10;
  checkPage(20);
  const ortDatumLine = y;
  doc.setLineWidth(0.2);
  doc.line(ML, ortDatumLine, ML + 35, ortDatumLine);
  doc.text(', ', ML + 36, ortDatumLine);
  doc.line(ML + 40, ortDatumLine, ML + 70, ortDatumLine);
  y = ortDatumLine + 4;
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text('Ort', ML, y);
  doc.text('Datum', ML + 40, y);

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

export function buildZahlungserinnerungFilename(tenants: TenantEntry[]): string {
  const year = new Date().getFullYear();
  const t = tenants[0];
  const objekt = (t?.propertyName || t?.city || 'Immobilie')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const einheit = (t?.unitNumber || '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const parts = ['Zahlungserinnerung', String(year)];
  if (objekt) parts.push(objekt);
  if (einheit) parts.push(einheit);
  return parts.join('_') + '.pdf';
}
