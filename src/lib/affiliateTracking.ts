export {
  initReferralTracking as initAffiliateTracking,
  getReferralCode as getAffiliateCode,
  setReferralCode as setAffiliateCookie,
  clearReferralCode as clearAffiliateCode,
  getReferralCode,
  getReferralMetadata,
  setReferralCode,
  clearReferralCode,
  initReferralTracking,
  withRef,
  isValidRefCode,
} from './referralTracking';

export type { RefMetadata } from './referralTracking';
