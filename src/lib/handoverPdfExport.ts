import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HandoverProtocol {
  handover_type: string;
  handover_date: string;
  landlord_name?: string;
  tenant_name?: string;
  witness_name?: string;
  checklist_data?: any[];
  meters?: any[];
  keys?: any;
  photos?: any[];
  notes?: string;
  last_renovation?: string;
  status?: string;
  property_id?: string;
  unit_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PropertyData {
  name: string;
  address: string;
  unitName?: string;
  squareMeters?: string;
}

async function loadLogoForPdf(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const maxWidth = 200;
      const scale = Math.min(1, maxWidth / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = "/asset_1@4x.png";
  });
}

export async function generateHandoverPDF(
  protocol: HandoverProtocol,
  propertyData: PropertyData
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const exportDate = new Date().toLocaleDateString("de-DE");

  let logoData: string | null = null;
  try {
    logoData = await loadLogoForPdf();
  } catch {
    // continue without logo
  }

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M_LEFT = 20;
  const M_RIGHT = 20;
  const M_TOP = 18;
  const M_BOTTOM = 18;
  const FOOTER_H = 12;
  const CONTENT_BOTTOM_Y = PAGE_H - M_BOTTOM - FOOTER_H;
  const HEADER_END_Y = 38;

  let currentY = HEADER_END_Y;

  const typeLabel =
    protocol.handover_type === "move_in" ? "Einzug" : "Auszug";
  const dateLabel = new Date(protocol.handover_date).toLocaleDateString(
    "de-DE"
  );

  const drawHeader = () => {
    if (logoData) {
      doc.addImage(
        logoData,
        "JPEG",
        PAGE_W - M_RIGHT - 40,
        M_TOP,
        40,
        8
      );
    }

    doc.setFontSize(10);
    doc.setFont(undefined as any, "normal");
    doc.setTextColor(0);
    doc.text("Übergabeprotokoll", M_LEFT, M_TOP + 9);

    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, M_TOP + 12, PAGE_W - M_RIGHT, M_TOP + 12);
    doc.setTextColor(0);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const lineY = PAGE_H - M_BOTTOM - FOOTER_H;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(M_LEFT, lineY, PAGE_W - M_RIGHT, lineY);

    doc.setFontSize(8);
    doc.setFont(undefined as any, "normal");
    doc.setTextColor(100);
    doc.text(
      `Rentably · Übergabeprotokoll · Export vom ${exportDate}`,
      M_LEFT,
      PAGE_H - M_BOTTOM
    );

    const pageText = `Seite ${pageNum} von ${totalPages}`;
    const pageWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE_W - M_RIGHT - pageWidth, PAGE_H - M_BOTTOM);
    doc.setTextColor(0);
  };

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > CONTENT_BOTTOM_Y) {
      doc.addPage();
      drawHeader();
      currentY = HEADER_END_Y;
    }
  };

  const renderKeyValueTable = (rows: string[][], startY: number) => {
    const tableWidth = PAGE_W - M_LEFT - M_RIGHT;
    const labelWidth = 55;

    autoTable(doc, {
      startY,
      body: rows,
      theme: "plain",
      margin: { left: M_LEFT, right: M_RIGHT },
      tableWidth,
      styles: {
        fontSize: 10,
        cellPadding: { top: 1.6, right: 1.6, bottom: 1.6, left: 1.6 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: {
          cellWidth: labelWidth,
          textColor: 110,
          fontStyle: "normal",
          fontSize: 9,
        },
        1: {
          cellWidth: tableWidth - labelWidth,
          textColor: 20,
          fontSize: 10,
        },
      },
      rowPageBreak: "avoid",
      didDrawPage: () => {
        drawHeader();
      },
    });

    return (doc as any).lastAutoTable.finalY + 6;
  };

  const renderSection = (title: string) => {
    ensureSpace(30);
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.setTextColor(0);
    doc.text(title, M_LEFT, currentY);
    currentY += 4;
  };

  drawHeader();

  doc.setFontSize(16);
  doc.setFont(undefined as any, "bold");
  doc.setTextColor(0);
  doc.text(
    `Übergabeprotokoll – ${typeLabel}`,
    M_LEFT,
    currentY
  );
  currentY += 7;

  doc.setFontSize(9);
  doc.setFont(undefined as any, "normal");
  doc.setTextColor(100);
  doc.text(
    `${propertyData.name} · ${propertyData.address}`,
    M_LEFT,
    currentY
  );
  doc.setTextColor(0);
  currentY += 4;

  doc.setDrawColor(230);
  doc.setLineWidth(0.1);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

  renderSection("Allgemein");
  const generalRows: string[][] = [
    ["Art", typeLabel],
    ["Datum", dateLabel],
    [
      "Status",
      protocol.status === "final" ? "Finalisiert" : "Entwurf",
    ],
  ];
  if (protocol.last_renovation) {
    generalRows.push(["Letzte Renovierung", protocol.last_renovation]);
  }
  currentY = renderKeyValueTable(generalRows, currentY);

  renderSection("Immobilie");
  const propertyRows: string[][] = [
    ["Objekt", propertyData.name],
    ["Adresse", propertyData.address],
  ];
  if (propertyData.unitName) {
    propertyRows.push(["Einheit", propertyData.unitName]);
  }
  if (propertyData.squareMeters) {
    propertyRows.push(["Wohnfläche", `${propertyData.squareMeters} m²`]);
  }
  currentY = renderKeyValueTable(propertyRows, currentY);

  renderSection("Beteiligte");
  const partiesRows: string[][] = [
    ["Vermieter", protocol.landlord_name || "-"],
    ["Mieter", protocol.tenant_name || "-"],
  ];
  if (protocol.witness_name) {
    partiesRows.push(["Zeuge", protocol.witness_name]);
  }
  currentY = renderKeyValueTable(partiesRows, currentY);

  if (Array.isArray(protocol.meters) && protocol.meters.length > 0) {
    renderSection("Zählerstände");

    const meterTypeLabels: Record<string, string> = {
      electricity: "Strom",
      water: "Wasser",
      heating: "Heizung",
      gas: "Gas",
      other: "Sonstiges",
    };

    const meterTableData = protocol.meters.map((meter) => [
      meterTypeLabels[meter.type] || meter.type,
      meter.meterNumber || "-",
      meter.reading || "-",
      meter.unit || "",
      new Date(meter.readingDate).toLocaleDateString("de-DE"),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Typ", "Zählernummer", "Stand", "Einheit", "Ablesedatum"]],
      body: meterTableData,
      theme: "plain",
      margin: { left: M_LEFT, right: M_RIGHT },
      styles: {
        fontSize: 9,
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      headStyles: {
        fontSize: 9,
        fontStyle: "bold",
        textColor: 0,
        fillColor: 245,
      },
      rowPageBreak: "avoid",
      didDrawPage: () => {
        drawHeader();
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (
    Array.isArray(protocol.checklist_data) &&
    protocol.checklist_data.length > 0
  ) {
    renderSection("Checkliste");

    const statusLabels: Record<string, string> = {
      good: "Gut",
      damaged: "Beschädigt",
      missing: "Fehlt",
    };

    const checklistTableData = protocol.checklist_data.map((item) => [
      item.item || "",
      statusLabels[item.status] || item.status,
      item.notes || "-",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Punkt", "Status", "Anmerkungen"]],
      body: checklistTableData,
      theme: "plain",
      margin: { left: M_LEFT, right: M_RIGHT },
      styles: {
        fontSize: 9,
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        textColor: 20,
        lineColor: 230,
        lineWidth: 0.1,
      },
      headStyles: {
        fontSize: 9,
        fontStyle: "bold",
        textColor: 0,
        fillColor: 245,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 80 },
      },
      rowPageBreak: "avoid",
      didDrawPage: () => {
        drawHeader();
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (protocol.keys) {
    renderSection("Schlüsselübergabe");

    const keyRows: string[][] = [
      [
        "Wohnungsschlüssel",
        protocol.keys.aptKeys?.toString() || "0",
      ],
      [
        "Haustürschlüssel",
        protocol.keys.buildingKeys?.toString() || "0",
      ],
      [
        "Briefkastenschlüssel",
        protocol.keys.mailboxKeys?.toString() || "0",
      ],
      [
        "Kellerschlüssel",
        protocol.keys.cellarKeys?.toString() || "0",
      ],
    ];

    if (
      Array.isArray(protocol.keys.otherKeys) &&
      protocol.keys.otherKeys.length > 0
    ) {
      protocol.keys.otherKeys.forEach((key: any) => {
        keyRows.push([key.label, key.count?.toString() || "0"]);
      });
    }

    if (!protocol.keys.allKeysReceived && protocol.keys.missingKeysNote) {
      keyRows.push(["Fehlende Schlüssel", protocol.keys.missingKeysNote]);
    }

    currentY = renderKeyValueTable(keyRows, currentY);
  }

  if (protocol.notes) {
    renderSection("Zusätzliche Notizen");
    doc.setFontSize(9);
    doc.setFont(undefined as any, "normal");
    doc.setTextColor(40);
    const splitNotes = doc.splitTextToSize(
      protocol.notes,
      PAGE_W - M_LEFT - M_RIGHT
    );
    doc.text(splitNotes, M_LEFT, currentY);
    currentY += splitNotes.length * 4.5 + 8;
    doc.setTextColor(0);
  }

  if (Array.isArray(protocol.photos) && protocol.photos.length > 0) {
    const photosToInclude = protocol.photos.filter((photo) => photo.url);

    if (photosToInclude.length > 0) {
      renderSection("Fotos");
      doc.setFontSize(9);
      doc.setFont(undefined as any, "normal");
      doc.setTextColor(80);
      doc.text(
        `${photosToInclude.length} Foto(s) wurden zum Zeitpunkt der Übergabe aufgenommen.`,
        M_LEFT,
        currentY
      );
      currentY += 6;

      const photoRows = photosToInclude
        .slice(0, 12)
        .map((photo, i) => [
          `${i + 1}`,
          photo.description || "-",
        ]);

      if (photosToInclude.length > 12) {
        photoRows.push([
          "...",
          `und ${photosToInclude.length - 12} weitere Foto(s)`,
        ]);
      }

      currentY = renderKeyValueTable(photoRows, currentY);
    }
  }

  ensureSpace(60);
  renderSection("Unterschriften");
  currentY += 15;

  doc.setFontSize(10);
  doc.setFont(undefined as any, "normal");
  doc.setTextColor(0);

  const sigLineLeft = M_LEFT;
  const sigLineRight = M_LEFT + 70;
  const sigLine2Left = PAGE_W / 2 + 5;
  const sigLine2Right = PAGE_W / 2 + 75;

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(sigLineLeft, currentY, sigLineRight, currentY);
  doc.line(sigLine2Left, currentY, sigLine2Right, currentY);
  currentY += 5;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Vermieter", sigLineLeft, currentY);
  doc.text("Mieter", sigLine2Left, currentY);
  currentY += 15;

  doc.setDrawColor(180);
  doc.line(sigLineLeft, currentY, sigLineRight, currentY);
  doc.line(sigLine2Left, currentY, sigLine2Right, currentY);
  currentY += 5;

  doc.text("Ort, Datum", sigLineLeft, currentY);
  doc.text("Ort, Datum", sigLine2Left, currentY);
  doc.setTextColor(0);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  const fileName = `Rentably_Uebergabeprotokoll_${typeLabel}_${dateLabel.replace(/\./g, "-")}.pdf`;
  doc.save(fileName);
}
