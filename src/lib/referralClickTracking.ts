function getSessionId(): string {
  let sessionId = sessionStorage.getItem('referral_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('referral_session_id', sessionId);
  }

  return sessionId;
}

function getUTMParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

export async function trackReferralClick(referralCode: string): Promise<void> {
  if (!referralCode) return;

  const hasTracked = sessionStorage.getItem(`tracked_ref_${referralCode}`);
  if (hasTracked) {
    return;
  }

  const sessionId = getSessionId();
  const { utmSource, utmMedium, utmCampaign } = getUTMParams();

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-referral-click`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode,
          sessionId,
          landingPath: window.location.pathname,
          referrerUrl: document.referrer || undefined,
          utmSource,
          utmMedium,
          utmCampaign,
          userAgent: navigator.userAgent,
        }),
      }
    );

    if (response.ok) {
      sessionStorage.setItem(`tracked_ref_${referralCode}`, 'true');
    }
  } catch (error) {
    console.error('Error tracking referral click:', error);
  }
}

export function getReferralCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}
