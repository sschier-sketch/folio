const AFFILIATE_CODE_KEY = 'rentably_affiliate_code';
const AFFILIATE_CODE_EXPIRY = 30 * 24 * 60 * 60 * 1000;

export function setAffiliateCookie(code: string): void {
  const expiryDate = new Date(Date.now() + AFFILIATE_CODE_EXPIRY);
  document.cookie = `${AFFILIATE_CODE_KEY}=${code}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

  try {
    const trackingData = {
      code,
      timestamp: Date.now(),
      expiry: expiryDate.getTime()
    };
    localStorage.setItem(AFFILIATE_CODE_KEY, JSON.stringify(trackingData));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function getAffiliateCode(): string | null {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${AFFILIATE_CODE_KEY}=`))
    ?.split('=')[1];

  if (cookieValue) {
    return cookieValue;
  }

  try {
    const stored = localStorage.getItem(AFFILIATE_CODE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.expiry > Date.now()) {
        return data.code;
      } else {
        localStorage.removeItem(AFFILIATE_CODE_KEY);
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage:', e);
  }

  return null;
}

export function clearAffiliateCode(): void {
  document.cookie = `${AFFILIATE_CODE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  try {
    localStorage.removeItem(AFFILIATE_CODE_KEY);
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }
}

export function initAffiliateTracking(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  if (refCode) {
    const existingCode = getAffiliateCode();
    if (!existingCode) {
      setAffiliateCookie(refCode.trim().toUpperCase());
    }
  }
}
