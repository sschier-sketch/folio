export const CATEGORIES = [
  "alle",
  "finanzen",
  "immobilien",
  "mietrecht",
  "nebenkosten",
  "steuern",
  "allgemein",
  "news",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  alle: "Alle Beiträge",
  finanzen: "Finanzen",
  immobilien: "Immobilien",
  mietrecht: "Mietrecht",
  nebenkosten: "Nebenkosten",
  steuern: "Steuern",
  allgemein: "Allgemein",
  news: "News",
};
