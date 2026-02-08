export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: "Vertrag",
  rental_agreement: "Mietvertrag",
  main_contract: "Hauptvertrag",
  amendment: "Nachtrag",
  addendum: "Zusatzvereinbarung",
  termination: "Kündigung",
  invoice: "Rechnung",
  bill: "Abrechnung",
  utility_bill: "Nebenkostenabrechnung",
  receipt: "Beleg",
  report: "Bericht",
  floor_plan: "Grundriss",
  blueprint: "Bauplan",
  expose: "Exposé",
  energy_certificate: "Energieausweis",
  insurance: "Versicherung",
  property_deed: "Grundbuchauszug",
  maintenance: "Wartung",
  photo: "Foto",
  protocol: "Protokoll",
  correspondence: "Korrespondenz",
  other: "Sonstiges",
};

export const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  contract: "bg-blue-100 text-blue-700",
  rental_agreement: "bg-amber-100 text-amber-700",
  main_contract: "bg-blue-100 text-blue-700",
  amendment: "bg-sky-100 text-sky-700",
  addendum: "bg-sky-100 text-sky-700",
  termination: "bg-red-100 text-red-700",
  invoice: "bg-emerald-100 text-emerald-700",
  bill: "bg-orange-100 text-orange-700",
  utility_bill: "bg-orange-100 text-orange-700",
  receipt: "bg-teal-100 text-teal-700",
  report: "bg-gray-100 text-gray-700",
  floor_plan: "bg-blue-100 text-blue-700",
  blueprint: "bg-blue-100 text-blue-700",
  expose: "bg-blue-100 text-blue-700",
  energy_certificate: "bg-emerald-100 text-emerald-700",
  insurance: "bg-cyan-100 text-cyan-700",
  property_deed: "bg-amber-100 text-amber-700",
  maintenance: "bg-slate-100 text-slate-700",
  photo: "bg-pink-100 text-pink-700",
  protocol: "bg-gray-100 text-gray-700",
  correspondence: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-700",
};

export interface DocumentTypeGroup {
  label: string;
  types: string[];
}

export const DOCUMENT_TYPE_GROUPS: DocumentTypeGroup[] = [
  {
    label: "Verträge & Urkunden",
    types: ["contract", "rental_agreement", "main_contract", "amendment", "addendum", "termination", "property_deed"],
  },
  {
    label: "Grundrisse & Pläne",
    types: ["floor_plan", "blueprint", "expose"],
  },
  {
    label: "Finanzen",
    types: ["invoice", "bill", "utility_bill", "receipt"],
  },
  {
    label: "Zertifikate & Versicherungen",
    types: ["energy_certificate", "insurance"],
  },
  {
    label: "Verwaltung",
    types: ["report", "maintenance", "protocol", "correspondence"],
  },
  {
    label: "Medien & Sonstiges",
    types: ["photo", "other"],
  },
];

export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] || type;
}

export function getDocumentTypeColor(type: string): string {
  return DOCUMENT_TYPE_COLORS[type] || "bg-gray-100 text-gray-700";
}
