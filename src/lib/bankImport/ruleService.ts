import { supabase } from '../supabase';
import type { BankMatchingRule, BankTransaction, MatchingRuleTargetType } from './types';

export async function createMatchingRule(
  userId: string,
  rule: {
    counterparty_name: string;
    amount_cents: number;
    direction: 'credit' | 'debit';
    target_type: MatchingRuleTargetType;
    target_config: Record<string, unknown>;
    name?: string;
  }
): Promise<BankMatchingRule> {
  const displayName =
    rule.name ||
    `${rule.counterparty_name} - ${(rule.amount_cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;

  const { data: existing } = await supabase
    .from('bank_matching_rules')
    .select('id')
    .eq('user_id', userId)
    .eq('counterparty_name', rule.counterparty_name)
    .eq('amount_cents', rule.amount_cents)
    .eq('direction', rule.direction)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('bank_matching_rules')
      .update({
        target_type: rule.target_type,
        target_config: rule.target_config,
        name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from('bank_matching_rules')
    .insert({
      user_id: userId,
      name: displayName,
      counterparty_name: rule.counterparty_name,
      amount_cents: rule.amount_cents,
      direction: rule.direction,
      target_type: rule.target_type,
      target_config: rule.target_config,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listMatchingRules(userId: string): Promise<BankMatchingRule[]> {
  const { data, error } = await supabase
    .from('bank_matching_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateMatchingRule(
  userId: string,
  ruleId: string,
  updates: { is_active?: boolean; name?: string }
): Promise<void> {
  const { error } = await supabase
    .from('bank_matching_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function deleteMatchingRule(userId: string, ruleId: string): Promise<void> {
  const { error } = await supabase
    .from('bank_matching_rules')
    .delete()
    .eq('id', ruleId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function findMatchingRule(
  userId: string,
  tx: BankTransaction
): Promise<BankMatchingRule | null> {
  const direction = tx.direction || (tx.amount >= 0 ? 'credit' : 'debit');
  const amountCents = Math.round(Math.abs(tx.amount) * 100);
  const cpName = (tx.counterparty_name || '').trim();

  if (!cpName) return null;

  const { data } = await supabase
    .from('bank_matching_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('direction', direction)
    .eq('amount_cents', amountCents)
    .eq('counterparty_name', cpName)
    .limit(1)
    .maybeSingle();

  return data || null;
}

export async function incrementRuleMatchCount(ruleId: string): Promise<void> {
  const { data: current } = await supabase
    .from('bank_matching_rules')
    .select('match_count')
    .eq('id', ruleId)
    .maybeSingle();

  if (!current) return;

  await supabase
    .from('bank_matching_rules')
    .update({
      match_count: (current.match_count || 0) + 1,
      last_matched_at: new Date().toISOString(),
    })
    .eq('id', ruleId);
}

export async function getAutoApplySetting(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_settings')
    .select('auto_apply_bank_rules')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.auto_apply_bank_rules ?? false;
}

export async function setAutoApplySetting(userId: string, enabled: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_settings')
      .update({ auto_apply_bank_rules: enabled })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_settings')
      .insert({ user_id: userId, auto_apply_bank_rules: enabled });
  }
}
