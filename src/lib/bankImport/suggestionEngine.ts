import { supabase } from '../supabase';
import type { BankTransaction } from './types';

interface MatchSuggestion {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  confidence: number;
  reason: string;
}

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
    return best;
  }

  return null;
}

export async function runSuggestionsForUnmatched(userId: string): Promise<number> {
  const { data: unmatched } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'UNMATCHED')
    .eq('direction', 'credit')
    .limit(200);

  if (!unmatched || unmatched.length === 0) return 0;

  let count = 0;

  for (const tx of unmatched) {
    const suggestion = await suggestTenantMatch(userId, tx);

    if (suggestion && suggestion.confidence >= 0.6) {
      await supabase
        .from('bank_transactions')
        .update({
          status: 'SUGGESTED',
          confidence: suggestion.confidence,
          matched_by: `suggestion:${suggestion.tenantId}`,
        })
        .eq('id', tx.id)
        .eq('user_id', userId);
      count++;
    }
  }

  return count;
}
