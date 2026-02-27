import { useState } from 'react';
import { Upload, FileCode, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../ui/Button';
import { importFromCamt053 } from '../../../lib/bankImport';
import type { ImportResult } from '../../../lib/bankImport/types';

export default function CamtImportFlow() {
  const { user } = useAuth();
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
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
          'Die Datei scheint kein gueltiges CAMT.053-Format zu sein. Bitte pruefen Sie das Format.'
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
    setError('');
  }

  if (importResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
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
          <div className="bg-amber-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-amber-700">
              {importResult.duplicateRows}
            </div>
            <div className="text-xs text-amber-600">Duplikate</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-700">
              {importResult.totalRows}
            </div>
            <div className="text-xs text-gray-500">Gesamt</div>
          </div>
        </div>

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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Loader className="w-10 h-10 text-[#3c8af7] mx-auto mb-3 animate-spin" />
        <p className="text-sm font-medium text-dark mb-1">
          Importiere {fileName}...
        </p>
        <p className="text-xs text-gray-400">
          Transaktionen werden verarbeitet und auf Duplikate geprueft.
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
        Standardformat fuer elektronische Kontoauszuege (ISO 20022)
      </p>
      <label className="inline-block">
        <input
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={handleFileSelect}
        />
        <span className="inline-flex items-center gap-2 h-[42px] px-5 rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          XML-Datei auswaehlen
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
