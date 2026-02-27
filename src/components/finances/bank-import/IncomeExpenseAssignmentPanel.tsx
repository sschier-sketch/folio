import { useState, useEffect } from 'react';
import { AlertCircle, Loader, ChevronDown, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { allocateBankTransaction } from '../../../lib/bankImport';
import type { BankTransaction, AllocationTargetType } from '../../../lib/bankImport/types';

interface Property {
  id: string;
  name: string;
}

interface IncomeExpenseAssignmentPanelProps {
  tx: BankTransaction;
  userId: string;
  targetType: 'income_entry' | 'expense';
  onComplete: () => void;
  onCancel: () => void;
}

const INCOME_CATEGORIES = [
  'Mieteinnahmen',
  'Nebenkosten-Nachzahlung',
  'Kaution',
  'Sonstige Einnahmen',
  'Foerderung',
  'Versicherungsleistung',
];

const EXPENSE_CATEGORIES = [
  'Instandhaltung',
  'Versicherung',
  'Hausverwaltung',
  'Grundsteuer',
  'Bankgebuehren',
  'Rechtskosten',
  'Sonstige Ausgaben',
  'Heizkosten',
  'Wasser/Abwasser',
  'Strom',
  'Muellentsorgung',
];

export default function IncomeExpenseAssignmentPanel({
  tx,
  userId,
  targetType,
  onComplete,
  onCancel,
}: IncomeExpenseAssignmentPanelProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState(tx.usage_text || tx.counterparty_name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isIncome = targetType === 'income_entry';
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const txAmount = Math.abs(tx.amount);

  useEffect(() => {
    loadProperties();
  }, [userId]);

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('id, name')
      .eq('user_id', userId)
      .order('name');
    if (data) setProperties(data);
  }

  async function handleSave() {
    if (!category) {
      setError('Bitte Kategorie waehlen.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const table = isIncome ? 'income_entries' : 'expenses';
      const record: Record<string, unknown> = {
        user_id: userId,
        amount: txAmount,
        category,
        description: description || (isIncome ? 'Bank-Eingang' : 'Bank-Ausgang'),
        status: 'paid',
        source_bank_transaction_id: tx.id,
        source_bank_import_file_id: tx.import_file_id || null,
        ...(isIncome
          ? { entry_date: tx.transaction_date }
          : { expense_date: tx.transaction_date }),
      };

      if (propertyId) {
        record.property_id = propertyId;
      }

      const { data: created, error: insertError } = await supabase
        .from(table)
        .insert(record)
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);
      if (!created) throw new Error('Datensatz konnte nicht erstellt werden');

      await allocateBankTransaction(
        userId,
        tx.id,
        [
          {
            target_type: targetType as AllocationTargetType,
            target_id: created.id,
            amount_allocated: txAmount,
          },
        ],
        'manual'
      );

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zuordnung fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-dark">
        Als {isIncome ? 'Einnahme' : 'Ausgabe'} erfassen
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Kategorie <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value="">-- Kategorie waehlen --</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Immobilie (optional)
          </label>
          <div className="relative">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value="">-- Keine Zuordnung --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Beschreibung
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
        />
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
        <span className="text-xs text-gray-500">Betrag</span>
        <span className="text-sm font-semibold text-dark tabular-nums">
          {txAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="cancel" size="sm" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || !category}
        >
          {saving ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {saving
            ? 'Speichert...'
            : isIncome
            ? 'Als Einnahme erfassen'
            : 'Als Ausgabe erfassen'}
        </Button>
      </div>
    </div>
  );
}
