import { useState } from 'react';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  Loader,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { BanksApiConnection, BanksApiBankProduct } from './BanksApiImportFlow';

interface Props {
  connection: BanksApiConnection;
  products: BanksApiBankProduct[];
  saving: boolean;
  onSave: (selections: Array<{ productId: string; selected: boolean; importFromDate: string | null }>) => void;
  onCancel: () => void;
  error: string;
}

function getDefaultImportDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatBalance(cents: number | null): string {
  if (cents === null) return '--';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatAccountType(type: string | null): string {
  if (!type) return 'Konto';
  const map: Record<string, string> = {
    girokonto: 'Girokonto',
    sparkonto: 'Sparkonto',
    tagesgeld: 'Tagesgeldkonto',
    festgeld: 'Festgeldkonto',
    kreditkarte: 'Kreditkarte',
    depot: 'Depot',
    bausparvertrag: 'Bausparvertrag',
    checking: 'Girokonto',
    savings: 'Sparkonto',
    credit_card: 'Kreditkarte',
    loan: 'Kredit',
  };
  return map[type.toLowerCase()] || type;
}

export default function BanksApiAccountSelection({
  connection,
  products,
  saving,
  onSave,
  onCancel,
  error,
}: Props) {
  const [selections, setSelections] = useState<Record<string, { selected: boolean; importFromDate: string }>>(() => {
    const init: Record<string, { selected: boolean; importFromDate: string }> = {};
    for (const p of products) {
      init[p.id] = {
        selected: p.selected_for_import,
        importFromDate: p.import_from_date || getDefaultImportDate(),
      };
    }
    return init;
  });

  function toggleProduct(productId: string) {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: !prev[productId].selected,
      },
    }));
  }

  function setImportDate(productId: string, date: string) {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        importFromDate: date,
      },
    }));
  }

  function handleSave() {
    const mapped = products.map((p) => ({
      productId: p.id,
      selected: selections[p.id]?.selected || false,
      importFromDate: selections[p.id]?.selected
        ? selections[p.id]?.importFromDate || getDefaultImportDate()
        : null,
    }));
    onSave(mapped);
  }

  const selectedCount = Object.values(selections).filter((s) => s.selected).length;
  const today = getTodayString();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-base font-semibold text-dark">
            Konten auswählen
          </h3>
          <p className="text-xs text-gray-400">
            {connection.bank_name || 'Bankverbindung'} &middot; Wählen Sie die Konten für den Import
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Keine Bankkonten gefunden. Bitte versuchen Sie die Verbindung erneut herzustellen.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {products.map((product) => {
              const sel = selections[product.id];
              const isSelected = sel?.selected || false;

              return (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected
                      ? 'border-[#3c8af7] bg-blue-50/30 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <label className="relative flex items-center mt-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(product.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#3c8af7] border-[#3c8af7]'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </label>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark truncate">
                            {product.account_name || 'Unbenanntes Konto'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {product.iban && (
                              <span className="text-xs text-gray-400 font-mono">
                                {product.iban}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatAccountType(product.account_type)}
                            </span>
                          </div>
                        </div>

                        {product.balance_cents !== null && (
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-semibold ${
                              product.balance_cents >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {formatBalance(product.balance_cents)}
                            </p>
                            {product.balance_date && (
                              <p className="text-[10px] text-gray-400">
                                Stand: {new Date(product.balance_date).toLocaleDateString('de-DE')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <label className="text-xs text-gray-500 whitespace-nowrap">
                              Import ab:
                            </label>
                            <input
                              type="date"
                              value={sel?.importFromDate || getDefaultImportDate()}
                              max={today}
                              onChange={(e) => setImportDate(product.id, e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3c8af7] bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">
              {selectedCount} von {products.length} Konten ausgewaehlt
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={saving}>
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Speichere...
                  </>
                ) : (
                  'Auswahl speichern'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
