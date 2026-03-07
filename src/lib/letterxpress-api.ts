import { supabase } from "./supabase";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/letterxpress-api`;

export interface LxConfig {
  id: string;
  user_id: string;
  username: string;
  has_api_key: boolean;
  is_enabled: boolean;
  is_test_mode: boolean;
  last_connection_test_at: string | null;
  last_connection_test_status: string | null;
  last_connection_test_message: string | null;
  last_balance: number | null;
  last_balance_currency: string | null;
  last_balance_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LxBalance {
  balance: number;
  currency: string;
}

export interface LxTestResult {
  success: boolean;
  message: string;
  balance: LxBalance | null;
}

export interface LxPriceSpecification {
  pages: number;
  color?: "1" | "4";
  mode?: "simplex" | "duplex";
  shipping?: "national" | "international" | "auto";
  c4?: 0 | 1;
}

export interface LxJobItem {
  address: string;
  pages: number;
  amount: number;
  vat: number;
  status: string;
}

export interface LxJob {
  id: number;
  shipping: string;
  mode: string;
  color: string;
  c4: number;
  registered: string | null;
  bank_form: number;
  notice: string | null;
  status: string;
  dispatch_date: string | null;
  filename_original: string | null;
  created_at: string;
  updated_at: string;
  items: LxJobItem[];
}

export interface LxPagination {
  total: number;
  count: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export type LxJobFilter = "queue" | "hold" | "done" | "canceled" | "draft";

export interface LxCreateJobPayload {
  base64_file: string;
  base64_file_checksum: string;
  filename_original?: string;
  registered?: "r1" | "r2";
  dispatch_date?: string;
  notice?: string;
  specification?: {
    color?: "1" | "4";
    mode?: "simplex" | "duplex";
    shipping?: "national" | "international" | "auto";
    c4?: 0 | 1;
  };
}

export interface LxUpdateJobPayload {
  job_id: number;
  specification?: Partial<LxCreateJobPayload["specification"]>;
  registered?: "r1" | "r2" | null;
  dispatch_date?: string;
  notice?: string;
}

export interface LxSyncResult {
  synced: number;
  errors: number;
  total: number;
  pagination: LxPagination | null;
}

export class LetterXpressApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "LetterXpressApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new LetterXpressApiError("Not authenticated", "AUTH_ERROR", 401);
  }

  return session.access_token;
}

async function callAction<T = unknown>(
  action: string,
  options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  }
): Promise<T> {
  const token = await getAccessToken();
  const method = options?.method || "POST";

  let url = `${FUNCTION_BASE}/${action}`;
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (options?.body && (method === "POST" || method === "PUT")) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new LetterXpressApiError(
      "Invalid response from server",
      "PARSE_ERROR",
      response.status
    );
  }

  if (!response.ok) {
    throw new LetterXpressApiError(
      data?.error || "Request failed",
      data?.code || "UNKNOWN_ERROR",
      response.status,
      data?.details
    );
  }

  return data as T;
}

// ============================================================
// PUBLIC API - PostalMailService
// ============================================================

export async function getLetterXpressConfig(): Promise<LxConfig | null> {
  const result = await callAction<{ config: LxConfig | null }>("get-config");
  return result.config;
}

export async function saveLetterXpressConfig(payload: {
  username: string;
  api_key?: string;
  is_enabled?: boolean;
}): Promise<LxConfig> {
  const result = await callAction<{ config: LxConfig }>("save-config", {
    body: payload,
  });
  return result.config;
}

export async function testLetterXpressConnection(): Promise<LxTestResult> {
  return callAction<LxTestResult>("test-connection");
}

export async function getLetterXpressBalance(): Promise<LxBalance> {
  return callAction<LxBalance>("balance");
}

export async function getLetterXpressPriceQuote(
  specification: LxPriceSpecification,
  registered?: "r1" | "r2"
): Promise<{ price: unknown }> {
  return callAction<{ price: unknown }>("price", {
    body: { specification, registered },
  });
}

export async function listLetterXpressJobs(
  filter?: LxJobFilter
): Promise<{ printjobs: LxJob[]; pagination: LxPagination | null }> {
  return callAction("list-jobs", {
    ...(filter ? { params: { filter } } : {}),
  });
}

export async function syncLetterXpressJobs(
  filter?: LxJobFilter
): Promise<LxSyncResult> {
  return callAction<LxSyncResult>("sync-jobs", {
    body: filter ? { filter } : {},
  });
}

export async function createLetterXpressJob(
  payload: LxCreateJobPayload
): Promise<{ success: boolean; job: LxJob }> {
  return callAction("create-job", { body: payload });
}

export async function updateLetterXpressJob(
  payload: LxUpdateJobPayload
): Promise<{ success: boolean; job: LxJob }> {
  return callAction("update-job", { body: payload });
}

export async function cancelLetterXpressJob(
  jobId: number
): Promise<{ success: boolean; message: string }> {
  return callAction("cancel-job", { body: { job_id: jobId } });
}

// ============================================================
// UTILITY: PDF preparation helpers
// ============================================================

export async function preparePdfForDispatch(
  pdfBytes: Uint8Array | ArrayBuffer
): Promise<{ base64_file: string; base64_file_checksum: string }> {
  const bytes =
    pdfBytes instanceof ArrayBuffer ? new Uint8Array(pdfBytes) : pdfBytes;

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64_file = btoa(binary);

  const hashBuffer = await crypto.subtle.digest("MD5", bytes).catch(() => null);

  let base64_file_checksum: string;
  if (hashBuffer) {
    const hashArray = new Uint8Array(hashBuffer);
    base64_file_checksum = Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    base64_file_checksum = await computeMd5Fallback(bytes);
  }

  return { base64_file, base64_file_checksum };
}

async function computeMd5Fallback(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 32);
}
