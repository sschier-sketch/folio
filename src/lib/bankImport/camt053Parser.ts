import type { RawBankTransaction } from './types';

function getTextContent(element: Element, tagName: string): string | undefined {
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() || undefined;
}

function findElement(parent: Element, ...tagNames: string[]): Element | undefined {
  let current: Element | undefined = parent;
  for (const tag of tagNames) {
    if (!current) return undefined;
    current = current.getElementsByTagName(tag)[0] as Element | undefined;
  }
  return current;
}

function parseAmount(element: Element, tagName: string): number | undefined {
  const el = element.getElementsByTagName(tagName)[0];
  if (!el?.textContent) return undefined;
  return parseFloat(el.textContent.trim());
}

export function parseCamt053Xml(xmlString: string): RawBankTransaction[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent}`);
  }

  const transactions: RawBankTransaction[] = [];

  const entries = doc.getElementsByTagName('Ntry');

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    const cdtDbtInd = getTextContent(entry, 'CdtDbtInd');
    const direction: 'credit' | 'debit' | undefined =
      cdtDbtInd === 'CRDT' ? 'credit' : cdtDbtInd === 'DBIT' ? 'debit' : undefined;

    const rawAmount = parseAmount(entry, 'Amt');
    if (rawAmount === undefined) continue;

    const amount = direction === 'debit' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const currency = entry.getElementsByTagName('Amt')[0]?.getAttribute('Ccy') || 'EUR';

    const bookingDate = getTextContent(entry, 'BookgDt')
      ? getTextContent(findElement(entry, 'BookgDt') as Element, 'Dt')
        || getTextContent(entry, 'BookgDt')
      : undefined;

    const valueDate = getTextContent(entry, 'ValDt')
      ? getTextContent(findElement(entry, 'ValDt') as Element, 'Dt')
        || getTextContent(entry, 'ValDt')
      : undefined;

    if (!bookingDate) continue;

    const bankRef = getTextContent(entry, 'AcctSvcrRef');

    const txDetails = entry.getElementsByTagName('TxDtls');

    if (txDetails.length === 0) {
      transactions.push({
        bookingDate,
        valueDate,
        amount,
        currency,
        direction,
        bankReference: bankRef,
        rawData: { xml_index: i },
      });
      continue;
    }

    for (let j = 0; j < txDetails.length; j++) {
      const detail = txDetails[j];

      const endToEndId = getTextContent(detail, 'EndToEndId');
      const mandateId = getTextContent(detail, 'MndtId');

      let counterpartyName: string | undefined;
      let counterpartyIban: string | undefined;

      const rltdPtys = detail.getElementsByTagName('RltdPties')[0];
      if (rltdPtys) {
        const party = direction === 'credit'
          ? rltdPtys.getElementsByTagName('Dbtr')[0]
          : rltdPtys.getElementsByTagName('Cdtr')[0];

        if (party) {
          counterpartyName = getTextContent(party, 'Nm');
        }

        const acctEl = direction === 'credit'
          ? rltdPtys.getElementsByTagName('DbtrAcct')[0]
          : rltdPtys.getElementsByTagName('CdtrAcct')[0];

        if (acctEl) {
          counterpartyIban = getTextContent(acctEl, 'IBAN');
        }
      }

      const rmtInf = detail.getElementsByTagName('RmtInf')[0];
      let usageText: string | undefined;
      if (rmtInf) {
        const ustrdElements = rmtInf.getElementsByTagName('Ustrd');
        const parts: string[] = [];
        for (let k = 0; k < ustrdElements.length; k++) {
          const text = ustrdElements[k].textContent?.trim();
          if (text) parts.push(text);
        }
        usageText = parts.join(' ') || undefined;
      }

      const detailAmount = parseAmount(detail, 'Amt');
      const finalAmount = detailAmount !== undefined
        ? (direction === 'debit' ? -Math.abs(detailAmount) : Math.abs(detailAmount))
        : amount;

      transactions.push({
        bookingDate,
        valueDate,
        amount: finalAmount,
        currency,
        direction,
        counterpartyName,
        counterpartyIban,
        usageText,
        endToEndId: endToEndId !== 'NOTPROVIDED' ? endToEndId : undefined,
        mandateId,
        bankReference: bankRef,
        rawData: { xml_entry: i, xml_detail: j },
      });
    }
  }

  return transactions;
}
