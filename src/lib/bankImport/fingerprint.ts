export async function computeFingerprint(
  userId: string,
  bookingDate: string,
  amount: number,
  iban?: string,
  usageText?: string,
  reference?: string
): Promise<string> {
  const raw =
    userId +
    '|' + (bookingDate || '') +
    '|' + (amount != null ? String(amount) : '') +
    '|' + (iban ? iban.trim().toUpperCase() : '') +
    '|' + (usageText ? usageText.trim().substring(0, 140) : '') +
    '|' + (reference ? reference.trim() : '');

  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
