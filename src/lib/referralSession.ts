/*
 * Referral Session Management (ref_sid)
 *
 * Integrates with existing referralTracking.ts to provide robust session tracking.
 *
 * Storage Strategy:
 * - Primary: Server-side cookie (ref_sid) set by edge functions
 * - Backup: localStorage for when cookies are disabled/cleared
 * - TTL: 30 days
 *
 * Integration Notes:
 * - Uses existing referralTracking.ts for ref_code management
 * - ref_sid is additional layer for server-side session correlation
 * - Both systems work together: ref_code (client) + ref_sid (server session)
 */

const REF_SID_KEY = 'ref_sid';
const REF_SESSION_META_KEY = 'ref_session_meta';

interface RefSessionMetadata {
  refSid: string;
  refCode: string;
  createdAt: number;
  expiresAt: number;
}

function getCookie(name: string): string | null {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1] || null;
}

function setToStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    // Storage blocked or quota exceeded
  }
  try {
    sessionStorage.setItem(key, value);
  } catch (_) {
    // Storage blocked
  }
}

function getFromStorage(key: string): string | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const val = store.getItem(key);
      if (val) return val;
    } catch (_) {
      // Storage blocked
    }
  }
  return null;
}

export function getRefSid(): string | null {
  // Priority 1: Cookie (set by server)
  const cookieRefSid = getCookie(REF_SID_KEY);
  if (cookieRefSid) return cookieRefSid;

  // Priority 2: localStorage backup
  const storedMeta = getFromStorage(REF_SESSION_META_KEY);
  if (storedMeta) {
    try {
      const meta: RefSessionMetadata = JSON.parse(storedMeta);
      if (meta.expiresAt > Date.now()) {
        return meta.refSid;
      }
    } catch (_) {
      // Corrupt data
    }
  }

  return null;
}

export function setRefSid(refSid: string, refCode: string): void {
  const metadata: RefSessionMetadata = {
    refSid,
    refCode,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  setToStorage(REF_SESSION_META_KEY, JSON.stringify(metadata));
}

export function getRefSessionMetadata(): RefSessionMetadata | null {
  const stored = getFromStorage(REF_SESSION_META_KEY);
  if (!stored) return null;

  try {
    const meta: RefSessionMetadata = JSON.parse(stored);
    if (meta.expiresAt > Date.now()) {
      return meta;
    }
  } catch (_) {
    // Corrupt data
  }

  return null;
}

export function clearRefSession(): void {
  try {
    localStorage.removeItem(REF_SID_KEY);
    localStorage.removeItem(REF_SESSION_META_KEY);
  } catch (_) {
    // Storage blocked
  }
  try {
    sessionStorage.removeItem(REF_SID_KEY);
    sessionStorage.removeItem(REF_SESSION_META_KEY);
  } catch (_) {
    // Storage blocked
  }
}
