import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Inbox as InboxIcon,
  FileSpreadsheet,
  FileCode,
  History,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CsvImportFlow from './bank-import/CsvImportFlow';
import CamtImportFlow from './bank-import/CamtImportFlow';
import TransactionInbox from './bank-import/TransactionInbox';
import ImportHistoryView from './bank-import/ImportHistoryView';

type MainTab = 'inbox' | 'import' | 'history';
type ImportTab = 'csv' | 'camt';

export default function BankConnectionView() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('inbox');
  const [importTab, setImportTab] = useState<ImportTab>('csv');
  const [inboxCount, setInboxCount] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    if (user) loadInboxCount();
  }, [user]);

  async function loadInboxCount() {
    if (!user) return;
    const { count } = await supabase
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['UNMATCHED', 'SUGGESTED']);
    setInboxCount(count || 0);
  }

  const handleRollbackComplete = useCallback(() => {
    loadInboxCount();
    setHistoryKey((k) => k + 1);
  }, []);

  const mainTabs = [
    {
      id: 'inbox' as MainTab,
      label: 'Zuordnungs-Inbox',
      icon: InboxIcon,
      badge: inboxCount > 0 ? inboxCount : undefined,
    },
    { id: 'import' as MainTab, label: 'Import', icon: Upload },
    { id: 'history' as MainTab, label: 'Import-Historie', icon: History },
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

      {mainTab === 'history' && (
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <ImportHistoryView
            key={historyKey}
            onRollbackComplete={handleRollbackComplete}
          />
        </div>
      )}
    </div>
  );
}
