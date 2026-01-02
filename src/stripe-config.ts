export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: "payment" | "subscription";
  price: number;
  currency: string;
  currencySymbol: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: "price_1SbIhEDT0DRNFiKmk9kwJUXT",
    name: "Rentab.ly Pro Membership",
    description: "Verwalte deine Mieter unkompliziert mit Rentab.ly!",
    mode: "subscription",
    price: 9.0,
    currency: "eur",
    currencySymbol: "€",
  },
];

export function getProductByPriceId(
  priceId: string,
): StripeProduct | undefined {
  return stripeProducts.find((product) => product.priceId === priceId);
}
