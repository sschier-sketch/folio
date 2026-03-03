import jsPDF from 'jspdf';
import type {
  LandlordData,
  TenantEntry,
  GreetingData,
  MieterhoehungSachverhalt,
} from '../components/wizard-templates/types';

interface MieterhoehungPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: MieterhoehungSachverhalt;
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

function buildPropertyDesignation(t: TenantEntry): string {
  return [`${t.street} ${t.number}`.trim(), `${t.zip} ${t.city}`.trim()]
    .filter(Boolean)
    .join(', ');
}

function buildTenantNames(tenants: TenantEntry[]): string {
  return tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean)
    .join(', ');
}

export function generateMieterhoehungsverlangPdf(input: MieterhoehungPdfInput): Blob {
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
    doc.text(streetLine + ',', ML, y);
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
  writeLines('Mieterhöhungsverlangen gemäß § 558 BGB');

  y += 3;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const designation = buildPropertyDesignation(primaryTenant);
  doc.text('Mietverhältnis:', ML, y);
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
    'hiermit verlange ich die Zustimmung zur Erhöhung der Nettokaltmiete für die oben bezeichnete Wohnung auf die ortsübliche Vergleichsmiete gemäß § 558 BGB.',
  );

  y += 4;
  doc.setFont('helvetica', 'bold');
  writeLines('Begründung:');
  doc.setFont('helvetica', 'normal');
  y += 2;

  const vergleichsmiete = sachverhalt.ortsueblicheVergleichsmiete || '–';
  writeLines(
    `Die ortsübliche Vergleichsmiete für vergleichbare Wohnungen beträgt ${vergleichsmiete} EUR.`,
  );
  y += 2;

  if (sachverhalt.begruendungMietspiegel) {
    const qual = sachverhalt.mietspiegelQualitaet || '';
    const betrag = sachverhalt.mietspiegelNeuerBetragProQm || '–';
    writeLines(
      `Die Mieterhöhung wird anhand des Mietspiegels begründet. Laut Mietspiegel ergibt sich für eine Wohnung der Wohnlage "${qual}" ein Betrag von ${betrag} EUR pro m².`,
    );
    y += 2;
  }

  if (sachverhalt.begruendungVergleichswohnungen && sachverhalt.vergleichswohnungen.length > 0) {
    writeLines(
      'Die Mieterhöhung wird anhand der folgenden vergleichbaren Wohnungen begründet:',
    );
    y += 2;

    sachverhalt.vergleichswohnungen.forEach((w, idx) => {
      const addr = `${w.strasse} ${w.hausnummer}`.trim();
      const city = `${w.plz} ${w.stadt}`.trim();
      const miete = w.mieteProQm ? `${w.mieteProQm} EUR/m²` : '';
      const flaeche = w.wohnflaeche ? `, ${w.wohnflaeche} m²` : '';
      writeLines(`${idx + 1}. ${addr}, ${city} – ${miete}${flaeche}`);
    });
    y += 2;
  }

  if (sachverhalt.begruendungGutachten) {
    const anrede = sachverhalt.gutachterAnrede || '';
    const name = sachverhalt.gutachterName || '–';
    const datum = sachverhalt.gutachterBerichtsdatum
      ? formatDate(sachverhalt.gutachterBerichtsdatum)
      : '–';
    writeLines(
      `Die Mieterhöhung wird durch das Gutachten von ${anrede} ${name}, erstellt am ${datum}, begründet.`,
    );
    y += 2;
  }

  y += 2;
  if (sachverhalt.ersteMieterhoehung === false && sachverhalt.letzteMieterhoehungDatum) {
    writeLines(
      `Die letzte Mieterhöhung erfolgte zum ${formatDate(sachverhalt.letzteMieterhoehungDatum)}. Seitdem sind mehr als 15 Monate vergangen (§ 558 Abs. 1 S. 1 BGB).`,
    );
    y += 2;
  }

  if (sachverhalt.ersteMieterhoehung === true) {
    writeLines(
      'Es handelt sich um die erste Mieterhöhung seit Beginn des Mietverhältnisses.',
    );
    y += 2;
  }

  if (sachverhalt.modernisierung && sachverhalt.modernisierungDatum) {
    writeLines(
      `Ich weise darauf hin, dass die Miete zuletzt am ${formatDate(sachverhalt.modernisierungDatum)} aufgrund von Modernisierungsmaßnahmen erhöht wurde. Diese Erhöhung bleibt gemäß § 558 Abs. 5 BGB bei der Berechnung der Kappungsgrenze unberücksichtigt.`,
    );
    y += 2;
  }

  y += 2;
  writeLines(
    `Ich bitte Sie, Ihre Zustimmung zur Mieterhöhung bis zum ${formatDate(sachverhalt.ruecksendeFrist)} schriftlich zu erteilen. Nach Ablauf der Frist bin ich berechtigt, die Zustimmung gerichtlich einzuklagen (§ 558b Abs. 2 BGB).`,
  );

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
  doc.text('Mieter (Zustimmung)', ML + 90, y);

  if (tenants.length > 1) {
    y += 18;
    checkPage(20);
    doc.line(ML + 90, y, ML + 90 + 60, y);
    y += 4;
    doc.text('Mieter (Zustimmung)', ML + 90, y);
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

export function buildMieterhoehungsverlangenFilename(tenants: TenantEntry[]): string {
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
  const parts = ['Mieterhoehungsverlangen', String(year)];
  if (objekt) parts.push(objekt);
  if (einheit) parts.push(einheit);
  return parts.join('_') + '.pdf';
}
