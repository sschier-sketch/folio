import jsPDF from "jspdf";
import "jspdf-autotable";

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

export async function generateHandoverPDF(
  protocol: HandoverProtocol,
  propertyData: PropertyData
) {
  const doc = new jsPDF();
  let yPos = 20;

  const addLogo = () => {
    try {
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 120, 180);
      doc.text("Rentably", 20, yPos);
      yPos += 12;
    } catch (error) {
      console.error("Error adding logo:", error);
      yPos += 12;
    }
  };

  const addTitle = () => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Übergabeprotokoll", 20, yPos);
    yPos += 10;
  };

  const addSection = (title: string) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, yPos);
    yPos += 7;
  };

  const addText = (label: string, value: string) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${label}: ${value || "-"}`, 20, yPos);
    yPos += 6;
  };

  addLogo();
  addTitle();

  const typeLabel = protocol.handover_type === "move_in" ? "Einzug" : "Auszug";
  const dateLabel = new Date(protocol.handover_date).toLocaleDateString("de-DE");

  addText("Art der Übergabe", typeLabel);
  addText("Datum", dateLabel);
  addText("Status", protocol.status === "final" ? "Finalisiert" : "Entwurf");
  yPos += 5;

  addSection("Immobilie");
  addText("Objekt", propertyData.name);
  addText("Adresse", propertyData.address);
  if (propertyData.unitName) {
    addText("Einheit", propertyData.unitName);
  }
  if (propertyData.squareMeters) {
    addText("Wohnfläche", `${propertyData.squareMeters} m²`);
  }
  yPos += 5;

  addSection("Beteiligte");
  addText("Vermieter", protocol.landlord_name || "");
  addText("Mieter", protocol.tenant_name || "");
  if (protocol.witness_name) {
    addText("Zeuge", protocol.witness_name);
  }
  yPos += 5;

  if (Array.isArray(protocol.meters) && protocol.meters.length > 0) {
    addSection("Zählerstände");

    const meterTableData = protocol.meters.map((meter) => {
      const typeLabels: Record<string, string> = {
        electricity: "Strom",
        water: "Wasser",
        heating: "Heizung",
        gas: "Gas",
        other: "Sonstiges",
      };

      return [
        typeLabels[meter.type] || meter.type,
        meter.meterNumber || "-",
        meter.reading || "-",
        meter.unit || "",
        new Date(meter.readingDate).toLocaleDateString("de-DE"),
      ];
    });

    (doc as any).autoTable({
      startY: yPos,
      head: [["Typ", "Zählernummer", "Stand", "Einheit", "Ablesedatum"]],
      body: meterTableData,
      theme: "grid",
      headStyles: { fillColor: [31, 120, 180], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (Array.isArray(protocol.checklist_data) && protocol.checklist_data.length > 0) {
    addSection("Checkliste");

    const checklistTableData = protocol.checklist_data.map((item) => {
      const statusLabels: Record<string, string> = {
        good: "Gut",
        damaged: "Beschädigt",
        missing: "Fehlt",
      };

      return [
        item.item || "",
        statusLabels[item.status] || item.status,
        item.notes || "-",
      ];
    });

    (doc as any).autoTable({
      startY: yPos,
      head: [["Punkt", "Status", "Anmerkungen"]],
      body: checklistTableData,
      theme: "grid",
      headStyles: { fillColor: [31, 120, 180], textColor: 255 },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 80 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (protocol.keys) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    addSection("Schlüsselübergabe");
    addText("Wohnungsschlüssel", protocol.keys.aptKeys?.toString() || "0");
    addText("Haustürschlüssel", protocol.keys.buildingKeys?.toString() || "0");
    addText("Briefkastenschlüssel", protocol.keys.mailboxKeys?.toString() || "0");
    addText("Kellerschlüssel", protocol.keys.cellarKeys?.toString() || "0");

    if (
      Array.isArray(protocol.keys.otherKeys) &&
      protocol.keys.otherKeys.length > 0
    ) {
      protocol.keys.otherKeys.forEach((key: any) => {
        addText(key.label, key.count?.toString() || "0");
      });
    }

    if (!protocol.keys.allKeysReceived && protocol.keys.missingKeysNote) {
      addText("Fehlende Schlüssel", protocol.keys.missingKeysNote);
    }

    yPos += 5;
  }

  if (protocol.last_renovation) {
    addText("Letzte Renovierung", protocol.last_renovation);
    yPos += 5;
  }

  if (protocol.notes) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    addSection("Zusätzliche Notizen");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(protocol.notes, 170);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  if (Array.isArray(protocol.photos) && protocol.photos.length > 0) {
    doc.addPage();
    yPos = 20;
    addSection("Fotos");

    const photosToInclude = protocol.photos.filter((photo) => photo.url);

    if (photosToInclude.length > 0) {
      doc.setFontSize(9);
      doc.text(`${photosToInclude.length} Foto(s) wurden zum Zeitpunkt der Übergabe aufgenommen.`, 20, yPos);
      yPos += 10;

      for (let i = 0; i < Math.min(photosToInclude.length, 6); i++) {
        const photo = photosToInclude[i];
        if (photo.description) {
          doc.text(`${i + 1}. ${photo.description}`, 20, yPos);
          yPos += 6;
        }
      }

      if (photosToInclude.length > 6) {
        doc.text(`... und ${photosToInclude.length - 6} weitere Foto(s)`, 20, yPos);
      }
    }
  }

  doc.addPage();
  yPos = 20;
  addSection("Unterschriften");
  yPos += 20;

  doc.setFontSize(10);
  doc.text("_____________________________", 20, yPos);
  doc.text("_____________________________", 110, yPos);
  yPos += 5;
  doc.text("Vermieter", 20, yPos);
  doc.text("Mieter", 110, yPos);
  yPos += 15;
  doc.text("_____________________________", 20, yPos);
  doc.text("_____________________________", 110, yPos);
  yPos += 5;
  doc.text("Ort, Datum", 20, yPos);
  doc.text("Ort, Datum", 110, yPos);

  const fileName = `Uebergabeprotokoll_${typeLabel}_${dateLabel.replace(/\./g, "-")}.pdf`;
  doc.save(fileName);
}
