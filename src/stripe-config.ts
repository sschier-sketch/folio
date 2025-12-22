export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  currencySymbol: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SbIhEDT0DRNFiKmk9kwJUXT',
    name: 'Folio Pro Membership',
    description: 'Verwalte deine Mieter unkompliziert mit Folio!',
    mode: 'subscription',
    price: 9.00,
    currency: 'eur',
    currencySymbol: '€'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}