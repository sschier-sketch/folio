import jsPDF from 'jspdf';
import type {
  LandlordData,
  TenantEntry,
  GreetingData,
  ZahlungsverzugSachverhalt,
} from '../components/wizard-templates/types';

interface ZahlungsverzugPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: ZahlungsverzugSachverhalt;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function formatCurrency(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
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
  const streetLine = `${t.street} ${t.number}`.trim();
  const cityLine = `${t.zip} ${t.city}`.trim();
  return [streetLine, cityLine].filter(Boolean).join(' , ');
}

function buildTenantNames(tenants: TenantEntry[]): string {
  return tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean)
    .join(', ');
}

export function generateZahlungsverzugPdf(input: ZahlungsverzugPdfInput): Blob {
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
  doc.text('Kündigung wegen Zahlungsverzug', ML, y);

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

  writeLines('Sie befinden sich mit folgenden Zahlungen in Verzug:');

  y += 3;
  for (const z of sachverhalt.zahlungen) {
    const line = `offene Miete für den Monat ${formatDate(z.faelligkeitsdatum)} in Höhe von ${formatCurrency(z.betrag)} EUR`;
    writeLines(line);
    y += 1;
  }

  y += 4;
  writeLines(
    `Ich kündige das Mietverhältnis gemäß § 543 BGB fristlos, hilfsweise fristgemäß, und fordere Sie auf, das Mietobjekt zu räumen und geräumt spätestens bis zum ${formatDate(sachverhalt.rueckgabeDatum)} zurückzugeben.`,
  );

  y += 4;
  writeLines(
    'Höchst vorsorglich weise ich Sie daraufhin, dass Sie einer ordentlichen Kündigung gemäß § 574 BGB widersprechen und die Fortsetzung des Mietverhältnisses verlangen können. Dies setzt voraus, dass die Beendigung des Mietverhältnisses für Sie oder Ihre Familie eine Härte bedeuten würde. Der Widerspruch muss spätestens zwei Monate vor Ablauf der ordentlichen Kündigungsfrist erklärt werden.',
  );

  y += 4;
  writeLines(
    'Ich fordere Sie auf, den Widerspruch zu begründen. Ich merke allerdings an, dass ein Widerspruchsrecht gemäß § 574 Abs. 1 S. 2 BGB dann nicht gegeben ist, wenn ein Grund vorliegt, der den Vermieter zur außerordentlichen fristlosen Kündigung berechtigt.',
  );

  y += 4;
  writeLines(
    'Um die ordnungsgemäße Übergabe sicherzustellen, bitte ich Sie, mit mir einen Termin für die Übergabe zu vereinbaren.',
  );

  y += 4;
  writeLines(
    'Bereits jetzt widerspreche ich ausdrücklich einer Fortsetzung des Mietverhältnisses. Dieses wird auch dann nicht verlängert, wenn Sie den Gebrauch der Mietsache fortsetzen.',
  );

  y += 4;
  writeLines(
    'Bis zur Rückgabe des Mietobjekts bleiben Sie zur Zahlung einer Nutzungsentschädigung, zumindest in Höhe der bisherigen Miete, verpflichtet.',
  );

  y += 4;
  writeLines(
    'Sofern Sie das Mietobjekt nicht freiwillig zurückgeben, werde ich umgehend Räumungs- und Zahlungsklage gegen Sie einreichen. Hierdurch entstehen weitere erhebliche Gerichts-, Rechtsanwalts- und Gerichtsvollzieherkosten. Diese zusätzlichen Kosten wären ebenfalls durch Sie zu tragen.',
  );

  y += 4;
  writeLines('Ich behalte mir vor, weitergehende, auch zurückliegende Ansprüche geltend zu machen.');

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

export function buildZahlungsverzugFilename(tenants: TenantEntry[]): string {
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
  const parts = ['Kuendigung_Zahlungsverzug', String(year)];
  if (objekt) parts.push(objekt);
  if (einheit) parts.push(einheit);
  return parts.join('_') + '.pdf';
}
