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
  if (!iso) return "–";
  const d = new Date(iso + (iso.length <= 7 ? "-01" : ""));
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

const fmtDateDE = (iso: string) => {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtEffectiveMonth = (iso: string) => {
  if (!iso) return "–";
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
    doc.text("–", bulletX, currentY);
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
  const senderLine = `${data.landlordName} · ${data.landlordAddress}`;
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
  doc.text("Anpassung der Miete gemäß vereinbarter Indexmiete (§ 557b BGB)", M_LEFT, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${anredeFull},`, M_LEFT, currentY);
  currentY += 8;

  writeLines(
    `im Mietvertrag vom ${fmtDateDE(data.contractDate)} wurde gemäß § 557b BGB vereinbart, dass die Nettokaltmiete an die Entwicklung des vom Statistischen Bundesamt veröffentlichten Verbraucherpreisindexes für Deutschland (VPI, Basisjahr 2020 = 100) angepasst wird.`
  );
  currentY += 3;

  writeLines(
    `Die letzte Mietfestsetzung erfolgte zum ${fmtDateDE(data.lastRentValidFrom)} mit einer monatlichen Nettokaltmiete in Höhe von ${fmtCurrency(data.currentRent)} €.`
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
  doc.text("Zum Zeitpunkt der letzten Mietfestsetzung maßgeblicher Index:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtMonthDE(data.vpiOldMonth)} – ${data.vpiOldValue.toFixed(1)} Punkte`, M_LEFT, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Aktuell veröffentlichter Index:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtMonthDE(data.vpiNewMonth)} – ${data.vpiNewValue.toFixed(1)} Punkte`, M_LEFT, currentY);
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

  doc.text("Die Veränderung des Indexes beträgt:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.vpiNewValue.toFixed(1)} / ${data.vpiOldValue.toFixed(1)} = ${indexFactor.toFixed(6)}`,
    M_LEFT, currentY
  );
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Prozentuale Veränderung:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `(${indexFactor.toFixed(6)} - 1) × 100 = ${indexPercent.toFixed(2)} %`,
    M_LEFT, currentY
  );
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Berechnung der neuen Nettokaltmiete:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `${fmtCurrency(data.currentRent)} € × ${indexFactor.toFixed(6)} = ${fmtCurrency(newRentUnrounded)} €`,
    M_LEFT, currentY
  );
  currentY += 8;

  doc.setFont("helvetica", "normal");
  writeLines("Gerundet auf zwei Nachkommastellen ergibt sich eine neue monatliche Nettokaltmiete von:");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${fmtCurrency(data.newRent)} €`, M_LEFT, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Die monatliche Erhöhung beträgt somit:", M_LEFT, currentY);
  currentY += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtCurrency(delta)} €`, M_LEFT, currentY);
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
    `Die angepasste Miete ist gemäß § 557b BGB ab dem ${fmtDateDE(data.effectiveDate)} zu zahlen.`
  );
  currentY += 3;

  writeLines(
    "Die Betriebskostenvorauszahlungen bleiben unverändert, sofern keine gesonderte Anpassung erfolgt."
  );
  currentY += 3;

  writeLines(
    "Die monatlich zu zahlende Gesamtmiete setzt sich somit ab dem oben genannten Zeitpunkt wie folgt zusammen:"
  );
  currentY += 3;

  writeBullet(`Nettokaltmiete: ${fmtCurrency(data.newRent)} €`);
  writeBullet(`Betriebskosten: ${fmtCurrency(data.utilities)} €`);
  writeBullet(`Gesamtmiete: ${fmtCurrency(gesamtmiete)} €`, true);
  currentY += 5;

  writeLines(
    `Bitte überweisen Sie den entsprechend angepassten Betrag erstmals für den Monat ${fmtEffectiveMonth(data.effectiveDate)}.`
  );
  currentY += 6;

  writeLines("Für Rückfragen stehen wir Ihnen gerne zur Verfügung.");
  currentY += 8;

  writeLines("Mit freundlichen Grüßen");
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
      "Indexmieterhöhung § 557b BGB · Erstellt mit rentab.ly - Immobilienverwaltung",
      M_LEFT,
      footerY
    );
    doc.text(`Seite ${i} von ${totalPages}`, PAGE_W - M_RIGHT, footerY, { align: "right" });
  }

  return doc.output("blob") as Blob;
}
