import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

interface PdfData {
  year: number;
  propertyName: string;
  propertyAddress: string;
  unitNumber: string;
  tenantName: string;
  tenantGender: 'male' | 'female' | 'neutral';
  tenantAddress: string;
  daysInPeriod: number;
  areaSqm: number;
  totalAreaSqm: number;
  unitCount: number;
  totalPersons: number;
  lineItems: Array<{
    cost_type: string;
    allocation_key: string;
    amount: number;
    share: string;
    shareAmount: number;
  }>;
  costShare: number;
  prepayments: number;
  balance: number;
  landlordName: string;
  landlordAddress: string;
  bankDetails?: {
    account_holder: string;
    iban: string;
    bic?: string;
    bank_name?: string;
  };
  createdDate: string;
  paymentDueDate: string;
}

export async function generateOperatingCostPdf(
  userId: string,
  statementId: string,
  resultId: string
): Promise<{ data: { pdfBlob: Blob; pdfId: string } | null; error: any }> {
  try {
    console.log('generateOperatingCostPdf called:', { userId, statementId, resultId });

    const { data: statement, error: statementError } = await supabase
      .from('operating_cost_statements')
      .select('*')
      .eq('id', statementId)
      .single();

    console.log('Statement loaded:', { statement, error: statementError });

    if (statementError) throw new Error(`Statement error: ${statementError.message}`);
    if (!statement) throw new Error('Statement not found');

    const { data: result, error: resultError } = await supabase
      .from('operating_cost_results')
      .select('*')
      .eq('id', resultId)
      .single();

    console.log('Result loaded:', { result, error: resultError });

    if (resultError) throw new Error(`Result error: ${resultError.message}`);
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
      .eq('statement_id', statementId);

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
    let totalPersons = 0;

    const { data: allUnits } = await supabase
      .from('property_units')
      .select('area_sqm')
      .eq('property_id', statement.property_id);

    const { data: allContracts } = await supabase
      .from('rental_contracts')
      .select('tenant_id')
      .eq('property_id', statement.property_id);

    if (allUnits) {
      totalArea = allUnits.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0);
      unitCount = allUnits.length;
    }

    if (allContracts) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('household_size')
        .in('id', allContracts.map(c => c.tenant_id));

      if (tenants) {
        totalPersons = tenants.reduce((sum, t) => sum + Number(t.household_size || 1), 0);
      }
    }

    const processedLineItems = (lineItems || []).map((item) => {
      let share = '';
      let shareAmount = 0;

      if (item.allocation_key === 'area' && totalArea > 0) {
        const unitArea = Number(result.area_sqm);
        share = `${unitArea.toFixed(2)} / ${totalArea.toFixed(2)} m²`;
        shareAmount = (Number(item.amount) * unitArea / totalArea) * (result.days_in_period / totalDaysInYear);
      } else if (item.allocation_key === 'units' && unitCount > 0) {
        share = `1 / ${unitCount}`;
        shareAmount = (Number(item.amount) / unitCount) * (result.days_in_period / totalDaysInYear);
      } else if (item.allocation_key === 'persons' && totalPersons > 0) {
        const tenantPersons = Number(tenant?.household_size || 1);
        share = `${tenantPersons} / ${totalPersons} Personen`;
        shareAmount = (Number(item.amount) * tenantPersons / totalPersons) * (result.days_in_period / totalDaysInYear);
      }

      return {
        cost_type: item.cost_type,
        allocation_key: item.allocation_key,
        amount: Number(item.amount),
        share,
        shareAmount,
      };
    });

    const landlordFullName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : 'Vermieter';

    const landlordFullAddress = profile
      ? `${profile.address_street || ''} · ${profile.address_zip || ''} ${profile.address_city || ''}`.trim()
      : '';

    const tenantFullAddress = tenant
      ? `${tenant.street || ''}\n${tenant.postal_code || ''} ${tenant.city || ''}`
      : '';

    const createdDate = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const paymentDue = new Date();
    paymentDue.setDate(paymentDue.getDate() + 30);
    const paymentDueDate = paymentDue.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const pdfData: PdfData = {
      year: statement.year,
      propertyName: property?.address || 'Immobilie',
      propertyAddress: property?.address || '',
      unitNumber: unit?.unit_number || '1',
      tenantName: tenant
        ? `${tenant.first_name} ${tenant.last_name}`
        : 'Unbekannter Mieter',
      tenantGender: tenant?.gender || 'neutral',
      tenantAddress: tenantFullAddress,
      daysInPeriod: result.days_in_period,
      areaSqm: Number(result.area_sqm),
      totalAreaSqm: totalArea,
      unitCount,
      totalPersons,
      lineItems: processedLineItems,
      costShare: Number(result.cost_share),
      prepayments: Number(result.prepayments),
      balance: Number(result.balance),
      landlordName: landlordFullName,
      landlordAddress: landlordFullAddress,
      bankDetails: bankDetails ? {
        account_holder: bankDetails.account_holder,
        iban: bankDetails.iban,
        bic: bankDetails.bic || undefined,
        bank_name: bankDetails.bank_name || undefined,
      } : undefined,
      createdDate,
      paymentDueDate,
    };

    console.log('Creating PDF with data:', { year: pdfData.year, tenantName: pdfData.tenantName });

    const pdfBlob = createPdf(pdfData);

    console.log('PDF created, blob size:', pdfBlob.size);

    const fileName = `betriebskostenabrechnung_${statement.year}_einheit_${unit?.unit_number || result.id}.pdf`;
    const filePath = `operating-costs/${userId}/${fileName}`;

    console.log('Uploading PDF to storage:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('PDF uploaded successfully');

    const { data: pdfRecord, error: insertError } = await supabase
      .from('operating_cost_pdfs')
      .insert({
        statement_id: statementId,
        result_id: resultId,
        tenant_id: result.tenant_id,
        unit_id: result.unit_id,
        file_path: filePath,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('PDF record created:', pdfRecord.id);

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
  console.log('createPdf called with data:', { year: data.year, tenantName: data.tenantName });
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let yPos = 20;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const senderLine = `${data.landlordName} · ${data.landlordAddress}`;
  doc.text(senderLine, marginLeft, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  const recipientLines = data.tenantName + '\n' + data.tenantAddress;
  const splitRecipient = doc.splitTextToSize(recipientLines, 80);
  doc.text(splitRecipient, marginLeft, yPos);
  yPos += splitRecipient.length * 5 + 10;

  doc.setFontSize(10);
  doc.text(data.createdDate, pageWidth - marginRight, 30, { align: 'right' });

  yPos = Math.max(yPos, 60);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Betriebskostenabrechnung für das Jahr ${data.year}`, marginLeft, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mietobjekt: ${data.propertyName}, Einheit ${data.unitNumber}`, marginLeft, yPos);
  yPos += 5;
  doc.text(`Abrechnungszeitraum: 01.01.${data.year} – 31.12.${data.year}`, marginLeft, yPos);
  yPos += 10;

  let salutation = 'Sehr geehrte Damen und Herren';
  if (data.tenantGender === 'male') {
    salutation = `Sehr geehrter Herr ${data.tenantName.split(' ').pop()}`;
  } else if (data.tenantGender === 'female') {
    salutation = `Sehr geehrte Frau ${data.tenantName.split(' ').pop()}`;
  }

  doc.text(`${salutation},`, marginLeft, yPos);
  yPos += 10;

  const introText = 'hiermit erhalten Sie die Abrechnung über die Betriebskosten gemäß § 556 BGB und der\nBetriebskostenverordnung (BetrKV) für den oben genannten Abrechnungszeitraum.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginLeft, yPos);
  yPos += introLines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('I. Aufstellung der Betriebskosten', marginLeft, yPos);
  yPos += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  const tableData = data.lineItems.map((item) => [
    item.cost_type,
    getAllocationKeyLabel(item.allocation_key),
    `${item.amount.toFixed(2)} €`,
    item.share,
    `${item.shareAmount.toFixed(2)} €`,
  ]);

  tableData.push([
    { content: 'Summe Betriebskosten', colSpan: 2, styles: { fontStyle: 'bold' } },
    `${data.lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)} €`,
    '',
    { content: `${data.costShare.toFixed(2)} €`, styles: { fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Kostenart', 'Umlageschlüssel', 'Gesamtkosten', 'Ihr Anteil', 'Ihr Betrag']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: 'bold',
      lineWidth: 0,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { halign: 'right', cellWidth: 25 },
      3: { cellWidth: 35 },
      4: { halign: 'right', cellWidth: 25 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFont('helvetica', 'bold');
  doc.text('II. Abrechnungsergebnis', marginLeft, yPos);
  yPos += 2;
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Geleistete Betriebskostenvorauszahlungen', marginLeft, yPos);
  doc.text(`${data.prepayments.toFixed(2)} €`, pageWidth - marginRight, yPos, { align: 'right' });
  yPos += 6;

  doc.text('Ihr Anteil an den Betriebskosten (siehe Aufstellung)', marginLeft, yPos);
  doc.text(`./. ${data.costShare.toFixed(2)} €`, pageWidth - marginRight, yPos, { align: 'right' });
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  if (data.balance >= 0) {
    doc.text('Nachzahlung', marginLeft, yPos);
    doc.text(`${data.balance.toFixed(2)} €`, pageWidth - marginRight, yPos, { align: 'right' });
  } else {
    doc.text('Guthaben', marginLeft, yPos);
    doc.text(`${Math.abs(data.balance).toFixed(2)} €`, pageWidth - marginRight, yPos, { align: 'right' });
  }
  yPos += 2;
  doc.setLineWidth(1);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);

  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 15;
  }

  if (data.balance > 0 && data.bankDetails) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const paymentText = `Bitte überweisen Sie den Nachzahlungsbetrag von ${data.balance.toFixed(2)} € bis zum ${data.paymentDueDate} auf folgendes Konto:`;
    const paymentLines = doc.splitTextToSize(paymentText, contentWidth);
    doc.text(paymentLines, marginLeft, yPos);
    yPos += paymentLines.length * 5 + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('III. Berechnungsgrundlagen', marginLeft, yPos);
  yPos += 2;
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  const columnXPos = pageWidth / 2 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Gesamtobjekt:', marginLeft, yPos);
  doc.text('Ihre Wohnung:', columnXPos, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Gesamtwohnfläche:', marginLeft, yPos);
  doc.text(`${data.totalAreaSqm.toFixed(2)} m²`, marginLeft + 50, yPos);
  doc.text('Wohnfläche:', columnXPos, yPos);
  doc.text(`${data.areaSqm.toFixed(2)} m² (${((data.areaSqm / data.totalAreaSqm) * 100).toFixed(2)}%)`, columnXPos + 30, yPos);
  yPos += 5;

  doc.text('Wohneinheiten:', marginLeft, yPos);
  doc.text(`${data.unitCount}`, marginLeft + 50, yPos);
  doc.text('Personen:', columnXPos, yPos);
  doc.text(`${data.totalPersons}`, columnXPos + 30, yPos);
  yPos += 5;

  doc.text('Bewohner gesamt:', marginLeft, yPos);
  doc.text(`${data.totalPersons} Personen`, marginLeft + 50, yPos);
  doc.text('Abrechnungstage:', columnXPos, yPos);
  const totalDaysInYear = 365 + (new Date(data.year, 1, 29).getMonth() === 1 ? 1 : 0);
  doc.text(`${data.daysInPeriod} von ${totalDaysInYear} (${((data.daysInPeriod / totalDaysInYear) * 100).toFixed(2)}%)`, columnXPos + 30, yPos);
  yPos += 15;

  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('IV. Rechtliche Hinweise', marginLeft, yPos);
  yPos += 2;
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('• Belegeinsicht (§ 259 BGB)', marginLeft, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  const belege = 'Sie haben das Recht, die dieser Abrechnung zugrunde liegenden Belege und Unterlagen einzusehen. Bitte vereinbaren Sie\nhierzu einen Termin.';
  const belegeLines = doc.splitTextToSize(belege, contentWidth - 5);
  doc.text(belegeLines, marginLeft + 3, yPos);
  yPos += belegeLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('• Einwendungsfrist (§ 556 Abs. 3 Satz 5 BGB)', marginLeft, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  const einwendung = 'Einwendungen gegen diese Abrechnung sind gemäß § 556 Abs. 3 Satz 5 BGB innerhalb von 12 Monaten nach Zugang dieser\nAbrechnung mitzuteilen. Nach Ablauf dieser Frist können Einwendungen nicht mehr geltend gemacht werden, es sei denn, Sie\nhaben die verspätete Geltendmachung nicht zu vertreten.';
  const einwendungLines = doc.splitTextToSize(einwendung, contentWidth - 5);
  doc.text(einwendungLines, marginLeft + 3, yPos);
  yPos += einwendungLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('• Rechtsgrundlage', marginLeft, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  const rechtsgrundlage = 'Diese Abrechnung wurde auf Grundlage des § 556 BGB sowie der Betriebskostenverordnung (BetrKV) erstellt. Es wurden nur\numlagefähige Betriebskosten gemäß § 2 BetrKV berücksichtigt.';
  const rechtsgrundlageLines = doc.splitTextToSize(rechtsgrundlage, contentWidth - 5);
  doc.text(rechtsgrundlageLines, marginLeft + 3, yPos);
  yPos += rechtsgrundlageLines.length * 5 + 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Für Rückfragen stehen wir Ihnen gerne zur Verfügung.', marginLeft, yPos);
  yPos += 10;

  doc.text('Mit freundlichen Grüßen', marginLeft, yPos);
  yPos += 15;

  doc.text(data.landlordName, marginLeft, yPos);

  doc.setFontSize(8);
  doc.setTextColor(128);
  const footer = `Betriebskostenabrechnung ${data.year} · Erstellt am ${data.createdDate}`;
  doc.text(footer, marginLeft, pageHeight - 10);
  doc.text(`Seite 1 von 1`, pageWidth - marginRight, pageHeight - 10, { align: 'right' });

  console.log('Outputting PDF as blob');
  const blob = doc.output('blob') as Blob;
  console.log('PDF blob created, size:', blob.size, 'type:', blob.type);
  return blob;
}

function getAllocationKeyLabel(key: string): string {
  switch (key) {
    case 'area':
      return 'Wohnfläche';
    case 'units':
      return 'Wohneinheiten';
    case 'persons':
      return 'Personenzahl';
    case 'consumption':
      return 'Verbrauch';
    default:
      return key;
  }
}
