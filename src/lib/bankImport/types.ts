export interface RawBankTransaction {
  bookingDate: string;
  valueDate?: string;
  amount: number;
  currency?: string;
  direction?: 'credit' | 'debit';
  counterpartyName?: string;
  counterpartyIban?: string;
  usageText?: string;
  endToEndId?: string;
  mandateId?: string;
  bankReference?: string;
  rawData?: Record<string, unknown>;
}

export interface BankImportFile {
  id: string;
  user_id: string;
  filename: string;
  source_type: 'csv' | 'camt053' | 'mt940';
  file_size_bytes?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back' | 'deleted';
  total_rows: number;
  imported_rows: number;
  duplicate_rows: number;
  error_message?: string;
  raw_meta?: Record<string, unknown>;
  storage_path?: string | null;
  rollback_available: boolean;
  deleted_at?: string | null;
  summary?: Record<string, unknown>;
  uploaded_at: string;
  processed_at?: string;
}

export interface RollbackResult {
  status: 'success' | 'already_deleted';
  message?: string;
  error?: string;
  deleted_allocations?: number;
  deleted_transactions?: number;
  deleted_income?: number;
  deleted_expenses?: number;
  deleted_rent_payments?: number;
  recalced_rents?: number;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  bank_connection_id?: string;
  import_file_id?: string;
  transaction_date: string;
  value_date?: string;
  amount: number;
  currency: string;
  direction?: 'credit' | 'debit';
  counterparty_name?: string;
  counterparty_iban?: string;
  usage_text?: string;
  end_to_end_id?: string;
  mandate_id?: string;
  bank_reference?: string;
  fingerprint?: string;
  status: BankTransactionStatus;
  matched_by?: string;
  confidence?: number;
  description?: string;
  sender?: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type BankTransactionStatus =
  | 'UNMATCHED'
  | 'SUGGESTED'
  | 'MATCHED_AUTO'
  | 'MATCHED_MANUAL'
  | 'IGNORED';

export type AllocationTargetType = 'rent_payment' | 'income_entry' | 'expense';

export interface BankTransactionAllocation {
  id: string;
  user_id: string;
  bank_transaction_id: string;
  target_type: AllocationTargetType;
  target_id: string;
  amount_allocated: number;
  created_by: 'auto' | 'manual';
  notes?: string;
  created_at: string;
  deleted_at?: string;
}

export interface AllocationInput {
  target_type: AllocationTargetType;
  target_id: string;
  amount_allocated: number;
  notes?: string;
}

export interface CsvColumnMapping {
  bookingDate: string;
  valueDate?: string;
  amount: string;
  counterpartyName?: string;
  counterpartyIban?: string;
  usageText?: string;
  creditDebitIndicator?: string;
  currency?: string;
  delimiter?: string;
  dateFormat?: string;
  decimalSeparator?: ',' | '.';
  skipRows?: number;
  encoding?: string;
}

export interface ImportResult {
  importFileId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  errors: string[];
}
