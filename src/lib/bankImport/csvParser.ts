import type { RawBankTransaction, CsvColumnMapping } from './types';

function parseGermanDate(dateStr: string, format?: string): string | null {
  const trimmed = dateStr.trim();

  if (format === 'YYYY-MM-DD' || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0');
    const month = dotMatch[2].padStart(2, '0');
    let year = dotMatch[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  return null;
}

function parseAmount(value: string, decimalSeparator: ',' | '.' = ','): number | null {
  let cleaned = value.trim().replace(/["\s]/g, '');

  if (!cleaned) return null;

  if (decimalSeparator === ',') {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectDelimiter(firstLine: string): string {
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount >= commaCount && semicolonCount >= tabCount) return ';';
  if (tabCount >= commaCount) return '\t';
  return ',';
}

export function parseBankCsv(
  csvContent: string,
  mapping: CsvColumnMapping
): RawBankTransaction[] {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

  const skipRows = mapping.skipRows ?? 0;
  if (lines.length <= skipRows + 1) return [];

  const delimiter = mapping.delimiter || detectDelimiter(lines[skipRows]);
  const headerLine = lines[skipRows];
  const headers = splitCsvLine(headerLine, delimiter);
  const decimalSep = mapping.decimalSeparator ?? ',';

  const colIndex = (name: string | undefined): number => {
    if (!name) return -1;
    const idx = headers.findIndex(
      h => h.replace(/^"+|"+$/g, '').trim().toLowerCase() === name.toLowerCase()
    );
    return idx;
  };

  const dateIdx = colIndex(mapping.bookingDate);
  const valueDateIdx = colIndex(mapping.valueDate);
  const amountIdx = colIndex(mapping.amount);
  const nameIdx = colIndex(mapping.counterpartyName);
  const ibanIdx = colIndex(mapping.counterpartyIban);
  const usageIdx = colIndex(mapping.usageText);
  const cdIndicatorIdx = colIndex(mapping.creditDebitIndicator);
  const currencyIdx = colIndex(mapping.currency);

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error(
      `Required columns not found. Looking for date="${mapping.bookingDate}" (found: ${dateIdx}), amount="${mapping.amount}" (found: ${amountIdx}). Available headers: ${headers.join(', ')}`
    );
  }

  const transactions: RawBankTransaction[] = [];
  const dataLines = lines.slice(skipRows + 1);

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (!line.trim()) continue;

    const fields = splitCsvLine(line, delimiter);

    const dateStr = fields[dateIdx];
    const bookingDate = parseGermanDate(dateStr, mapping.dateFormat);
    if (!bookingDate) continue;

    const amountStr = fields[amountIdx];
    const rawAmount = parseAmount(amountStr, decimalSep);
    if (rawAmount === null) continue;

    let direction: 'credit' | 'debit' | undefined;
    if (cdIndicatorIdx >= 0 && fields[cdIndicatorIdx]) {
      const indicator = fields[cdIndicatorIdx].toUpperCase().trim();
      if (indicator === 'H' || indicator === 'HABEN' || indicator === 'CR' || indicator === 'CREDIT') {
        direction = 'credit';
      } else if (indicator === 'S' || indicator === 'SOLL' || indicator === 'DR' || indicator === 'DEBIT') {
        direction = 'debit';
      }
    }

    if (!direction) {
      direction = rawAmount >= 0 ? 'credit' : 'debit';
    }

    const valueDate = valueDateIdx >= 0 && fields[valueDateIdx]
      ? parseGermanDate(fields[valueDateIdx], mapping.dateFormat) ?? undefined
      : undefined;

    const counterpartyName = nameIdx >= 0 ? fields[nameIdx]?.replace(/^"+|"+$/g, '') || undefined : undefined;
    const counterpartyIban = ibanIdx >= 0 ? fields[ibanIdx]?.replace(/^"+|"+$/g, '').replace(/\s/g, '') || undefined : undefined;
    const usageText = usageIdx >= 0 ? fields[usageIdx]?.replace(/^"+|"+$/g, '') || undefined : undefined;
    const currency = currencyIdx >= 0 ? fields[currencyIdx]?.trim() || 'EUR' : 'EUR';

    const rawData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rawData[h.replace(/^"+|"+$/g, '')] = fields[idx] || '';
    });

    transactions.push({
      bookingDate,
      valueDate,
      amount: rawAmount,
      currency,
      direction,
      counterpartyName,
      counterpartyIban,
      usageText,
      rawData,
    });
  }

  return transactions;
}

export function detectCsvMapping(csvContent: string): Partial<CsvColumnMapping> {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return {};

  let skipRows = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('buchung') || line.includes('datum') || line.includes('date') || line.includes('betrag') || line.includes('amount')) {
      skipRows = i;
      break;
    }
  }

  const delimiter = detectDelimiter(lines[skipRows]);
  const headers = splitCsvLine(lines[skipRows], delimiter).map(h =>
    h.replace(/^"+|"+$/g, '').trim().toLowerCase()
  );

  const mapping: Partial<CsvColumnMapping> = { delimiter, skipRows };

  const datePatterns = ['buchungstag', 'buchungsdatum', 'buchung', 'datum', 'date', 'booking date', 'valutadatum'];
  const valueDatePatterns = ['wertstellung', 'valuta', 'value date', 'wertstellungsdatum'];
  const amountPatterns = ['betrag', 'amount', 'umsatz', 'betrag (eur)', 'betrag in eur'];
  const namePatterns = ['auftraggeber/empfänger', 'name', 'empfänger', 'auftraggeber', 'beguenstigter/zahlungspflichtiger', 'counterparty'];
  const ibanPatterns = ['iban', 'kontonummer', 'konto', 'kontonr'];
  const usagePatterns = ['verwendungszweck', 'purpose', 'buchungstext', 'beschreibung', 'vorgang/verwendungszweck'];

  for (const original of splitCsvLine(lines[skipRows], delimiter)) {
    const h = original.replace(/^"+|"+$/g, '').trim();
    const lower = h.toLowerCase();

    if (!mapping.bookingDate && datePatterns.some(p => lower.includes(p))) {
      mapping.bookingDate = h;
    }
    if (!mapping.valueDate && valueDatePatterns.some(p => lower.includes(p))) {
      mapping.valueDate = h;
    }
    if (!mapping.amount && amountPatterns.some(p => lower.includes(p))) {
      mapping.amount = h;
    }
    if (!mapping.counterpartyName && namePatterns.some(p => lower.includes(p))) {
      mapping.counterpartyName = h;
    }
    if (!mapping.counterpartyIban && ibanPatterns.some(p => lower.includes(p))) {
      mapping.counterpartyIban = h;
    }
    if (!mapping.usageText && usagePatterns.some(p => lower.includes(p))) {
      mapping.usageText = h;
    }
  }

  const sampleLine = lines[skipRows + 1];
  if (sampleLine) {
    const sampleFields = splitCsvLine(sampleLine, delimiter);
    const amountIdx = headers.findIndex(h =>
      amountPatterns.some(p => h.includes(p))
    );
    if (amountIdx >= 0) {
      const sample = sampleFields[amountIdx] || '';
      mapping.decimalSeparator = sample.includes(',') ? ',' : '.';
    }
  }

  return mapping;
}
