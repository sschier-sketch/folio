export function parseNumberInput(value: string): number {
  if (!value) return 0;

  const str = String(value).trim();

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    const lastCommaPos = str.lastIndexOf(',');
    const lastDotPos = str.lastIndexOf('.');

    if (lastCommaPos > lastDotPos) {
      const normalized = str.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    } else {
      const normalized = str.replace(/,/g, '');
      return parseFloat(normalized) || 0;
    }
  } else if (hasComma) {
    const normalized = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  } else {
    return parseFloat(str) || 0;
  }
}

export function formatNumberInput(value: number | string): string {
  return String(value);
}

export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';

  let sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return sanitized + extension.toLowerCase();
}
