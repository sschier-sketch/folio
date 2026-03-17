import { supabase } from '../supabase';
import type { BankTransaction } from './types';
import { findMatchingRule, incrementRuleMatchCount, getAutoApplySetting } from './ruleService';
import { allocateBankTransaction } from './allocationService';

export interface MatchSuggestion {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  confidence: number;
  reason: string;
  suggestedPaymentType?: 'rent' | 'nebenkosten';
}

export interface ExpenseMatchSuggestion {
  type: 'hausgeld' | 'existing_expense';
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  category: string;
  confidence: number;
  reason: string;
  existingEntryId?: string;
}

export interface IncomeMatchSuggestion {
  type: 'existing_income';
  entryId: string;
  propertyId?: string;
  propertyName?: string;
  category: string;
  description: string;
  confidence: number;
  reason: string;
}

export type DebitSuggestion = ExpenseMatchSuggestion;
export type CreditSuggestion = MatchSuggestion | IncomeMatchSuggestion;

const NK_KEYWORDS = [
  'nebenkosten', 'betriebskosten', 'nebenkostenabrechnung',
  'betriebskostenabrechnung', 'nachzahlung nk', 'nachzahlung bk',
  'bka', ' nk ', ' bk ',
];

const AMOUNT_TOLERANCE_CENTS = 1;

function centsOf(eur: number): number {
  return Math.round(Math.abs(eur) * 100);
}

function amountMatches(aCents: number, bCents: number): boolean {
  return Math.abs(aCents - bCents) <= AMOUNT_TOLERANCE_CENTS;
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

async function suggestHausgeldMatch(
  userId: string,
  txCents: number
): Promise<ExpenseMatchSuggestion | null> {
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

  for (const u of units) {
    if (!u.housegeld_monthly_cents || u.housegeld_monthly_cents <= 0) continue;
    const propName = propMap.get(u.property_id);
    if (!propName) continue;

    if (amountMatches(txCents, u.housegeld_monthly_cents)) {
      return {
        type: 'hausgeld',
        propertyId: u.property_id,
        propertyName: propName,
        unitId: u.id,
        unitNumber: u.unit_number,
        category: 'Hausverwaltung',
        confidence: 0.8,
        reason: `Betrag entspricht Hausgeld ${(u.housegeld_monthly_cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR fuer ${propName} (${u.unit_number})`,
      };
    }
  }

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
    if (amountMatches(txCents, info.cents)) {
      return {
        type: 'hausgeld',
        propertyId,
        propertyName: info.name,
        unitId: info.unitIds[0],
        unitNumber: info.unitNumbers.join(', '),
        category: 'Hausverwaltung',
        confidence: 0.75,
        reason: `Betrag entspricht Gesamt-Hausgeld ${(info.cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR fuer ${info.name}`,
      };
    }
  }

  return null;
}

async function suggestExistingExpenseMatch(
  userId: string,
  tx: BankTransaction,
  txCents: number
): Promise<ExpenseMatchSuggestion | null> {
  const { data: openExpenses } = await supabase
    .from('expenses')
    .select('id, amount, category, description, recipient, property_id, properties(name)')
    .eq('user_id', userId)
    .eq('status', 'open')
    .is('source_bank_transaction_id', null)
    .limit(200);

  if (!openExpenses || openExpenses.length === 0) return null;

  let best: ExpenseMatchSuggestion | null = null;

  for (const e of openExpenses) {
    const expCents = centsOf(Number(e.amount));
    if (!amountMatches(txCents, expCents)) continue;

    let confidence = 0.65;
    const reasons: string[] = [];
    const propName = (e.properties as { name: string } | null)?.name || '';
    const label = e.description || e.category || 'Ausgabe';

    reasons.push(`Betrag stimmt ueberein mit "${label}" (${(expCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR)`);

    if (e.recipient && tx.counterparty_name) {
      const recipLower = e.recipient.toLowerCase();
      const cpLower = tx.counterparty_name.toLowerCase();
      if (cpLower.includes(recipLower) || recipLower.includes(cpLower)) {
        confidence = 0.85;
        reasons.push(`Empfaenger "${e.recipient}" passt zur Gegenpartei`);
      }
    }

    if (propName) {
      reasons.push(propName);
    }

    if (confidence > (best?.confidence || 0)) {
      best = {
        type: 'existing_expense',
        propertyId: e.property_id || '',
        propertyName: propName,
        unitId: '',
        unitNumber: '',
        category: e.category || '',
        confidence,
        reason: reasons.join(' - '),
        existingEntryId: e.id,
      };
    }
  }

  return best;
}

export async function suggestExpenseMatch(
  userId: string,
  tx: BankTransaction
): Promise<ExpenseMatchSuggestion | null> {
  const txAmount = Math.abs(tx.amount);
  if (txAmount <= 0) return null;
  const txCents = centsOf(txAmount);

  const [hausgeld, existingExpense] = await Promise.all([
    suggestHausgeldMatch(userId, txCents),
    suggestExistingExpenseMatch(userId, tx, txCents),
  ]);

  if (hausgeld && existingExpense) {
    return hausgeld.confidence >= existingExpense.confidence ? hausgeld : existingExpense;
  }
  return hausgeld || existingExpense;
}

export async function suggestIncomeMatch(
  userId: string,
  tx: BankTransaction
): Promise<IncomeMatchSuggestion | null> {
  const txAmount = Math.abs(tx.amount);
  if (txAmount <= 0) return null;
  const txCents = centsOf(txAmount);

  const { data: openIncome } = await supabase
    .from('income_entries')
    .select('id, amount, category, description, recipient, property_id, properties(name)')
    .eq('user_id', userId)
    .eq('status', 'open')
    .is('source_bank_transaction_id', null)
    .limit(200);

  if (!openIncome || openIncome.length === 0) return null;

  let best: IncomeMatchSuggestion | null = null;

  for (const e of openIncome) {
    const incomeCents = centsOf(Number(e.amount));
    if (!amountMatches(txCents, incomeCents)) continue;

    let confidence = 0.65;
    const reasons: string[] = [];
    const propName = (e.properties as { name: string } | null)?.name || '';
    const label = e.description || e.category || 'Einnahme';

    reasons.push(`Betrag stimmt ueberein mit "${label}" (${(incomeCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR)`);

    if (e.recipient && tx.counterparty_name) {
      const recipLower = e.recipient.toLowerCase();
      const cpLower = tx.counterparty_name.toLowerCase();
      if (cpLower.includes(recipLower) || recipLower.includes(cpLower)) {
        confidence = 0.85;
        reasons.push(`Absender "${e.recipient}" passt zur Gegenpartei`);
      }
    }

    if (propName) {
      reasons.push(propName);
    }

    if (confidence > (best?.confidence || 0)) {
      best = {
        type: 'existing_income',
        entryId: e.id,
        propertyId: e.property_id || undefined,
        propertyName: propName || undefined,
        category: e.category || '',
        description: e.description || '',
        confidence,
        reason: reasons.join(' - '),
      };
    }
  }

  return best;
}

export interface ParsedSuggestion {
  type: 'tenant' | 'hausgeld' | 'existing_expense' | 'existing_income' | 'rule';
  tenantId?: string;
  propertyId?: string;
  unitId?: string;
  category?: string;
  existingEntryId?: string;
  isNk?: boolean;
  ruleId?: string;
}

export function parseSuggestion(matchedBy: string): ParsedSuggestion | null {
  if (matchedBy.startsWith('rule:')) {
    return { type: 'rule', ruleId: matchedBy.replace('rule:', '') };
  }

  if (!matchedBy.startsWith('suggestion:')) return null;

  if (matchedBy.startsWith('suggestion:hausgeld:')) {
    const parts = matchedBy.split(':');
    if (parts.length < 4) return null;
    return {
      type: 'hausgeld',
      propertyId: parts[2],
      unitId: parts[3],
      category: 'Hausverwaltung',
    };
  }

  if (matchedBy.startsWith('suggestion:expense:')) {
    const parts = matchedBy.split(':');
    if (parts.length < 3) return null;
    return {
      type: 'existing_expense',
      existingEntryId: parts[2],
    };
  }

  if (matchedBy.startsWith('suggestion:income:')) {
    const parts = matchedBy.split(':');
    if (parts.length < 3) return null;
    return {
      type: 'existing_income',
      existingEntryId: parts[2],
    };
  }

  const rest = matchedBy.replace('suggestion:', '');
  const parts = rest.split(':');
  return {
    type: 'tenant',
    tenantId: parts[0],
    isNk: parts[1] === 'nk',
  };
}

export function parseExpenseSuggestion(matchedBy: string): { propertyId: string; unitId: string; category: string } | null {
  const parsed = parseSuggestion(matchedBy);
  if (!parsed || parsed.type !== 'hausgeld') return null;
  return {
    propertyId: parsed.propertyId!,
    unitId: parsed.unitId!,
    category: parsed.category!,
  };
}

function buildMatchedBy(
  type: 'tenant' | 'hausgeld' | 'existing_expense' | 'existing_income',
  ids: Record<string, string>,
  isNk?: boolean
): string {
  switch (type) {
    case 'tenant':
      return isNk ? `suggestion:${ids.tenantId}:nk` : `suggestion:${ids.tenantId}`;
    case 'hausgeld':
      return `suggestion:hausgeld:${ids.propertyId}:${ids.unitId}`;
    case 'existing_expense':
      return `suggestion:expense:${ids.entryId}`;
    case 'existing_income':
      return `suggestion:income:${ids.entryId}`;
  }
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
    const rule = await findMatchingRule(userId, tx);
    if (rule) {
      if (rule.target_type === 'ignore') {
        await supabase
          .from('bank_transactions')
          .update({
            status: 'IGNORED',
            confidence: 0.99,
            matched_by: `rule:${rule.id}`,
          })
          .eq('id', tx.id)
          .eq('user_id', userId);
        await incrementRuleMatchCount(rule.id);
        count++;
        continue;
      }

      await supabase
        .from('bank_transactions')
        .update({
          status: 'SUGGESTED',
          confidence: 0.99,
          matched_by: `rule:${rule.id}`,
        })
        .eq('id', tx.id)
        .eq('user_id', userId);
      count++;
      continue;
    }

    const isCredit = tx.direction === 'credit' || tx.amount > 0;
    let matchedBy: string | null = null;
    let confidence = 0;

    if (isCredit) {
      const tenantSugg = await suggestTenantMatch(userId, tx);
      if (tenantSugg && tenantSugg.confidence >= 0.6) {
        matchedBy = buildMatchedBy('tenant', { tenantId: tenantSugg.tenantId }, tenantSugg.suggestedPaymentType === 'nebenkosten');
        confidence = tenantSugg.confidence;
      }

      if (!matchedBy) {
        const incomeSugg = await suggestIncomeMatch(userId, tx);
        if (incomeSugg && incomeSugg.confidence >= 0.6) {
          matchedBy = buildMatchedBy('existing_income', { entryId: incomeSugg.entryId });
          confidence = incomeSugg.confidence;
        }
      }
    } else {
      const expSugg = await suggestExpenseMatch(userId, tx);
      if (expSugg && expSugg.confidence >= 0.6) {
        if (expSugg.type === 'hausgeld') {
          matchedBy = buildMatchedBy('hausgeld', { propertyId: expSugg.propertyId, unitId: expSugg.unitId });
        } else {
          matchedBy = buildMatchedBy('existing_expense', { entryId: expSugg.existingEntryId! });
        }
        confidence = expSugg.confidence;
      }
    }

    if (matchedBy && confidence >= 0.6) {
      await supabase
        .from('bank_transactions')
        .update({
          status: 'SUGGESTED',
          confidence,
          matched_by: matchedBy,
        })
        .eq('id', tx.id)
        .eq('user_id', userId);
      count++;
    }
  }

  return count;
}

export async function applyRulesAutomatically(userId: string): Promise<number> {
  const autoApply = await getAutoApplySetting(userId);
  if (!autoApply) return 0;

  const { data: ruleSuggested } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'SUGGESTED')
    .like('matched_by', 'rule:%')
    .limit(200);

  if (!ruleSuggested || ruleSuggested.length === 0) return 0;

  let applied = 0;

  for (const tx of ruleSuggested) {
    const ruleId = tx.matched_by?.replace('rule:', '');
    if (!ruleId) continue;

    const { data: rule } = await supabase
      .from('bank_matching_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!rule) continue;

    try {
      const success = await applyRuleToTransaction(userId, tx, rule);
      if (success) {
        await incrementRuleMatchCount(rule.id);
        applied++;
      }
    } catch {
      // skip failed applications
    }
  }

  return applied;
}

async function applyRuleToTransaction(
  userId: string,
  tx: BankTransaction,
  rule: { id: string; target_type: string; target_config: Record<string, unknown> }
): Promise<boolean> {
  const txAmount = Math.abs(tx.amount);

  if (rule.target_type === 'rent_payment') {
    const tenantId = rule.target_config.tenant_id as string;
    if (!tenantId) return false;

    const { data: contractIds } = await supabase
      .from('rental_contracts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    const cIds = (contractIds || []).map(c => c.id);
    let payments: { id: string; amount: number; paid_amount: number }[] = [];

    if (cIds.length > 0) {
      const { data } = await supabase
        .from('rent_payments')
        .select('id, amount, paid_amount')
        .eq('user_id', userId)
        .in('contract_id', cIds)
        .in('payment_status', ['unpaid', 'partial'])
        .order('due_date', { ascending: true });
      if (data) payments = data;
    }

    const { data: byTenant } = await supabase
      .from('rent_payments')
      .select('id, amount, paid_amount')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .in('payment_status', ['unpaid', 'partial'])
      .order('due_date', { ascending: true });

    if (byTenant) {
      const existingIds = new Set(payments.map(p => p.id));
      for (const p of byTenant) {
        if (!existingIds.has(p.id)) payments.push(p);
      }
    }

    if (payments.length === 0) return false;

    let remaining = txAmount;
    const inputs: { target_type: 'rent_payment'; target_id: string; amount_allocated: number }[] = [];

    for (const rp of payments) {
      if (remaining <= 0) break;
      const open = Number(rp.amount) - Number(rp.paid_amount || 0);
      if (open <= 0) continue;
      const alloc = Math.min(remaining, open);
      inputs.push({ target_type: 'rent_payment', target_id: rp.id, amount_allocated: Math.round(alloc * 100) / 100 });
      remaining -= alloc;
    }

    if (inputs.length === 0) return false;
    await allocateBankTransaction(userId, tx.id, inputs, 'auto');
    return true;
  }

  if (rule.target_type === 'expense' || rule.target_type === 'income_entry') {
    const table = rule.target_type === 'expense' ? 'expenses' : 'income_entries';
    const dateCol = rule.target_type === 'expense' ? 'expense_date' : 'entry_date';
    const config = rule.target_config;

    const record: Record<string, unknown> = {
      user_id: userId,
      amount: txAmount,
      category: config.category || '',
      description: config.description || tx.usage_text || tx.counterparty_name || '',
      status: 'paid',
      source_bank_transaction_id: tx.id,
      source_bank_import_file_id: tx.import_file_id || null,
      [dateCol]: tx.transaction_date,
    };

    if (config.property_id) record.property_id = config.property_id;
    if (config.category_id) record.category_id = config.category_id;

    const { data: created, error: insertError } = await supabase
      .from(table)
      .insert(record)
      .select('id')
      .single();

    if (insertError || !created) return false;

    await allocateBankTransaction(
      userId,
      tx.id,
      [{ target_type: rule.target_type as 'expense' | 'income_entry', target_id: created.id, amount_allocated: txAmount }],
      'auto'
    );
    return true;
  }

  return false;
}

export async function runPostImportMatching(userId: string): Promise<{ suggestions: number; autoApplied: number }> {
  const suggestions = await runSuggestionsForUnmatched(userId);
  const autoApplied = await applyRulesAutomatically(userId);
  return { suggestions, autoApplied };
}
