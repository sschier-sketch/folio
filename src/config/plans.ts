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
    description: 'Perfekt für Einsteiger',
    stripePriceId: 'free',
    priceMonthly: 0,
    currency: 'eur',
    currencySymbol: '€',
    maxProperties: 3,
    features: [
      { text: 'Unbegrenzt Immobilien, Mieter & Einheiten', included: true },
      { text: 'Einnahmen & Ausgaben', included: true },
      { text: 'Zähler & Ablesungen', included: true },
      { text: 'Dokumenten-Upload', included: true },
      { text: 'Standard-Vorlagen', included: true },
      { text: 'E-Mail-Support', included: true },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal für professionelle Verwalter',
    stripePriceIdMonthly: 'price_1T1UDRDT0DRNFiKmpncgVabp',
    stripePriceIdYearly: 'price_1T1UEKDT0DRNFiKmBASqhNDI',
    priceMonthly: 12.90,
    priceYearly: 108.00,
    currency: 'eur',
    currencySymbol: '€',
    maxProperties: 20,
    popular: true,
    features: [
      { text: 'Unbegrenzt Immobilien, Mieter & Einheiten', included: true },
      { text: 'Alles aus Basic, plus:', included: true },
      { text: 'Ticketsystem & Nachrichten', included: true },
      { text: 'Mieterportal', included: true },
      { text: 'Betriebskostenabrechnung', included: true },
      { text: 'Mahnwesen & Indexmiete', included: true },
      { text: 'Cashflow & Finanzanalyse', included: true },
      { text: 'Dokumenten-Upload (erweitert)', included: true },
      { text: 'Alle Vorlagen inkl. Premium', included: true },
      { text: 'Prioritäts-Support (24h)', included: true },
    ],
  },
};

export interface ComparisonRow {
  feature: string;
  basic: string | boolean;
  pro: string | boolean;
  isNew?: boolean;
}

export interface ComparisonCategory {
  name: string;
  rows: ComparisonRow[];
}

export const COMPARISON_TABLE: ComparisonCategory[] = [
  {
    name: 'Immobilien',
    rows: [
      { feature: 'Unbegrenzt Immobilien & Einheiten', basic: true, pro: true },
      { feature: 'Stammdaten & Übersicht', basic: true, pro: true },
      { feature: 'Einheiten verwalten', basic: 'Basis', pro: 'Erweitert' },
      { feature: 'Kontaktverwaltung', basic: false, pro: true },
      { feature: 'Dokumente (Objekt-Ebene)', basic: false, pro: true },
      { feature: 'Instandhaltung', basic: false, pro: true },
      { feature: 'Kennzahlen & Analysen', basic: false, pro: true },
      { feature: 'Änderungshistorie', basic: false, pro: true },
    ],
  },
  {
    name: 'Mieter',
    rows: [
      { feature: 'Unbegrenzt Mieter', basic: true, pro: true },
      { feature: 'Mieterübersicht & Stammdaten', basic: true, pro: true },
      { feature: 'Mieteingänge verfolgen', basic: true, pro: true },
      { feature: 'Vertrag & Dokumente (Details)', basic: false, pro: true },
      { feature: 'Kautionsverwaltung', basic: false, pro: true },
      { feature: 'Übergabeprotokolle', basic: false, pro: true },
      { feature: 'Kommunikationshistorie', basic: false, pro: true },
      { feature: 'Mietentwicklungs-Timeline', basic: false, pro: true },
    ],
  },
  {
    name: 'Finanzen',
    rows: [
      { feature: 'Einnahmen & Ausgaben', basic: true, pro: true },
      { feature: 'Cashflow-Übersicht', basic: false, pro: true },
      { feature: 'Anlage V', basic: false, pro: true, isNew: true },
      { feature: 'Restschuldberechnung', basic: false, pro: true, isNew: true },
      { feature: 'Indexmiete', basic: false, pro: true },
      { feature: 'Finanzanalyse & Prognosen', basic: false, pro: true },
      { feature: 'Mahnwesen (Erinnerungen, Vorlagen, Historie)', basic: false, pro: true },
    ],
  },
  {
    name: 'Abrechnung',
    rows: [
      { feature: 'Zähler & Ablesungen', basic: true, pro: true },
      { feature: 'Betriebskostenabrechnung', basic: false, pro: true },
      { feature: 'PDF-Export & Dokumenten-Export', basic: false, pro: true },
      { feature: 'Abrechnungshistorie & Plausibilitätschecks', basic: false, pro: true },
    ],
  },
  {
    name: 'Dokumente',
    rows: [
      { feature: 'Speicherplatz', basic: '200 MB', pro: '2 GB' },
      { feature: 'Dateien pro Upload', basic: '1', pro: 'Bis zu 10' },
      { feature: 'Suche', basic: 'Dateiname', pro: 'Erweitert' },
      { feature: 'Erweiterte Filter (Objekt, Zeitraum)', basic: false, pro: true },
      { feature: 'Datum & Zuordnung beim Upload', basic: false, pro: true },
      { feature: 'Dokumenten-Archiv', basic: false, pro: true },
      { feature: 'Versionshistorie', basic: false, pro: true },
      { feature: 'Teilen über Mieterportal', basic: false, pro: true },
    ],
  },
  {
    name: 'Kommunikation',
    rows: [
      { feature: 'Ticketsystem', basic: false, pro: true },
      { feature: 'Nachrichten & E-Mail (@rentab.ly)', basic: false, pro: true },
      { feature: 'Mieterportal', basic: false, pro: true },
    ],
  },
  {
    name: 'Vorlagen & Support',
    rows: [
      { feature: 'Standard-Vorlagen', basic: true, pro: true },
      { feature: 'Premium-Vorlagen', basic: false, pro: true },
      { feature: 'Dokument-Assistent', basic: false, pro: true, isNew: true },
      { feature: 'Support', basic: 'E-Mail', pro: 'Priorität (24h)' },
    ],
  },
];

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
