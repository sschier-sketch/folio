/*
 * Robust Referral Click Tracking with ref_sid support
 *
 * Integrates with:
 * - referralTracking.ts: For ref_code management
 * - referralSession.ts: For ref_sid management
 * - track-referral-click edge function: Server-side tracking with cookie setting
 */

import { getRefSid, setRefSid } from './referralSession';

function getUTMParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
} {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    utmContent: params.get('utm_content') || undefined,
  };
}

export async function trackReferralClick(referralCode: string): Promise<void> {
  if (!referralCode) return;

  const hasTracked = sessionStorage.getItem(`tracked_ref_${referralCode}`);
  if (hasTracked) {
    return;
  }

  const existingRefSid = getRefSid();
  const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = getUTMParams();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-referral-click`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          referralCode,
          refSid: existingRefSid || undefined,
          landingPath: window.location.pathname,
          referrerUrl: document.referrer || undefined,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          fullQueryString: window.location.search,
          userAgent: navigator.userAgent,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.refSid) {
        setRefSid(data.refSid, referralCode);
      }
      sessionStorage.setItem(`tracked_ref_${referralCode}`, 'true');
    }
  } catch (error) {
    console.error('Error tracking referral click:', error);
  }
}

export function getReferralCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  return ref ? ref.toUpperCase() : null;
}
