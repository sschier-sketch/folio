/**
 * Bundesbank CSV Parser
 *
 * Parses CSV downloads from the Deutsche Bundesbank SDMX REST API.
 * Format: semicolon-separated, metadata lines at top, data rows as "YYYY-MM;value;[annotation]"
 *
 * URLs used (flowRef=BBIM1, Housing loans to households, new business, effective interest rate):
 *   1) Variabel / bis 1 Jahr:  M.DE.B.A2C.F.R.A.2250.EUR.N
 *   2) > 1 bis 5 Jahre:        M.DE.B.A2C.I.R.A.2250.EUR.N
 *   3) > 5 bis 10 Jahre:       M.DE.B.A2C.O.R.A.2250.EUR.N
 *   4) > 10 Jahre:             M.DE.B.A2C.P.R.A.2250.EUR.N
 *
 * raw_hash: SHA-256 of stableStringify(seriesPayload) where keys are sorted alphabetically.
 */

export interface DataPoint {
  date: string;
  value: number;
}

export function parseBundesbankCsv(csvText: string): DataPoint[] {
  const points: DataPoint[] = [];
  const lines = csvText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split(";");
    if (parts.length < 2) continue;

    const datePart = parts[0].trim().replace(/^"/, "").replace(/"$/, "");
    const valuePart = parts[1].trim().replace(/^"/, "").replace(/"$/, "");

    if (!/^\d{4}-\d{2}$/.test(datePart)) continue;

    const numericStr = valuePart.replace(",", ".");
    const value = parseFloat(numericStr);
    if (isNaN(value)) continue;

    points.push({ date: datePart, value });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) => JSON.stringify(k) + ":" + stableStringify((obj as Record<string, unknown>)[k])
  );
  return "{" + pairs.join(",") + "}";
}
