import { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Landmark,
  RefreshCw,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { listRecentImportFiles, rollbackAndDeleteImport } from '../../../lib/bankImport';
import type { BankImportFile } from '../../../lib/bankImport/types';
import { Button } from '../../ui/Button';

const SOURCE_ICON: Record<string, typeof FileSpreadsheet> = {
  csv: FileSpreadsheet,
  camt053: FileCode,
  mt940: FileCode,
  banksapi: Landmark,
};

const SOURCE_LABELS: Record<string, string> = {
  csv: 'CSV',
  camt053: 'CAMT.053',
  mt940: 'MT940',
  banksapi: 'Bankabruf',
};

interface StatusConfig {
  icon: typeof CheckCircle;
  color: string;
  bg: string;
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'Abgeschlossen',
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    label: 'Fehlgeschlagen',
  },
  processing: {
    icon: Loader,
    color: 'text-[#3c8af7]',
    bg: 'bg-blue-50',
    label: 'Verarbeitung...',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    label: 'Ausstehend',
  },
  deleted: {
    icon: Trash2,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    label: 'Gelöscht',
  },
  rolled_back: {
    icon: Trash2,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    label: 'Rückgängig',
  },
};

interface StoredDuplicate {
  rowIndex?: number;
  bookingDate: string;
  amount: number;
  counterpartyName?: string;
  usageText?: string;
  reason: 'db' | 'batch';
}

function DuplicateDetailPanel({
  rawMeta,
  duplicateRows,
}: {
  rawMeta?: Record<string, unknown>;
  duplicateRows: number;
}) {
  const duplicates = (rawMeta?.duplicates as StoredDuplicate[] | undefined) || [];
  const filteredByDate = (rawMeta?.filtered_by_date as number | undefined) || 0;
  const effectiveStart = rawMeta?.effective_start as string | undefined;

  if (duplicates.length === 0 && duplicateRows > 0) {
    return (
      <div className="space-y-2">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-600">
          {duplicateRows} Duplikate erkannt (Detailinformationen stehen ab dem n\u00e4chsten Import zur Verf\u00fcgung).
        </div>
        {filteredByDate > 0 && effectiveStart && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
            {filteredByDate} \u00e4ltere Transaktionen (vor {new Date(effectiveStart).toLocaleDateString('de-DE')}) wurden nicht erneut gepr\u00fcft.
          </div>
        )}
      </div>
    );
  }

  const batchDups = duplicates.filter((d) => d.reason === 'batch');
  const dbDups = duplicates.filter((d) => d.reason === 'db');

  function formatDupLine(d: StoredDuplicate) {
    const datePart = d.bookingDate
      ? new Date(d.bookingDate).toLocaleDateString('de-DE')
      : '–';
    const amountPart = d.amount != null ? `${d.amount.toFixed(2)} EUR` : '';
    const namePart = d.counterpartyName || '';
    return [datePart, amountPart, namePart].filter(Boolean).join(' | ');
  }

  return (
    <div className="space-y-2">
      {batchDups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Copy className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs font-semibold text-amber-700">
              {batchDups.length} doppelte Transaktionen innerhalb des Abrufs
            </p>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {batchDups.map((d, i) => (
              <div
                key={i}
                className="text-xs bg-white/60 rounded px-2 py-1.5 flex items-center gap-3"
              >
                {d.rowIndex != null && (
                  <span className="text-amber-500 font-mono flex-shrink-0">
                    Zeile {d.rowIndex}
                  </span>
                )}
                <span className="text-gray-600 truncate">
                  {formatDupLine(d)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dbDups.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">
              {dbDups.length} bereits importierte Transaktionen
            </p>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {dbDups.map((d, i) => (
              <div
                key={i}
                className="text-xs bg-white/60 rounded px-2 py-1.5 flex items-center gap-3"
              >
                {d.rowIndex != null && (
                  <span className="text-blue-500 font-mono flex-shrink-0">
                    Zeile {d.rowIndex}
                  </span>
                )}
                <span className="text-gray-600 truncate">
                  {formatDupLine(d)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {duplicates.length < duplicateRows && (
        <p className="text-[10px] text-gray-400">
          Zeige {duplicates.length} von {duplicateRows} Duplikaten
        </p>
      )}

      {filteredByDate > 0 && effectiveStart && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
          {filteredByDate} \u00e4ltere Transaktionen (vor {new Date(effectiveStart).toLocaleDateString('de-DE')}) wurden nicht erneut gepr\u00fcft.
        </div>
      )}
    </div>
  );
}

interface ImportHistoryViewProps {
  onRollbackComplete?: () => void;
  readOnly?: boolean;
}

export default function ImportHistoryView({ onRollbackComplete, readOnly = false }: ImportHistoryViewProps) {
  const { user } = useAuth();
  const [imports, setImports] = useState<BankImportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDuplicatesId, setShowDuplicatesId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [rolling, setRolling] = useState(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  async function loadHistory() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listRecentImportFiles(user.id, 14);
      setImports(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback(importFileId: string) {
    setRolling(true);
    setRollbackError(null);
    try {
      await rollbackAndDeleteImport(importFileId);
      setConfirmDeleteId(null);
      setConfirmText('');
      await loadHistory();
      onRollbackComplete?.();
    } catch (err) {
      setRollbackError(err instanceof Error ? err.message : String(err));
    } finally {
      setRolling(false);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          Noch keine Importe in den letzten 14 Tagen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-dark">
            Import-Historie (letzte 14 Tage)
          </h3>
          <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
            {imports.length} {imports.length === 1 ? 'Import' : 'Importe'}
          </span>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-1 text-xs text-[#3c8af7] hover:underline"
        >
          <RefreshCw className="w-3 h-3" />
          Aktualisieren
        </button>
      </div>

      {imports.map((file) => {
        const config = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const SourceIcon = SOURCE_ICON[file.source_type] || FileSpreadsheet;
        const isExpanded = expandedId === file.id;
        const isDeleted = file.status === 'deleted' || file.status === 'rolled_back';
        const canRollback = !isDeleted && file.status === 'completed';

        return (
          <div
            key={file.id}
            className={`border rounded-lg overflow-hidden transition-colors ${
              isDeleted
                ? 'border-gray-200 bg-gray-50/50 opacity-60'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : file.id)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}
              >
                <StatusIcon
                  className={`w-4 h-4 ${config.color} ${
                    file.status === 'processing' ? 'animate-spin' : ''
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SourceIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-dark truncate">
                    {file.filename}
                  </p>
                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">
                    {SOURCE_LABELS[file.source_type] || file.source_type}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(file.uploaded_at)}
                  {file.file_size_bytes
                    ? ` | ${formatFileSize(file.file_size_bytes)}`
                    : ''}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {file.status === 'completed' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-600 font-medium">
                      {file.imported_rows} importiert
                    </span>
                    {file.duplicate_rows > 0 && (
                      <span className="text-amber-600">
                        {file.duplicate_rows} Duplikate
                      </span>
                    )}
                  </div>
                )}
                {file.status === 'failed' && file.error_message && (
                  <span className="text-xs text-red-500 max-w-[160px] truncate">
                    {file.error_message}
                  </span>
                )}
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
                >
                  {config.label}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">
                      {file.source_type === 'banksapi' ? 'Gepr\u00fcfte Transaktionen' : 'Gesamt Zeilen'}
                    </span>
                    <p className="font-medium text-dark">
                      {file.total_rows}
                      {file.source_type === 'banksapi' && file.raw_meta?.total_from_provider && (
                        <span className="text-gray-400 font-normal ml-1">
                          / {String(file.raw_meta.total_from_provider)} gesamt
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Importiert</span>
                    <p className="font-medium text-emerald-600">
                      {file.imported_rows}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Duplikate</span>
                    {file.duplicate_rows > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDuplicatesId(
                            showDuplicatesId === file.id ? null : file.id
                          );
                        }}
                        className="flex items-center gap-1 font-medium text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        {file.duplicate_rows}
                        {showDuplicatesId === file.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <p className="font-medium text-amber-600">0</p>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">Verarbeitet</span>
                    <p className="font-medium text-dark">
                      {file.processed_at
                        ? formatDate(file.processed_at)
                        : '--'}
                    </p>
                  </div>
                </div>

                {showDuplicatesId === file.id && file.duplicate_rows > 0 && (
                  <DuplicateDetailPanel rawMeta={file.raw_meta} duplicateRows={file.duplicate_rows} />
                )}

                {file.summary &&
                  typeof file.summary === 'object' &&
                  file.summary.rolled_back_at && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-medium text-gray-600">
                        Rollback-Details
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {file.summary.deleted_transactions != null && (
                          <div>
                            <span className="text-gray-400">
                              Transaktionen entfernt
                            </span>
                            <p className="font-medium">
                              {String(file.summary.deleted_transactions)}
                            </p>
                          </div>
                        )}
                        {file.summary.deleted_allocations != null && (
                          <div>
                            <span className="text-gray-400">
                              Zuordnungen entfernt
                            </span>
                            <p className="font-medium">
                              {String(file.summary.deleted_allocations)}
                            </p>
                          </div>
                        )}
                        {file.summary.recalced_rents != null && (
                          <div>
                            <span className="text-gray-400">
                              Mieten neu berechnet
                            </span>
                            <p className="font-medium">
                              {String(file.summary.recalced_rents)}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 mt-1">
                        Gelöscht am{' '}
                        {formatDate(String(file.summary.rolled_back_at))}
                      </p>
                    </div>
                  )}

                {file.error_message && (
                  <div className="bg-red-50 rounded-lg p-3 text-xs">
                    <p className="font-medium text-red-600 mb-1">
                      Fehlermeldung
                    </p>
                    <p className="text-red-500">{file.error_message}</p>
                  </div>
                )}

                {canRollback && !readOnly && (
                  <div className="pt-2 border-t border-gray-100">
                    {confirmDeleteId === file.id ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                          <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-red-700 mb-1">
                              Import rückgängig machen und löschen?
                            </p>
                            <p className="text-red-600">
                              Alle importierten Transaktionen und Zuordnungen
                              (Miete/Einnahmen/Ausgaben) werden entfernt. Dieser
                              Vorgang kann nicht rückgängig gemacht werden.
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Tippen Sie <strong>LÖSCHEN</strong> zur
                            Bestätigung:
                          </label>
                          <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                            placeholder="LÖSCHEN"
                            autoFocus
                          />
                        </div>
                        {rollbackError && (
                          <p className="text-xs text-red-500">
                            {rollbackError}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRollback(file.id)}
                            disabled={
                              confirmText !== 'LÖSCHEN' || rolling
                            }
                          >
                            {rolling ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                Wird gelöscht...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3" />
                                Endgültig löschen
                              </>
                            )}
                          </Button>
                          <Button
                            variant="cancel"
                            size="sm"
                            onClick={() => {
                              setConfirmDeleteId(null);
                              setConfirmText('');
                              setRollbackError(null);
                            }}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="text-danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(file.id);
                          setRollbackError(null);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Import rückgängig machen & löschen
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
