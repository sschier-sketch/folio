import { useState } from 'react';
import { Upload, FileCode, AlertCircle, CheckCircle2, Loader, ChevronDown, ChevronUp, Copy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../ui/Button';
import { importFromCamt053 } from '../../../lib/bankImport';
import type { ImportResult } from '../../../lib/bankImport/types';

export default function CamtImportFlow() {
  const { user } = useAuth();
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!user) return;

    setError('');
    setFileName(file.name);
    setImporting(true);

    try {
      const content = await file.text();

      if (!content.includes('<Document') && !content.includes('<BkToCstmrStmt')) {
        setError(
          'Die Datei scheint kein gültiges CAMT.053-Format zu sein. Bitte prüfen Sie das Format.'
        );
        setImporting(false);
        return;
      }

      const result = await importFromCamt053(user.id, content, file.name);
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setImporting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xml') || file.name.endsWith('.XML'))) {
      handleFile(file);
    } else {
      setError('Bitte laden Sie eine XML-Datei (CAMT.053) hoch.');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleReset() {
    setFileName('');
    setImportResult(null);
    setShowDuplicates(false);
    setError('');
  }

  if (importResult) {
    const batchDuplicates = importResult.duplicates.filter(d => d.reason === 'batch');
    const dbDuplicates = importResult.duplicates.filter(d => d.reason === 'db');

    return (
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
            </ul>
          </div>
        )}

        <Button variant="primary" onClick={handleReset}>
          Weiteren Import starten
        </Button>
      </div>
    );
  }

  if (importing) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <Loader className="w-10 h-10 text-[#3c8af7] mx-auto mb-3 animate-spin" />
        <p className="text-sm font-medium text-dark mb-1">
          Importiere {fileName}...
        </p>
        <p className="text-xs text-gray-400">
          Transaktionen werden verarbeitet und auf Duplikate geprüft.
        </p>
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
      onDrop={handleDrop}
    >
      <FileCode className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-dark mb-1">
        CAMT.053 XML hier ablegen
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Standardformat für elektronische Kontoauszüge (ISO 20022)
      </p>
      <label className="inline-block">
        <input
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={handleFileSelect}
        />
        <span className="inline-flex items-center gap-2 h-[42px] px-5 rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] cursor-pointer transition-colors">
          XML-Datei auswählen
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
