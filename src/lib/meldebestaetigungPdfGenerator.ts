import jsPDF from 'jspdf';
import type {
  LandlordData,
  MeldebestaetigungFormData,
} from '../components/wizard-templates/types';

interface MeldebestaetigungPdfInput {
  landlord: LandlordData;
  form: MeldebestaetigungFormData;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function generateMeldebestaetigungPdf(input: MeldebestaetigungPdfInput): Blob {
  const { landlord, form } = input;
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
  doc.text('Meldebestätigung', PAGE_W / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('nach § 19 des Bundesmeldegesetzes (BMG)', PAGE_W / 2, y, { align: 'center' });

  y += 12;

  const COL_LABEL_W = 30;
  const COL1_X = ML + COL_LABEL_W + 2;
  const COL2_X = ML + CONTENT_W / 2 + 10;
  const COL1_W = CONTENT_W / 2 - COL_LABEL_W;
  const COL2_W = CONTENT_W / 2 - 10;

  const drawTableLine = (yPos: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(ML, yPos, ML + CONTENT_W, yPos);
  };

  drawTableLine(y);
  y += 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Angaben zum Wohnungsgeber', COL1_X, y + 4);
  doc.text('(Vermieter):', COL1_X, y + 8);
  doc.text('Angaben zum Eigentümer der Wohnung', COL2_X, y + 4);
  doc.text('(sofern dieser nicht Vermieter ist oder', COL2_X, y + 8);
  doc.text('selbst einzieht):', COL2_X, y + 12);
  y += 16;

  drawTableLine(y);
  y += 2;

  const drawRow = (label: string, val1: string, val2: string, rowH: number = 10) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, ML + 2, y + rowH / 2 + 1);
    doc.setFontSize(9);
    doc.text(val1, COL1_X, y + rowH / 2 + 1);
    doc.text(val2, COL2_X, y + rowH / 2 + 1);
    y += rowH;
    drawTableLine(y);
    y += 2;
  };

  const landlordAddr = `${landlord.street} ${landlord.number}`.trim();
  const landlordCity = `${landlord.zip} ${landlord.city}`.trim();

  const ownerName = form.selbstgenutzesWohneigentum ? '' : form.eigentuemerName;
  const ownerAddr = form.selbstgenutzesWohneigentum
    ? ''
    : `${form.eigentuemerStrasse} ${form.eigentuemerNr}`.trim();
  const ownerCity = form.selbstgenutzesWohneigentum
    ? ''
    : `${form.eigentuemerPlz} ${form.eigentuemerStadt}`.trim();

  drawRow('Familienname,\nVorname', landlord.name, ownerName, 12);
  drawRow('Straße, Hausnr.', landlordAddr + ',', ownerAddr ? ownerAddr + ',' : '', 10);
  drawRow('PLZ, Ort', landlordCity, ownerCity, 10);

  y += 8;

  const midX = ML + CONTENT_W / 2;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Angaben zum meldepflichtigen Vorgang:', ML, y);
  doc.text('Angaben zum Mietobjekt:', midX, y);
  y += 2;
  drawTableLine(y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (form.selbstgenutzesWohneigentum) {
    const checkSize = 3;
    doc.rect(ML, y - 2, checkSize, checkSize);
    doc.text('Die Wohnungsgeberbestätigung erfolgt als', ML + checkSize + 2, y + 1);
    y += 4;
    doc.text('Eigenerklärung (Bezug durch Eigentümer)', ML + checkSize + 2, y + 1);
  }

  y += 6;
  const dateLabel = form.einOderAuszug === 'einzug' ? 'Einzug am' : 'Auszug am';
  doc.text(`${dateLabel} ${formatDate(form.datum)}`, ML, y);

  const mietobjektStrasse = `${form.mietobjektStrasse} ${form.mietobjektNr}`.trim();
  const mietobjektPraefix = form.mietobjektPraefix ? `, ${form.mietobjektPraefix}` : '';
  const mietobjektCity = `${form.mietobjektPlz} ${form.mietobjektStadt}`.trim();

  const objY = y - 6;
  doc.text(`Straße, Hausnr.: ${mietobjektStrasse}${mietobjektPraefix},`, midX, objY);
  doc.text(`PLZ, Ort: ${mietobjektCity}`, midX, objY + 6);

  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Angaben zu den meldepflichtigen Personen:', ML, y);
  y += 2;
  drawTableLine(y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const personenText = form.meldepflichtigePersonen
    .map((p) => {
      const bd = p.geburtsdatum ? formatDate(p.geburtsdatum) : '';
      return bd ? `${p.name}, ${bd}` : p.name;
    })
    .join('; ');

  const personenLines = doc.splitTextToSize(personenText + ';', CONTENT_W - 10);
  personenLines.forEach((line: string) => {
    checkPage(6);
    doc.text(line, ML + 5, y);
    y += 5;
  });

  y += 2;
  doc.setLineWidth(0.3);
  doc.line(ML + 5, y, ML + CONTENT_W / 2 + 20, y);

  y += 20;
  checkPage(25);

  doc.line(ML, y, ML + 60, y);
  y += 4;
  doc.setFontSize(9);
  doc.text('Vermieter', ML, y);

  if (form.beauftragtePersonName.trim()) {
    y += 20;
    checkPage(50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Angaben zu der vom Wohnungsgeber (Vermieter) beauftragten Person:', midX - 10, y);
    y += 2;
    drawTableLine(y);

    y += 2;
    const bpLabelX = ML + 2;
    const bpValX = ML + 35;

    const bpRow = (label: string, val: string, rh: number = 10) => {
      checkPage(rh + 4);
      drawTableLine(y);
      y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(label, bpLabelX, y + rh / 2);
      doc.setFontSize(9);
      doc.text(val, bpValX, y + rh / 2);
      y += rh;
    };

    bpRow('Familienname,\nVorname', form.beauftragtePersonName, 12);
    const bpAddr = `${form.beauftragtePersonStrasse} ${form.beauftragtePersonNr}`.trim();
    bpRow('Straße, Hausnr.', bpAddr ? bpAddr + ',' : '', 10);
    const bpCity = `${form.beauftragtePersonPlz} ${form.beauftragtePersonStadt}`.trim();
    bpRow('PLZ, Ort', bpCity, 10);
    drawTableLine(y);
  }

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

export function buildMeldebestaetigungFilename(form: MeldebestaetigungFormData): string {
  const year = new Date().getFullYear();
  const city = (form.mietobjektStadt || 'Immobilie')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `Meldebestaetigung_${year}_${city}.pdf`;
}
