import { FileText, Upload, Folder } from "lucide-react";

export default function DocumentsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Dokumente</h1>
          <p className="text-gray-400 mt-1">
            Verwalten Sie alle Dokumente Ihrer Immobilien
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
          <Upload className="w-4 h-4" />
          Dokument hochladen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">0</div>
          <div className="text-sm text-gray-400">Dokumente gesamt</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <Folder className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">0</div>
          <div className="text-sm text-gray-400">Ordner</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">0 MB</div>
          <div className="text-sm text-gray-400">Speicherplatz genutzt</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            Keine Dokumente vorhanden
          </h3>
          <p className="text-gray-400 mb-6">
            Laden Sie Ihr erstes Dokument hoch, um loszulegen. Sie können
            Verträge, Rechnungen und andere wichtige Dokumente hier speichern.
          </p>
          <button className="px-6 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Dokument hochladen
          </button>
        </div>
      </div>
    </div>
  );
}
