import { Button } from '../ui/Button';

interface Props {
  generating: boolean;
  onDownload: () => void;
  onSendDigital: () => void;
}

export default function StepErgebnis({ generating, onDownload, onSendDigital }: Props) {
  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        <h3 className="text-2xl font-bold text-dark mb-2">Ihr Dokument ist bereit</h3>
        <p className="text-sm text-gray-500 mb-8">
          Ihre Kündigungsbestätigung wurde erfolgreich erstellt. Wählen Sie, wie Sie fortfahren möchten.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={onDownload}
            disabled={generating}
            className="p-6 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-primary-blue hover:bg-blue-50/30 transition-all group"
          >
            <h4 className="font-semibold text-dark mb-2 group-hover:text-primary-blue transition-colors">
              Ausdrucken und unterschreiben
            </h4>
            <p className="text-sm text-gray-500">
              Laden Sie das PDF herunter, drucken Sie es aus und holen Sie die Unterschriften ein.
            </p>
          </button>

          <button
            onClick={onSendDigital}
            className="p-6 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-primary-blue hover:bg-blue-50/30 transition-all group"
          >
            <h4 className="font-semibold text-dark mb-2 group-hover:text-primary-blue transition-colors">
              Digital versenden
            </h4>
            <p className="text-sm text-gray-500">
              Senden Sie das Dokument per E-Mail an den/die Mieter und stellen Sie es optional im Mieterportal bereit.
            </p>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="font-semibold text-dark mb-3">Checkliste</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              Prüfen Sie alle Angaben im Dokument auf Richtigkeit
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              Stellen Sie sicher, dass das Kündigungsdatum korrekt ist
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              Bei postalischem Versand: Unterschreiben Sie das Dokument vor dem Versand
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              Bewahren Sie eine Kopie für Ihre Unterlagen auf
            </li>
          </ul>
        </div>

        <Button onClick={onDownload} disabled={generating} variant="primary">
          {generating ? 'Wird erstellt...' : 'Herunterladen'}
        </Button>
      </div>

      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="bg-blue-50 rounded-lg p-5 sticky top-4">
          <h4 className="font-semibold text-dark mb-2">Hinweise & Tipps</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Das Dokument wird nach dem Herunterladen oder Versenden automatisch im
            Dokumentenbereich des Objekts gespeichert, sodass Sie es jederzeit wieder finden.
          </p>
        </div>
      </div>
    </div>
  );
}
