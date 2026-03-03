import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader, ChevronDown, ChevronUp, Copy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../ui/Button';
import CsvPreviewTable from './CsvPreviewTable';
import CsvColumnMapper, { getRequiredFieldsMissing } from './CsvColumnMapper';
import CsvSettingsPanel, { DEFAULT_CSV_SETTINGS, type CsvSettings } from './CsvSettingsPanel';
import SavedMappingsSelect from './SavedMappingsSelect';
import { detectCsvMapping, importFromCsv } from '../../../lib/bankImport';
import type { CsvColumnMapping as CsvMapping, ImportResult } from '../../../lib/bankImport/types';

type Step = 'upload' | 'mapping' | 'result';

function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectDelimiter(line: string): string {
  const semi = (line.match(/;/g) || []).length;
  const comma = (line.match(/,/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (semi >= comma && semi >= tab) return ';';
  if (tab >= comma) return '\t';
  return ',';
}

export default function CsvImportFlow() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [rawContent, setRawContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [settings, setSettings] = useState<CsvSettings>(DEFAULT_CSV_SETTINGS);
  const [columnAssignments, setColumnAssignments] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const parseCsvPreview = useCallback(
    (content: string, currentSettings: CsvSettings) => {
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setError('Die CSV-Datei enthält zu wenig Zeilen.');
        return;
      }

      const skip = currentSettings.skipRows;
      const delimiter = currentSettings.delimiter === '\\t' ? '\t' : currentSettings.delimiter;
      const headerLine = lines[skip];
      if (!headerLine) {
        setError('Keine Kopfzeile gefunden.');
        return;
      }

      const parsedHeaders = splitCsvLine(headerLine, delimiter).map((h) =>
        h.replace(/^"+|"+$/g, '').trim()
      );
      const parsedRows = lines.slice(skip + 1, skip + 21).map((line) =>
        splitCsvLine(line, delimiter).map((f) => f.replace(/^"+|"+$/g, '').trim())
      );

      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setError('');
    },
    []
  );

  function handleFileRead(file: File) {
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawContent(content);

      const detected = detectCsvMapping(content);
      const detectedDelimiter = detected.delimiter || detectDelimiter(content.split(/\r?\n/)[0] || '');

      const newSettings: CsvSettings = {
        ...DEFAULT_CSV_SETTINGS,
        delimiter: detectedDelimiter === '\t' ? '\\t' : detectedDelimiter,
        decimalSeparator: (detected.decimalSeparator as ',' | '.') || ',',
        skipRows: detected.skipRows || 0,
      };
      setSettings(newSettings);

      const autoAssignments: Record<string, string> = {};
      if (detected.bookingDate) autoAssignments.bookingDate = detected.bookingDate;
      if (detected.amount) autoAssignments.amount = detected.amount;
      if (detected.usageText) autoAssignments.usageText = detected.usageText;
      if (detected.counterpartyName) autoAssignments.counterpartyName = detected.counterpartyName;
      if (detected.counterpartyIban) autoAssignments.counterpartyIban = detected.counterpartyIban;
      if (detected.valueDate) autoAssignments.valueDate = detected.valueDate;
      setColumnAssignments(autoAssignments);

      parseCsvPreview(content, newSettings);
      setStep('mapping');
    };

    reader.readAsText(file, settings.encoding || 'utf-8');
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.CSV') || file.type === 'text/csv')) {
      handleFileRead(file);
    } else {
      setError('Bitte laden Sie eine CSV-Datei hoch.');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }

  function handleSettingsChange(newSettings: CsvSettings) {
    setSettings(newSettings);
    if (rawContent) {
      parseCsvPreview(rawContent, newSettings);
    }
  }

  function handleSavedMappingSelect(saved: {
    mapping: Record<string, string>;
    settings: Record<string, unknown>;
  }) {
    setColumnAssignments(saved.mapping);
    if (saved.settings) {
      const merged: CsvSettings = {
        delimiter: (saved.settings.delimiter as string) || settings.delimiter,
        decimalSeparator:
          (saved.settings.decimalSeparator as ',' | '.') || settings.decimalSeparator,
        dateFormat: (saved.settings.dateFormat as string) || settings.dateFormat,
        skipRows:
          typeof saved.settings.skipRows === 'number'
            ? saved.settings.skipRows
            : settings.skipRows,
        encoding: (saved.settings.encoding as string) || settings.encoding,
      };
      setSettings(merged);
      if (rawContent) parseCsvPreview(rawContent, merged);
    }
  }

  async function handleImport() {
    if (!user) return;

    const missing = getRequiredFieldsMissing(columnAssignments);
    if (missing.length > 0) {
      setError(`Pflichtfelder fehlen: ${missing.join(', ')}`);
      return;
    }

    setImporting(true);
    setError('');

    try {
      const mapping: CsvMapping = {
        bookingDate: columnAssignments.bookingDate || '',
        amount: columnAssignments.amount || '',
        valueDate: columnAssignments.valueDate,
        counterpartyName: columnAssignments.counterpartyName,
        counterpartyIban: columnAssignments.counterpartyIban,
        usageText: columnAssignments.usageText,
        creditDebitIndicator: columnAssignments.creditDebitIndicator,
        currency: columnAssignments.currency,
        delimiter: settings.delimiter === '\\t' ? '\t' : settings.delimiter,
        dateFormat: settings.dateFormat === 'auto' ? undefined : settings.dateFormat,
        decimalSeparator: settings.decimalSeparator,
        skipRows: settings.skipRows,
        encoding: settings.encoding,
      };

      const result = await importFromCsv(user.id, rawContent, fileName, mapping);
      setImportResult(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setStep('upload');
    setRawContent('');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setColumnAssignments({});
    setImportResult(null);
    setShowDuplicates(false);
    setError('');
  }

  if (step === 'result' && importResult) {
    const batchDuplicates = importResult.duplicates.filter(d => d.reason === 'batch');
    const dbDuplicates = importResult.duplicates.filter(d => d.reason === 'db');

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-dark mb-1">Import abgeschlossen</h3>
          <p className="text-sm text-gray-500 mb-4">{fileName}</p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-emerald-700">
                {importResult.importedRows}
              </div>
              <div className="text-xs text-emerald-600">Importiert</div>
            </div>
            <div
              className={`rounded-lg p-3 ${
                importResult.duplicateRows > 0
                  ? 'bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors'
                  : 'bg-amber-50'
              }`}
              onClick={() => {
                if (importResult.duplicateRows > 0) setShowDuplicates(prev => !prev);
              }}
            >
              <div className="text-2xl font-bold text-amber-700 flex items-center justify-center gap-1">
                {importResult.duplicateRows}
                {importResult.duplicateRows > 0 && (
                  showDuplicates
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs text-amber-600">
                {importResult.duplicateRows > 0 ? 'Duplikate anzeigen' : 'Duplikate'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-700">
                {importResult.totalRows}
              </div>
              <div className="text-xs text-gray-500">Gesamt</div>
            </div>
          </div>

          {showDuplicates && importResult.duplicates.length > 0 && (
            <div className="text-left max-w-lg mx-auto mb-6 space-y-3">
              {batchDuplicates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700">
                      {batchDuplicates.length} doppelte Zeilen innerhalb der Datei
                    </p>
                  </div>
                  <p className="text-xs text-amber-600 mb-2">
                    Diese Zeilen haben identisches Datum, Betrag, IBAN und Verwendungszweck wie eine andere Zeile in derselben Datei.
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {batchDuplicates.map((d, i) => (
                      <div key={i} className="text-xs bg-white/60 rounded px-2 py-1.5 flex items-center gap-3">
                        <span className="text-amber-500 font-mono flex-shrink-0">Zeile {d.rowIndex}</span>
                        <span className="text-gray-600 truncate">
                          {new Date(d.bookingDate).toLocaleDateString('de-DE')}
                          {' | '}
                          {d.amount.toFixed(2)} EUR
                          {d.counterpartyName ? ` | ${d.counterpartyName}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dbDuplicates.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-700">
                      {dbDuplicates.length} bereits vorhandene Transaktionen
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">
                    Diese Transaktionen waren bereits aus einem früheren Import vorhanden und wurden übersprungen.
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dbDuplicates.map((d, i) => (
                      <div key={i} className="text-xs bg-white/60 rounded px-2 py-1.5 flex items-center gap-3">
                        <span className="text-blue-500 font-mono flex-shrink-0">Zeile {d.rowIndex}</span>
                        <span className="text-gray-600 truncate">
                          {new Date(d.bookingDate).toLocaleDateString('de-DE')}
                          {' | '}
                          {d.amount.toFixed(2)} EUR
                          {d.counterpartyName ? ` | ${d.counterpartyName}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {importResult.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 mb-4 text-left max-w-md mx-auto">
              <p className="text-xs font-medium text-red-700 mb-1">
                {importResult.errors.length} Fehler:
              </p>
              <ul className="text-xs text-red-600 space-y-0.5">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>... und {importResult.errors.length - 5} weitere</li>
                )}
              </ul>
            </div>
          )}

          <Button variant="primary" onClick={handleReset}>
            Weiteren Import starten
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'mapping') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#3c8af7]" />
              <span className="text-sm font-medium text-dark">{fileName}</span>
              <span className="text-xs text-gray-400">
                ({rows.length} Zeilen)
              </span>
            </div>
            <Button variant="cancel" size="sm" onClick={handleReset}>
              Andere Datei
            </Button>
          </div>

          {user && (
            <SavedMappingsSelect
              userId={user.id}
              onSelect={handleSavedMappingSelect}
              currentAssignments={columnAssignments}
              currentSettings={settings as unknown as Record<string, unknown>}
            />
          )}
        </div>

        <div className="bg-white rounded-lg p-4">
          <CsvSettingsPanel settings={settings} onChange={handleSettingsChange} />
        </div>

        <div className="bg-white rounded-lg p-4">
          <CsvColumnMapper
            headers={headers}
            columnAssignments={columnAssignments}
            onChange={(field, col) =>
              setColumnAssignments((prev) => ({ ...prev, [field]: col }))
            }
          />
        </div>

        {headers.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Vorschau
            </div>
            <CsvPreviewTable
              headers={headers}
              rows={rows}
              columnAssignments={columnAssignments}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Importiere...
              </>
            ) : (
              'Import starten'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragOver
          ? 'border-[#3c8af7] bg-blue-50/50'
          : 'border-gray-300 hover:border-gray-400 bg-white'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
    >
      <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-dark mb-1">
        CSV-Datei hier ablegen
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Unterstützte Formate: CSV (Sparkasse, DKB, ING, Commerzbank, etc.)
      </p>
      <label className="inline-block">
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <span className="inline-flex items-center gap-2 h-[42px] px-5 rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] cursor-pointer transition-colors">
          Datei auswählen
        </span>
      </label>

      {error && (
        <div className="mt-4 flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
