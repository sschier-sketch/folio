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
    is_section_35a?: boolean;
    section_35a_category?: 'haushaltsnahe_dienstleistungen' | 'handwerkerleistungen' | null;
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
      .select('area_sqm, mea')
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
      } else if (item.allocation_key === 'consumption' && unitCount > 0) {
        share = `1 / ${unitCount} Einheiten`;
        shareAmount = (Number(item.amount) / unitCount) * (result.days_in_period / totalDaysInYear);
      } else if (item.allocation_key === 'mea' && allUnits) {
        const parseMea = (mea: string | null): { numerator: number; denominator: number } => {
          if (!mea) return { numerator: 0, denominator: 10000 };
          const parts = mea.split('/').map(s => Number(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] > 0) {
            return { numerator: parts[0], denominator: parts[1] };
          }
          return { numerator: 0, denominator: 10000 };
        };
        const unitMea = parseMea(unit?.mea);
        const totalMeaNumerator = allUnits.reduce((sum, u) => sum + parseMea(u.mea).numerator, 0) || 1;
        share = `${unitMea.numerator} / ${totalMeaNumerator} MEA`;
        if (totalMeaNumerator > 0) {
          shareAmount = (Number(item.amount) * unitMea.numerator / totalMeaNumerator) * (result.days_in_period / totalDaysInYear);
        }
      } else if (item.allocation_key === 'direct' || item.allocation_key === 'consumption_billing') {
        share = 'Direktumlage';
        shareAmount = Number(item.amount) * (result.days_in_period / totalDaysInYear);
      }

      return {
        cost_type: item.cost_type,
        allocation_key: item.allocation_key,
        amount: Number(item.amount),
        share,
        shareAmount,
        is_section_35a: item.is_section_35a || false,
        section_35a_category: item.section_35a_category || null,
      };
    });

    const landlordFullName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : 'Vermieter';

    const landlordFullAddress = profile
      ? `${profile.address_street || ''} · ${profile.address_zip || ''} ${profile.address_city || ''}`.trim()
      : '';

    const tenantFullAddress = tenant
      ? `${tenant.street || ''} ${tenant.house_number || ''}\n${tenant.zip_code || ''} ${tenant.city || ''}`
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
    const filePath = `${userId}/operating-costs/${fileName}`;

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
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M_LEFT = 20;
  const M_RIGHT = 20;
  const M_TOP = 20;
  const M_BOTTOM = 15;
  const FOOTER_H = 8;
  const CONTENT_BOTTOM_Y = PAGE_H - M_BOTTOM - FOOTER_H;
  const contentWidth = PAGE_W - M_LEFT - M_RIGHT;

  const checkPageBreak = (requiredSpace: number = 10) => {
    if (currentY > CONTENT_BOTTOM_Y - requiredSpace) {
      doc.addPage();
      currentY = M_TOP;
      return true;
    }
    return false;
  };

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const senderLine = `${data.landlordName} · ${data.landlordAddress}`;
  doc.text(senderLine, M_LEFT, 37);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  const recipientLines = data.tenantName + '\n' + data.tenantAddress;
  const splitRecipient = doc.splitTextToSize(recipientLines, 85);
  doc.text(splitRecipient, M_LEFT, 55);

  doc.setFontSize(10);
  doc.text(data.createdDate, PAGE_W - M_RIGHT, 80, { align: 'right' });

  let currentY = 90;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Betriebskostenabrechnung für das Jahr ${data.year}`, M_LEFT, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mietobjekt: ${data.propertyName}, Einheit ${data.unitNumber}`, M_LEFT, currentY);
  currentY += 5;
  doc.text(`Abrechnungszeitraum: 01.01.${data.year} – 31.12.${data.year}`, M_LEFT, currentY);
  currentY += 10;

  let salutation = 'Sehr geehrte Damen und Herren';
  if (data.tenantGender === 'male') {
    salutation = `Sehr geehrter Herr ${data.tenantName.split(' ').pop()}`;
  } else if (data.tenantGender === 'female') {
    salutation = `Sehr geehrte Frau ${data.tenantName.split(' ').pop()}`;
  }

  doc.text(`${salutation},`, M_LEFT, currentY);
  currentY += 10;

  const introText = 'hiermit erhalten Sie die Abrechnung über die Betriebskosten gemäß § 556 BGB und der\nBetriebskostenverordnung (BetrKV) für den oben genannten Abrechnungszeitraum.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, M_LEFT, currentY);
  currentY += introLines.length * 5 + 10;

  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.text('I. Aufstellung der Betriebskosten', M_LEFT, currentY);
  currentY += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 8;

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

  checkPageBreak(30);
  autoTable(doc, {
    startY: currentY,
    head: [['Kostenart', 'Umlageschlüssel', 'Gesamtkosten', 'Ihr Anteil', 'Ihr Betrag']],
    body: tableData,
    theme: 'plain',
    margin: { left: M_LEFT, right: M_RIGHT },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: 'bold',
      lineWidth: 0,
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 33 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 39 },
      4: { halign: 'right', cellWidth: 25 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.text('II. Abrechnungsergebnis', M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Geleistete Betriebskostenvorauszahlungen', M_LEFT, currentY);
  doc.text(`${data.prepayments.toFixed(2)} €`, PAGE_W - M_RIGHT, currentY, { align: 'right' });
  currentY += 6;

  doc.text('Ihr Anteil an den Betriebskosten (siehe Aufstellung)', M_LEFT, currentY);
  doc.text(`./. ${data.costShare.toFixed(2)} €`, PAGE_W - M_RIGHT, currentY, { align: 'right' });
  currentY += 10;

  doc.setFont('helvetica', 'bold');
  if (data.balance >= 0) {
    doc.text('Nachzahlung', M_LEFT, currentY);
    doc.text(`${data.balance.toFixed(2)} €`, PAGE_W - M_RIGHT, currentY, { align: 'right' });
  } else {
    doc.text('Guthaben', M_LEFT, currentY);
    doc.text(`${Math.abs(data.balance).toFixed(2)} €`, PAGE_W - M_RIGHT, currentY, { align: 'right' });
  }
  currentY += 2;
  doc.setLineWidth(1);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 15;

  checkPageBreak(40);
  if (data.balance > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (data.bankDetails && data.bankDetails.iban) {
      const paymentText = `Bitte überweisen Sie den Nachzahlungsbetrag von ${data.balance.toFixed(2)} € bis zum ${data.paymentDueDate} auf folgendes Konto:`;
      const paymentLines = doc.splitTextToSize(paymentText, contentWidth);
      doc.text(paymentLines, M_LEFT, currentY);
      currentY += paymentLines.length * 5 + 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Kontoinhaber:', M_LEFT, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.bankDetails.account_holder, M_LEFT + 40, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('IBAN:', M_LEFT, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.bankDetails.iban, M_LEFT + 40, currentY);
      currentY += 5;

      if (data.bankDetails.bic) {
        doc.setFont('helvetica', 'bold');
        doc.text('BIC:', M_LEFT, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.bankDetails.bic, M_LEFT + 40, currentY);
        currentY += 5;
      }

      if (data.bankDetails.bank_name) {
        doc.setFont('helvetica', 'bold');
        doc.text('Bank:', M_LEFT, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.bankDetails.bank_name, M_LEFT + 40, currentY);
        currentY += 5;
      }
      currentY += 5;
    } else {
      doc.setFillColor(255, 245, 230);
      doc.rect(M_LEFT, currentY - 3, contentWidth, 12, 'F');
      doc.setTextColor(180, 100, 0);
      const warningText = 'Bankverbindung nicht hinterlegt – bitte im Account ergänzen.';
      doc.text(warningText, M_LEFT + 2, currentY + 3);
      doc.setTextColor(0);
      currentY += 15;
    }
  }

  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.text('III. Berechnungsgrundlagen', M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 10;

  const columnXPos = PAGE_W / 2 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Gesamtobjekt:', M_LEFT, currentY);
  doc.text('Ihre Wohnung:', columnXPos, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Gesamtwohnfläche:', M_LEFT, currentY);
  doc.text(`${data.totalAreaSqm.toFixed(2)} m²`, M_LEFT + 50, currentY);
  doc.text('Wohnfläche:', columnXPos, currentY);
  doc.text(`${data.areaSqm.toFixed(2)} m² (${((data.areaSqm / data.totalAreaSqm) * 100).toFixed(2)}%)`, columnXPos + 30, currentY);
  currentY += 5;

  doc.text('Wohneinheiten:', M_LEFT, currentY);
  doc.text(`${data.unitCount}`, M_LEFT + 50, currentY);
  doc.text('Personen:', columnXPos, currentY);
  doc.text(`${data.totalPersons}`, columnXPos + 30, currentY);
  currentY += 5;

  doc.text('Bewohner gesamt:', M_LEFT, currentY);
  doc.text(`${data.totalPersons} Personen`, M_LEFT + 50, currentY);
  doc.text('Abrechnungstage:', columnXPos, currentY);
  const totalDaysInYear = 365 + (new Date(data.year, 1, 29).getMonth() === 1 ? 1 : 0);
  doc.text(`${data.daysInPeriod} von ${totalDaysInYear} (${((data.daysInPeriod / totalDaysInYear) * 100).toFixed(2)}%)`, columnXPos + 30, currentY);
  currentY += 15;

  const section35aItems = data.lineItems.filter(item => item.is_section_35a && item.section_35a_category);
  let nextSectionNumber = 4;

  if (section35aItems.length > 0) {
    checkPageBreak(80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const section35aTitle = 'IV. In Ihren Kosten enthaltener Anteil an Aufwendungen gemäß §35a EStG\n(haushaltsnahe Dienstleistungen & Handwerkerleistungen)';
    const section35aTitleLines = doc.splitTextToSize(section35aTitle, contentWidth);
    doc.text(section35aTitleLines, M_LEFT, currentY);
    currentY += section35aTitleLines.length * 5;
    doc.setLineWidth(0.5);
    doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
    currentY += 10;

    checkPageBreak(40);

    const haushaltsnaheItems = section35aItems.filter(item => item.section_35a_category === 'haushaltsnahe_dienstleistungen');
    const handwerkerItems = section35aItems.filter(item => item.section_35a_category === 'handwerkerleistungen');

    const taxTableData: any[] = [];

    if (haushaltsnaheItems.length > 0) {
      taxTableData.push([
        { content: 'a) haushaltsnahe Dienstleistungen / Beschäftigungen', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [255, 255, 255] } },
      ]);

      haushaltsnaheItems.forEach(item => {
        taxTableData.push([
          item.cost_type,
          `${item.amount.toFixed(2)} €`,
          getAllocationKeyLabel(item.allocation_key),
          `${item.shareAmount.toFixed(2)} €`,
        ]);
      });
    }

    if (handwerkerItems.length > 0) {
      taxTableData.push([
        { content: 'b) Handwerkerleistungen', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [255, 255, 255] } },
      ]);

      handwerkerItems.forEach(item => {
        taxTableData.push([
          item.cost_type,
          `${item.amount.toFixed(2)} €`,
          getAllocationKeyLabel(item.allocation_key),
          `${item.shareAmount.toFixed(2)} €`,
        ]);
      });
    }

    const totalSection35a = section35aItems.reduce((sum, item) => sum + item.shareAmount, 0);
    taxTableData.push([
      { content: 'In Ihren Kosten enthaltener Gesamtanteil an Aufwendungen gem. §35a EStG', colSpan: 3, styles: { fontStyle: 'bold' } },
      { content: `${totalSection35a.toFixed(2)} €`, styles: { fontStyle: 'bold', halign: 'right' } },
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Kostenart', 'Kosten gemäß §35a EStG', 'Abrechnungsschlüssel', 'Ihr Anteil']],
      body: taxTableData,
      theme: 'plain',
      margin: { left: M_LEFT, right: M_RIGHT },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'right', cellWidth: 38 },
        2: { cellWidth: 42 },
        3: { halign: 'right', cellWidth: 30 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    checkPageBreak(20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const taxDisclaimer = 'Die Haftung für etwaige Steuerbegünstigungen der Anspruchsberechtigten, die sich aus den jeweilig ausgewiesenen Beträgen ergeben, ist ausgeschlossen.';
    const taxDisclaimerLines = doc.splitTextToSize(taxDisclaimer, contentWidth);
    doc.text(taxDisclaimerLines, M_LEFT, currentY);
    currentY += taxDisclaimerLines.length * 4 + 12;

    nextSectionNumber = 5;
  }

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  checkPageBreak(80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${romanNumerals[nextSectionNumber - 1]}. Rechtliche Hinweise`, M_LEFT, currentY);
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.line(M_LEFT, currentY, PAGE_W - M_RIGHT, currentY);
  currentY += 10;

  doc.setFontSize(8.5);

  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Einwendungsfrist (§ 556 Abs. 3 Satz 5 BGB)', M_LEFT, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  const einwendung = 'Einwendungen gegen diese Abrechnung sind gemäß § 556 Abs. 3 Satz 5 BGB innerhalb von 12 Monaten nach Zugang dieser Abrechnung mitzuteilen. Nach Ablauf dieser Frist können Einwendungen nicht mehr geltend gemacht werden, es sei denn, Sie haben die verspätete Geltendmachung nicht zu vertreten.';
  const einwendungLines = doc.splitTextToSize(einwendung, contentWidth - 5);
  doc.text(einwendungLines, M_LEFT, currentY);
  currentY += einwendungLines.length * 4.5 + 6;

  checkPageBreak(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Rechtsgrundlage', M_LEFT, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  const rechtsgrundlage = 'Diese Abrechnung wurde auf Grundlage des § 556 BGB sowie der Betriebskostenverordnung (BetrKV) erstellt. Es wurden nur umlagefähige Betriebskosten gemäß § 2 BetrKV berücksichtigt.';
  const rechtsgrundlageLines = doc.splitTextToSize(rechtsgrundlage, contentWidth - 5);
  doc.text(rechtsgrundlageLines, M_LEFT, currentY);
  currentY += rechtsgrundlageLines.length * 4.5 + 6;

  checkPageBreak(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Direktumlage', M_LEFT, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  const direktumlage = 'Bei Kostenpositionen, die mit dem Vermerk \'Direktumlage\' gekennzeichnet sind, wurde der Betrag manuell zugeordnet.';
  const direktumlageLines = doc.splitTextToSize(direktumlage, contentWidth - 5);
  doc.text(direktumlageLines, M_LEFT, currentY);
  currentY += direktumlageLines.length * 4.5 + 6;

  checkPageBreak(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Berechnung des Kostenanteils', M_LEFT, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  const berechnung = 'Ihren Kostenanteil berechnen Sie wie folgt: Gesamtkosten/Gesamteinheiten * Ihre Einheiten/Tage im AZ * Tage im NZ = Ihr Kostenanteil. (Zum Beispiel: 200,00 €/400qm*40qm/365 Tage im AZ * 180 Tage im NZ = 9,86 €)';
  const berechnungLines = doc.splitTextToSize(berechnung, contentWidth - 5);
  doc.text(berechnungLines, M_LEFT, currentY);
  currentY += berechnungLines.length * 4.5 + 6;

  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.text('§35a EStG (haushaltsnahe Dienstleistungen & Handwerkerleistungen)', M_LEFT, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  const section35aDisclaimer = 'Die ausgewiesenen Beträge dienen ausschließlich als Übersicht über potenziell steuerlich begünstigte Aufwendungen gemäß §35a EStG. Eine steuerliche Beratung oder Gewähr für die Anerkennung durch das Finanzamt ist ausgeschlossen.';
  const section35aDisclaimerLines = doc.splitTextToSize(section35aDisclaimer, contentWidth - 5);
  doc.text(section35aDisclaimerLines, M_LEFT, currentY);
  currentY += section35aDisclaimerLines.length * 4.5 + 6;

  doc.setFontSize(10);

  checkPageBreak(20);
  doc.setFont('helvetica', 'normal');
  doc.text('Für Rückfragen stehen wir Ihnen gerne zur Verfügung.', M_LEFT, currentY);
  currentY += 15;

  doc.text('Mit freundlichen Grüßen', M_LEFT, currentY);
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
    const footer = `Betriebskostenabrechnung ${data.year} · Erstellt am ${data.createdDate}`;
    doc.text(footer, M_LEFT, footerY);
    doc.text(`Seite ${i} von ${totalPages}`, PAGE_W - M_RIGHT, footerY, { align: 'right' });
  }

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
    case 'mea':
      return 'MEA';
    case 'direct':
      return 'Direktumlage';
    case 'consumption_billing':
      return 'lt. Verbrauchsabr.';
    default:
      return key;
  }
}
