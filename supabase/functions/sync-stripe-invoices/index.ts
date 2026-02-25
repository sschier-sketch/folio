import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function getStripe(): Stripe {
  return new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    appInfo: { name: 'Bolt Integration', version: '1.0.0' },
  });
}

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

const PDF_CONCURRENCY = 4;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripe = getStripe();
    const supabase = getSupabase();

    const cutoffDate = Math.floor(Date.now() / 1000) - 18 * 30 * 24 * 60 * 60;

    let synced = 0;
    let pdfsCached = 0;
    const errors: string[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.InvoiceListParams = {
        limit: 100,
        created: { gte: cutoffDate },
        expand: [],
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const invoices = await stripe.invoices.list(params);

      for (const invoice of invoices.data) {
        try {
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
          const createdAt = new Date(invoice.created * 1000).toISOString();
          const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null;
          const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null;

          const { error: upsertError } = await supabase
            .from('stripe_invoices')
            .upsert({
              stripe_invoice_id: invoice.id,
              stripe_customer_id: customerId,
              invoice_number: invoice.number ?? null,
              status: invoice.status ?? 'draft',
              currency: invoice.currency ?? 'eur',
              total: invoice.total ?? 0,
              tax: invoice.tax ?? null,
              subtotal: invoice.subtotal ?? null,
              created_at_stripe: createdAt,
              period_start: periodStart,
              period_end: periodEnd,
              customer_email: invoice.customer_email ?? null,
              customer_name: invoice.customer_name ?? null,
              hosted_invoice_url: invoice.hosted_invoice_url ?? null,
              invoice_pdf_url: invoice.invoice_pdf ?? null,
              updated_at: new Date().toISOString(),
              raw: {
                id: invoice.id,
                number: invoice.number,
                status: invoice.status,
                total: invoice.total,
                tax: invoice.tax,
                subtotal: invoice.subtotal,
                currency: invoice.currency,
                lines_count: invoice.lines?.data?.length ?? 0,
              },
            }, { onConflict: 'stripe_invoice_id' });

          if (upsertError) {
            errors.push(`upsert ${invoice.id}: ${upsertError.message}`);
          } else {
            synced++;
          }
        } catch (err: any) {
          errors.push(`process ${invoice.id}: ${err.message}`);
        }
      }

      hasMore = invoices.has_more;
      if (invoices.data.length > 0) {
        startingAfter = invoices.data[invoices.data.length - 1].id;
      }
    }

    const { data: needsPdf } = await supabase
      .from('stripe_invoices')
      .select('stripe_invoice_id, invoice_pdf_url, pdf_storage_path, pdf_cached_at, updated_at, created_at_stripe, invoice_number')
      .in('status', ['open', 'paid', 'uncollectible', 'void'])
      .not('invoice_pdf_url', 'is', null)
      .order('created_at_stripe', { ascending: false });

    const toCachePdfs = (needsPdf ?? []).filter((row) => {
      if (!row.pdf_storage_path) return true;
      if (!row.pdf_cached_at) return true;
      return new Date(row.pdf_cached_at).getTime() < new Date(row.updated_at).getTime();
    });

    for (let i = 0; i < toCachePdfs.length; i += PDF_CONCURRENCY) {
      const batch = toCachePdfs.slice(i, i + PDF_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (row) => {
          const createdDate = new Date(row.created_at_stripe);
          const yyyy = createdDate.getFullYear().toString();
          const mm = String(createdDate.getMonth() + 1).padStart(2, '0');
          const safeName = (row.invoice_number ?? row.stripe_invoice_id).replace(/[^a-zA-Z0-9_-]/g, '_');
          const storagePath = `stripe/invoices/${yyyy}/${mm}/${row.stripe_invoice_id}_${safeName}.pdf`;

          const pdfRes = await fetch(row.invoice_pdf_url!);
          if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
          const pdfBuffer = await pdfRes.arrayBuffer();

          const { error: uploadErr } = await supabase.storage
            .from('billing')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

          if (uploadErr) throw uploadErr;

          await supabase
            .from('stripe_invoices')
            .update({
              pdf_storage_path: storagePath,
              pdf_cached_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_invoice_id', row.stripe_invoice_id);

          return row.stripe_invoice_id;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          pdfsCached++;
        } else {
          errors.push(`pdf: ${r.reason?.message ?? 'unknown'}`);
        }
      }
    }

    let creditNotesSynced = 0;
    let creditNotePdfsCached = 0;
    let cnHasMore = true;
    let cnStartingAfter: string | undefined;

    while (cnHasMore) {
      const cnParams: Stripe.CreditNoteListParams = {
        limit: 100,
      };
      if (cnStartingAfter) {
        cnParams.starting_after = cnStartingAfter;
      }

      const creditNotes = await stripe.creditNotes.list(cnParams);

      for (const cn of creditNotes.data) {
        if (cn.created < cutoffDate) {
          cnHasMore = false;
          break;
        }

        try {
          const customerId = typeof cn.customer === 'string' ? cn.customer : null;
          const invoiceId = typeof cn.invoice === 'string' ? cn.invoice : null;
          const refundId = typeof cn.refund === 'string' ? cn.refund : null;
          const createdAt = new Date(cn.created * 1000).toISOString();

          const { error: cnUpsertError } = await supabase
            .from('stripe_credit_notes')
            .upsert({
              stripe_credit_note_id: cn.id,
              stripe_invoice_id: invoiceId ?? '',
              stripe_customer_id: customerId,
              stripe_refund_id: refundId,
              number: cn.number ?? null,
              status: cn.status ?? 'issued',
              currency: cn.currency ?? 'eur',
              total: cn.amount ?? 0,
              subtotal: cn.subtotal ?? null,
              tax: cn.tax ?? null,
              reason: cn.reason ?? null,
              memo: cn.memo ?? null,
              created_at_stripe: createdAt,
              customer_email: cn.customer_email ?? null,
              customer_name: cn.customer_name ?? null,
              pdf_url: cn.pdf ?? null,
              updated_at: new Date().toISOString(),
              raw: {
                id: cn.id,
                number: cn.number,
                status: cn.status,
                amount: cn.amount,
                invoice: invoiceId,
                refund: refundId,
              },
            }, { onConflict: 'stripe_credit_note_id' });

          if (cnUpsertError) {
            errors.push(`cn upsert ${cn.id}: ${cnUpsertError.message}`);
          } else {
            creditNotesSynced++;
          }
        } catch (err: any) {
          errors.push(`cn process ${cn.id}: ${err.message}`);
        }
      }

      if (cnHasMore) {
        cnHasMore = creditNotes.has_more;
      }
      if (creditNotes.data.length > 0) {
        cnStartingAfter = creditNotes.data[creditNotes.data.length - 1].id;
      }
    }

    const { data: cnNeedsPdf } = await supabase
      .from('stripe_credit_notes')
      .select('stripe_credit_note_id, pdf_url, pdf_storage_path, pdf_cached_at, updated_at, created_at_stripe, number')
      .eq('status', 'issued')
      .not('pdf_url', 'is', null)
      .order('created_at_stripe', { ascending: false });

    const cnToCachePdfs = (cnNeedsPdf ?? []).filter((row) => {
      if (!row.pdf_storage_path) return true;
      if (!row.pdf_cached_at) return true;
      return new Date(row.pdf_cached_at).getTime() < new Date(row.updated_at).getTime();
    });

    for (let i = 0; i < cnToCachePdfs.length; i += PDF_CONCURRENCY) {
      const batch = cnToCachePdfs.slice(i, i + PDF_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (row) => {
          const createdDate = new Date(row.created_at_stripe);
          const yyyy = createdDate.getFullYear().toString();
          const mm = String(createdDate.getMonth() + 1).padStart(2, '0');
          const safeName = (row.number ?? row.stripe_credit_note_id).replace(/[^a-zA-Z0-9_-]/g, '_');
          const storagePath = `stripe/credit_notes/${yyyy}/${mm}/${row.stripe_credit_note_id}_${safeName}.pdf`;

          const pdfRes = await fetch(row.pdf_url!);
          if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
          const pdfBuffer = await pdfRes.arrayBuffer();

          const { error: uploadErr } = await supabase.storage
            .from('billing')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

          if (uploadErr) throw uploadErr;

          await supabase
            .from('stripe_credit_notes')
            .update({
              pdf_storage_path: storagePath,
              pdf_cached_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_credit_note_id', row.stripe_credit_note_id);

          return row.stripe_credit_note_id;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          creditNotePdfsCached++;
        } else {
          errors.push(`cn pdf: ${r.reason?.message ?? 'unknown'}`);
        }
      }
    }

    const result = {
      synced,
      pdfs_cached: pdfsCached,
      pdfs_pending: toCachePdfs.length,
      credit_notes_synced: creditNotesSynced,
      credit_notes_pdfs_cached: creditNotePdfsCached,
      errors_count: errors.length,
      errors: errors.slice(0, 20),
    };

    console.log('Sync complete:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
