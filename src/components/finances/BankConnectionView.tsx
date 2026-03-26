import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Inbox as InboxIcon,
  FileSpreadsheet,
  FileCode,
  Landmark,
  History,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import CsvImportFlow from './bank-import/CsvImportFlow';
import CamtImportFlow from './bank-import/CamtImportFlow';
import BanksApiImportFlow from './bank-import/BanksApiImportFlow';
import TransactionInbox from './bank-import/TransactionInbox';
import ImportHistoryView from './bank-import/ImportHistoryView';
import MatchingRulesView from './bank-import/MatchingRulesView';

type MainTab = 'inbox' | 'import' | 'rules' | 'history';
type ImportTab = 'csv' | 'camt' | 'banksapi';
type DatePreset = 'all' | 'current_year' | 'last_year' | 'custom';

function getYearRange(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export default function BankConnectionView() {
  const { user } = useAuth();
  const { dataOwnerId, canWrite, loading: permLoading } = usePermissions();
  const [mainTab, setMainTab] = useState<MainTab>(canWrite ? 'inbox' : 'history');
  const [importTab, setImportTab] = useState<ImportTab>('csv');
  const [inboxCount, setInboxCount] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [bankApiBanner, setBankApiBanner] = useState<'success' | 'error' | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const now = new Date();
  const currentYear = now.getFullYear();

  let dateFrom = '';
  let dateTo = '';
  if (datePreset === 'current_year') {
    const r = getYearRange(currentYear);
    dateFrom = r.from;
    dateTo = r.to;
  } else if (datePreset === 'last_year') {
    const r = getYearRange(currentYear - 1);
    dateFrom = r.from;
    dateTo = r.to;
  } else if (datePreset === 'custom') {
    dateFrom = customFrom;
    dateTo = customTo;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const banksapiStatus = params.get('banksapi_status');
    if (banksapiStatus === 'success' || banksapiStatus === 'error') {
      setBankApiBanner(banksapiStatus);
      setMainTab('import');
      setImportTab('banksapi');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('banksapi_status');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  useEffect(() => {
    if (user && !permLoading && dataOwnerId) loadInboxCount();
  }, [user, permLoading, dataOwnerId]);

  async function loadInboxCount() {
    if (!dataOwnerId) return;
    const { count } = await supabase
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', dataOwnerId)
      .in('status', ['UNMATCHED', 'SUGGESTED']);
    setInboxCount(count || 0);
  }

  const handleRollbackComplete = useCallback(() => {
    loadInboxCount();
    setHistoryKey((k) => k + 1);
  }, []);

  const mainTabs = [
    ...(canWrite ? [{
      id: 'inbox' as MainTab,
      label: 'Zuordnungs-Inbox',
      icon: InboxIcon,
      badge: inboxCount > 0 ? inboxCount : undefined,
    },
    { id: 'import' as MainTab, label: 'Importmöglichkeiten', icon: Upload },
    { id: 'rules' as MainTab, label: 'Regeln', icon: RotateCcw }] : []),
    { id: 'history' as MainTab, label: 'Import-Historie', icon: History },
  ];

  const importTabs = [
    { id: 'csv' as ImportTab, label: 'CSV Import', icon: FileSpreadsheet },
    { id: 'camt' as ImportTab, label: 'CAMT.053 Import', icon: FileCode },
    { id: 'banksapi' as ImportTab, label: 'Bankabruf', icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      {bankApiBanner && (
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-lg border ${
            bankApiBanner === 'success'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {bankApiBanner === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-semibold ${
                bankApiBanner === 'success' ? 'text-emerald-800' : 'text-red-800'
              }`}>
                {bankApiBanner === 'success'
                  ? 'Bankverbindung erfolgreich hergestellt'
                  : 'Bankverbindung konnte nicht hergestellt werden'}
              </p>
              <p className={`text-xs mt-0.5 ${
                bankApiBanner === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {bankApiBanner === 'success'
                  ? 'Ihr Bankkonto ist nun verbunden. Sie können jetzt Konten auswählen und Transaktionen importieren.'
                  : 'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setBankApiBanner(null)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

      {(mainTab === 'inbox' || mainTab === 'history') && (
        <div className="bg-white rounded-lg px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-500">Zeitraum:</span>
            <div className="flex gap-1 flex-wrap">
              {([
                { id: 'all', label: 'Alle' },
                { id: 'current_year', label: String(currentYear) },
                { id: 'last_year', label: String(currentYear - 1) },
                { id: 'custom', label: 'Benutzerdefiniert' },
              ] as { id: DatePreset; label: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDatePreset(opt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    datePreset === opt.id
                      ? 'bg-[#3c8af7] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3c8af7]"
                />
                <span className="text-xs text-gray-400">bis</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3c8af7]"
                />
                {(customFrom || customTo) && (
                  <button
                    onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Datumsfilter zurücksetzen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === 'inbox' && canWrite && (
        <TransactionInbox dateFrom={dateFrom} dateTo={dateTo} />
      )}

      {mainTab === 'import' && canWrite && (
        <>
          <div className="bg-white rounded-lg p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#3c8af7]/10 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#3c8af7]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-dark">
                  Kontoauszug importieren
                </h3>
                <p className="text-xs text-gray-400">
                  Laden Sie Ihre Kontoauszüge als CSV, CAMT.053 XML hoch oder verbinden Sie Ihr Konto direkt
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
            {importTab === 'banksapi' && <BanksApiImportFlow />}
          </div>

          {importTab !== 'banksapi' && (
            <div
              style={{ backgroundColor: '#eff4fe', borderColor: '#DDE7FF' }}
              className="border rounded-lg p-4"
            >
              <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
              <p className="text-sm text-blue-900">
                Importierte Transaktionen werden automatisch auf Duplikate
                geprüft. Bereits importierte Buchungen werden übersprungen. Ihre
                Daten werden sicher verarbeitet und nie an Dritte weitergegeben.
              </p>
            </div>
          )}
        </>
      )}

      {mainTab === 'rules' && canWrite && (
        <MatchingRulesView />
      )}

      {mainTab === 'history' && (
        <div className="bg-white rounded-lg p-5">
          <ImportHistoryView
            key={historyKey}
            onRollbackComplete={handleRollbackComplete}
            readOnly={!canWrite}
          />
        </div>
      )}
    </div>
  );
}
