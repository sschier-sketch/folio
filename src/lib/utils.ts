export function parseNumberInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

export function formatNumberInput(value: number | string): string {
  return String(value);
}
