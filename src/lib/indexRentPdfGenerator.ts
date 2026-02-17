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
  const ML = 25;
  const MR = 20;
  const MT = 20;
  const MB = 15;
  const FOOTER_H = 8;
  const CONTENT_BOTTOM = PAGE_H - MB - FOOTER_H;
  const CW = PAGE_W - ML - MR;
  const LINE_H = 5;

  let y = MT;

  const checkPage = (need: number = 12) => {
    if (y > CONTENT_BOTTOM - need) {
      doc.addPage();
      y = MT;
    }
  };

  const writeLines = (text: string, fontSize: number = 10, style: string = "normal", lineHeight: number = LINE_H) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    const lines = doc.splitTextToSize(text, CW);
    for (const line of lines) {
      checkPage(lineHeight);
      doc.text(line, ML, y);
      y += lineHeight;
    }
  };

  const writeBullet = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const bulletX = ML + 3;
    const textX = ML + 8;
    const lines = doc.splitTextToSize(text, CW - 8);
    checkPage(lines.length * LINE_H);
    doc.text("\u2013", bulletX, y);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, y);
      y += LINE_H;
    }
  };

  const indexFactor = data.vpiOldValue > 0 ? data.vpiNewValue / data.vpiOldValue : 1;
  const indexPercent = (indexFactor - 1) * 100;
  const newRentUnrounded = data.currentRent * indexFactor;
  const delta = data.newRent - data.currentRent;
  const gesamtmiete = data.newRent + data.utilities;

  let mieterAnrede = "Damen und Herren";
  let anredeFull = "Sehr geehrte Damen und Herren";
  if (data.tenantSalutation === "male") {
    const lastName = data.tenantName.split(" ").pop() || data.tenantName;
    mieterAnrede = `Herr ${lastName}`;
    anredeFull = `Sehr geehrter ${mieterAnrede}`;
  } else if (data.tenantSalutation === "female") {
    const lastName = data.tenantName.split(" ").pop() || data.tenantName;
    mieterAnrede = `Frau ${lastName}`;
    anredeFull = `Sehr geehrte ${mieterAnrede}`;
  }

  // --- HEADER: sender line ---
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  const senderLine = `${data.landlordName} \u00B7 ${data.landlordAddress}`;
  doc.text(senderLine, ML, 45);
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(ML, 46, ML + CW, 46);

  // --- RECIPIENT ---
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  const recipientBlock = data.tenantName + "\n" + data.tenantAddress;
  const recipientLines = doc.splitTextToSize(recipientBlock, 85);
  doc.text(recipientLines, ML, 52);

  // --- DATE ---
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(data.createdDate, PAGE_W - MR, 52, { align: "right" });

  // --- BETREFF ---
  y = 80;
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Anpassung der Miete gem\u00E4\u00DF vereinbarter Indexmiete (\u00A7 557b BGB)", ML, y);
  y += 10;

  // --- ANREDE ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${anredeFull},`, ML, y);
  y += 8;

  // --- INTRO PARAGRAPH ---
  writeLines(
    `im Mietvertrag vom ${fmtDateDE(data.contractDate)} wurde gem\u00E4\u00DF \u00A7 557b BGB vereinbart, dass die Nettokaltmiete an die Entwicklung des vom Statistischen Bundesamt ver\u00F6ffentlichten Verbraucherpreisindexes f\u00FCr Deutschland (VPI, Basisjahr 2020 = 100) angepasst wird.`
  );
  y += 3;

  writeLines(
    `Die letzte Mietfestsetzung erfolgte zum ${fmtDateDE(data.lastRentValidFrom)} mit einer monatlichen Nettokaltmiete in H\u00F6he von ${fmtCurrency(data.currentRent)} \u20AC.`
  );
  y += 6;

  // --- SECTION 1 ---
  checkPage(40);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("1. Entwicklung des Verbraucherpreisindexes", ML, y);
  y += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(ML, y, ML + CW, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Zum Zeitpunkt der letzten Mietfestsetzung ma\u00DFgeblicher Index:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtMonthDE(data.vpiOldMonth)} \u2013 ${data.vpiOldValue.toFixed(1)} Punkte`, ML, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Aktuell ver\u00F6ffentlichter Index:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtMonthDE(data.vpiNewMonth)} \u2013 ${data.vpiNewValue.toFixed(1)} Punkte`, ML, y);
  y += 8;

  // --- SECTION 2 ---
  checkPage(50);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("2. Berechnung der Mietanpassung", ML, y);
  y += 2;
  doc.setLineWidth(0.4);
  doc.line(ML, y, ML + CW, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Die Ver\u00E4nderung des Indexes betr\u00E4gt:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.vpiNewValue.toFixed(1)} / ${data.vpiOldValue.toFixed(1)} = ${indexFactor.toFixed(6)}`,
    ML, y
  );
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Prozentuale Ver\u00E4nderung:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `(${indexFactor.toFixed(6)} - 1) \u00D7 100 = ${indexPercent.toFixed(2)} %`,
    ML, y
  );
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Berechnung der neuen Nettokaltmiete:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(
    `${fmtCurrency(data.currentRent)} \u20AC \u00D7 ${indexFactor.toFixed(6)} = ${fmtCurrency(newRentUnrounded)} \u20AC`,
    ML, y
  );
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Gerundet auf zwei Nachkommastellen ergibt sich eine neue monatliche Nettokaltmiete von:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${fmtCurrency(data.newRent)} \u20AC`, ML, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Die monatliche Erh\u00F6hung betr\u00E4gt somit:", ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "bold");
  doc.text(`${fmtCurrency(delta)} \u20AC`, ML, y);
  y += 8;

  // --- SECTION 3 ---
  checkPage(55);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("3. Wirksamkeit der Anpassung", ML, y);
  y += 2;
  doc.setLineWidth(0.4);
  doc.line(ML, y, ML + CW, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  writeLines(
    `Die angepasste Miete ist gem\u00E4\u00DF \u00A7 557b BGB ab dem ${fmtDateDE(data.effectiveDate)} zu zahlen.`
  );
  y += 3;

  writeLines(
    "Die Betriebskostenvorauszahlungen bleiben unver\u00E4ndert, sofern keine gesonderte Anpassung erfolgt."
  );
  y += 3;

  writeLines(
    "Die monatlich zu zahlende Gesamtmiete setzt sich somit ab dem oben genannten Zeitpunkt wie folgt zusammen:"
  );
  y += 3;

  writeBullet(`Nettokaltmiete: ${fmtCurrency(data.newRent)} \u20AC`);
  writeBullet(`Betriebskosten: ${fmtCurrency(data.utilities)} \u20AC`);
  doc.setFont("helvetica", "bold");
  const gesamtText = `Gesamtmiete: ${fmtCurrency(gesamtmiete)} \u20AC`;
  const gesamtTextX = ML + 8;
  checkPage(LINE_H);
  doc.text("\u2013", ML + 3, y);
  doc.text(gesamtText, gesamtTextX, y);
  y += LINE_H;
  doc.setFont("helvetica", "normal");
  y += 5;

  writeLines(
    `Bitte \u00FCberweisen Sie den entsprechend angepassten Betrag erstmals f\u00FCr den Monat ${fmtEffectiveMonth(data.effectiveDate)}.`
  );
  y += 6;

  writeLines("F\u00FCr R\u00FCckfragen stehen wir Ihnen gerne zur Verf\u00FCgung.");
  y += 8;

  writeLines("Mit freundlichen Gr\u00FC\u00DFen");
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text(data.landlordName, ML, y);
  y += LINE_H;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.landlordAddress, ML, y);

  // --- FOOTER ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerLineY = PAGE_H - MB - FOOTER_H;
    const footerY = PAGE_H - MB;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(ML, footerLineY, PAGE_W - MR, footerLineY);
    doc.setFontSize(7.5);
    doc.setTextColor(130);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Indexmieterh\u00F6hung \u00A7 557b BGB \u00B7 Erstellt mit rentab.ly",
      ML,
      footerY
    );
    doc.text(`Seite ${i} von ${totalPages}`, PAGE_W - MR, footerY, { align: "right" });
  }

  return doc.output("blob") as Blob;
}
