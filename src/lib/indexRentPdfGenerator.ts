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
  utilities: number;
  vpiOldMonth: string;
  vpiOldValue: number;
  vpiNewMonth: string;
  vpiNewValue: number;
  effectiveDate: string;
  lastRentValidFrom: string;
  createdDate: string;
}

const fmtCurrency = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtMonthDE = (iso: string) => {
  if (!iso) return "\u2013";
  const d = new Date(iso + (iso.length <= 7 ? "-01" : ""));
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

const fmtDateDE = (iso: string) => {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtEffectiveMonth = (iso: string) => {
  if (!iso) return "\u2013";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

export function generateIndexRentPdfBlob(data: IndexRentPdfData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M_LEFT = 20;
  const M_RIGHT = 20;
  const M_TOP = 20;
  const M_BOTTOM = 15;
  const FOOTER_H = 8;
  const CONTENT_BOTTOM = PAGE_H - M_BOTTOM - FOOTER_H;
  const contentWidth = PAGE_W - M_LEFT - M_RIGHT;
  const LINE_H = 5;

  let currentY = M_TOP;

  const checkPageBreak = (need: number = 12) => {
    if (currentY > CONTENT_BOTTOM - need) {
      doc.addPage();
      currentY = M_TOP;
    }
  };

  const writeLines = (text: string, fontSize: number = 10, style: string = "normal", lineHeight: number = LINE_H) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, M_LEFT, currentY);
      currentY += lineHeight;
    }
  };

  const writeBullet = (text: string, bold = false) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const bulletX = M_LEFT + 3;
    const textX = M_LEFT + 8;
    const lines = doc.splitTextToSize(text, contentWidth - 8);
    checkPageBreak(lines.length * LINE_H);
    doc.text("\u2013", bulletX, currentY);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, currentY);
      currentY += LINE_H;
    }
  };

  const indexFactor = data.vpiOldValue > 0 ? data.vpiNewValue / data.vpiOldValue : 1;
  const indexPercent = (indexFactor - 1) * 100;
  const newRentUnrounded = data.currentRent * indexFactor;
  const delta = data.newRent - data.currentRent;
  const gesamtmiete = data.newRent + data.utilities;

  let anredeFull = "Sehr geehrte Damen und Herren";
  if (data.tenantSalutation === "male") {
    const lastName = data.tenantName.split(" ").pop() || data.tenantName;
    anredeFull = `Sehr geehrter Herr ${lastName}`;
  } else if (data.tenantSalutation === "female") {
    const lastName = data.tenantName.split(" ").pop() || data.tenantName;
    anredeFull = `Sehr geehrte Frau ${lastName}`;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  const senderLine = `${data.landlordName} \u00B7 ${data.landlordAddress}`;
  doc.text(senderLine, M_LEFT, 37);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  const recipientBlock = data.tenantName + "\n" + data.tenantAddress;
  const splitRecipient = doc.splitTextToSize(recipientBlock, 85);
  doc.text(splitRecipient, M_LEFT, 55);

  doc.setFontSize(10);
  doc.text(data.createdDate, PAGE_W - M_RIGHT, 80, { align: "right" });

  currentY = 90;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Anpassung der Miete gem\u00E4\u00DF vereinbarter Indexmiete (\u00A7 557b BGB)", M_LEFT, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${anredeFull},`, M_LEFT, currentY);
  currentY += 8;

  writeLines(
    `im Mietvertrag vom ${fmtDateDE(data.contractDate)} wurde gem\u00E4\u00DF \u00A7 557b BGB vereinbart, dass die Nettokaltmiete an die Entwicklung des vom Statistischen Bundesamt ver\u00F6ffentlichten Verbraucherpreisindexes f\u00FCr Deutschland (VPI, Basisjahr 2020 = 100) angepasst wird.`
  );
  currentY += 3;

  writeLines(
    `Die letzte Mietfestsetzung erfolgte zum ${fmtDateDE(data.lastRentValidFrom)} mit einer monatlichen Nettokaltmiete in H\u00F6he von ${fmtCurrency(data.currentRent)} \u20AC.`
  );
  currentY += 6;

  checkPageBreak(40);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("1. Entwicklung des Verbraucherpreisindexes", M_LEFT, currentY);
  currentY += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Zum Zeitpunkt der letzten Mietfestsetzung ma\u00DFgeblicher Index:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtMonthDE(data.vpiOldMonth)} \u2013 ${data.vpiOldValue.toFixed(1)} Punkte`, M_LEFT, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Aktuell ver\u00F6ffentlichter Index:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtMonthDE(data.vpiNewMonth)} \u2013 ${data.vpiNewValue.toFixed(1)} Punkte`, M_LEFT, currentY);
  currentY += 8;

  checkPageBreak(50);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("2. Berechnung der Mietanpassung", M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Die Ver\u00E4nderung des Indexes betr\u00E4gt:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.vpiNewValue.toFixed(1)} / ${data.vpiOldValue.toFixed(1)} = ${indexFactor.toFixed(6)}`,
    M_LEFT, currentY
  );
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Prozentuale Ver\u00E4nderung:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `(${indexFactor.toFixed(6)} - 1) \u00D7 100 = ${indexPercent.toFixed(2)} %`,
    M_LEFT, currentY
  );
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Berechnung der neuen Nettokaltmiete:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `${fmtCurrency(data.currentRent)} \u20AC \u00D7 ${indexFactor.toFixed(6)} = ${fmtCurrency(newRentUnrounded)} \u20AC`,
    M_LEFT, currentY
  );
  currentY += 8;

  doc.setFont("helvetica", "normal");
  writeLines("Gerundet auf zwei Nachkommastellen ergibt sich eine neue monatliche Nettokaltmiete von:");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${fmtCurrency(data.newRent)} \u20AC`, M_LEFT, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Die monatliche Erh\u00F6hung betr\u00E4gt somit:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtCurrency(delta)} \u20AC`, M_LEFT, currentY);
  currentY += 8;

  checkPageBreak(55);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("3. Wirksamkeit der Anpassung", M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  writeLines(
    `Die angepasste Miete ist gem\u00E4\u00DF \u00A7 557b BGB ab dem ${fmtDateDE(data.effectiveDate)} zu zahlen.`
  );
  currentY += 3;

  writeLines(
    "Die Betriebskostenvorauszahlungen bleiben unver\u00E4ndert, sofern keine gesonderte Anpassung erfolgt."
  );
  currentY += 3;

  writeLines(
    "Die monatlich zu zahlende Gesamtmiete setzt sich somit ab dem oben genannten Zeitpunkt wie folgt zusammen:"
  );
  currentY += 3;

  writeBullet(`Nettokaltmiete: ${fmtCurrency(data.newRent)} \u20AC`);
  writeBullet(`Betriebskosten: ${fmtCurrency(data.utilities)} \u20AC`);
  writeBullet(`Gesamtmiete: ${fmtCurrency(gesamtmiete)} \u20AC`, true);
  currentY += 5;

  writeLines(
    `Bitte \u00FCberweisen Sie den entsprechend angepassten Betrag erstmals f\u00FCr den Monat ${fmtEffectiveMonth(data.effectiveDate)}.`
  );
  currentY += 6;

  writeLines("F\u00FCr R\u00FCckfragen stehen wir Ihnen gerne zur Verf\u00FCgung.");
  currentY += 8;

  writeLines("Mit freundlichen Gr\u00FC\u00DFen");
  currentY += 12;

  doc.setFont("helvetica", "normal");
  doc.text(data.landlordName, M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFontSize(9);
  doc.text(data.landlordAddress, M_LEFT, currentY);

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
    doc.setFont("helvetica", "normal");
    doc.text(
      "Indexmieterh\u00F6hung \u00A7 557b BGB \u00B7 Erstellt mit rentab.ly - Immobilienverwaltung",
      M_LEFT,
      footerY
    );
    doc.text(`Seite ${i} von ${totalPages}`, PAGE_W - M_RIGHT, footerY, { align: "right" });
  }

  return doc.output("blob") as Blob;
}
