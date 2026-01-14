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
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: "price_1SmAu0DT0DRNFiKmj97bxor8",
    name: "Rentably Pro - Monatlich",
    description: "Verwalte deine Mieter unkompliziert mit Rentably!",
    mode: "subscription",
    price: 12.90,
    currency: "eur",
    currencySymbol: "€",
    interval: "month",
  },
  {
    priceId: "price_1SmAszDT0DRNFiKmQ7qG1L8V",
    name: "Rentably Pro - Jährlich",
    description: "Verwalte deine Mieter unkompliziert mit Rentably! Spare 16% mit der jährlichen Zahlung.",
    mode: "subscription",
    price: 108.0,
    currency: "eur",
    currencySymbol: "€",
    interval: "year",
  },
];

export function getProductByPriceId(
  priceId: string,
): StripeProduct | undefined {
  return stripeProducts.find((product) => product.priceId === priceId);
}
