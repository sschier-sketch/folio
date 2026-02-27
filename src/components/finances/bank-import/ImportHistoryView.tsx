import { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader,
  Trash2,
  X,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { listRecentImportFiles, rollbackAndDeleteImport } from '../../../lib/bankImport';
import type { BankImportFile } from '../../../lib/bankImport/types';
import { Button } from '../../ui/Button';

const SOURCE_ICON: Record<string, typeof FileSpreadsheet> = {
  csv: FileSpreadsheet,
  camt053: FileCode,
  mt940: FileCode,
};

const SOURCE_LABELS: Record<string, string> = {
  csv: 'CSV',
  camt053: 'CAMT.053',
  mt940: 'MT940',
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
    label: 'Geloescht',
  },
  rolled_back: {
    icon: Trash2,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    label: 'Rueckgaengig',
  },
};

interface ImportHistoryViewProps {
  onRollbackComplete?: () => void;
}

export default function ImportHistoryView({ onRollbackComplete }: ImportHistoryViewProps) {
  const { user } = useAuth();
  const [imports, setImports] = useState<BankImportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
        const fileExpired = !file.storage_path && file.status !== 'deleted';

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
                  {fileExpired && !isDeleted && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 flex-shrink-0">
                      Datei abgelaufen
                    </span>
                  )}
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
                    <span className="text-gray-400">Gesamt Zeilen</span>
                    <p className="font-medium text-dark">{file.total_rows}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Importiert</span>
                    <p className="font-medium text-emerald-600">
                      {file.imported_rows}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Duplikate</span>
                    <p className="font-medium text-amber-600">
                      {file.duplicate_rows}
                    </p>
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
                        Geloescht am{' '}
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

                {canRollback && (
                  <div className="pt-2 border-t border-gray-100">
                    {confirmDeleteId === file.id ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                          <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-red-700 mb-1">
                              Import rueckgaengig machen und loeschen?
                            </p>
                            <p className="text-red-600">
                              Alle importierten Transaktionen und Zuordnungen
                              (Miete/Einnahmen/Ausgaben) werden entfernt. Dieser
                              Vorgang kann nicht rueckgaengig gemacht werden.
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Tippen Sie <strong>LOESCHEN</strong> zur
                            Bestaetigung:
                          </label>
                          <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                            placeholder="LOESCHEN"
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
                              confirmText !== 'LOESCHEN' || rolling
                            }
                          >
                            {rolling ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                Wird geloescht...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3" />
                                Endgueltig loeschen
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
                        Import rueckgaengig machen & loeschen
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
