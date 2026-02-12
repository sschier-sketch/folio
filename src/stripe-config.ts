export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: "payment" | "subscription";
  price: number;
  currency: string;
  currencySymbol: string;
  interval: "month" | "year";
  intervalCount?: number;
  features?: string[];
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: "free",
    name: "Basic",
    description: "Perfekt für Einsteiger mit 1-3 Immobilien",
    mode: "subscription",
    price: 0,
    currency: "eur",
    currencySymbol: "€",
    interval: "month",
    features: [
      "Bis zu 3 Immobilien",
      "Unbegrenzt Mieter",
      "Basic Finanzübersicht",
      "Ticketsystem",
      "Mieterportal",
      "E-Mail Support",
    ],
  },
  {
    priceId: "price_1SmAu0DT0DRNFiKmj97bxor8",
    name: "Pro - Monatlich",
    description: "Ideal für professionelle Verwalter",
    mode: "subscription",
    price: 12.90,
    currency: "eur",
    currencySymbol: "€",
    interval: "month",
    features: [
      "Bis zu 20 Immobilien",
      "Unbegrenzt Mieter",
      "Erweiterte Finanzanalysen",
      "Prioritäts-Ticketsystem",
      "Premium Mieterportal",
      "Prioritäts-Support (24h)",
      "Detaillierte Reports & Statistiken",
      "Automatische Erinnerungen",
      "Export-Funktionen",
    ],
  },
  {
    priceId: "price_1SmAszDT0DRNFiKmQ7qG1L8V",
    name: "Pro - Jährlich",
    description: "Ideal für professionelle Verwalter. Spare 30% mit der jährlichen Zahlung.",
    mode: "subscription",
    price: 108.0,
    currency: "eur",
    currencySymbol: "€",
    interval: "year",
    features: [
      "Bis zu 20 Immobilien",
      "Unbegrenzt Mieter",
      "Erweiterte Finanzanalysen",
      "Prioritäts-Ticketsystem",
      "Premium Mieterportal",
      "Prioritäts-Support (24h)",
      "Detaillierte Reports & Statistiken",
      "Automatische Erinnerungen",
      "Export-Funktionen",
    ],
  },
];

export function getProductByPriceId(
  priceId: string,
): StripeProduct | undefined {
  return stripeProducts.find((product) => product.priceId === priceId);
}
