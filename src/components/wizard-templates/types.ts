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
  { key: 'vermieter', label: 'Vermieter' },
  { key: 'mieter', label: 'Mieter' },
  { key: 'ansprache', label: 'Ansprache' },
  { key: 'sachverhalt', label: 'Sachverhalt' },
  { key: 'ergebnis', label: 'Ergebnis' },
  { key: 'versand', label: 'Digital versenden' },
];

export interface ZahlungserinnerungSachverhalt {
  zahlungErwartetBis: string;
  offenerBetrag: string;
  zahlungsfrist: string;
}

export interface ZahlungserinnerungWizardData {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: ZahlungserinnerungSachverhalt;
}

export type ZahlungserinnerungStep =
  | 'vermieter'
  | 'mieter'
  | 'ansprache'
  | 'sachverhalt'
  | 'ergebnis'
  | 'versand';

export const ZAHLUNGSERINNERUNG_STEPS: { key: ZahlungserinnerungStep; label: string }[] = [
  { key: 'vermieter', label: 'Vermieter' },
  { key: 'mieter', label: 'Mieter' },
  { key: 'ansprache', label: 'Ansprache' },
  { key: 'sachverhalt', label: 'Sachverhalt' },
  { key: 'ergebnis', label: 'Ergebnis' },
  { key: 'versand', label: 'Digital versenden' },
];

export interface StoerungsEreignis {
  id: string;
  datum: string;
  uhrzeit: string;
  kategorie: string;
  beschreibung: string;
}

export interface AbmahnungRuhestoerungSachverhalt {
  nachbarName: string;
  datumEreignis: string;
  anzahlEreignisse: number;
  ereignisse: StoerungsEreignis[];
}

export interface AbmahnungRuhestoerungWizardData {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: AbmahnungRuhestoerungSachverhalt;
}

export type AbmahnungRuhestoerungStep =
  | 'vermieter'
  | 'mieter'
  | 'ansprache'
  | 'sachverhalt'
  | 'ergebnis'
  | 'versand';

export const ABMAHNUNG_RUHESTOERUNG_STEPS: { key: AbmahnungRuhestoerungStep; label: string }[] = [
  { key: 'vermieter', label: 'Vermieter' },
  { key: 'mieter', label: 'Mieter' },
  { key: 'ansprache', label: 'Ansprache' },
  { key: 'sachverhalt', label: 'Sachverhalt' },
  { key: 'ergebnis', label: 'Ergebnis' },
  { key: 'versand', label: 'Digital versenden' },
];

export interface AbmahnungBaulicheSachverhalt {
  beschreibung: string;
  reparaturFrist: string;
}

export interface AbmahnungBaulicheWizardData {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: AbmahnungBaulicheSachverhalt;
}

export type AbmahnungBaulicheStep =
  | 'vermieter'
  | 'mieter'
  | 'ansprache'
  | 'sachverhalt'
  | 'ergebnis'
  | 'versand';

export const ABMAHNUNG_BAULICHE_STEPS: { key: AbmahnungBaulicheStep; label: string }[] = [
  { key: 'vermieter', label: 'Vermieter' },
  { key: 'mieter', label: 'Mieter' },
  { key: 'ansprache', label: 'Ansprache' },
  { key: 'sachverhalt', label: 'Sachverhalt' },
  { key: 'ergebnis', label: 'Ergebnis' },
  { key: 'versand', label: 'Digital versenden' },
];

export interface BetriebskostenSachverhalt {
  modus: 'erhoehen' | 'senken';
  jahr: string;
  vorauszahlungProMonat: string;
  bezahlteMonate: string;
  abrechnungVon: string;
  abrechnungBis: string;
  nachzahlungsanspruch: string;
  ueberweisungenAb: string;
  monatlicheAnpassung: string;
  gesamtsumme: string;
}

export interface BetriebskostenWizardData {
  landlord: LandlordData;
  tenants: TenantEntry[];
  greeting: GreetingData;
  sachverhalt: BetriebskostenSachverhalt;
}

export type BetriebskostenStep =
  | 'vermieter'
  | 'mieter'
  | 'ansprache'
  | 'sachverhalt'
  | 'ergebnis'
  | 'versand';

export const BETRIEBSKOSTEN_STEPS: { key: BetriebskostenStep; label: string }[] = [
  { key: 'vermieter', label: 'Vermieter' },
  { key: 'mieter', label: 'Mieter' },
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
  { id: 'begehungsankuendigung', label: 'Begehungsankündigung' },
  { id: 'kuendigung', label: 'Kündigung' },
  { id: 'abmahnungen', label: 'Abmahnungen' },
  { id: 'mietvertrag', label: 'Mietvertrag' },
  { id: 'sonstiges', label: 'Sonstiges' },
];
