import { supabase } from '../supabase';
import type {
  AllocationInput,
  BankTransaction,
  BankTransactionStatus,
  BankTransactionAllocation,
} from './types';

export async function allocateBankTransaction(
  userId: string,
  bankTransactionId: string,
  allocations: AllocationInput[],
  createdBy: 'auto' | 'manual' = 'manual'
): Promise<BankTransactionAllocation[]> {
  if (allocations.length === 0) {
    throw new Error('At least one allocation is required');
  }

  const { data: tx, error: txError } = await supabase
    .from('bank_transactions')
    .select('id, amount, status, user_id')
    .eq('id', bankTransactionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (txError || !tx) {
    throw new Error('Bank transaction not found');
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount_allocated, 0);
  const txAbsAmount = Math.abs(tx.amount);

  if (totalAllocated > txAbsAmount + 0.01) {
    throw new Error(
      `Total allocated (${totalAllocated.toFixed(2)}) exceeds transaction amount (${txAbsAmount.toFixed(2)})`
    );
  }

  const rows = allocations.map(a => ({
    user_id: userId,
    bank_transaction_id: bankTransactionId,
    target_type: a.target_type,
    target_id: a.target_id,
    amount_allocated: a.amount_allocated,
    created_by: createdBy,
    notes: a.notes || null,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('bank_transaction_allocations')
    .insert(rows)
    .select();

  if (insertError) {
    throw new Error(`Failed to create allocations: ${insertError.message}`);
  }

  const newStatus: BankTransactionStatus =
    createdBy === 'auto' ? 'MATCHED_AUTO' : 'MATCHED_MANUAL';

  await supabase
    .from('bank_transactions')
    .update({ status: newStatus, matched_by: createdBy })
    .eq('id', bankTransactionId);

  for (const alloc of allocations) {
    await updateTargetPaymentStatus(alloc.target_type, alloc.target_id);
  }

  return inserted || [];
}

export async function undoAllocation(
  userId: string,
  bankTransactionId: string
): Promise<void> {
  const { data: activeAllocations, error: fetchError } = await supabase
    .from('bank_transaction_allocations')
    .select('id, target_type, target_id')
    .eq('bank_transaction_id', bankTransactionId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (fetchError) {
    throw new Error(`Failed to fetch allocations: ${fetchError.message}`);
  }

  if (!activeAllocations || activeAllocations.length === 0) {
    throw new Error('No active allocations found for this transaction');
  }

  const { error: softDeleteError } = await supabase
    .from('bank_transaction_allocations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('bank_transaction_id', bankTransactionId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (softDeleteError) {
    throw new Error(`Failed to undo allocations: ${softDeleteError.message}`);
  }

  await supabase
    .from('bank_transactions')
    .update({
      status: 'UNMATCHED',
      matched_by: null,
      confidence: null,
    })
    .eq('id', bankTransactionId)
    .eq('user_id', userId);

  const targets = new Set(
    activeAllocations.map(a => `${a.target_type}::${a.target_id}`)
  );

  for (const key of targets) {
    const [targetType, targetId] = key.split('::');
    await updateTargetPaymentStatus(
      targetType as AllocationInput['target_type'],
      targetId
    );
  }
}

export async function ignoreBankTransaction(
  userId: string,
  bankTransactionId: string
): Promise<void> {
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'IGNORED' })
    .eq('id', bankTransactionId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to ignore transaction: ${error.message}`);
}

export async function unignoreBankTransaction(
  userId: string,
  bankTransactionId: string
): Promise<void> {
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'UNMATCHED' })
    .eq('id', bankTransactionId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to unignore transaction: ${error.message}`);
}

async function updateTargetPaymentStatus(
  targetType: string,
  targetId: string
): Promise<void> {
  const { data: activeAllocations } = await supabase
    .from('bank_transaction_allocations')
    .select('amount_allocated')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('deleted_at', null);

  const totalAllocated = (activeAllocations || []).reduce(
    (sum, a) => sum + Number(a.amount_allocated),
    0
  );

  if (targetType === 'rent_payment') {
    await recalcRentPayment(targetId, totalAllocated);
  } else if (targetType === 'expense') {
    await recalcExpense(targetId, totalAllocated);
  } else if (targetType === 'income_entry') {
    await recalcIncomeEntry(targetId, totalAllocated);
  }
}

async function recalcRentPayment(
  rentPaymentId: string,
  totalAllocated: number
): Promise<void> {
  const { data: rp } = await supabase
    .from('rent_payments')
    .select('id, amount')
    .eq('id', rentPaymentId)
    .maybeSingle();

  if (!rp) return;

  const dueAmount = Number(rp.amount);
  let newStatus: string;

  if (totalAllocated >= dueAmount) {
    newStatus = 'paid';
  } else if (totalAllocated > 0) {
    newStatus = 'partial';
  } else {
    newStatus = 'unpaid';
  }

  await supabase
    .from('rent_payments')
    .update({
      payment_status: newStatus,
      paid_amount: totalAllocated,
      paid: newStatus === 'paid',
      paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
    })
    .eq('id', rentPaymentId);
}

async function recalcExpense(
  expenseId: string,
  totalAllocated: number
): Promise<void> {
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, amount')
    .eq('id', expenseId)
    .maybeSingle();

  if (!expense) return;

  const newStatus = totalAllocated >= Math.abs(Number(expense.amount)) ? 'paid' : 'open';

  await supabase
    .from('expenses')
    .update({ status: newStatus })
    .eq('id', expenseId);
}

async function recalcIncomeEntry(
  incomeEntryId: string,
  totalAllocated: number
): Promise<void> {
  const { data: entry } = await supabase
    .from('income_entries')
    .select('id, amount')
    .eq('id', incomeEntryId)
    .maybeSingle();

  if (!entry) return;

  const newStatus = totalAllocated >= Math.abs(Number(entry.amount)) ? 'paid' : 'open';

  await supabase
    .from('income_entries')
    .update({ status: newStatus })
    .eq('id', incomeEntryId);
}

export async function listBankTransactions(
  userId: string,
  filters?: {
    status?: BankTransactionStatus | BankTransactionStatus[];
    dateFrom?: string;
    dateTo?: string;
    direction?: 'credit' | 'debit';
    importFileId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: BankTransaction[]; count: number }> {
  let query = supabase
    .from('bank_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.dateFrom) {
    query = query.gte('transaction_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('transaction_date', filters.dateTo);
  }
  if (filters?.direction) {
    query = query.eq('direction', filters.direction);
  }
  if (filters?.importFileId) {
    query = query.eq('import_file_id', filters.importFileId);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return { data: data || [], count: count || 0 };
}

export async function getAllocationsForTransaction(
  bankTransactionId: string
): Promise<BankTransactionAllocation[]> {
  const { data, error } = await supabase
    .from('bank_transaction_allocations')
    .select('*')
    .eq('bank_transaction_id', bankTransactionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
