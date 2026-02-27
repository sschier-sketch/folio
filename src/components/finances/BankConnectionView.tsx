import { useState, useEffect } from 'react';
import {
  Upload,
  Inbox as InboxIcon,
  FileSpreadsheet,
  FileCode,
  History,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CsvImportFlow from './bank-import/CsvImportFlow';
import CamtImportFlow from './bank-import/CamtImportFlow';
import TransactionInbox from './bank-import/TransactionInbox';
import type { BankImportFile } from '../../lib/bankImport/types';

type MainTab = 'inbox' | 'import';
type ImportTab = 'csv' | 'camt';

const SOURCE_LABELS: Record<string, string> = {
  csv: 'CSV',
  camt053: 'CAMT.053',
  mt940: 'MT940',
};

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    label: 'Abgeschlossen',
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-red-500',
    label: 'Fehlgeschlagen',
  },
  processing: {
    icon: Loader,
    color: 'text-[#3c8af7]',
    label: 'Verarbeitung...',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    label: 'Ausstehend',
  },
};

export default function BankConnectionView() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('inbox');
  const [importTab, setImportTab] = useState<ImportTab>('csv');
  const [importHistory, setImportHistory] = useState<BankImportFile[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadImportHistory();
      loadInboxCount();
    }
  }, [user]);

  async function loadImportHistory() {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('bank_import_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setImportHistory(data);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadInboxCount() {
    if (!user) return;
    const { count } = await supabase
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['UNMATCHED', 'SUGGESTED']);
    setInboxCount(count || 0);
  }

  const mainTabs = [
    {
      id: 'inbox' as MainTab,
      label: 'Zuordnungs-Inbox',
      icon: InboxIcon,
      badge: inboxCount > 0 ? inboxCount : undefined,
    },
    { id: 'import' as MainTab, label: 'Import', icon: Upload },
  ];

  const importTabs = [
    { id: 'csv' as ImportTab, label: 'CSV Import', icon: FileSpreadsheet },
    { id: 'camt' as ImportTab, label: 'CAMT.053 Import', icon: FileCode },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                mainTab === tab.id
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mainTab === 'inbox' && <TransactionInbox />}

      {mainTab === 'import' && (
        <>
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#3c8af7]/10 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#3c8af7]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-dark">
                  Kontoauszug importieren
                </h3>
                <p className="text-xs text-gray-400">
                  Laden Sie Ihre Kontoauszuege als CSV oder CAMT.053 XML hoch
                </p>
              </div>
            </div>

            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              {importTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setImportTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      importTab === tab.id
                        ? 'bg-white text-dark shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {importTab === 'csv' && <CsvImportFlow />}
            {importTab === 'camt' && <CamtImportFlow />}
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <History className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-dark">Import-Verlauf</h3>
              <button
                onClick={loadImportHistory}
                className="ml-auto text-xs text-[#3c8af7] hover:underline"
              >
                Aktualisieren
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : importHistory.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400">
                  Noch keine Importe vorhanden
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {importHistory.map((file) => {
                  const config =
                    STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                    >
                      <StatusIcon
                        className={`w-4 h-4 flex-shrink-0 ${config.color} ${
                          file.status === 'processing' ? 'animate-spin' : ''
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-dark truncate">
                            {file.filename}
                          </p>
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                            {SOURCE_LABELS[file.source_type] ||
                              file.source_type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(file.uploaded_at).toLocaleDateString(
                            'de-DE',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {file.status === 'completed' && (
                          <>
                            <span className="text-emerald-600 font-medium">
                              {file.imported_rows} importiert
                            </span>
                            {file.duplicate_rows > 0 && (
                              <span className="text-amber-600">
                                {file.duplicate_rows} Duplikate
                              </span>
                            )}
                          </>
                        )}
                        {file.status === 'failed' && file.error_message && (
                          <span className="text-red-500 max-w-[200px] truncate">
                            {file.error_message}
                          </span>
                        )}
                        <span className={`${config.color} font-medium`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{ backgroundColor: '#eff4fe', borderColor: '#DDE7FF' }}
            className="border rounded-lg p-4"
          >
            <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
            <p className="text-sm text-blue-900">
              Importierte Transaktionen werden automatisch auf Duplikate
              geprueft. Bereits importierte Buchungen werden uebersprungen. Ihre
              Daten werden sicher verarbeitet und nie an Dritte weitergegeben.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
