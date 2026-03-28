import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Building2,
  DoorOpen,
  Users,
  FileCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  downloadImportTemplate,
  parseImportExcel,
  executeImport,
  ParsedImportData,
  ImportResult,
} from '../../lib/onboardingImport';
import ImportPreviewTable from './ImportPreviewTable';

interface Props {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'result';

export default function OnboardingImportWizard({ onClose, onComplete }: Props) {
  const { user } = useAuth();
  const { dataOwnerId } = usePermissions();
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ownerId = dataOwnerId || user?.id || '';

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    setFileName(file.name);

    if (!file.name.match(/\.xlsx?$/i)) {
      setParseError('Bitte laden Sie eine .xlsx-Datei hoch.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const data = parseImportExcel(buffer);
      setParsedData(data);

      if (data.properties.length === 0 && data.units.length === 0 && data.tenants.length === 0) {
        setParseError('Die Datei enthält keine importierbaren Daten. Bitte verwenden Sie die Vorlage.');
        return;
      }

      setStep('preview');
    } catch (err) {
      setParseError('Die Datei konnte nicht gelesen werden. Bitte prüfen Sie das Format.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = useCallback(async () => {
    if (!parsedData || !ownerId) return;
    setStep('importing');

    try {
      const result = await executeImport(parsedData, ownerId);
      setImportResult(result);
      setStep('result');
    } catch {
      setImportResult({
        propertiesCreated: 0,
        unitsCreated: 0,
        tenantsCreated: 0,
        contractsCreated: 0,
        errors: ['Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'],
      });
      setStep('result');
    }
  }, [parsedData, ownerId]);

  const hasBlockingErrors = parsedData?.errors.some(e =>
    e.sheet === '-' || (e.column === 'Ref-Nr.' && e.message.includes('Doppelte'))
  );

  const totalRecords = (parsedData?.properties.length || 0) + (parsedData?.units.length || 0) + (parsedData?.tenants.length || 0);
  const successTotal = (importResult?.propertiesCreated || 0) + (importResult?.unitsCreated || 0) + (importResult?.tenantsCreated || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Daten importieren</h2>
              <p className="text-xs text-gray-500">Immobilien, Einheiten und Mietverhältnisse per Excel anlegen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 border-b bg-gray-50/50">
          {[
            { id: 'upload', label: 'Hochladen', num: 1 },
            { id: 'preview', label: 'Vorschau', num: 2 },
            { id: 'result', label: 'Ergebnis', num: 3 },
          ].map((s, idx) => {
            const isActive = step === s.id || (step === 'importing' && s.id === 'result');
            const isDone =
              (s.id === 'upload' && step !== 'upload') ||
              (s.id === 'preview' && (step === 'importing' || step === 'result'));

            return (
              <div key={s.id} className="flex items-center gap-2">
                {idx > 0 && <div className={`w-8 h-px ${isDone || isActive ? 'bg-blue-400' : 'bg-gray-200'}`} />}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isDone ? 'bg-blue-600 text-white' :
                    isActive ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-xs font-medium ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <Download className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">Excel-Vorlage herunterladen</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Die Vorlage enthält drei Tabellenblätter mit Beispieldaten und Erklärungen.
                  </p>
                </div>
                <button
                  onClick={downloadImportTemplate}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Vorlage
                </button>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                  dragOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-7 h-7 ${dragOver ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <p className="text-gray-900 font-medium">
                  {dragOver ? 'Datei hier ablegen' : 'Excel-Datei hochladen'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Klicken oder Datei hierher ziehen (.xlsx)
                </p>
                {fileName && !parseError && (
                  <p className="text-sm text-blue-600 mt-3 font-medium">{fileName}</p>
                )}
              </div>

              {parseError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Fehler beim Lesen</p>
                    <p className="text-sm text-red-700 mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Blatt 1</p>
                    <p className="text-sm font-medium text-gray-900">Immobilien</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DoorOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Blatt 2</p>
                    <p className="text-sm font-medium text-gray-900">Einheiten</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Blatt 3</p>
                    <p className="text-sm font-medium text-gray-900">Mietverhältnisse</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && parsedData && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Building2 className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{parsedData.properties.length}</p>
                  <p className="text-xs text-gray-600">Immobilien</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <DoorOpen className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{parsedData.units.length}</p>
                  <p className="text-xs text-gray-600">Einheiten</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{parsedData.tenants.length}</p>
                  <p className="text-xs text-gray-600">Mietverhältnisse</p>
                </div>
              </div>

              <ImportPreviewTable
                properties={parsedData.properties}
                units={parsedData.units}
                tenants={parsedData.tenants}
                errors={parsedData.errors}
              />

              {parsedData.errors.length > 0 && !hasBlockingErrors && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Hinweis</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Es gibt Validierungsfehler. Betroffene Zeilen werden beim Import übersprungen.
                      Korrekte Daten werden trotzdem importiert.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-900 font-medium">Daten werden importiert...</p>
              <p className="text-sm text-gray-500 mt-1">Dies kann einen Moment dauern.</p>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6">
              {importResult.errors.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Import erfolgreich</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Alle {successTotal} Datensätze wurden angelegt.
                  </p>
                </div>
              ) : successTotal > 0 ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <FileCheck className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Import teilweise erfolgreich</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {successTotal} von {totalRecords} Datensätze wurden angelegt.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Import fehlgeschlagen</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Es konnten keine Daten importiert werden.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{importResult.propertiesCreated}</p>
                  <p className="text-xs text-gray-600">Immobilien</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{importResult.unitsCreated}</p>
                  <p className="text-xs text-gray-600">Einheiten</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{importResult.tenantsCreated}</p>
                  <p className="text-xs text-gray-600">Mieter</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{importResult.contractsCreated}</p>
                  <p className="text-xs text-gray-600">Verträge</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">
                    {importResult.errors.length} Fehler beim Import
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
          <div>
            {step === 'preview' && (
              <button
                onClick={() => {
                  setStep('upload');
                  setParsedData(null);
                  setFileName('');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={step === 'result' ? onComplete : onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {step === 'result' ? 'Schließen' : 'Abbrechen'}
            </button>
            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={hasBlockingErrors || totalRecords === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Jetzt importieren
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 'result' && successTotal > 0 && (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zum Dashboard
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
