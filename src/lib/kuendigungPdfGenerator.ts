import jsPDF from 'jspdf';
import type {
  LandlordData,
  TenantEntry,
  GreetingData,
  KuendigungSachverhalt,
} from '../components/wizard-templates/types';

interface KuendigungPdfInput {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: KuendigungSachverhalt;
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

function buildRecipientBlock(t: TenantEntry): string[] {
  const lines: string[] = [];
  const fullName = `${t.firstName} ${t.lastName}`.trim();
  if (fullName) lines.push(fullName);
  const streetLine = `${t.street} ${t.number}`.trim();
  if (streetLine && streetLine !== ' ') lines.push(streetLine);
  const cityLine = `${t.zip} ${t.city}`.trim();
  if (cityLine) lines.push(cityLine);
  return lines;
}

function buildPropertyDesignation(t: TenantEntry): string {
  const streetLine = `${t.street} ${t.number}`.trim();
  const cityLine = `${t.zip} ${t.city}`.trim();
  return [streetLine, cityLine].filter(Boolean).join(', ');
}

export function generateKuendigungPdf(input: KuendigungPdfInput): Blob {
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

  const primaryTenant = tenants[0];
  const recipientLines = buildRecipientBlock(primaryTenant);
  recipientLines.forEach((line) => {
    doc.text(line, ML, y);
    y += 6;
  });

  y = Math.max(y, 95);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Datum des Schreibens: ${formatDate(sachverhalt.versanddatum)}`, ML, y);

  y += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Kündigungsbestätigung', ML, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const designation = buildPropertyDesignation(primaryTenant);
  doc.text('Konkrete Bezeichnung des Mietverhältnisses:', ML, y);
  y += 5;
  doc.text(designation, ML, y);

  y += 10;
  const tenantFullName = `${primaryTenant.firstName} ${primaryTenant.lastName}`.trim();
  doc.text(`Sehr geehrte/r ${tenantFullName},`, ML, y);

  y += 8;
  if (greeting.hasPersonalGreeting && greeting.greetingText) {
    doc.setFont('helvetica', 'normal');
    writeLines(greeting.greetingText);
    y += 3;
  }

  y += 2;
  doc.setFont('helvetica', 'normal');

  const mainText = `Bezugnehmend auf Ihr Schreiben, welches am ${formatDate(sachverhalt.eingangsdatum)} bei mir eingegangen ist, bestätige ich Ihnen die fristgerechte Kündigung des Mietverhältnisses zum ${formatDate(sachverhalt.kuendigungsdatum)}.`;
  writeLines(mainText);

  y += 5;
  const inspectionText = 'Damit eine reibungslose Übergabe der Wohnung gewährleistet wird, bitte ich Sie, mir einen Vorbesichtigungstermin vorzuschlagen, damit wir uns gemeinsam ein Bild über die Wohnung machen können und die vorzunehmenden Arbeiten machen bzw. absprechen können.';
  writeLines(inspectionText);

  y += 5;
  if (sachverhalt.appointments.length === 1) {
    const apt = sachverhalt.appointments[0];
    const aptText = `Als Abnahmetermin für die endgültige Abnahme schlage ich den am ${formatDate(apt.date)} von ${apt.timeFrom} bis ${apt.timeTo} Uhr vor. Sollte ich nichts weiter von Ihnen hören, werde ich zu diesem Termin die Abnahme durchführen.`;
    writeLines(aptText);
  } else if (sachverhalt.appointments.length > 1) {
    writeLines('Ich schlage folgende Abnahmetermine vor:');
    y += 2;
    sachverhalt.appointments.forEach((apt, i) => {
      checkPage(8);
      doc.text(`${i + 1}. ${formatDate(apt.date)}, ${apt.timeFrom} – ${apt.timeTo} Uhr`, ML + 5, y);
      y += 5;
    });
    y += 2;
    writeLines('Sollte ich nichts weiter von Ihnen hören, werde ich zum ersten genannten Termin die Abnahme durchführen.');
  }

  y += 5;
  writeLines('Bereits jetzt widerspreche ich ausdrücklich einer Fortsetzung des Mietverhältnisses. Dieses wird auch dann nicht verlängert, wenn Sie den Gebrauch der Mietsache fortsetzen.');

  y += 5;
  writeLines('Ich bitte Sie außerdem, Folgendes zu beachten:');

  y += 5;
  writeLines('Der Mietzins ist bis zum Zeitpunkt der Beendigung des Mietverhältnisses zu entrichten. Für den Fall der nicht fristgerechten Räumung der Wohnräume ist \u2013 unbeschadet der Geltendmachung etwaiger Schadensersatzansprüche \u2013 für jeden Monat Ihrer weiteren Nutzung der Wohnung ein Nutzungsentgelt in Höhe der jeweils geschuldeten monatlichen Miete zu zahlen.');

  y += 5;
  writeLines('Sie sind verpflichtet, alle Wohnungs-, Briefkasten- und Hausschlüssel \u2013 auch die, die Sie ohne mein Wissen beschafft haben sollten \u2013 bei der Übergabe der Wohnung an mich auszuhändigen.');

  y += 5;
  writeLines('Die Wohnung ist im geräumten, mangelfreien und sauberen Zustand zu übergeben. Bauliche Veränderungen in den Mieträumen, die sie durchgeführt haben, sind rückgängig zu machen bis zum Tag Ihres Auszuges. Sollten Sie während des Mietverhältnisses eine Vereinbarung zu den baulichen Veränderungen mit den früheren Vermietern geschlossen haben, bitte ich Sie, mir diese zu übersenden bzw. bei der Vorbesichtigung vorzulegen.');

  y += 5;
  writeLines('Ich bitte Sie außerdem, mir Ihre neue Wohnanschrift und Ihre Kontoverbindung mitzuteilen, damit ich Ihnen die Kautions- und Betriebskostenabrechnungen zusenden und Ihnen gegebenenfalls die entsprechenden Guthaben erstatten kann.');

  y += 5;
  writeLines('Bei weiteren Fragen können Sie uns/mich selbstverständlich gern anrufen.');

  y += 5;
  writeLines('Mit freundlichen Grüßen');

  y += 15;
  checkPage(30);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + 60, y);
  doc.line(ML + 90, y, ML + 90 + 60, y);
  y += 4;
  doc.setFontSize(9);
  doc.text('Vermieter', ML, y);
  doc.text('Mieter', ML + 90, y);

  y += 10;
  checkPage(20);
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

export function buildKuendigungFilename(
  tenants: TenantEntry[],
): string {
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
  const parts = ['Kuendigungsbestaetigung', String(year)];
  if (objekt) parts.push(objekt);
  if (einheit) parts.push(einheit);
  return parts.join('_') + '.pdf';
}
