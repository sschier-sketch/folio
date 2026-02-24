import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  LandlordData,
  TenantEntry,
  MietinteressentData,
  WeitereBewohnerData,
  ZulassungData,
} from '../components/wizard-templates/types';

interface MieterselbstauskunftPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  mietinteressent: MietinteressentData;
  weitereBewohner: WeitereBewohnerData;
  zulassung: ZulassungData;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

const ZULASSUNG_TEXTS = [
  'Über die Räumung meiner/unserer bisherigen Wohnräume war/ist in den letzten 5 Jahren kein Räumungsrechtsstreit anhängig.',
  'Gegen mich/uns läuft kein Mietforderungsverfahren.',
  'Gegen mich/uns läuft keine Lohn- bzw. Gehaltspfändung.',
  'Ich/Wir habe/n weder eine eidesstattliche Versicherung abgegeben, noch ist ein solches Verfahren anhängig.',
  'Über mein/unser Vermögen wurde in den letzten 5 Jahren kein Konkurs- oder Vergleichsverfahren bzw. Insolvenzverfahren eröffnet und die Eröffnung eines solchen Verfahrens wurde auch nicht mangels Masse abgewiesen. Solche Verfahren sind derzeit auch nicht anhängig.',
  'Ich erkläre/Wir erklären, alle mietvertraglich zu übernehmenden Verpflichtungen leisten zu können, insbesondere die Zahlung von Kaution, Miete und Betriebskosten.',
  'Ich versichere/Wir versichern mit meiner/unserer Unterschrift, alle Fragen vollständig und wahrheitsgemäß beantwortet zu haben. Falsche Angaben stellen einen Vertrauensbruch dar und berechtigen den Vermieter, den Mietvertrag anzufechten und gegebenenfalls sofort fristlos zu kündigen.',
];

export function generateMieterselbstauskunftPdf(input: MieterselbstauskunftPdfInput): Blob {
  const { tenants, mietinteressent, weitereBewohner, zulassung } = input;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const ML = 20;
  const MR = 20;
  const CONTENT_W = PAGE_W - ML - MR;

  let y = 20;

  const checkPage = (needed = 10) => {
    if (y > 282 - needed) {
      doc.addPage();
      y = 20;
    }
  };

  const writeWrapped = (text: string, fontSize = 10, fontStyle = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    lines.forEach((line: string) => {
      checkPage(6);
      doc.text(line, ML, y);
      y += 5;
    });
  };

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Mieterselbstauskunft', PAGE_W / 2, y, { align: 'center' });
  y += 14;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Angaben zum Mietobjekt:', ML, y);
  y += 7;

  const primary = tenants[0];
  doc.setFont('helvetica', 'normal');
  const propertyAddr = [
    `${primary.street} ${primary.number}`.trim(),
    `${primary.zip} ${primary.city}`.trim(),
  ]
    .filter(Boolean)
    .join(' , ');
  doc.text(`  ${propertyAddr}`, ML, y);
  y += 9;

  const colVal = ML + 50;
  doc.text('Mietbeginn:', ML + 2, y);
  doc.text(formatDate(mietinteressent.mietbeginn), colVal, y);
  y += 6;
  doc.text('Gewünschter Einzugstermin:', ML + 2, y);
  doc.text(formatDate(mietinteressent.gewuenschterEinzugstermin), colVal, y);
  y += 12;

  const tenantNames = tenants
    .map((t) => `${t.firstName} ${t.lastName}`.trim())
    .filter(Boolean)
    .join(', ');

  const bisherigAddress = [
    `${primary.street},${primary.number},`,
    `,${primary.zip} ${primary.city}`,
  ]
    .filter(Boolean)
    .join('');

  const tableRows = [
    ['Name / Vorname', tenantNames],
    ['Bisherige Anschrift', bisherigAddress],
    ['Geburtsdatum', formatDate(mietinteressent.geburtsdatum)],
    ['Familienstand (ledig, verheiratet)', mietinteressent.familienstand],
    ['Aktuelles monatliches Nettoeinkommen in Euro', mietinteressent.nettoeinkommenMonatlich],
    ['', ''],
    ['Telefonnummer', mietinteressent.telefonnummer],
    ['E-Mail Adresse', mietinteressent.email],
    ['Bisheriger Vermieter', mietinteressent.bisherigVermieter],
    ['Kontakt', mietinteressent.kontaktVermieter],
    ['Derzeitiger Arbeitgeber', mietinteressent.derzeitigerArbeitgeber],
    ['Kontakt', mietinteressent.kontaktArbeitgeber],
    ['', ''],
    ['Derzeitig ausgeübter Beruf / selbstständig als', mietinteressent.ausgeuebterBeruf],
    ['Stellung seit', mietinteressent.stellungSeit],
  ];

  autoTable(doc, {
    startY: y,
    head: [['', 'Mietinteressent/in']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: 'helvetica',
      textColor: [0, 0, 0],
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: CONTENT_W - 85 },
    },
    margin: { left: ML, right: MR },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  checkPage(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  writeWrapped(
    'Zum Haushalt gehörende Kinder, Verwandte, Hausangestellte oder sonstige Mitbewohner:',
  );
  y += 2;

  if (weitereBewohner.hatWeitereBewohner && weitereBewohner.bewohner.length > 0) {
    const memberRows = weitereBewohner.bewohner.map((b) => [
      b.name,
      b.verwandtschaftsgrad,
      formatDate(b.geburtsdatum),
      b.eigenesEinkommen,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Verwandtschaftsgrad', 'Geburtsdatum', 'Eigenes Einkommen (netto)']],
      body: memberRows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      margin: { left: ML, right: MR },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Verwandtschaftsgrad', 'Geburtsdatum', 'Eigenes Einkommen (netto)']],
      body: [['', '', '', '']],
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      margin: { left: ML, right: MR },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  checkPage(30);
  y = Math.max(y, 230);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ich versichere:', ML, y);
  y += 8;

  const checkboxKeys: (keyof ZulassungData)[] = [
    'checkbox1',
    'checkbox2',
    'checkbox3',
    'checkbox4',
    'checkbox5',
    'checkbox6',
    'checkbox7',
  ];

  doc.setFont('helvetica', 'normal');
  checkboxKeys.forEach((key, i) => {
    const checked = zulassung[key];
    const text = ZULASSUNG_TEXTS[i];
    const lines = doc.splitTextToSize(text, CONTENT_W - 8);
    const blockH = lines.length * 5 + 6;
    checkPage(blockH);

    const boxX = ML;
    const boxY = y - 3.5;
    doc.setDrawColor(100);
    doc.setLineWidth(0.3);
    doc.rect(boxX, boxY, 4, 4);
    if (checked) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(boxX + 0.5, boxY + 2, boxX + 1.8, boxY + 3.5);
      doc.line(boxX + 1.8, boxY + 3.5, boxX + 3.5, boxY + 0.5);
    }

    doc.setFontSize(9);
    doc.setTextColor(0);
    lines.forEach((line: string, li: number) => {
      doc.text(line, ML + 7, y + li * 5);
    });
    y += blockH;
  });

  y += 8;
  checkPage(25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Wichtiger Hinweis!', ML, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  writeWrapped(
    'Sollte sich nach Abschluss des Mietvertrags herausstellen, dass einzelne Angaben falsch sind, ist die Vermieterseite berechtigt, den Mietvertrag anzufechten bzw. diesen fristgerecht gegebenenfalls sofort fristlos zu kündigen.',
  );

  y += 20;
  checkPage(20);
  doc.setLineWidth(0.3);
  doc.setDrawColor(0);
  doc.line(ML, y, ML + 60, y);
  y += 4;
  doc.setFontSize(9);
  doc.text('Mieter', ML, y);

  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120);
  const lineStart = ML;
  doc.line(lineStart, y, lineStart + 35, y);
  doc.text(', ', lineStart + 36, y);
  doc.line(lineStart + 40, y, lineStart + 70, y);
  y += 4;
  doc.setFontSize(7);
  doc.text('Ort', lineStart, y);
  doc.text('Datum', lineStart + 40, y);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`${p} / ${totalPages}`, 210 - MR, 297 - 8, { align: 'right' });
  }

  return doc.output('blob');
}

export function buildMieterselbstauskunftFilename(tenants: TenantEntry[]): string {
  const year = new Date().getFullYear();
  const t = tenants[0];
  const objekt = (`${t?.lastName || ''}_${t?.firstName || ''}`)
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const parts = ['Mieterselbstauskunft', String(year)];
  if (objekt) parts.push(objekt);
  return parts.join('_') + '.pdf';
}
