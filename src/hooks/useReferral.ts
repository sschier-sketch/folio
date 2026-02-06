import { useState } from 'react';
import { getReferralCode, getReferralMetadata, withRef as withRefFn, type RefMetadata } from '../lib/referralTracking';

export function useReferral() {
  const [refCode] = useState<string | null>(() => getReferralCode());

  return {
    refCode,
    hasRef: !!refCode,
    metadata: getReferralMetadata() as RefMetadata | null,
    withRef: (url: string) => withRefFn(url, refCode),
  };
}
