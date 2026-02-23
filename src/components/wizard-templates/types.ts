export interface LandlordData {
  name: string;
  street: string;
  number: string;
  zip: string;
  city: string;
  prefix: string;
  country: string;
}

export interface TenantEntry {
  tenantId?: string;
  propertyId?: string;
  unitId?: string;
  firstName: string;
  lastName: string;
  street: string;
  number: string;
  zip: string;
  city: string;
  prefix: string;
  country: string;
  propertyName?: string;
  unitNumber?: string;
}

export interface GreetingData {
  hasPersonalGreeting: boolean;
  greetingText: string;
}

export interface AppointmentSlot {
  id: string;
  date: string;
  timeFrom: string;
  timeTo: string;
}

export interface KuendigungSachverhalt {
  versanddatum: string;
  eingangsdatum: string;
  kuendigungsdatum: string;
  schreibenVom: string;
  appointments: AppointmentSlot[];
}

export interface KuendigungWizardData {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: KuendigungSachverhalt;
}

export type KuendigungStep =
  | 'vermieter'
  | 'mieter'
  | 'ansprache'
  | 'sachverhalt'
  | 'ergebnis'
  | 'versand';

export const KUENDIGUNG_STEPS: { key: KuendigungStep; label: string }[] = [
  { key: 'vermieter', label: 'Vermieter:in' },
  { key: 'mieter', label: 'Mieter:innen' },
  { key: 'ansprache', label: 'Ansprache' },
  { key: 'sachverhalt', label: 'Sachverhalt' },
  { key: 'ergebnis', label: 'Ergebnis' },
  { key: 'versand', label: 'Digital versenden' },
];

export interface WizardTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
}

export const WIZARD_CATEGORIES: { id: string; label: string }[] = [
  { id: 'kuendigung', label: 'Kündigung' },
  { id: 'begehungsankuendigung', label: 'Begehungsankündigung' },
  { id: 'mieterhoehung', label: 'Mieterhöhung' },
  { id: 'sonstiges', label: 'Sonstiges' },
];
