import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import JSZip from 'npm:jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRecord) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const status = url.searchParams.get('status');

    if (!from || !to) {
      return new Response(JSON.stringify({ error: 'Missing from/to date parameters (YYYY-MM-DD)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('stripe_invoices')
      .select('stripe_invoice_id, invoice_number, customer_name, customer_email, pdf_storage_path, created_at_stripe, status')
      .gte('created_at_stripe', `${from}T00:00:00Z`)
      .lte('created_at_stripe', `${to}T23:59:59Z`)
      .order('created_at_stripe', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: invoices, error: queryError } = await query;

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!invoices || invoices.length === 0) {
      return new Response(JSON.stringify({ error: 'Keine Rechnungen im angegebenen Zeitraum gefunden' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const zip = new JSZip();
    const missing: string[] = [];
    let added = 0;

    for (const inv of invoices) {
      if (!inv.pdf_storage_path) {
        missing.push(inv.stripe_invoice_id);
        continue;
      }

      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('billing')
          .download(inv.pdf_storage_path);

        if (downloadError || !fileData) {
          missing.push(inv.stripe_invoice_id);
          continue;
        }

        const dateStr = new Date(inv.created_at_stripe).toISOString().slice(0, 10);
        const customerPart = (inv.customer_name || inv.customer_email || 'unknown')
          .replace(/[^a-zA-Z0-9äöüÄÖÜß@._-]/g, '_')
          .slice(0, 40);
        const numberPart = (inv.invoice_number || inv.stripe_invoice_id).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${dateStr}_${numberPart}_${customerPart}.pdf`;

        const buffer = await fileData.arrayBuffer();
        zip.file(filename, buffer);
        added++;
      } catch {
        missing.push(inv.stripe_invoice_id);
      }
    }

    if (added === 0) {
      return new Response(JSON.stringify({
        error: 'Keine PDFs zum Exportieren vorhanden',
        missing,
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (missing.length > 0) {
      zip.file('_fehlende_rechnungen.txt',
        `Die folgenden Rechnungen hatten kein gespeichertes PDF:\n\n${missing.join('\n')}\n`
      );
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });

    const zipFilename = `Rechnungen_${from}_bis_${to}.zip`;

    return new Response(zipBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('export-invoices-zip error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
