import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from './supabase';

interface PdfData {
  year: number;
  propertyName: string;
  propertyAddress: string;
  unitNumber: string;
  tenantName: string;
  daysInPeriod: number;
  areaSqm: number;
  lineItems: Array<{
    category: string;
    description: string;
    totalAmount: number;
    allocationKey: string;
    share: number;
    shareAmount: number;
  }>;
  costShare: number;
  prepayments: number;
  balance: number;
  landlordName?: string;
  landlordAddress?: string;
  bankDetails?: {
    accountHolder: string;
    iban: string;
    bic?: string;
    bankName?: string;
  };
}

export async function generateOperatingCostPdf(
  userId: string,
  statementId: string,
  resultId: string
): Promise<{ data: { pdfBlob: Blob; pdfId: string } | null; error: any }> {
  try {
    const { data: statement } = await supabase
      .from('operating_cost_statements')
      .select('*')
      .eq('id', statementId)
      .single();

    if (!statement) throw new Error('Statement not found');

    const { data: result } = await supabase
      .from('operating_cost_results')
      .select('*')
      .eq('id', resultId)
      .single();

    if (!result) throw new Error('Result not found');

    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', statement.property_id)
      .single();

    const { data: unit } = result.unit_id
      ? await supabase
          .from('property_units')
          .select('*')
          .eq('id', result.unit_id)
          .single()
      : { data: null };

    const { data: tenant } = result.tenant_id
      ? await supabase
          .from('tenants')
          .select('*')
          .eq('id', result.tenant_id)
          .single()
      : { data: null };

    const { data: lineItems } = await supabase
      .from('operating_cost_line_items')
      .select('*')
      .eq('statement_id', statementId)
      .order('sort_order');

    const { data: profile } = await supabase
      .from('account_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: bankDetails } = await supabase
      .from('user_bank_details')
      .select('*')
      .eq('user_id', userId)
      .single();

    const totalDaysInYear =
      365 + (new Date(statement.year, 1, 29).getMonth() === 1 ? 1 : 0);

    let totalArea = 0;
    let unitCount = 0;

    const { data: allUnits } = await supabase
      .from('property_units')
      .select('area_sqm')
      .eq('property_id', statement.property_id);

    if (allUnits) {
      totalArea = allUnits.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0);
      unitCount = allUnits.length;
    }

    const processedLineItems = (lineItems || []).map((item) => {
      let share = 0;

      if (item.allocation_key === 'area' && totalArea > 0) {
        share = Number(result.area_sqm) / totalArea;
      } else if (item.allocation_key === 'units' && unitCount > 0) {
        share = 1 / unitCount;
      } else if (item.allocation_key === 'persons' && unitCount > 0) {
        share = 1 / unitCount;
      }

      const proRatedShare = (share * result.days_in_period) / totalDaysInYear;
      const shareAmount = Number(item.amount) * proRatedShare;

      return {
        category: item.category,
        description: item.description || '',
        totalAmount: Number(item.amount),
        allocationKey: item.allocation_key,
        share: proRatedShare,
        shareAmount,
      };
    });

    const pdfData: PdfData = {
      year: statement.year,
      propertyName: property?.name || 'Immobilie',
      propertyAddress: property
        ? `${property.street || ''} ${property.house_number || ''}, ${property.postal_code || ''} ${property.city || ''}`
        : '',
      unitNumber: unit?.unit_number || 'N/A',
      tenantName: tenant
        ? `${tenant.first_name} ${tenant.last_name}`
        : 'Unbekannter Mieter',
      daysInPeriod: result.days_in_period,
      areaSqm: Number(result.area_sqm),
      lineItems: processedLineItems,
      costShare: Number(result.cost_share),
      prepayments: Number(result.prepayments),
      balance: Number(result.balance),
      landlordName: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`
        : undefined,
      landlordAddress: profile
        ? `${profile.address_street || ''}, ${profile.address_zip || ''} ${profile.address_city || ''}`
        : undefined,
      bankDetails: bankDetails || undefined,
    };

    const pdfBlob = await createPdf(pdfData);

    const fileName = `betriebskostenabrechnung_${statement.year}_${result.id}.pdf`;
    const filePath = `operating-costs/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: pdfRecord, error: insertError } = await supabase
      .from('operating_cost_pdfs')
      .insert({
        user_id: userId,
        statement_id: statementId,
        result_id: resultId,
        file_url: filePath,
        file_size: pdfBlob.size,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      data: { pdfBlob, pdfId: pdfRecord.id },
      error: null,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { data: null, error };
  }
}

function createPdf(data: PdfData): Blob {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Rentably', 20, 25);

  doc.setFontSize(18);
  doc.text(`Betriebskostenabrechnung ${data.year}`, 20, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let yPos = 55;

  if (data.landlordName) {
    doc.text('Vermieter:', 20, yPos);
    doc.text(data.landlordName, 60, yPos);
    yPos += 5;
  }

  if (data.landlordAddress) {
    doc.text(data.landlordAddress, 60, yPos);
    yPos += 10;
  } else {
    yPos += 5;
  }

  doc.text('Objekt:', 20, yPos);
  doc.text(data.propertyName, 60, yPos);
  yPos += 5;

  if (data.propertyAddress) {
    doc.text(data.propertyAddress, 60, yPos);
    yPos += 5;
  }

  doc.text('Einheit:', 60, yPos);
  doc.text(data.unitNumber, 80, yPos);
  yPos += 10;

  doc.text('Mieter:', 20, yPos);
  doc.text(data.tenantName, 60, yPos);
  yPos += 5;

  doc.text('Abrechnungszeitraum:', 20, yPos);
  doc.text(`01.01.${data.year} - 31.12.${data.year}`, 60, yPos);
  yPos += 5;

  doc.text('Tage im Zeitraum:', 20, yPos);
  doc.text(`${data.daysInPeriod} Tage`, 60, yPos);
  yPos += 5;

  doc.text('Wohnfläche:', 20, yPos);
  doc.text(`${data.areaSqm.toFixed(2)} m²`, 60, yPos);
  yPos += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Betriebskosten', 20, yPos);
  yPos += 5;

  const tableData = data.lineItems.map((item) => [
    item.category,
    item.description,
    `${item.totalAmount.toFixed(2)} €`,
    getAllocationKeyLabel(item.allocationKey),
    `${(item.share * 100).toFixed(2)}%`,
    `${item.shareAmount.toFixed(2)} €`,
  ]);

  (doc as any).autoTable({
    startY: yPos,
    head: [
      [
        'Kostenart',
        'Beschreibung',
        'Gesamtbetrag',
        'Schlüssel',
        'Anteil',
        'Ihr Anteil',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      2: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);

  doc.text('Kostenanteil gesamt:', 20, yPos);
  doc.text(`${data.costShare.toFixed(2)} €`, pageWidth - 50, yPos, {
    align: 'right',
  });
  yPos += 7;

  doc.text('Vorauszahlungen:', 20, yPos);
  doc.text(`${data.prepayments.toFixed(2)} €`, pageWidth - 50, yPos, {
    align: 'right',
  });
  yPos += 7;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 30, yPos);
  yPos += 7;

  if (data.balance >= 0) {
    doc.setTextColor(220, 53, 69);
    doc.text('Nachzahlung:', 20, yPos);
    doc.text(`${data.balance.toFixed(2)} €`, pageWidth - 50, yPos, {
      align: 'right',
    });
  } else {
    doc.setTextColor(40, 167, 69);
    doc.text('Guthaben:', 20, yPos);
    doc.text(`${Math.abs(data.balance).toFixed(2)} €`, pageWidth - 50, yPos, {
      align: 'right',
    });
  }

  doc.setTextColor(0);
  yPos += 15;

  if (data.balance > 0 && data.bankDetails) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Bankverbindung für Nachzahlung:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text('Kontoinhaber:', 20, yPos);
    doc.text(data.bankDetails.accountHolder, 60, yPos);
    yPos += 5;

    doc.text('IBAN:', 20, yPos);
    doc.text(data.bankDetails.iban, 60, yPos);
    yPos += 5;

    if (data.bankDetails.bic) {
      doc.text('BIC:', 20, yPos);
      doc.text(data.bankDetails.bic, 60, yPos);
      yPos += 5;
    }

    if (data.bankDetails.bankName) {
      doc.text('Bank:', 20, yPos);
      doc.text(data.bankDetails.bankName, 60, yPos);
      yPos += 5;
    }
  } else if (data.balance > 0 && !data.bankDetails) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text(
      'Hinweis: Bitte kontaktieren Sie Ihren Vermieter für die Zahlungsdetails.',
      20,
      yPos
    );
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Erstellt am ${new Date().toLocaleDateString('de-DE')} mit Rentably`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.output('blob');
}

function getAllocationKeyLabel(key: string): string {
  switch (key) {
    case 'area':
      return 'Fläche';
    case 'units':
      return 'Einheiten';
    case 'persons':
      return 'Personen';
    default:
      return key;
  }
}
