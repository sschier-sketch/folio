import jsPDF from 'jspdf';
import type {
  LandlordData,
  TenantEntry,
  WohnungsgeberSachverhaltData,
} from '../components/wizard-templates/types';

interface PdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  sachverhalt: WohnungsgeberSachverhaltData;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function generateWohnungsgeberbestaetigungPdf(input: PdfInput): Blob {
  const { landlord, tenants, sachverhalt } = input;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 20;
  const MR = 20;
  const MB = 15;
  const CONTENT_W = PAGE_W - ML - MR;

  let y = 0;

  const checkPage = (needed: number = 10) => {
    if (y > PAGE_H - MB - 15 - needed) {
      doc.addPage();
      y = 25;
    }
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  y = 30;
  doc.text('Wohnungsgeberbestätigung', PAGE_W / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('nach § 19 des Bundesmeldegesetzes (BMG)', PAGE_W / 2, y, { align: 'center' });

  y += 14;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Über den', ML, y);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 1, ML + 20, y + 1);

  y += 8;
  doc.setFont('helvetica', 'normal');

  const checkSize = 4;
  const isEinzug = sachverhalt.einOderAuszug === 'einzug';
  const isAuszug = sachverhalt.einOderAuszug === 'auszug';

  if (isEinzug) {
    doc.rect(ML, y - 3, checkSize, checkSize);
    doc.line(ML + 0.8, y - 1, ML + 1.5, y + 0.5);
    doc.line(ML + 1.5, y + 0.5, ML + 3.2, y - 2.5);
  } else {
    doc.rect(ML, y - 3, checkSize, checkSize);
  }
  doc.text('Wohnungseinzug', ML + checkSize + 3, y);

  y += 6;
  doc.text(`Am ${formatDate(sachverhalt.umzugDatum)}`, ML + 1, y);

  y += 14;
  checkPage(20);

  doc.setFont('helvetica', 'bold');
  doc.text('Anschrift der Wohnung (Straße, Hausnr., Postleitzahl, Stadt)', ML, y);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 1, ML + CONTENT_W, y + 1);

  y += 8;
  doc.setFont('helvetica', 'normal');
  const primary = tenants[0];
  if (primary) {
    const addr = `${primary.street} ${primary.number}, ${primary.zip} ${primary.city}`.trim();
    doc.text(addr, ML, y);
  }

  y += 12;
  checkPage(20);

  doc.setFont('helvetica', 'bold');
  doc.text('Name, Vorname der ein- bzw ausziehenden meldepflichtigen Personen', ML, y);
  doc.line(ML, y + 1, ML + CONTENT_W, y + 1);

  y += 8;
  doc.setFont('helvetica', 'normal');
  tenants.forEach((t, idx) => {
    checkPage(6);
    doc.text(`${idx + 1}. ${t.firstName} ${t.lastName}`.trim(), ML + 5, y);
    y += 6;
  });

  y += 8;
  checkPage(20);

  doc.setFont('helvetica', 'bold');
  doc.text('Name und Anschrift des Wohnungsgebers', ML, y);
  doc.line(ML, y + 1, ML + CONTENT_W, y + 1);

  y += 8;
  doc.setFont('helvetica', 'normal');
  const landlordAddr = `${landlord.name}, ${landlord.street} ${landlord.number}, ${landlord.zip} ${landlord.city}.`.trim();
  const landlordLines = doc.splitTextToSize(landlordAddr, CONTENT_W - 5);
  landlordLines.forEach((line: string) => {
    doc.text(line, ML, y);
    y += 5;
  });

  y += 8;
  checkPage(20);

  doc.setFont('helvetica', 'bold');
  doc.text('Name und Anschrift der vom Wohnungsgeber ggf. beauftragten Person:', ML, y);
  doc.line(ML, y + 1, ML + CONTENT_W, y + 1);

  y += 8;
  doc.setFont('helvetica', 'normal');
  if (sachverhalt.drittperson && sachverhalt.maklerName.trim()) {
    doc.text(sachverhalt.maklerName, ML, y);
  }

  y += 10;
  checkPage(20);

  const cbY = y;
  doc.rect(ML, cbY - 3, checkSize, checkSize);
  if (sachverhalt.istEigentuemer) {
    doc.line(ML + 0.8, cbY - 1, ML + 1.5, cbY + 0.5);
    doc.line(ML + 1.5, cbY + 0.5, ML + 3.2, cbY - 2.5);
  }
  doc.text('Der Wohnungsgeber ist gleichzeitig Eigentümer der Wohnung', ML + checkSize + 3, cbY);

  y = cbY + 6;
  doc.rect(ML, y - 3, checkSize, checkSize);
  if (!sachverhalt.istEigentuemer) {
    doc.line(ML + 0.8, y - 1, ML + 1.5, y + 0.5);
    doc.line(ML + 1.5, y + 0.5, ML + 3.2, y - 2.5);
  }
  doc.text('Der Wohnungsgeber ist nicht Eigentümer der Wohnung.', ML + checkSize + 3, y);

  y += 8;
  if (sachverhalt.anmerkung.trim()) {
    checkPage(20);
    doc.setFontSize(9);
    doc.text('Anmerkung:', ML, y);
    y += 5;
    const anmLines = doc.splitTextToSize(sachverhalt.anmerkung, CONTENT_W - 5);
    anmLines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, ML, y);
      y += 4.5;
    });
    y += 4;
  }

  y += 4;
  checkPage(40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const legalText =
    'Mit meiner Unterschrift wird bestätigt, dass die vorstehenden Angaben den Tatsachen entsprechen. Mir ist bekannt, dass es verboten ist, eine Wohnanschrift für eine Anmeldung einer dritten Person anzubieten oder zur Verfügung zu stellen, obwohl ein tatsächlicher Bezug der Wohnung durch diese Person weder stattfindet noch beabsichtigt ist. Ein Verstoß gegen das Verbot stellt ebenso eine Ordnungswidrigkeit dar wie die Ausstellung dieser Bestätigung, ohne dazu als Wohnungsgeber oder dessen beauftragte Person / Stelle berechtigt zu sein (§ 54 BMG i.V.m. § 19 BMG).';

  const legalLines = doc.splitTextToSize(legalText, CONTENT_W);
  legalLines.forEach((line: string) => {
    checkPage(5);
    doc.text(line, ML, y);
    y += 4.5;
  });

  y += 15;
  checkPage(20);

  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + 60, y);
  y += 4;
  doc.text('Vermieter', ML, y);

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

export function buildWohnungsgeberFilename(tenants: TenantEntry[]): string {
  const primary = tenants[0];
  const name = primary
    ? `${primary.lastName}_${primary.firstName}`.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    : 'Mieter';
  return `Wohnungsgeberbestaetigung_${name}.pdf`;
}
