// Referral Tracking Module
// Attribution: first-touch (first valid ref wins, not overwritten by different codes)
// TTL: 30 days. Re-visiting with the SAME code refreshes TTL.
// Storage layers: Cookie (rt_ref) + localStorage + sessionStorage
// Metadata: code, setAt, landingPath, source, expiry
// Validation: alphanumeric 6-16 chars, case-insensitive, normalized to uppercase

const REF_COOKIE = 'rt_ref';
const REF_META_KEY = 'rt_ref_meta';
const LEGACY_COOKIE = 'rentably_affiliate_code';
const LEGACY_LS_KEY = 'rentably_affiliate_code';
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const EXCLUDED_PREFIXES = ['/admin', '/dashboard', '/logout', '/api'];

export interface RefMetadata {
  code: string;
  setAt: number;
  landingPath: string;
  source: 'query' | 'storage';
  expiry: number;
}

export function isValidRefCode(code: string): boolean {
  return /^[A-Z0-9]{6,16}$/i.test(code);
}

function setCookie(name: string, value: string, maxAgeMs: number): void {
  const expires = new Date(Date.now() + maxAgeMs).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1] || null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function setToStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch (_) { /* blocked */ }
  try { sessionStorage.setItem(key, value); } catch (_) { /* blocked */ }
}

function getFromStorage(key: string): string | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const val = store.getItem(key);
      if (val) return val;
    } catch (_) { /* blocked */ }
  }
  return null;
}

function clearFromStorage(key: string): void {
  try { localStorage.removeItem(key); } catch (_) { /* blocked */ }
  try { sessionStorage.removeItem(key); } catch (_) { /* blocked */ }
}

function persistRef(code: string, metadata: RefMetadata): void {
  setCookie(REF_COOKIE, code, REF_TTL_MS);
  setToStorage(REF_META_KEY, JSON.stringify(metadata));

  setCookie(LEGACY_COOKIE, code, REF_TTL_MS);
  setToStorage(LEGACY_LS_KEY, JSON.stringify({
    code,
    timestamp: metadata.setAt,
    expiry: metadata.expiry,
  }));
}

export function getReferralCode(): string | null {
  const primary = getCookie(REF_COOKIE);
  if (primary && isValidRefCode(primary)) return primary.toUpperCase();

  const legacy = getCookie(LEGACY_COOKIE);
  if (legacy && isValidRefCode(legacy)) return legacy.toUpperCase();

  const metaJson = getFromStorage(REF_META_KEY);
  if (metaJson) {
    try {
      const meta: RefMetadata = JSON.parse(metaJson);
      if (meta.expiry > Date.now() && isValidRefCode(meta.code)) return meta.code.toUpperCase();
    } catch (_) { /* corrupt */ }
  }

  const legacyJson = getFromStorage(LEGACY_LS_KEY);
  if (legacyJson) {
    try {
      const data = JSON.parse(legacyJson);
      if (data.expiry > Date.now() && isValidRefCode(data.code)) return data.code.toUpperCase();
    } catch (_) { /* corrupt */ }
  }

  return null;
}

export function getReferralMetadata(): RefMetadata | null {
  const json = getFromStorage(REF_META_KEY);
  if (!json) return null;
  try {
    const meta: RefMetadata = JSON.parse(json);
    if (meta.expiry > Date.now()) return meta;
  } catch (_) { /* corrupt */ }
  return null;
}

export function setReferralCode(code: string): void {
  if (!isValidRefCode(code)) return;
  const normalized = code.toUpperCase();
  const metadata: RefMetadata = {
    code: normalized,
    setAt: Date.now(),
    landingPath: window.location.pathname,
    source: 'storage',
    expiry: Date.now() + REF_TTL_MS,
  };
  persistRef(normalized, metadata);
}

export function clearReferralCode(): void {
  deleteCookie(REF_COOKIE);
  deleteCookie(LEGACY_COOKIE);
  clearFromStorage(REF_META_KEY);
  clearFromStorage(LEGACY_LS_KEY);
}

export function initReferralTracking(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const rawRef = urlParams.get('ref')?.trim().toUpperCase();

  if (!rawRef || !isValidRefCode(rawRef)) return;

  const existing = getReferralCode();

  if (existing && existing !== rawRef) return;

  const metadata: RefMetadata = {
    code: rawRef,
    setAt: Date.now(),
    landingPath: window.location.pathname,
    source: 'query',
    expiry: Date.now() + REF_TTL_MS,
  };
  persistRef(rawRef, metadata);
}

export function withRef(url: string, refCode?: string | null): string {
  const code = refCode ?? getReferralCode();
  if (!code) return url;

  if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return url;

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== window.location.hostname) return url;
    } catch (_) {
      return url;
    }
  }

  const pathPart = url.split('?')[0].split('#')[0];
  if (EXCLUDED_PREFIXES.some(prefix => pathPart.startsWith(prefix))) return url;

  if (url.includes('ref=')) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ref=${code}`;
}

export const setAffiliateCookie = setReferralCode;
export const getAffiliateCode = getReferralCode;
export const clearAffiliateCode = clearReferralCode;
export const initAffiliateTracking = initReferralTracking;
