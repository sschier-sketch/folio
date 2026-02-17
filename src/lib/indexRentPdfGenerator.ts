import jsPDF from "jspdf";

export interface IndexRentPdfData {
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantSalutation: "male" | "female" | "neutral";
  tenantAddress: string;
  propertyAddress: string;
  unitNumber: string;
  contractDate: string;
  currentRent: number;
  newRent: number;
  vpiOldMonth: string;
  vpiOldValue: number;
  vpiNewMonth: string;
  vpiNewValue: number;
  effectiveDate: string;
  createdDate: string;
}

const formatCurrencyDE = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";

const formatMonthDE = (iso: string) => {
  const d = new Date(iso + (iso.length <= 7 ? "-01" : ""));
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

const formatDateDE = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export function generateIndexRentPdfBlob(data: IndexRentPdfData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M_LEFT = 20;
  const M_RIGHT = 20;
  const M_TOP = 20;
  const M_BOTTOM = 15;
  const FOOTER_H = 8;
  const CONTENT_BOTTOM_Y = PAGE_H - M_BOTTOM - FOOTER_H;
  const contentWidth = PAGE_W - M_LEFT - M_RIGHT;

  let currentY = M_TOP;

  const checkPageBreak = (requiredSpace: number = 10) => {
    if (currentY > CONTENT_BOTTOM_Y - requiredSpace) {
      doc.addPage();
      currentY = M_TOP;
      return true;
    }
    return false;
  };

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  const senderLine = `${data.landlordName} \u00B7 ${data.landlordAddress}`;
  doc.text(senderLine, M_LEFT, 37);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  const recipientLines = data.tenantName + "\n" + data.tenantAddress;
  const splitRecipient = doc.splitTextToSize(recipientLines, 85);
  doc.text(splitRecipient, M_LEFT, 55);

  doc.setFontSize(10);
  doc.text(data.createdDate, PAGE_W - M_RIGHT, 80, { align: "right" });

  currentY = 90;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Mietanpassung gem\u00E4\u00DF \u00A7 557b BGB (Indexmiete)", M_LEFT, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const objectLine = `Mietobjekt: ${data.propertyAddress}${data.unitNumber ? `, Einheit ${data.unitNumber}` : ""}`;
  doc.text(objectLine, M_LEFT, currentY);
  currentY += 5;
  if (data.contractDate) {
    doc.text(`Mietvertrag vom ${formatDateDE(data.contractDate)}`, M_LEFT, currentY);
    currentY += 5;
  }
  currentY += 5;

  let salutation = "Sehr geehrte Damen und Herren";
  if (data.tenantSalutation === "male") {
    salutation = `Sehr geehrter Herr ${data.tenantName.split(" ").pop()}`;
  } else if (data.tenantSalutation === "female") {
    salutation = `Sehr geehrte Frau ${data.tenantName.split(" ").pop()}`;
  }
  doc.text(`${salutation},`, M_LEFT, currentY);
  currentY += 10;

  const pctChange = ((data.vpiNewValue / data.vpiOldValue - 1) * 100);
  const delta = data.newRent - data.currentRent;

  const introText =
    `gem\u00E4\u00DF \u00A7 557b BGB und der in Ihrem Mietvertrag enthaltenen Indexklausel teilen wir Ihnen ` +
    `hiermit die Anpassung der Nettokaltmiete auf Grundlage des Verbraucherpreisindex (VPI) f\u00FCr ` +
    `Deutschland mit.`;
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, M_LEFT, currentY);
  currentY += introLines.length * 5 + 10;

  checkPageBreak(50);
  doc.setFont("helvetica", "bold");
  doc.text("I. Verbraucherpreisindex (VPI)", M_LEFT, currentY);
  currentY += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  const rows = [
    ["Basismonat:", formatMonthDE(data.vpiOldMonth), "Indexstand:", data.vpiOldValue.toFixed(1)],
    ["Aktueller Monat:", formatMonthDE(data.vpiNewMonth), "Indexstand:", data.vpiNewValue.toFixed(1)],
  ];

  const col1X = M_LEFT;
  const col2X = M_LEFT + 40;
  const col3X = M_LEFT + 95;
  const col4X = M_LEFT + 125;

  for (const row of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(row[0], col1X, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(row[1], col2X, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(row[2], col3X, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(row[3], col4X, currentY);
    currentY += 6;
  }

  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Indexver\u00E4nderung: ${data.vpiNewValue.toFixed(1)} / ${data.vpiOldValue.toFixed(1)} \u2013 1 = ${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)} %`,
    M_LEFT,
    currentY
  );
  currentY += 12;

  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.text("II. Berechnung der neuen Miete", M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  const calcLines = [
    `Bisherige Nettokaltmiete:  ${formatCurrencyDE(data.currentRent)}`,
    `Indexfaktor:  ${data.vpiNewValue.toFixed(1)} / ${data.vpiOldValue.toFixed(1)} = ${(data.vpiNewValue / data.vpiOldValue).toFixed(6)}`,
    `Neue Nettokaltmiete:  ${formatCurrencyDE(data.currentRent)} \u00D7 ${(data.vpiNewValue / data.vpiOldValue).toFixed(6)} = ${formatCurrencyDE(data.newRent)}`,
  ];
  for (const line of calcLines) {
    doc.text(line, M_LEFT, currentY);
    currentY += 6;
  }

  currentY += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Erh\u00F6hung: ${formatCurrencyDE(delta)} pro Monat`, M_LEFT, currentY);
  currentY += 12;

  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("III. Zusammenfassung", M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

  const boxY = currentY;
  const boxH = 28;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(M_LEFT, boxY, contentWidth, boxH, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  currentY = boxY + 7;
  doc.text(`Bisherige Nettokaltmiete:`, M_LEFT + 5, currentY);
  doc.text(formatCurrencyDE(data.currentRent), M_LEFT + contentWidth - 5, currentY, { align: "right" });
  currentY += 7;
  doc.setFont("helvetica", "bold");
  doc.text(`Neue Nettokaltmiete:`, M_LEFT + 5, currentY);
  doc.text(formatCurrencyDE(data.newRent), M_LEFT + contentWidth - 5, currentY, { align: "right" });
  currentY += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Wirksamkeitsdatum:`, M_LEFT + 5, currentY);
  doc.text(formatDateDE(data.effectiveDate), M_LEFT + contentWidth - 5, currentY, { align: "right" });

  currentY = boxY + boxH + 12;

  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("IV. Rechtliche Hinweise", M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const legalText =
    `Die Anpassung der Miete erfolgt auf Grundlage der im Mietvertrag vereinbarten Indexklausel ` +
    `gem\u00E4\u00DF \u00A7 557b BGB. Ma\u00DFgeblich ist der vom Statistischen Bundesamt ver\u00F6ffentlichte ` +
    `Verbraucherpreisindex f\u00FCr Deutschland (Basis 2020 = 100). Die neue Miete wird ab dem oben genannten ` +
    `Wirksamkeitsdatum geschuldet. Die \u00FCbrigen Bestandteile Ihres Mietvertrages bleiben unber\u00FChrt.`;
  const legalLines = doc.splitTextToSize(legalText, contentWidth);
  doc.text(legalLines, M_LEFT, currentY);
  currentY += legalLines.length * 4.5 + 8;

  checkPageBreak(15);
  const hinweisText =
    `Bitte \u00FCberweisen Sie ab dem ${formatDateDE(data.effectiveDate)} den neuen monatlichen Betrag ` +
    `von ${formatCurrencyDE(data.newRent)} (Nettokaltmiete) zuz\u00FCglich der vereinbarten Nebenkosten.`;
  const hinweisLines = doc.splitTextToSize(hinweisText, contentWidth);
  doc.text(hinweisLines, M_LEFT, currentY);
  currentY += hinweisLines.length * 4.5 + 12;

  doc.setFontSize(10);
  checkPageBreak(30);
  doc.text("F\u00FCr R\u00FCckfragen stehen wir Ihnen gerne zur Verf\u00FCgung.", M_LEFT, currentY);
  currentY += 15;
  doc.text("Mit freundlichen Gr\u00FC\u00DFen", M_LEFT, currentY);
  currentY += 20;
  doc.text(data.landlordName, M_LEFT, currentY);

  const totalPages = doc.internal.getNumberOfPages();
  const footerY = PAGE_H - M_BOTTOM;
  const footerLineY = PAGE_H - M_BOTTOM - FOOTER_H;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(M_LEFT, footerLineY, PAGE_W - M_RIGHT, footerLineY);
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      "Indexmieterh\u00F6hung \u00A7 557b BGB \u00B7 Erstellt mit rentab.ly - Immobilienverwaltung",
      M_LEFT,
      footerY
    );
    doc.text(`Seite ${i} von ${totalPages}`, PAGE_W - M_RIGHT, footerY, { align: "right" });
  }

  return doc.output("blob") as Blob;
}
