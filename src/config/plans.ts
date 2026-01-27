export type PlanId = 'basic' | 'pro';
export type BillingInterval = 'month' | 'year';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  stripePriceId?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  currencySymbol: string;
  features: PlanFeature[];
  popular?: boolean;
  maxProperties: number;
}

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Perfekt für Einsteiger mit 1-3 Immobilien',
    stripePriceId: 'free',
    priceMonthly: 0,
    currency: 'eur',
    currencySymbol: '€',
    maxProperties: 3,
    features: [
      { text: 'Bis zu 3 Immobilien', included: true },
      { text: 'Unbegrenzt Mieter', included: true },
      { text: 'Basic Finanzübersicht', included: true },
      { text: 'Ticketsystem', included: true },
      { text: 'Mieterportal', included: true },
      { text: 'E-Mail Support', included: true },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Rentably Pro',
    description: 'Ideal für professionelle Verwalter',
    stripePriceIdMonthly: 'price_1SmAu0DT0DRNFiKmj97bxor8',
    stripePriceIdYearly: 'price_1SmAszDT0DRNFiKmQ7qG1L8V',
    priceMonthly: 12.90,
    priceYearly: 108.00,
    currency: 'eur',
    currencySymbol: '€',
    maxProperties: 20,
    popular: true,
    features: [
      { text: 'Bis zu 20 Immobilien', included: true },
      { text: 'Unbegrenzt Mieter', included: true },
      { text: 'Erweiterte Finanzanalysen', included: true },
      { text: 'Prioritäts-Ticketsystem', included: true },
      { text: 'Premium Mieterportal', included: true },
      { text: 'Prioritäts-Support (24h)', included: true },
      { text: 'Detaillierte Reports & Statistiken', included: true },
      { text: 'Automatische Erinnerungen', included: true },
      { text: 'Export-Funktionen', included: true },
    ],
  },
};

export function getPlanById(id: PlanId): Plan {
  return PLANS[id];
}

export function getStripePriceId(planId: PlanId, interval: BillingInterval): string | undefined {
  const plan = PLANS[planId];
  if (planId === 'basic') {
    return plan.stripePriceId;
  }
  return interval === 'month' ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;
}

export function getPlanByStripePriceId(priceId: string): { planId: PlanId; interval: BillingInterval } | null {
  if (priceId === 'free') {
    return { planId: 'basic', interval: 'month' };
  }
  if (priceId === PLANS.pro.stripePriceIdMonthly) {
    return { planId: 'pro', interval: 'month' };
  }
  if (priceId === PLANS.pro.stripePriceIdYearly) {
    return { planId: 'pro', interval: 'year' };
  }
  return null;
}

export function calculateYearlySavings(): number {
  const monthlyTotal = PLANS.pro.priceMonthly * 12;
  const yearlyPrice = PLANS.pro.priceYearly || 0;
  return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
}
