import { supabase } from '../supabase';
import type { BankTransaction } from './types';

export interface MatchSuggestion {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  confidence: number;
  reason: string;
  suggestedPaymentType?: 'rent' | 'nebenkosten';
}

export interface ExpenseMatchSuggestion {
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  category: string;
  confidence: number;
  reason: string;
}

const NK_KEYWORDS = [
  'nebenkosten', 'betriebskosten', 'nebenkostenabrechnung',
  'betriebskostenabrechnung', 'nachzahlung nk', 'nachzahlung bk',
  'bka', ' nk ', ' bk ',
];

export async function suggestTenantMatch(
  userId: string,
  tx: BankTransaction
): Promise<MatchSuggestion | null> {
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, name, iban, property_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!tenants || tenants.length === 0) return null;

  let best: MatchSuggestion | null = null;

  for (const t of tenants) {
    let confidence = 0;
    let reason = '';

    if (tx.counterparty_iban && t.iban && tx.counterparty_iban === t.iban) {
      confidence = 0.95;
      reason = `IBAN stimmt ueberein (${t.iban.slice(-4)})`;
    }

    if (confidence < 0.8 && tx.counterparty_name) {
      const cpLower = tx.counterparty_name.toLowerCase();
      const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
      const displayName = (t.name || '').toLowerCase();

      if (cpLower === fullName || cpLower === displayName) {
        confidence = Math.max(confidence, 0.85);
        reason = `Name stimmt exakt ueberein`;
      } else if (
        cpLower.includes(t.last_name.toLowerCase()) &&
        t.last_name.length > 2
      ) {
        confidence = Math.max(confidence, 0.6);
        reason = `Nachname "${t.last_name}" im Auftraggeber enthalten`;
      }
    }

    if (confidence < 0.7 && tx.usage_text) {
      const usageLower = tx.usage_text.toLowerCase();
      const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();

      if (usageLower.includes(fullName)) {
        confidence = Math.max(confidence, 0.65);
        reason = `Name im Verwendungszweck gefunden`;
      } else if (
        usageLower.includes(t.last_name.toLowerCase()) &&
        t.last_name.length > 2
      ) {
        confidence = Math.max(confidence, 0.4);
        reason = `Nachname im Verwendungszweck gefunden`;
      }
    }

    const tenantName = t.name || `${t.first_name} ${t.last_name}`;

    if (confidence > (best?.confidence || 0)) {
      best = {
        tenantId: t.id,
        tenantName,
        propertyId: t.property_id,
        confidence,
        reason,
      };
    }
  }

  if (best && best.confidence >= 0.4) {
    const usageLower = ` ${(tx.usage_text || '').toLowerCase()} `;
    const isNk = NK_KEYWORDS.some(kw => usageLower.includes(kw));
    if (isNk) {
      best.suggestedPaymentType = 'nebenkosten';
      best.reason += ' (Nebenkosten erkannt)';
    }
    return best;
  }

  return null;
}

export async function suggestExpenseMatch(
  userId: string,
  tx: BankTransaction
): Promise<ExpenseMatchSuggestion | null> {
  const txAmount = Math.abs(tx.amount);
  if (txAmount <= 0) return null;

  const { data: userProperties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('user_id', userId);

  if (!userProperties || userProperties.length === 0) return null;

  const propMap = new Map(userProperties.map(p => [p.id, p.name]));
  const propIds = userProperties.map(p => p.id);

  const { data: units } = await supabase
    .from('property_units')
    .select('id, unit_number, unit_type, housegeld_monthly_cents, property_id')
    .in('property_id', propIds)
    .gt('housegeld_monthly_cents', 0);

  if (!units || units.length === 0) return null;

  const txCents = Math.round(txAmount * 100);
  let best: ExpenseMatchSuggestion | null = null;

  for (const u of units) {
    const hausgeldCents = u.housegeld_monthly_cents;
    if (!hausgeldCents || hausgeldCents <= 0) continue;

    const propName = propMap.get(u.property_id);
    if (!propName) continue;

    if (txCents === hausgeldCents) {
      const confidence = 0.8;
      const reason = `Betrag entspricht Hausgeld ${(hausgeldCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR für ${propName} (${u.unit_number})`;

      if (confidence > (best?.confidence || 0)) {
        best = {
          propertyId: u.property_id,
          propertyName: propName,
          unitId: u.id,
          unitNumber: u.unit_number,
          category: 'Hausverwaltung',
          confidence,
          reason,
        };
      }
    }
  }

  if (!best) {
    const propertyTotals = new Map<string, { cents: number; name: string; unitIds: string[]; unitNumbers: string[] }>();

    for (const u of units) {
      const propName = propMap.get(u.property_id);
      if (!propName) continue;

      const existing = propertyTotals.get(u.property_id);
      if (existing) {
        existing.cents += u.housegeld_monthly_cents;
        existing.unitIds.push(u.id);
        existing.unitNumbers.push(u.unit_number);
      } else {
        propertyTotals.set(u.property_id, {
          cents: u.housegeld_monthly_cents,
          name: propName,
          unitIds: [u.id],
          unitNumbers: [u.unit_number],
        });
      }
    }

    for (const [propertyId, info] of propertyTotals) {
      if (info.unitIds.length <= 1) continue;

      if (txCents === info.cents) {
        best = {
          propertyId,
          propertyName: info.name,
          unitId: info.unitIds[0],
          unitNumber: info.unitNumbers.join(', '),
          category: 'Hausverwaltung',
          confidence: 0.75,
          reason: `Betrag entspricht Gesamt-Hausgeld ${(info.cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR für ${info.name}`,
        };
        break;
      }
    }
  }

  return best;
}

export function parseExpenseSuggestion(matchedBy: string): { propertyId: string; unitId: string; category: string } | null {
  if (!matchedBy.startsWith('suggestion:hausgeld:')) return null;
  const parts = matchedBy.split(':');
  if (parts.length < 4) return null;
  return {
    propertyId: parts[2],
    unitId: parts[3],
    category: 'Hausverwaltung',
  };
}

export async function runSuggestionsForUnmatched(userId: string): Promise<number> {
  const { data: unmatched } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'UNMATCHED')
    .limit(400);

  if (!unmatched || unmatched.length === 0) return 0;

  let count = 0;

  for (const tx of unmatched) {
    const isCredit = tx.direction === 'credit' || tx.amount > 0;

    if (isCredit) {
      const suggestion = await suggestTenantMatch(userId, tx);
      if (suggestion && suggestion.confidence >= 0.6) {
        const matchedBy = suggestion.suggestedPaymentType === 'nebenkosten'
          ? `suggestion:${suggestion.tenantId}:nk`
          : `suggestion:${suggestion.tenantId}`;
        await supabase
          .from('bank_transactions')
          .update({
            status: 'SUGGESTED',
            confidence: suggestion.confidence,
            matched_by: matchedBy,
          })
          .eq('id', tx.id)
          .eq('user_id', userId);
        count++;
      }
    } else {
      const suggestion = await suggestExpenseMatch(userId, tx);
      if (suggestion && suggestion.confidence >= 0.6) {
        const matchedBy = `suggestion:hausgeld:${suggestion.propertyId}:${suggestion.unitId}`;
        await supabase
          .from('bank_transactions')
          .update({
            status: 'SUGGESTED',
            confidence: suggestion.confidence,
            matched_by: matchedBy,
          })
          .eq('id', tx.id)
          .eq('user_id', userId);
        count++;
      }
    }
  }

  return count;
}
