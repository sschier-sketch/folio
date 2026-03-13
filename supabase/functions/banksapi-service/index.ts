import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BANKSAPI_BASE_URL = "https://banksapi.io";
const BANKSAPI_AUTH_URL = "https://banksapi.io/auth/oauth2/token";
const OVERLAP_DAYS = 14;

type Admin = ReturnType<typeof getSupabaseAdmin>;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getSupabaseUser(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

async function computeFingerprint(
  userId: string,
  bookingDate: string,
  amount: number,
  iban?: string,
  usageText?: string,
  reference?: string,
  counterpartyName?: string
): Promise<string> {
  const raw =
    userId +
    "|" +
    (bookingDate || "") +
    "|" +
    (amount != null ? String(amount) : "") +
    "|" +
    (iban ? iban.trim().toUpperCase() : "") +
    "|" +
    (usageText ? usageText.trim().substring(0, 140) : "") +
    "|" +
    (reference ? reference.trim() : "") +
    "|" +
    (counterpartyName ? counterpartyName.trim().toUpperCase() : "");

  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getAccessToken(admin: Admin): Promise<string> {
  const { data: cached } = await admin
    .from("banksapi_token_cache")
    .select("access_token, expires_at")
    .eq("id", 1)
    .maybeSingle();

  if (cached?.access_token && cached?.expires_at) {
    const expiresAt = new Date(cached.expires_at).getTime();
    if (Date.now() < expiresAt - 60_000) {
      return cached.access_token;
    }
  }

  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_client_id, banksapi_client_secret_encrypted")
    .eq("id", 1)
    .maybeSingle();

  if (
    !settings?.banksapi_client_id ||
    !settings?.banksapi_client_secret_encrypted
  ) {
    throw new Error("BanksAPI credentials not configured");
  }

  const basicAuth = btoa(
    `${settings.banksapi_client_id}:${settings.banksapi_client_secret_encrypted}`
  );

  const tokenRes = await fetch(BANKSAPI_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("BanksAPI token error:", tokenRes.status, body);
    throw new Error(`BanksAPI auth failed: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await admin.from("banksapi_token_cache").upsert({
    id: 1,
    access_token: accessToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return accessToken;
}

async function banksapiFetch(
  admin: Admin,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken(admin);
  const url = `${BANKSAPI_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers, redirect: "manual" });
}

function getCustomerId(userId: string): string {
  return userId.replace(/-/g, "");
}

// ─── Connection management ──────────────────────────────────────

async function handleCreateBankAccess(
  admin: Admin,
  userId: string,
  body: { callbackUrl?: string; customerIpAddress?: string }
): Promise<Response> {
  const customerId = getCustomerId(userId);
  const callbackUrl =
    body.callbackUrl || "https://rentab.ly/banksapi/callback";

  const payload: Record<string, unknown> = { sync: true, callbackUrl };
  const reqHeaders: Record<string, string> = {
    "X-Tenant-Id": customerId,
  };
  if (body.customerIpAddress) {
    reqHeaders["Customer-IP-Address"] = body.customerIpAddress;
  }

  const { data: existing } = await admin
    .from("banksapi_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "requires_sca")
    .maybeSingle();

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify(payload),
  });

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";
    if (!existing) {
      await admin.from("banksapi_connections").insert({
        user_id: userId,
        banksapi_customer_id: customerId,
        bank_access_id: null,
        bank_name: "",
        status: "requires_sca",
      });
    }
    return jsonResponse({
      action: "redirect",
      redirectUrl: location,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI createBankAccess error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();
  return await persistBankAccess(admin, userId, customerId, data);
}

async function persistBankAccess(
  admin: Admin,
  userId: string,
  customerId: string,
  data: Record<string, unknown>
): Promise<Response> {
  const bankAccessId = String(data.id || "");
  const bankName =
    (data.bankName as string) ||
    ((data.bank as Record<string, unknown>)?.name as string) ||
    "";
  const providerId = String(data.providerId || "");

  const { data: existingConn } = await admin
    .from("banksapi_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("bank_access_id", bankAccessId)
    .maybeSingle();

  let connectionId: string;

  if (existingConn) {
    connectionId = existingConn.id;
    await admin
      .from("banksapi_connections")
      .update({
        status: "connected",
        error_message: null,
        bank_name: bankName || undefined,
        provider_id: providerId || undefined,
        raw_response: data,
      })
      .eq("id", connectionId);
  } else {
    const { data: pendingConn } = await admin
      .from("banksapi_connections")
      .select("id")
      .eq("user_id", userId)
      .is("bank_access_id", null)
      .eq("status", "requires_sca")
      .maybeSingle();

    if (pendingConn) {
      connectionId = pendingConn.id;
      await admin
        .from("banksapi_connections")
        .update({
          bank_access_id: bankAccessId,
          banksapi_customer_id: customerId,
          provider_id: providerId,
          bank_name: bankName,
          status: "connected",
          error_message: null,
          raw_response: data,
        })
        .eq("id", connectionId);
    } else {
      const { data: newConn, error: insertErr } = await admin
        .from("banksapi_connections")
        .insert({
          user_id: userId,
          banksapi_customer_id: customerId,
          bank_access_id: bankAccessId,
          provider_id: providerId,
          bank_name: bankName,
          status: "connected",
          raw_response: data,
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("Error saving connection:", insertErr);
        return errorResponse("Failed to save connection", 500);
      }
      connectionId = newConn.id;
    }
  }

  await syncBankProducts(
    admin,
    userId,
    connectionId,
    bankAccessId,
    customerId
  );

  return jsonResponse({
    connectionId,
    bankAccessId,
    status: "connected",
    bankName,
  });
}

async function syncBankProducts(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string
): Promise<void> {
  try {
    const res = await banksapiFetch(
      admin,
      `/customer/v2/bankzugaenge/${bankAccessId}/bankprodukte`,
      { method: "GET", headers: { "X-Tenant-Id": customerId } }
    );

    if (!res.ok) {
      console.error("Failed to fetch bank products:", res.status);
      return;
    }

    const productsData = await res.json();
    const products = Array.isArray(productsData)
      ? productsData
      : productsData?.bankprodukte || productsData?.bankProducts || [];

    for (const product of products) {
      const productId = String(product.id || product.bankProductId || "");
      if (!productId) continue;

      const iban = (product.iban as string) || null;
      const accountName =
        (product.bezeichnung as string) ||
        (product.description as string) ||
        (product.name as string) ||
        "";
      const accountType =
        (product.kategorie as string) ||
        (product.category as string) ||
        null;

      let balanceCents: number | null = null;
      let balanceDate: string | null = null;
      const saldo = product.saldo || product.balance;
      if (saldo) {
        const amount =
          typeof saldo.value === "number"
            ? saldo.value
            : typeof saldo === "number"
            ? saldo
            : null;
        if (amount !== null) {
          balanceCents = Math.round(amount * 100);
        }
        balanceDate = saldo.date || saldo.datum || null;
      }

      const { data: existingProduct } = await admin
        .from("banksapi_bank_products")
        .select("id, selected_for_import, import_from_date")
        .eq("connection_id", connectionId)
        .eq("bank_product_id", productId)
        .maybeSingle();

      if (existingProduct) {
        await admin
          .from("banksapi_bank_products")
          .update({
            iban,
            account_name: accountName,
            account_type: accountType,
            balance_cents: balanceCents,
            balance_date: balanceDate,
            raw_response: product,
          })
          .eq("id", existingProduct.id);
      } else {
        await admin.from("banksapi_bank_products").insert({
          connection_id: connectionId,
          user_id: userId,
          bank_product_id: productId,
          iban,
          account_name: accountName,
          account_type: accountType,
          balance_cents: balanceCents,
          balance_date: balanceDate,
          selected_for_import: false,
          import_from_date: null,
          raw_response: product,
        });
      }
    }
  } catch (err) {
    console.error("Error syncing bank products:", err);
  }
}

async function handleCompleteCallback(
  admin: Admin,
  body: { userId: string; baReentry: string }
): Promise<Response> {
  const userId = body.userId;
  const customerId = getCustomerId(userId);

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "GET",
    headers: { "X-Tenant-Id": customerId },
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Failed to list bank accesses after callback:", errBody);
    return errorResponse("Failed to resolve bank access", 502);
  }

  const bankAccesses = await res.json();
  const accessList = Array.isArray(bankAccesses)
    ? bankAccesses
    : bankAccesses?.bankzugaenge || [];

  if (accessList.length === 0) {
    return errorResponse("No bank accesses found after authorization", 404);
  }

  const latest = accessList[accessList.length - 1];
  return await persistBankAccess(admin, userId, customerId, latest);
}

async function handleGetConnections(
  admin: Admin,
  userId: string
): Promise<Response> {
  const { data: connections, error } = await admin
    .from("banksapi_connections")
    .select(
      "id, bank_access_id, bank_name, provider_id, status, error_message, last_sync_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .neq("status", "disconnected")
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ connections: connections || [] });
}

async function handleGetProducts(
  admin: Admin,
  userId: string,
  connectionId: string
): Promise<Response> {
  const { data: products, error } = await admin
    .from("banksapi_bank_products")
    .select("*")
    .eq("user_id", userId)
    .eq("connection_id", connectionId)
    .order("account_name");

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ products: products || [] });
}

async function handleSaveProductSelection(
  admin: Admin,
  userId: string,
  body: {
    connectionId: string;
    selections: Array<{
      productId: string;
      selected: boolean;
      importFromDate: string | null;
    }>;
    triggerImport?: boolean;
  }
): Promise<Response> {
  for (const sel of body.selections) {
    await admin
      .from("banksapi_bank_products")
      .update({
        selected_for_import: sel.selected,
        import_from_date: sel.importFromDate || null,
      })
      .eq("id", sel.productId)
      .eq("user_id", userId)
      .eq("connection_id", body.connectionId);
  }

  if (body.triggerImport !== false) {
    const { data: conn } = await admin
      .from("banksapi_connections")
      .select("id, bank_access_id, banksapi_customer_id, status")
      .eq("id", body.connectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (conn?.status === "connected" && conn.bank_access_id) {
      const result = await importTransactionsForConnection(
        admin,
        userId,
        conn.id,
        conn.bank_access_id,
        conn.banksapi_customer_id,
        "manual"
      );
      return jsonResponse({ status: "saved", import: result });
    }
  }

  return jsonResponse({ status: "saved" });
}

async function handleRefreshBankAccess(
  admin: Admin,
  userId: string,
  connectionId: string,
  body: { callbackUrl?: string; customerIpAddress?: string }
): Promise<Response> {
  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn?.bank_access_id) {
    return errorResponse("Connection not found", 404);
  }

  const callbackUrl =
    body.callbackUrl || "https://rentab.ly/banksapi/callback";

  const reqHeaders: Record<string, string> = {
    "X-Tenant-Id": conn.banksapi_customer_id,
  };
  if (body.customerIpAddress) {
    reqHeaders["Customer-IP-Address"] = body.customerIpAddress;
  }

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
    {
      method: "PUT",
      headers: reqHeaders,
      body: JSON.stringify({ sync: true, callbackUrl }),
    }
  );

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";
    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("id", connectionId);

    return jsonResponse({
      action: "redirect",
      redirectUrl: location,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI refresh error:", res.status, errBody);
    await admin
      .from("banksapi_connections")
      .update({
        status: "error",
        error_message: `Refresh failed: ${res.status}`,
      })
      .eq("id", connectionId);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();
  await admin
    .from("banksapi_connections")
    .update({ status: "connected", error_message: null, raw_response: data })
    .eq("id", connectionId);

  await syncBankProducts(
    admin,
    userId,
    connectionId,
    conn.bank_access_id,
    conn.banksapi_customer_id
  );

  return jsonResponse({ status: "connected" });
}

async function handleDeleteConnection(
  admin: Admin,
  userId: string,
  connectionId: string
): Promise<Response> {
  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (conn?.bank_access_id) {
    try {
      await banksapiFetch(
        admin,
        `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
        {
          method: "DELETE",
          headers: { "X-Tenant-Id": conn.banksapi_customer_id },
        }
      );
    } catch (e) {
      console.error("Error deleting remote bank access:", e);
    }
  }

  await admin
    .from("banksapi_connections")
    .update({ status: "disconnected" })
    .eq("id", connectionId)
    .eq("user_id", userId);

  return jsonResponse({ status: "disconnected" });
}

// ─── Transaction import ─────────────────────────────────────────

interface ProductImportResult {
  bankProductId: string;
  accountName: string;
  totalSeen: number;
  imported: number;
  duplicates: number;
  filteredByDate: number;
  anomalies: number;
  status: "success" | "failed";
  error?: string;
}

interface ConnectionImportResult {
  connectionId: string;
  bankAccessId: string;
  status: "success" | "partial" | "failed" | "requires_sca";
  products: ProductImportResult[];
  totalSeen: number;
  totalImported: number;
  totalDuplicates: number;
  totalFilteredByDate: number;
  error?: string;
}

function getOverlapStartDate(importFromDate: string): string {
  const overlapStart = new Date();
  overlapStart.setDate(overlapStart.getDate() - OVERLAP_DAYS);

  const configDate = new Date(importFromDate);
  return configDate < overlapStart
    ? overlapStart.toISOString().slice(0, 10)
    : importFromDate;
}

function getEffectiveStartDate(
  importFromDate: string,
  lastImportAt: string | null
): string {
  if (!lastImportAt) return importFromDate;
  return getOverlapStartDate(importFromDate);
}

async function fetchRemoteTransactions(
  admin: Admin,
  bankAccessId: string,
  bankProductId: string,
  customerId: string
): Promise<Record<string, unknown>[]> {
  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${bankAccessId}/${bankProductId}/kontoumsaetze`,
    { method: "GET", headers: { "X-Tenant-Id": customerId } }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `BanksAPI kontoumsaetze ${res.status}: ${errBody.substring(0, 200)}`
    );
  }

  const data = await res.json();
  const list = Array.isArray(data)
    ? data
    : data?.kontoumsaetze || data?.transactions || [];
  return list as Record<string, unknown>[];
}

function parseRemoteTx(tx: Record<string, unknown>) {
  const remoteId =
    (tx.id as string) || (tx.transactionId as string) || null;
  const remoteHash = (tx.hash as string) || null;

  const bookingDateRaw =
    (tx.buchungsdatum as string) ||
    (tx.bookingDate as string) ||
    (tx.valutaDatum as string) ||
    (tx.valueDate as string) ||
    null;
  const valueDateRaw =
    (tx.valutaDatum as string) ||
    (tx.valueDate as string) ||
    null;

  const bookingDate = bookingDateRaw ? bookingDateRaw.slice(0, 10) : null;
  const valueDate = valueDateRaw ? valueDateRaw.slice(0, 10) : null;

  const effectiveDate = bookingDate || valueDate;

  const betrag = tx.betrag ?? tx.amount;
  const amount =
    typeof betrag === "number"
      ? betrag
      : typeof betrag === "string"
      ? parseFloat(betrag.replace(",", "."))
      : null;

  const currency =
    (tx.waehrung as string) || (tx.currency as string) || "EUR";

  const usageText =
    (tx.verwendungszweck as string) ||
    (tx.usage as string) ||
    (tx.purpose as string) ||
    "";

  const counterpartyName =
    (tx.gegenkontoInhaber as string) ||
    (tx.counterpartyName as string) ||
    (tx.creditorName as string) ||
    (tx.debtorName as string) ||
    "";

  const counterpartyIban =
    (tx.gegenkontoIban as string) ||
    (tx.counterpartyIban as string) ||
    (tx.creditorIban as string) ||
    (tx.debtorIban as string) ||
    null;

  const counterpartyBic =
    (tx.gegenkontoBic as string) ||
    (tx.counterpartyBic as string) ||
    null;

  const endToEndId =
    (tx.endToEndId as string) || (tx.endToEndReference as string) || null;
  const mandateId = (tx.mandateId as string) || null;
  const bankReference =
    (tx.primaNotaId as string) ||
    (tx.bankReference as string) ||
    null;

  return {
    remoteId,
    remoteHash,
    bookingDate,
    valueDate,
    effectiveDate,
    amount,
    currency,
    usageText,
    counterpartyName,
    counterpartyIban,
    counterpartyBic,
    endToEndId,
    mandateId,
    bankReference,
  };
}

async function importTransactionsForProduct(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  product: {
    id: string;
    bank_product_id: string;
    iban: string | null;
    account_name: string;
    import_from_date: string;
    last_import_at: string | null;
  },
  customerId: string
): Promise<ProductImportResult> {
  const result: ProductImportResult = {
    bankProductId: product.bank_product_id,
    accountName: product.account_name,
    totalSeen: 0,
    imported: 0,
    duplicates: 0,
    filteredByDate: 0,
    anomalies: 0,
    status: "success",
  };

  try {
    const remoteTxs = await fetchRemoteTransactions(
      admin,
      bankAccessId,
      product.bank_product_id,
      customerId
    );

    result.totalSeen = remoteTxs.length;
    const effectiveStart = getEffectiveStartDate(
      product.import_from_date,
      product.last_import_at
    );
    const seenFingerprints = new Set<string>();

    const importFileId = await createBanksapiImportFile(
      admin,
      userId,
      connectionId,
      product.id,
      product.account_name
    );

    await admin
      .from("bank_import_files")
      .update({ status: "processing" })
      .eq("id", importFileId);

    for (const rawTx of remoteTxs) {
      const parsed = parseRemoteTx(rawTx);

      if (!parsed.effectiveDate) {
        result.anomalies++;
        continue;
      }

      if (parsed.amount === null || isNaN(parsed.amount)) {
        result.anomalies++;
        continue;
      }

      if (parsed.effectiveDate < effectiveStart) {
        result.filteredByDate++;
        continue;
      }

      const reference =
        parsed.bankReference || parsed.endToEndId || parsed.remoteId || "";

      const fp = await computeFingerprint(
        userId,
        parsed.effectiveDate,
        parsed.amount,
        parsed.counterpartyIban || product.iban || undefined,
        parsed.usageText || undefined,
        reference || undefined,
        parsed.counterpartyName || undefined
      );

      if (seenFingerprints.has(fp)) {
        result.duplicates++;
        continue;
      }

      const { data: existing } = await admin
        .from("bank_transactions")
        .select("id")
        .eq("fingerprint", fp)
        .maybeSingle();

      if (existing) {
        result.duplicates++;
        seenFingerprints.add(fp);
        continue;
      }

      seenFingerprints.add(fp);

      const direction =
        parsed.amount >= 0 ? "credit" : ("debit" as "credit" | "debit");

      const { error: insertErr } = await admin
        .from("bank_transactions")
        .insert({
          user_id: userId,
          import_file_id: importFileId,
          transaction_date: parsed.effectiveDate,
          value_date: parsed.valueDate || null,
          amount: parsed.amount,
          currency: parsed.currency,
          direction,
          counterparty_name: parsed.counterpartyName || null,
          counterparty_iban: parsed.counterpartyIban || null,
          usage_text: parsed.usageText || null,
          end_to_end_id: parsed.endToEndId || null,
          mandate_id: parsed.mandateId || null,
          bank_reference: parsed.bankReference || null,
          fingerprint: fp,
          status: "UNMATCHED",
          description: parsed.usageText || parsed.counterpartyName || "",
          sender: parsed.counterpartyName || "",
          raw_data: {
            source: "banksapi",
            remote_id: parsed.remoteId,
            remote_hash: parsed.remoteHash,
            bank_access_id: bankAccessId,
            bank_product_id: product.bank_product_id,
            counterparty_bic: parsed.counterpartyBic,
            product_iban: product.iban,
            raw: rawTx,
          },
        });

      if (insertErr) {
        if (insertErr.code === "23505") {
          result.duplicates++;
        } else {
          console.error("Insert tx error:", insertErr.message);
          result.anomalies++;
        }
        continue;
      }

      result.imported++;
    }

    await admin
      .from("bank_import_files")
      .update({
        status: "completed",
        total_rows: result.totalSeen,
        imported_rows: result.imported,
        duplicate_rows: result.duplicates,
        processed_at: new Date().toISOString(),
        raw_meta: {
          filtered_by_date: result.filteredByDate,
          anomalies: result.anomalies,
          effective_start: effectiveStart,
          overlap_days: OVERLAP_DAYS,
        },
      })
      .eq("id", importFileId);

    await admin
      .from("banksapi_bank_products")
      .update({ last_import_at: new Date().toISOString() })
      .eq("id", product.id);
  } catch (err) {
    result.status = "failed";
    result.error = err instanceof Error ? err.message : String(err);
    console.error(
      `Import failed for product ${product.bank_product_id}:`,
      err
    );
  }

  return result;
}

async function createBanksapiImportFile(
  admin: Admin,
  userId: string,
  connectionId: string,
  productDbId: string,
  accountName: string
): Promise<string> {
  const { data, error } = await admin
    .from("bank_import_files")
    .insert({
      user_id: userId,
      filename: `BanksAPI: ${accountName || "Konto"}`,
      source_type: "banksapi",
      status: "pending",
      banksapi_connection_id: connectionId,
      banksapi_product_id: productDbId,
      trigger_type: "manual",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create import file: ${error.message}`);
  return data.id;
}

async function importTransactionsForConnection(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string,
  triggerType: "manual" | "cron" | "callback_initial_sync"
): Promise<ConnectionImportResult> {
  const result: ConnectionImportResult = {
    connectionId,
    bankAccessId,
    status: "success",
    products: [],
    totalSeen: 0,
    totalImported: 0,
    totalDuplicates: 0,
    totalFilteredByDate: 0,
  };

  const { data: logRow } = await admin
    .from("banksapi_import_logs")
    .insert({
      user_id: userId,
      connection_id: connectionId,
      bank_access_id: bankAccessId,
      trigger_type: triggerType,
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  const logId = logRow?.id;

  try {
    const { data: products } = await admin
      .from("banksapi_bank_products")
      .select(
        "id, bank_product_id, iban, account_name, import_from_date, last_import_at"
      )
      .eq("connection_id", connectionId)
      .eq("user_id", userId)
      .eq("selected_for_import", true)
      .not("import_from_date", "is", null);

    if (!products || products.length === 0) {
      result.status = "success";
      if (logId) {
        await admin
          .from("banksapi_import_logs")
          .update({
            finished_at: new Date().toISOString(),
            status: "success",
          })
          .eq("id", logId);
      }
      return result;
    }

    let anySuccess = false;
    let anyFailure = false;

    for (const product of products) {
      const productResult = await importTransactionsForProduct(
        admin,
        userId,
        connectionId,
        bankAccessId,
        product,
        customerId
      );

      result.products.push(productResult);
      result.totalSeen += productResult.totalSeen;
      result.totalImported += productResult.imported;
      result.totalDuplicates += productResult.duplicates;
      result.totalFilteredByDate += productResult.filteredByDate;

      if (productResult.status === "success") anySuccess = true;
      else anyFailure = true;
    }

    if (anySuccess && anyFailure) result.status = "partial";
    else if (!anySuccess && anyFailure) result.status = "failed";

    await admin
      .from("banksapi_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connectionId);

    if (logId) {
      await admin
        .from("banksapi_import_logs")
        .update({
          finished_at: new Date().toISOString(),
          status: result.status,
          total_remote_transactions_seen: result.totalSeen,
          total_new_transactions_imported: result.totalImported,
          total_duplicates_skipped: result.totalDuplicates,
          total_filtered_by_date: result.totalFilteredByDate,
        })
        .eq("id", logId);
    }
  } catch (err) {
    result.status = "failed";
    result.error = err instanceof Error ? err.message : String(err);
    if (logId) {
      await admin
        .from("banksapi_import_logs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error_message: result.error,
        })
        .eq("id", logId);
    }
  }

  return result;
}

// ─── User-facing: manual refresh + import ───────────────────────

async function handleRefreshAndImport(
  admin: Admin,
  userId: string,
  connectionId: string,
  body: { callbackUrl?: string; customerIpAddress?: string }
): Promise<Response> {
  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id, status")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn?.bank_access_id) {
    return errorResponse("Connection not found", 404);
  }

  await admin
    .from("banksapi_connections")
    .update({ status: "syncing" })
    .eq("id", connectionId);

  const callbackUrl =
    body.callbackUrl || "https://rentab.ly/banksapi/callback";
  const reqHeaders: Record<string, string> = {
    "X-Tenant-Id": conn.banksapi_customer_id,
  };
  if (body.customerIpAddress) {
    reqHeaders["Customer-IP-Address"] = body.customerIpAddress;
  }

  const refreshRes = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
    {
      method: "PUT",
      headers: reqHeaders,
      body: JSON.stringify({ sync: true, callbackUrl }),
    }
  );

  if (refreshRes.status === 451) {
    const location = refreshRes.headers.get("Location") || "";
    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("id", connectionId);

    await admin.from("banksapi_import_logs").insert({
      user_id: userId,
      connection_id: connectionId,
      bank_access_id: conn.bank_access_id,
      trigger_type: "manual",
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      status: "requires_sca",
      error_message: "SCA redirect required",
    });

    return jsonResponse({
      action: "redirect",
      redirectUrl: location,
      status: "requires_sca",
    });
  }

  if (!refreshRes.ok) {
    const errBody = await refreshRes.text();
    console.error("BanksAPI refresh error:", refreshRes.status, errBody);
    await admin
      .from("banksapi_connections")
      .update({
        status: "error",
        error_message: `Refresh failed: ${refreshRes.status}`,
      })
      .eq("id", connectionId);
    return errorResponse(`BanksAPI error: ${refreshRes.status}`, 502);
  }

  const refreshData = await refreshRes.json();
  await admin
    .from("banksapi_connections")
    .update({
      status: "connected",
      error_message: null,
      raw_response: refreshData,
    })
    .eq("id", connectionId);

  await syncBankProducts(
    admin,
    userId,
    connectionId,
    conn.bank_access_id,
    conn.banksapi_customer_id
  );

  const importResult = await importTransactionsForConnection(
    admin,
    userId,
    connectionId,
    conn.bank_access_id,
    conn.banksapi_customer_id,
    "manual"
  );

  return jsonResponse({
    status: "imported",
    import: importResult,
  });
}

// ─── Cron: sync all connections ─────────────────────────────────

async function handleCronSync(admin: Admin): Promise<Response> {
  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.banksapi_enabled) {
    return jsonResponse({
      status: "skipped",
      reason: "BanksAPI disabled",
    });
  }

  const { data: connections } = await admin
    .from("banksapi_connections")
    .select("id, user_id, bank_access_id, banksapi_customer_id, status")
    .in("status", ["connected", "syncing"])
    .not("bank_access_id", "is", null);

  if (!connections || connections.length === 0) {
    return jsonResponse({
      status: "success",
      message: "No active connections to sync",
      connections_processed: 0,
    });
  }

  const results: Array<{
    connectionId: string;
    userId: string;
    status: string;
    imported: number;
    error?: string;
  }> = [];

  for (const conn of connections) {
    try {
      const { data: selectedProducts } = await admin
        .from("banksapi_bank_products")
        .select("id")
        .eq("connection_id", conn.id)
        .eq("selected_for_import", true)
        .not("import_from_date", "is", null)
        .limit(1);

      if (!selectedProducts || selectedProducts.length === 0) {
        results.push({
          connectionId: conn.id,
          userId: conn.user_id,
          status: "skipped",
          imported: 0,
        });
        continue;
      }

      await admin
        .from("banksapi_connections")
        .update({ status: "syncing" })
        .eq("id", conn.id);

      let refreshOk = true;
      const refreshRes = await banksapiFetch(
        admin,
        `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
        {
          method: "PUT",
          headers: { "X-Tenant-Id": conn.banksapi_customer_id },
          body: JSON.stringify({ sync: true }),
        }
      );

      if (refreshRes.status === 451) {
        await admin
          .from("banksapi_connections")
          .update({ status: "requires_sca" })
          .eq("id", conn.id);

        await admin.from("banksapi_import_logs").insert({
          user_id: conn.user_id,
          connection_id: conn.id,
          bank_access_id: conn.bank_access_id,
          trigger_type: "cron",
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          status: "requires_sca",
          error_message: "SCA consent expired, user must re-authorize",
        });

        results.push({
          connectionId: conn.id,
          userId: conn.user_id,
          status: "requires_sca",
          imported: 0,
        });
        continue;
      }

      if (!refreshRes.ok) {
        console.error(
          `Cron refresh failed for conn ${conn.id}: ${refreshRes.status}`
        );
        refreshOk = false;
      }

      if (refreshOk) {
        await admin
          .from("banksapi_connections")
          .update({ status: "connected", error_message: null })
          .eq("id", conn.id);

        await syncBankProducts(
          admin,
          conn.user_id,
          conn.id,
          conn.bank_access_id,
          conn.banksapi_customer_id
        );
      }

      const importResult = await importTransactionsForConnection(
        admin,
        conn.user_id,
        conn.id,
        conn.bank_access_id,
        conn.banksapi_customer_id,
        "cron"
      );

      results.push({
        connectionId: conn.id,
        userId: conn.user_id,
        status: importResult.status,
        imported: importResult.totalImported,
        error: importResult.error,
      });
    } catch (err) {
      console.error(`Cron sync error for conn ${conn.id}:`, err);
      await admin
        .from("banksapi_connections")
        .update({
          status: "error",
          error_message:
            err instanceof Error ? err.message : "Sync failed",
        })
        .eq("id", conn.id);

      results.push({
        connectionId: conn.id,
        userId: conn.user_id,
        status: "failed",
        imported: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const totalImported = results.reduce((s, r) => s + r.imported, 0);
  return jsonResponse({
    status: "success",
    connections_processed: connections.length,
    total_imported: totalImported,
    results,
  });
}

// ─── Import logs ────────────────────────────────────────────────

async function handleGetImportLogs(
  admin: Admin,
  userId: string,
  connectionId?: string
): Promise<Response> {
  let query = admin
    .from("banksapi_import_logs")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(50);

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ logs: data || [] });
}

// ─── Router ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname
      .replace(/^\/banksapi-service\/?/, "")
      .split("/")
      .filter(Boolean);
    const action = pathParts[0] || "";

    const admin = getSupabaseAdmin();

    if (action === "complete-callback") {
      const internalKey = req.headers.get("X-Internal-Key") || "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (internalKey !== serviceKey) {
        return errorResponse("Forbidden", 403);
      }
      const body = await req.json();
      return handleCompleteCallback(admin, body);
    }

    if (action === "cron-sync") {
      const internalKey = req.headers.get("X-Internal-Key") || "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (internalKey !== serviceKey) {
        return errorResponse("Forbidden", 403);
      }
      return handleCronSync(admin);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return errorResponse("Missing Authorization header", 401);
    }

    const supabaseUser = getSupabaseUser(authHeader);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: settings } = await admin
      .from("system_settings")
      .select("banksapi_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (!settings?.banksapi_enabled) {
      return errorResponse("BanksAPI integration is not enabled", 403);
    }

    switch (action) {
      case "create-bank-access": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const body = await req.json();
        return handleCreateBankAccess(admin, user.id, body);
      }

      case "connections": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        return handleGetConnections(admin, user.id);
      }

      case "products": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        return handleGetProducts(admin, user.id, connId);
      }

      case "save-selection": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const body = await req.json();
        return handleSaveProductSelection(admin, user.id, body);
      }

      case "refresh": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const body = await req.json().catch(() => ({}));
        return handleRefreshBankAccess(admin, user.id, connId, body);
      }

      case "refresh-and-import": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const body = await req.json().catch(() => ({}));
        return handleRefreshAndImport(admin, user.id, connId, body);
      }

      case "import": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const { data: conn } = await admin
          .from("banksapi_connections")
          .select("bank_access_id, banksapi_customer_id, status")
          .eq("id", connId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!conn?.bank_access_id)
          return errorResponse("Connection not found", 404);
        if (conn.status !== "connected")
          return errorResponse(
            `Connection status is ${conn.status}, not connected`,
            409
          );

        const importResult = await importTransactionsForConnection(
          admin,
          user.id,
          connId,
          conn.bank_access_id,
          conn.banksapi_customer_id,
          "manual"
        );
        return jsonResponse({ status: "imported", import: importResult });
      }

      case "import-logs": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1] || undefined;
        return handleGetImportLogs(admin, user.id, connId);
      }

      case "disconnect": {
        if (req.method !== "POST" && req.method !== "DELETE")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        return handleDeleteConnection(admin, user.id, connId);
      }

      case "status": {
        return jsonResponse({ enabled: true, version: "2.0.0" });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 404);
    }
  } catch (err) {
    console.error("banksapi-service error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
