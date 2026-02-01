import { supabase } from './supabase';

export async function sendOperatingCostPdf(
  userId: string,
  statementId: string,
  resultId: string,
  pdfId: string,
  recipientEmail: string
): Promise<{ data: { success: boolean } | null; error: any }> {
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

    const { data: pdf } = await supabase
      .from('operating_cost_pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (!pdf) throw new Error('PDF not found');

    const { data: tenant } = result.tenant_id
      ? await supabase
          .from('tenants')
          .select('*')
          .eq('id', result.tenant_id)
          .single()
      : { data: null };

    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', statement.property_id)
      .single();

    const { data: profile } = await supabase
      .from('account_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: pdfBlob } = await supabase.storage
      .from('documents')
      .download(pdf.file_path);

    if (!pdfBlob) throw new Error('Could not download PDF');

    const pdfBase64 = await blobToBase64(pdfBlob);

    const tenantName = tenant
      ? `${tenant.first_name} ${tenant.last_name}`
      : 'Sehr geehrte Damen und Herren';

    const landlordName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`
      : 'Ihr Vermieter';

    const emailSubject = `Betriebskostenabrechnung ${statement.year} - ${property?.name || 'Ihre Mietwohnung'}`;

    const emailBody = `
      Sehr geehrte/r ${tenantName},

      anbei erhalten Sie die Betriebskostenabrechnung für das Jahr ${statement.year}.

      Die Abrechnung bezieht sich auf folgendes Objekt:
      ${property?.name || 'Ihre Mietwohnung'}
      ${property?.street || ''} ${property?.house_number || ''}
      ${property?.postal_code || ''} ${property?.city || ''}

      ${
        Number(result.balance) >= 0
          ? `Die Abrechnung ergibt eine Nachzahlung in Höhe von ${Number(result.balance).toFixed(2)} €.`
          : `Die Abrechnung ergibt ein Guthaben in Höhe von ${Math.abs(Number(result.balance)).toFixed(2)} €.`
      }

      Bei Fragen zur Abrechnung stehen wir Ihnen gerne zur Verfügung.

      Mit freundlichen Grüßen
      ${landlordName}
    `;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: emailSubject,
        body: emailBody,
        attachments: [
          {
            filename: `Betriebskostenabrechnung_${statement.year}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send email');
    }

    const { error: logError } = await supabase
      .from('operating_cost_send_logs')
      .insert({
        user_id: userId,
        statement_id: statementId,
        result_id: resultId,
        pdf_id: pdfId,
        recipient_email: recipientEmail,
        status: 'success',
      });

    if (logError) console.error('Error logging send:', logError);

    await supabase.from('property_documents').insert({
      property_id: statement.property_id,
      unit_id: result.unit_id,
      document_type: 'nebenkostenabrechnung',
      file_path: pdf.file_path,
      file_name: `Betriebskostenabrechnung_${statement.year}.pdf`,
      file_size: pdfBlob.size,
      shared_with_tenant: true,
      user_id: userId,
    });

    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error sending email:', error);

    try {
      await supabase.from('operating_cost_send_logs').insert({
        user_id: userId,
        statement_id: statementId,
        result_id: resultId,
        pdf_id: pdfId,
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: error.message || 'Unknown error',
      });
    } catch (logError) {
      console.error('Error logging failed send:', logError);
    }

    return { data: null, error };
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function checkIfAnySent(statementId: string): Promise<boolean> {
  const { data } = await supabase
    .from('operating_cost_send_logs')
    .select('id')
    .eq('statement_id', statementId)
    .eq('status', 'success')
    .limit(1);

  return (data && data.length > 0) || false;
}
