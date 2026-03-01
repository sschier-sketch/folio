import jsPDF from 'jspdf';
import type {
  LandlordData,
  TenantEntry,
  GreetingData,
  MietkautionSachverhalt,
} from '../components/wizard-templates/types';

interface MietkautionPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: MietkautionSachverhalt;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function fmt(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function buildSenderLine(l: LandlordData): string {
  const parts = [l.name];
  if (l.prefix) parts.push(l.prefix);
  parts.push(`${l.street} ${l.number}`.trim());
  parts.push(`${l.zip} ${l.city}`.trim());
  return parts.filter(Boolean).join(', ');
}

function buildPropertyDesignation(t: TenantEntry): string {
  return [`${t.street} ${t.number}`.trim(), `${t.zip} ${t.city}`.trim()]
    .filter(Boolean)
    .join(' , ');
}

function buildTenantNames(tenants: TenantEntry[]): string {
  return tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean)
    .join(', ');
}

export function generateMietkautionPdf(input: MietkautionPdfInput): Blob {
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
  const RIGHT_X = PAGE_W - MR;

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

  const writeTableRow = (label: string, amount: string, bold = false, indent = 6) => {
    checkPage(8);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, ML + indent, y);
    doc.text(`${amount}`, RIGHT_X - 18, y, { align: 'right' });
    doc.text('EUR', RIGHT_X - 4, y, { align: 'right' });
    y += 6;
    doc.setFont('helvetica', 'normal');
  };

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  y = 45;
  doc.text(buildSenderLine(landlord), ML, y);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  y = 55;

  const allNames = buildTenantNames(tenants);
  const primaryTenant = tenants[0];

  doc.text(allNames, ML, y);
  y += 5;
  const streetLine = `${primaryTenant.street} ${primaryTenant.number}`.trim();
  if (streetLine) {
    doc.text(streetLine + ' ,', ML, y);
    y += 5;
  }
  const cityLine = `${primaryTenant.zip} ${primaryTenant.city}`.trim();
  if (cityLine) {
    doc.text(cityLine, ML, y);
    y += 5;
  }

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Datum des Schreibens: ${formatDate(sachverhalt.versanddatum)}`, ML, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Inanspruchnahme der Mietkaution', ML, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const designation = buildPropertyDesignation(primaryTenant);
  doc.text('Konkrete Bezeichnung des Mietverhältnisses:', ML, y);
  y += 5;
  doc.text(designation, ML, y);

  y += 8;
  doc.text(`Sehr geehrte/r ${allNames},`, ML, y);

  y += 8;
  if (greeting.hasPersonalGreeting && greeting.greetingText) {
    writeLines(greeting.greetingText);
    y += 3;
  }

  writeLines(
    `Das Mietverhältnis über die genannte Wohnung ist beendet. Sie haben die Räume am ${formatDate(sachverhalt.fristAuszug)} zurückgegeben.`,
  );

  y += 4;
  writeLines(
    `Sie schulden die Zahlung in Höhe von ${fmtShort(sachverhalt.zahlungsrueckstand)} EUR. Für:`,
  );

  y += 4;
  if (sachverhalt.verspaetertMonat && sachverhalt.geschuldeterMietbetrag) {
    writeTableRow(
      `Miete für die ${sachverhalt.verspaetertMonat}:`,
      fmtShort(sachverhalt.geschuldeterMietbetrag),
    );
  }
  if (sachverhalt.schadensersatz && parseFloat(sachverhalt.schadensersatz) > 0) {
    writeTableRow('Schadensersatz für:', fmtShort(sachverhalt.schadensersatz));
  }
  if (sachverhalt.betriebskostennachzahlung && parseFloat(sachverhalt.betriebskostennachzahlung) > 0) {
    writeTableRow('Betriebskostennachzahlung:', fmtShort(sachverhalt.betriebskostennachzahlung));
  }

  y += 3;
  writeLines('Nachfolgend wird über die Mietkaution abgerechnet:');
  y += 2;

  writeTableRow('Kaution in Höhe von:', fmtShort(sachverhalt.kautionBetrag));

  if (sachverhalt.zinsen && parseFloat(sachverhalt.zinsen) > 0) {
    writeTableRow('zzgl. Zinsen (Berechnung s. Anlage)', fmt(sachverhalt.zinsen));
  }

  const kautionNum = parseFloat(sachverhalt.kautionBetrag) || 0;
  const zinsenNum = parseFloat(sachverhalt.zinsen) || 0;
  const insgesamt = kautionNum + zinsenNum;

  writeTableRow('Insgesamt:', fmt(String(insgesamt)), true);

  y += 4;
  const rueckstandNum = parseFloat(sachverhalt.zahlungsrueckstand) || 0;

  writeLines(
    `Hiermit wird die Aufrechnung mit dem vorstehenden Betrag in Höhe von ${fmtShort(sachverhalt.zahlungsrueckstand)} EUR.`,
  );

  if (sachverhalt.forderungHoeher === 'ja' && sachverhalt.restsumme) {
    writeLines(
      `gegen Ihren Anspruch auf Rückzahlung der Kaution in Höhe von ${fmt(String(insgesamt))} erklärt. Überdies fordern wir Sie auf, die Differenz in Höhe von ${fmt(sachverhalt.restsumme)} EUR bis spätestens zum ${formatDate(sachverhalt.ueberweisungsfrist)} auf unser Konto zu überweisen. Nach fruchtlosem Fristablauf werden wir unseren Anspruch gerichtlich durchsetzen.`,
    );
  } else {
    const ueberschuss = insgesamt - rueckstandNum;
    if (ueberschuss > 0) {
      writeLines(
        `gegen Ihren Anspruch auf Rückzahlung der Kaution in Höhe von ${fmt(String(insgesamt))} erklärt. Der verbleibende Kautionsüberschuss in Höhe von ${fmt(String(ueberschuss))} EUR wird Ihnen zurückerstattet.`,
      );
    } else {
      writeLines(
        `gegen Ihren Anspruch auf Rückzahlung der Kaution in Höhe von ${fmt(String(insgesamt))} erklärt.`,
      );
    }
  }

  y += 4;
  writeLines('Mit freundlichen Grüßen');

  y += 15;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);

  const sigBlockHeight = tenants.length > 1 ? 55 : 35;
  checkPage(sigBlockHeight);

  doc.line(ML, y, ML + 60, y);
  doc.line(ML + 90, y, ML + 90 + 60, y);
  y += 4;
  doc.setFontSize(9);
  doc.text('Vermieter', ML, y);
  doc.text('Mieter', ML + 90, y);

  if (tenants.length > 1) {
    y += 18;
    checkPage(20);
    doc.line(ML + 90, y, ML + 90 + 60, y);
    y += 4;
    doc.text('Mieter', ML + 90, y);
  }

  y += 10;
  checkPage(15);
  const ortDatumLine = y;
  doc.setLineWidth(0.2);
  doc.line(ML, ortDatumLine, ML + 35, ortDatumLine);
  doc.text(', ', ML + 36, ortDatumLine);
  doc.line(ML + 40, ortDatumLine, ML + 70, ortDatumLine);

  doc.line(ML + 90, ortDatumLine, ML + 90 + 35, ortDatumLine);
  doc.text(', ', ML + 90 + 36, ortDatumLine);
  doc.line(ML + 90 + 40, ortDatumLine, ML + 90 + 70, ortDatumLine);

  y = ortDatumLine + 4;
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text('Ort', ML, y);
  doc.text('Datum', ML + 40, y);
  doc.text('Ort', ML + 90, y);
  doc.text('Datum', ML + 90 + 40, y);

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

export function buildMietkautionFilename(tenants: TenantEntry[]): string {
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
  const parts = ['Inanspruchnahme_Mietkaution', String(year)];
  if (objekt) parts.push(objekt);
  if (einheit) parts.push(einheit);
  return parts.join('_') + '.pdf';
}
