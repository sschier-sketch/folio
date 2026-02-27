import { supabase } from '../supabase';
import { parseCamt053Xml } from './camt053Parser';
import { parseBankCsv } from './csvParser';
import { computeFingerprint } from './fingerprint';
import type {
  RawBankTransaction,
  CsvColumnMapping,
  ImportResult,
  BankImportFile,
  RollbackResult,
} from './types';

export async function createImportFile(
  userId: string,
  filename: string,
  sourceType: BankImportFile['source_type'],
  fileSizeBytes?: number
): Promise<string> {
  const { data, error } = await supabase
    .from('bank_import_files')
    .insert({
      user_id: userId,
      filename,
      source_type: sourceType,
      file_size_bytes: fileSizeBytes,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create import file: ${error.message}`);
  return data.id;
}

export async function importFromCamt053(
  userId: string,
  xmlContent: string,
  filename: string
): Promise<ImportResult> {
  const importFileId = await createImportFile(userId, filename, 'camt053', xmlContent.length);

  try {
    await supabase
      .from('bank_import_files')
      .update({ status: 'processing' })
      .eq('id', importFileId);

    const rawTransactions = parseCamt053Xml(xmlContent);
    return await insertTransactions(userId, importFileId, rawTransactions);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from('bank_import_files')
      .update({ status: 'failed', error_message: msg })
      .eq('id', importFileId);
    throw err;
  }
}

export async function importFromCsv(
  userId: string,
  csvContent: string,
  filename: string,
  mapping: CsvColumnMapping
): Promise<ImportResult> {
  const importFileId = await createImportFile(userId, filename, 'csv', csvContent.length);

  try {
    await supabase
      .from('bank_import_files')
      .update({ status: 'processing' })
      .eq('id', importFileId);

    const rawTransactions = parseBankCsv(csvContent, mapping);
    return await insertTransactions(userId, importFileId, rawTransactions);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from('bank_import_files')
      .update({ status: 'failed', error_message: msg })
      .eq('id', importFileId);
    throw err;
  }
}

async function insertTransactions(
  userId: string,
  importFileId: string,
  rawTransactions: RawBankTransaction[]
): Promise<ImportResult> {
  let importedRows = 0;
  let duplicateRows = 0;
  const errors: string[] = [];

  for (const tx of rawTransactions) {
    try {
      const fp = await computeFingerprint(
        userId,
        tx.bookingDate,
        tx.amount,
        tx.counterpartyIban,
        tx.usageText,
        tx.bankReference || tx.endToEndId
      );

      const { data: existing } = await supabase
        .from('bank_transactions')
        .select('id')
        .eq('fingerprint', fp)
        .maybeSingle();

      if (existing) {
        duplicateRows++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('bank_transactions')
        .insert({
          user_id: userId,
          import_file_id: importFileId,
          transaction_date: tx.bookingDate,
          value_date: tx.valueDate || null,
          amount: tx.amount,
          currency: tx.currency || 'EUR',
          direction: tx.direction || (tx.amount >= 0 ? 'credit' : 'debit'),
          counterparty_name: tx.counterpartyName || null,
          counterparty_iban: tx.counterpartyIban || null,
          usage_text: tx.usageText || null,
          end_to_end_id: tx.endToEndId || null,
          mandate_id: tx.mandateId || null,
          bank_reference: tx.bankReference || null,
          fingerprint: fp,
          status: 'UNMATCHED',
          description: tx.usageText || tx.counterpartyName || '',
          sender: tx.counterpartyName || '',
          raw_data: tx.rawData || {},
        });

      if (insertError) {
        if (insertError.code === '23505') {
          duplicateRows++;
        } else {
          errors.push(`Row ${importedRows + duplicateRows + 1}: ${insertError.message}`);
        }
        continue;
      }

      importedRows++;
    } catch (err) {
      errors.push(`Row ${importedRows + duplicateRows + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await supabase
    .from('bank_import_files')
    .update({
      status: 'completed',
      total_rows: rawTransactions.length,
      imported_rows: importedRows,
      duplicate_rows: duplicateRows,
      processed_at: new Date().toISOString(),
      raw_meta: errors.length > 0 ? { errors } : {},
    })
    .eq('id', importFileId);

  return {
    importFileId,
    totalRows: rawTransactions.length,
    importedRows,
    duplicateRows,
    errors,
  };
}

export async function listImportFiles(userId: string): Promise<BankImportFile[]> {
  const { data, error } = await supabase
    .from('bank_import_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function rollbackAndDeleteImport(
  importFileId: string
): Promise<RollbackResult> {
  const { data, error } = await supabase.rpc('rollback_and_delete_import', {
    p_import_file_id: importFileId,
  });

  if (error) {
    throw new Error(`Rollback failed: ${error.message}`);
  }

  const result = data as RollbackResult;

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

export async function listRecentImportFiles(
  userId: string,
  days: number = 14
): Promise<BankImportFile[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('bank_import_files')
    .select('*')
    .eq('user_id', userId)
    .gte('uploaded_at', cutoff.toISOString())
    .order('uploaded_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
