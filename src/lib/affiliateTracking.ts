const AFFILIATE_CODE_KEY = 'rentably_affiliate_code';
const AFFILIATE_CODE_EXPIRY = 30 * 24 * 60 * 60 * 1000;

function saveToAllStorages(code: string, expiryDate: Date): void {
  document.cookie = `${AFFILIATE_CODE_KEY}=${code}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

  const trackingData = {
    code,
    timestamp: Date.now(),
    expiry: expiryDate.getTime()
  };
  const json = JSON.stringify(trackingData);

  try {
    localStorage.setItem(AFFILIATE_CODE_KEY, json);
  } catch (_) {}

  try {
    sessionStorage.setItem(AFFILIATE_CODE_KEY, json);
  } catch (_) {}
}

export function setAffiliateCookie(code: string): void {
  const expiryDate = new Date(Date.now() + AFFILIATE_CODE_EXPIRY);
  saveToAllStorages(code, expiryDate);
}

export function getAffiliateCode(): string | null {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${AFFILIATE_CODE_KEY}=`))
    ?.split('=')[1];

  if (cookieValue) {
    return cookieValue;
  }

  for (const storage of [localStorage, sessionStorage]) {
    try {
      const stored = storage.getItem(AFFILIATE_CODE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.expiry > Date.now()) {
          return data.code;
        } else {
          storage.removeItem(AFFILIATE_CODE_KEY);
        }
      }
    } catch (_) {}
  }

  return null;
}

export function clearAffiliateCode(): void {
  document.cookie = `${AFFILIATE_CODE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  try { localStorage.removeItem(AFFILIATE_CODE_KEY); } catch (_) {}
  try { sessionStorage.removeItem(AFFILIATE_CODE_KEY); } catch (_) {}
}

export function initAffiliateTracking(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  if (refCode) {
    setAffiliateCookie(refCode.trim().toUpperCase());
  }
}
