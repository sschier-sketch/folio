import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader, ChevronDown, Plus, Check, Search, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { allocateBankTransaction } from '../../../lib/bankImport';
import type { BankTransaction, AllocationTargetType } from '../../../lib/bankImport/types';

interface Property {
  id: string;
  name: string;
}

interface ExistingEntry {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  date: string;
  property_name?: string;
}

interface IncomeExpenseAssignmentPanelProps {
  tx: BankTransaction;
  userId: string;
  targetType: 'income_entry' | 'expense';
  suggestedPropertyId?: string;
  suggestedCategory?: string;
  suggestedExistingEntryId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

const INCOME_CATEGORIES = [
  'Mieteinnahmen',
  'Nebenkosten-Nachzahlung',
  'Kaution',
  'Sonstige Einnahmen',
  'Förderung',
  'Versicherungsleistung',
];

const EXPENSE_CATEGORIES = [
  'Instandhaltung',
  'Versicherung',
  'Hausverwaltung',
  'Grundsteuer',
  'Bankgebühren',
  'Rechtskosten',
  'Sonstige Ausgaben',
  'Heizkosten',
  'Wasser/Abwasser',
  'Strom',
  'Müllentsorgung',
];

export default function IncomeExpenseAssignmentPanel({
  tx,
  userId,
  targetType,
  suggestedPropertyId,
  suggestedCategory,
  suggestedExistingEntryId,
  onComplete,
  onCancel,
}: IncomeExpenseAssignmentPanelProps) {
  const hasNewSuggestion = !!(suggestedPropertyId || suggestedCategory);
  const hasExistingSuggestion = !!suggestedExistingEntryId;
  const defaultTab = hasNewSuggestion ? 'new' : 'existing';
  const [tab, setTab] = useState<'existing' | 'new'>(defaultTab);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState(suggestedPropertyId || '');
  const [category, setCategory] = useState(suggestedCategory || '');
  const [description, setDescription] = useState(tx.usage_text || tx.counterparty_name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [existingEntries, setExistingEntries] = useState<ExistingEntry[]>([]);
  const [existingLoading, setExistingLoading] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState(suggestedExistingEntryId || '');
  const [existingSearch, setExistingSearch] = useState('');

  const isIncome = targetType === 'income_entry';
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const txAmount = Math.abs(tx.amount);

  useEffect(() => {
    loadProperties();
    loadExistingEntries();
  }, [userId]);

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('id, name')
      .eq('user_id', userId)
      .order('name');
    if (data) setProperties(data);
  }

  async function loadExistingEntries() {
    setExistingLoading(true);
    const table = isIncome ? 'income_entries' : 'expenses';
    const dateCol = isIncome ? 'entry_date' : 'expense_date';

    const { data } = await supabase
      .from(table)
      .select(`id, description, category, amount, status, ${dateCol}, property:properties(name)`)
      .eq('user_id', userId)
      .eq('status', 'open')
      .order(dateCol, { ascending: false })
      .limit(100);

    if (data) {
      setExistingEntries(
        data.map((e: any) => ({
          id: e.id,
          description: e.description || '',
          category: e.category || '',
          amount: Number(e.amount),
          status: e.status,
          date: e[dateCol] || '',
          property_name: e.property?.name || undefined,
        })),
      );
    }
    setExistingLoading(false);
  }

  const filteredExisting = useMemo(() => {
    let entries = existingEntries;
    if (existingSearch.trim()) {
      const q = existingSearch.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.property_name || '').toLowerCase().includes(q),
      );
    }
    if (hasExistingSuggestion) {
      const idx = entries.findIndex(e => e.id === suggestedExistingEntryId);
      if (idx > 0) {
        const [suggested] = entries.splice(idx, 1);
        entries = [suggested, ...entries];
      }
    }
    return entries;
  }, [existingEntries, existingSearch, hasExistingSuggestion, suggestedExistingEntryId]);

  async function handleSaveNew() {
    if (!category) {
      setError('Bitte Kategorie wählen.');
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
        'manual',
      );

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zuordnung fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignExisting() {
    if (!selectedExistingId) {
      setError('Bitte einen Eintrag auswählen.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const table = isIncome ? 'income_entries' : 'expenses';
      await supabase
        .from(table)
        .update({ status: 'paid' })
        .eq('id', selectedExistingId);

      await allocateBankTransaction(
        userId,
        tx.id,
        [
          {
            target_type: targetType as AllocationTargetType,
            target_id: selectedExistingId,
            amount_allocated: txAmount,
          },
        ],
        'manual',
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

      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => { setTab('existing'); setError(''); }}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            tab === 'existing'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Bestehende zuordnen
        </button>
        <button
          onClick={() => { setTab('new'); setError(''); }}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            tab === 'new'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Neu anlegen
        </button>
      </div>

      {tab === 'existing' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={existingSearch}
              onChange={(e) => setExistingSearch(e.target.value)}
              placeholder={`Offene ${isIncome ? 'Einnahmen' : 'Ausgaben'} suchen...`}
              className="w-full h-9 pl-9 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            />
          </div>

          {existingLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : filteredExisting.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">
                Keine offenen {isIncome ? 'Einnahmen' : 'Ausgaben'} gefunden
              </p>
              <button
                onClick={() => setTab('new')}
                className="text-xs text-[#3c8af7] hover:underline mt-2"
              >
                Stattdessen neu anlegen
              </button>
            </div>
          ) : (
            <div className="max-h-[240px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {filteredExisting.map((e) => {
                const isSuggested = hasExistingSuggestion && e.id === suggestedExistingEntryId;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExistingId(e.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      selectedExistingId === e.id
                        ? 'bg-blue-50 border-l-2 border-l-[#3c8af7]'
                        : isSuggested
                        ? 'bg-blue-50/40'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-dark truncate">
                          {e.description || e.category}
                        </p>
                        {isSuggested && (
                          <Sparkles className="w-3 h-3 text-[#3c8af7] flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{e.category}</span>
                        {e.property_name && (
                          <span className="text-[10px] text-gray-400">
                            {e.property_name}
                          </span>
                        )}
                        {e.date && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(e.date).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-dark tabular-nums flex-shrink-0">
                      {Number(e.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
                    </span>
                    {selectedExistingId === e.id && (
                      <Check className="w-4 h-4 text-[#3c8af7] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500">Transaktionsbetrag</span>
            <span className="text-sm font-semibold text-dark tabular-nums">
              {txAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
            </span>
          </div>
        </div>
      )}

      {tab === 'new' && (
        <>
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
                  <option value="">-- Kategorie wählen --</option>
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
        </>
      )}

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
        {tab === 'existing' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleAssignExisting}
            disabled={saving || !selectedExistingId}
          >
            {saving ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {saving ? 'Speichert...' : 'Zuordnen'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveNew}
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
        )}
      </div>
    </div>
  );
}
